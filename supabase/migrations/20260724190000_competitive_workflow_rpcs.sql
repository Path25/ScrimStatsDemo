-- Transactional competitive-workflow mutations.
-- Browser clients can call only the authenticated staff RPCs granted below.

create table if not exists public.discord_oauth_states (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index if not exists discord_oauth_states_expiry_idx
  on public.discord_oauth_states(expires_at)
  where consumed_at is null;

alter table public.discord_oauth_states enable row level security;
revoke all on table public.discord_oauth_states from public, anon, authenticated;
grant select, insert, update, delete on table public.discord_oauth_states
  to service_role;

alter table public.integration_events
  add column if not exists claimed_at timestamptz;

create or replace function public.claim_integration_events(p_limit integer default 25)
returns setof public.integration_events
language sql
security definer
set search_path = ''
as $$
  with candidates as (
    select event.id
    from public.integration_events event
    where (
      event.status in ('pending', 'failed')
      and event.available_at <= now()
      and event.attempt_count < 5
    ) or (
      event.status = 'processing'
      and event.claimed_at < now() - interval '15 minutes'
    )
    order by event.created_at
    for update skip locked
    limit least(greatest(p_limit, 1), 100)
  ),
  claimed as (
    update public.integration_events event
    set status = 'processing',
        claimed_at = now()
    from candidates
    where event.id = candidates.id
    returning event.*
  )
  select * from claimed;
$$;

revoke all on function public.claim_integration_events(integer)
  from public, anon, authenticated;
grant execute on function public.claim_integration_events(integer)
  to service_role;

create or replace function public.set_preparation_brief_evidence(
  p_brief_id uuid,
  p_evidence_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  brief_row public.preparation_briefs%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  select * into brief_row
  from public.preparation_briefs
  where id = p_brief_id
  for update;

  if not found or brief_row.status <> 'draft' then
    raise exception 'Only a draft preparation brief can be changed';
  end if;

  if not public.user_has_tenant_role(
    brief_row.tenant_id,
    array['owner'::public.tenant_role, 'admin'::public.tenant_role]
  ) then
    raise exception 'Owner or admin access is required';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_evidence_ids, '{}'::uuid[])) evidence_id
    left join public.scouting_evidence evidence
      on evidence.id = evidence_id
     and evidence.tenant_id = brief_row.tenant_id
     and evidence.opponent_team_id = brief_row.opponent_team_id
    where evidence.id is null
  ) then
    raise exception 'Every evidence item must belong to the same tenant and opponent';
  end if;

  delete from public.preparation_brief_evidence
  where brief_id = p_brief_id;

  insert into public.preparation_brief_evidence (tenant_id, brief_id, evidence_id)
  select brief_row.tenant_id, p_brief_id, evidence_id
  from unnest(coalesce(p_evidence_ids, '{}'::uuid[])) evidence_id
  on conflict do nothing;
end;
$$;

revoke all on function public.set_preparation_brief_evidence(uuid, uuid[])
  from public, anon;
grant execute on function public.set_preparation_brief_evidence(uuid, uuid[])
  to authenticated;

create or replace function public.create_scouting_tendency(
  p_tenant_id uuid,
  p_opponent_team_id uuid,
  p_title text,
  p_summary text,
  p_category text,
  p_confidence smallint,
  p_evidence_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_tendency_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  if not public.user_has_tenant_role(
    p_tenant_id,
    array['owner'::public.tenant_role, 'admin'::public.tenant_role]
  ) then
    raise exception 'Owner or admin access is required';
  end if;

  if not exists (
    select 1
    from public.opponent_teams opponent
    where opponent.id = p_opponent_team_id
      and opponent.tenant_id = p_tenant_id
  ) then
    raise exception 'Opponent does not belong to this workspace';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_evidence_ids, '{}'::uuid[])) evidence_id
    left join public.scouting_evidence evidence
      on evidence.id = evidence_id
     and evidence.tenant_id = p_tenant_id
     and evidence.opponent_team_id = p_opponent_team_id
    where evidence.id is null
  ) then
    raise exception 'Every evidence item must belong to the same tenant and opponent';
  end if;

  insert into public.scouting_tendencies (
    tenant_id,
    opponent_team_id,
    category,
    title,
    summary,
    confidence,
    created_by
  )
  values (
    p_tenant_id,
    p_opponent_team_id,
    p_category,
    trim(p_title),
    trim(p_summary),
    p_confidence,
    (select auth.uid())
  )
  returning id into new_tendency_id;

  insert into public.scouting_tendency_evidence (
    tenant_id,
    tendency_id,
    evidence_id
  )
  select p_tenant_id, new_tendency_id, evidence_id
  from unnest(coalesce(p_evidence_ids, '{}'::uuid[])) evidence_id
  on conflict do nothing;

  return new_tendency_id;
end;
$$;

revoke all on function public.create_scouting_tendency(
  uuid, uuid, text, text, text, smallint, uuid[]
) from public, anon;
grant execute on function public.create_scouting_tendency(
  uuid, uuid, text, text, text, smallint, uuid[]
) to authenticated;

create or replace function public.publish_preparation_brief(p_brief_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  brief_row public.preparation_briefs%rowtype;
  published_at_value timestamptz := now();
  scenario_snapshot jsonb;
  evidence_snapshot jsonb;
  snapshot_value jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  select * into brief_row
  from public.preparation_briefs
  where id = p_brief_id
  for update;

  if not found or brief_row.status <> 'draft' then
    raise exception 'Only a draft preparation brief can be published';
  end if;

  if not public.user_has_tenant_role(
    brief_row.tenant_id,
    array['owner'::public.tenant_role, 'admin'::public.tenant_role]
  ) then
    raise exception 'Owner or admin access is required';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', scenario.id,
        'name', scenario.name,
        'side', scenario.side,
        'parent_scenario_id', scenario.parent_scenario_id,
        'rationale', scenario.rationale,
        'contingency_notes', scenario.contingency_notes,
        'actions', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'sequence_number', action.sequence_number,
              'phase', action.phase,
              'team_side', action.team_side,
              'action_type', action.action_type,
              'champion_name', action.champion_name,
              'assigned_role', action.assigned_role,
              'rationale', action.rationale
            )
            order by action.sequence_number
          )
          from public.draft_scenario_actions action
          where action.scenario_id = scenario.id
            and action.tenant_id = brief_row.tenant_id
        ), '[]'::jsonb)
      )
      order by scenario.created_at
    ),
    '[]'::jsonb
  )
  into scenario_snapshot
  from public.draft_scenarios scenario
  where scenario.brief_id = p_brief_id
    and scenario.tenant_id = brief_row.tenant_id
    and scenario.status = 'draft';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', evidence.id,
        'source_kind', evidence.source_kind,
        'evidence_type', evidence.evidence_type,
        'title', evidence.title,
        'observation', evidence.observation,
        'observed_at', evidence.observed_at,
        'confidence', evidence.confidence,
        'sample_context', evidence.sample_context,
        'scrim_id', evidence.scrim_id,
        'scrim_game_id', evidence.scrim_game_id
      )
      order by evidence.observed_at desc
    ),
    '[]'::jsonb
  )
  into evidence_snapshot
  from public.preparation_brief_evidence link
  join public.scouting_evidence evidence
    on evidence.id = link.evidence_id
   and evidence.tenant_id = link.tenant_id
  where link.brief_id = p_brief_id
    and link.tenant_id = brief_row.tenant_id;

  snapshot_value := jsonb_build_object(
    'brief', jsonb_build_object(
      'title', brief_row.title,
      'executive_summary', brief_row.executive_summary,
      'priorities', brief_row.priorities,
      'scheduled_for', brief_row.scheduled_for,
      'patch_label', brief_row.patch_label,
      'revision', brief_row.revision
    ),
    'evidence', evidence_snapshot,
    'scenarios', scenario_snapshot,
    'published_at', published_at_value
  );

  update public.draft_scenarios
  set status = 'published',
      updated_at = published_at_value
  where brief_id = p_brief_id
    and tenant_id = brief_row.tenant_id
    and status = 'draft';

  update public.preparation_briefs
  set status = 'published',
      snapshot = snapshot_value,
      published_at = published_at_value,
      updated_at = published_at_value
  where id = p_brief_id;

  return snapshot_value;
end;
$$;

revoke all on function public.publish_preparation_brief(uuid) from public, anon;
grant execute on function public.publish_preparation_brief(uuid) to authenticated;

create or replace function public.create_preparation_brief_revision(p_brief_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_brief public.preparation_briefs%rowtype;
  revision_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  select * into source_brief
  from public.preparation_briefs
  where id = p_brief_id;

  if not found or source_brief.status = 'draft' then
    raise exception 'Only a published or archived brief can be revised';
  end if;

  if not public.user_has_tenant_role(
    source_brief.tenant_id,
    array['owner'::public.tenant_role, 'admin'::public.tenant_role]
  ) then
    raise exception 'Owner or admin access is required';
  end if;

  insert into public.preparation_briefs (
    tenant_id,
    opponent_team_id,
    scrim_id,
    title,
    scheduled_for,
    patch_label,
    revision,
    parent_brief_id,
    executive_summary,
    priorities,
    created_by
  )
  values (
    source_brief.tenant_id,
    source_brief.opponent_team_id,
    source_brief.scrim_id,
    source_brief.title,
    source_brief.scheduled_for,
    source_brief.patch_label,
    source_brief.revision + 1,
    source_brief.id,
    source_brief.executive_summary,
    source_brief.priorities,
    (select auth.uid())
  )
  returning id into revision_id;

  insert into public.preparation_brief_evidence (
    tenant_id,
    brief_id,
    evidence_id
  )
  select tenant_id, revision_id, evidence_id
  from public.preparation_brief_evidence
  where brief_id = source_brief.id;

  return revision_id;
end;
$$;

revoke all on function public.create_preparation_brief_revision(uuid)
  from public, anon;
grant execute on function public.create_preparation_brief_revision(uuid)
  to authenticated;

create or replace function public.configure_discord_channel(
  p_tenant_id uuid,
  p_channel_id text,
  p_channel_name text,
  p_event_types text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  installation_id_value uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  if not public.user_has_tenant_role(
    p_tenant_id,
    array['owner'::public.tenant_role, 'admin'::public.tenant_role]
  ) then
    raise exception 'Owner or admin access is required';
  end if;

  select id into installation_id_value
  from public.discord_installations
  where tenant_id = p_tenant_id
    and status = 'active';

  if installation_id_value is null then
    raise exception 'An active Discord installation is required';
  end if;

  if p_channel_id !~ '^[0-9]{15,22}$' then
    raise exception 'A valid Discord channel is required';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_event_types, '{}'::text[])) event_type
    where event_type not in (
      'schedule_created', 'schedule_changed', 'schedule_cancelled',
      'practice_reminder', 'availability_reminder', 'collector_reminder'
    )
  ) then
    raise exception 'Unsupported Discord event type';
  end if;

  delete from public.discord_channel_subscriptions
  where tenant_id = p_tenant_id;

  insert into public.discord_channel_subscriptions (
    tenant_id,
    installation_id,
    channel_id,
    channel_name,
    event_type,
    enabled
  )
  select
    p_tenant_id,
    installation_id_value,
    p_channel_id,
    nullif(trim(p_channel_name), ''),
    event_type,
    true
  from unnest(coalesce(p_event_types, '{}'::text[])) event_type;
end;
$$;

revoke all on function public.configure_discord_channel(uuid, text, text, text[])
  from public, anon;
grant execute on function public.configure_discord_channel(uuid, text, text, text[])
  to authenticated;

create or replace function public.disconnect_discord_installation(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  if not public.user_has_tenant_role(
    p_tenant_id,
    array['owner'::public.tenant_role, 'admin'::public.tenant_role]
  ) then
    raise exception 'Owner or admin access is required';
  end if;

  update public.discord_installations
  set status = 'revoked',
      updated_at = now()
  where tenant_id = p_tenant_id;

  update public.discord_channel_subscriptions
  set enabled = false
  where tenant_id = p_tenant_id;
end;
$$;

revoke all on function public.disconnect_discord_installation(uuid)
  from public, anon;
grant execute on function public.disconnect_discord_installation(uuid)
  to authenticated;

create or replace function public.get_team_performance_summary_filtered(
  p_tenant_id uuid,
  p_date_from date default (current_date - 30),
  p_date_to date default current_date,
  p_opponent_id uuid default null,
  p_side text default null,
  p_format text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
stable
as $$
  with base_scrims as (
    select
      scrim.id,
      scrim.opponent_team_id,
      scrim.opponent_name,
      scrim.format,
      scrim.match_date
    from public.scrims scrim
    where scrim.tenant_id = p_tenant_id
      and public.user_belongs_to_tenant(p_tenant_id)
      and scrim.match_date between p_date_from and p_date_to
  ),
  selected_scrims as (
    select *
    from base_scrims scrim
    where (p_opponent_id is null or scrim.opponent_team_id = p_opponent_id)
      and (p_format is null or lower(coalesce(scrim.format, '')) = lower(p_format))
  ),
  completed_games as (
    select
      game.id,
      game.scrim_id,
      game.result,
      game.side,
      game.desktop_session_id,
      game.status
    from public.scrim_games game
    join selected_scrims scrim on scrim.id = game.scrim_id
    where game.status = 'completed'
      and (p_side is null or lower(coalesce(game.side, '')) = lower(p_side))
  ),
  games as (
    select *
    from completed_games
    where result in ('win', 'loss')
  ),
  participation as (
    select
      count(distinct participant.player_id) as player_count,
      count(*) as recorded_slots
    from public.scrim_participants participant
    join games game on game.id = participant.scrim_game_id
    where participant.is_our_team = true
  )
  select jsonb_build_object(
    'date_from', p_date_from,
    'date_to', p_date_to,
    'filters', jsonb_build_object(
      'opponent_id', p_opponent_id,
      'side', p_side,
      'format', p_format
    ),
    'filter_options', jsonb_build_object(
      'opponents', coalesce((
        select jsonb_agg(
          jsonb_build_object('id', option_row.opponent_team_id, 'name', option_row.opponent_name)
          order by option_row.opponent_name
        )
        from (
          select distinct on (scrim.opponent_team_id)
            scrim.opponent_team_id,
            scrim.opponent_name
          from base_scrims scrim
          where scrim.opponent_team_id is not null
          order by scrim.opponent_team_id, scrim.opponent_name
        ) option_row
      ), '[]'::jsonb),
      'formats', coalesce((
        select jsonb_agg(option_row.format order by option_row.format)
        from (
          select distinct scrim.format
          from base_scrims scrim
          where nullif(trim(scrim.format), '') is not null
        ) option_row
      ), '[]'::jsonb)
    ),
    'blocks', (select count(*) from selected_scrims),
    'recorded_games', (select count(*) from games),
    'excluded_games', (
      select count(*)
      from completed_games
      where result is null or result not in ('win', 'loss')
    ),
    'wins', (select count(*) from games where result = 'win'),
    'losses', (select count(*) from games where result = 'loss'),
    'collector_games', (select count(*) from games where desktop_session_id is not null),
    'manual_games', (select count(*) from games where desktop_session_id is null),
    'blue', jsonb_build_object(
      'games', (select count(*) from games where lower(side) = 'blue'),
      'wins', (select count(*) from games where lower(side) = 'blue' and result = 'win')
    ),
    'red', jsonb_build_object(
      'games', (select count(*) from games where lower(side) = 'red'),
      'wins', (select count(*) from games where lower(side) = 'red' and result = 'win')
    ),
    'formats', coalesce((
      select jsonb_agg(
        jsonb_build_object('format', grouped.format, 'blocks', grouped.blocks)
        order by grouped.blocks desc
      )
      from (
        select coalesce(format, 'Unspecified') as format, count(*) as blocks
        from selected_scrims
        group by coalesce(format, 'Unspecified')
      ) grouped
    ), '[]'::jsonb),
    'opponents', coalesce((
      select jsonb_agg(
        jsonb_build_object('opponent', grouped.opponent_name, 'blocks', grouped.blocks)
        order by grouped.blocks desc
      )
      from (
        select opponent_name, count(*) as blocks
        from selected_scrims
        group by opponent_name
        order by count(*) desc
        limit 8
      ) grouped
    ), '[]'::jsonb),
    'participation', jsonb_build_object(
      'players', coalesce((select player_count from participation), 0),
      'recorded_slots', coalesce((select recorded_slots from participation), 0)
    )
  );
$$;

revoke execute on function public.get_team_performance_summary_filtered(
  uuid, date, date, uuid, text, text
) from public, anon;
grant execute on function public.get_team_performance_summary_filtered(
  uuid, date, date, uuid, text, text
) to authenticated;
