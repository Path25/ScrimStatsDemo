-- Private, attributed Leaguepedia draft history for opponent preparation.
-- Imports are additive and service-owned; staff can only select imported games
-- into draft preparation through the permission-checked RPC below.

alter table public.opponent_teams
  add column if not exists leaguepedia_name text,
  add column if not exists leaguepedia_last_synced_at timestamptz,
  add column if not exists leaguepedia_sync_locked_until timestamptz,
  add column if not exists leaguepedia_sync_error text;

alter table public.opponent_teams
  drop constraint if exists opponent_teams_leaguepedia_name_length,
  add constraint opponent_teams_leaguepedia_name_length
    check (leaguepedia_name is null or char_length(trim(leaguepedia_name)) between 1 and 160);

create table if not exists public.opponent_external_draft_games (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  opponent_team_id uuid not null,
  provider text not null default 'leaguepedia' check (provider = 'leaguepedia'),
  provider_game_id text not null check (char_length(trim(provider_game_id)) between 1 and 240),
  provider_match_id text,
  provider_tournament text,
  provider_page text,
  source_url text not null,
  source_revision text,
  fetched_at timestamptz not null default now(),
  played_at timestamptz,
  patch text,
  blue_team text not null,
  red_team text not null,
  winner_side text check (winner_side in ('blue', 'red')),
  blue_picks jsonb not null default '[]'::jsonb check (jsonb_typeof(blue_picks) = 'array'),
  red_picks jsonb not null default '[]'::jsonb check (jsonb_typeof(red_picks) = 'array'),
  blue_bans jsonb not null default '[]'::jsonb check (jsonb_typeof(blue_bans) = 'array'),
  red_bans jsonb not null default '[]'::jsonb check (jsonb_typeof(red_bans) = 'array'),
  raw_source jsonb not null default '{}'::jsonb check (jsonb_typeof(raw_source) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opponent_external_drafts_team_tenant_fkey
    foreign key (opponent_team_id, tenant_id)
    references public.opponent_teams(id, tenant_id) on delete cascade,
  unique (tenant_id, provider, provider_game_id),
  unique (id, tenant_id)
);

create table if not exists public.preparation_brief_external_drafts (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  brief_id uuid not null,
  external_draft_game_id uuid not null,
  display_order smallint not null default 1 check (display_order between 1 and 100),
  created_at timestamptz not null default now(),
  primary key (brief_id, external_draft_game_id),
  constraint preparation_external_drafts_brief_tenant_fkey
    foreign key (brief_id, tenant_id)
    references public.preparation_briefs(id, tenant_id) on delete cascade,
  constraint preparation_external_drafts_game_tenant_fkey
    foreign key (external_draft_game_id, tenant_id)
    references public.opponent_external_draft_games(id, tenant_id) on delete restrict
);

create index if not exists opponent_external_drafts_team_date_idx
  on public.opponent_external_draft_games (tenant_id, opponent_team_id, played_at desc);
create index if not exists preparation_external_drafts_game_idx
  on public.preparation_brief_external_drafts (external_draft_game_id);

alter table public.opponent_external_draft_games enable row level security;
alter table public.preparation_brief_external_drafts enable row level security;

revoke all on table public.opponent_external_draft_games from public, anon, authenticated;
revoke all on table public.preparation_brief_external_drafts from public, anon, authenticated;
grant select, insert, update, delete on table public.opponent_external_draft_games to service_role;
grant select, insert, update, delete on table public.preparation_brief_external_drafts to service_role;
grant select on table public.opponent_external_draft_games to authenticated;
grant select on table public.preparation_brief_external_drafts to authenticated;

create policy "Staff can read private imported opponent drafts"
on public.opponent_external_draft_games for select to authenticated
using (
  public.user_has_tenant_role(
    tenant_id,
    array['owner'::public.tenant_role, 'admin'::public.tenant_role]
  )
  or exists (
    select 1
    from public.preparation_brief_external_drafts link
    join public.preparation_briefs brief
      on brief.id = link.brief_id and brief.tenant_id = link.tenant_id
    where link.external_draft_game_id = opponent_external_draft_games.id
      and link.tenant_id = opponent_external_draft_games.tenant_id
      and brief.status in ('published', 'archived')
      and public.user_belongs_to_tenant(brief.tenant_id)
  )
);

create policy "Members can read draft links shared through published briefs"
on public.preparation_brief_external_drafts for select to authenticated
using (
  exists (
    select 1
    from public.preparation_briefs brief
    where brief.id = preparation_brief_external_drafts.brief_id
      and brief.tenant_id = preparation_brief_external_drafts.tenant_id
      and (
        public.user_has_tenant_role(
          brief.tenant_id,
          array['owner'::public.tenant_role, 'admin'::public.tenant_role]
        )
        or (
          brief.status in ('published', 'archived')
          and public.user_belongs_to_tenant(brief.tenant_id)
        )
      )
  )
);

create or replace function public.claim_leaguepedia_draft_sync(
  p_opponent_team_id uuid,
  p_cooldown_minutes integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  team_row public.opponent_teams%rowtype;
  lock_until timestamptz := now() + interval '5 minutes';
begin
  select * into team_row
  from public.opponent_teams
  where id = p_opponent_team_id
  for update;

  if not found then
    raise exception 'Opponent team not found';
  end if;

  if team_row.leaguepedia_sync_locked_until is not null
     and team_row.leaguepedia_sync_locked_until > now() then
    return jsonb_build_object(
      'claimed', false,
      'reason', 'in_progress',
      'retry_at', team_row.leaguepedia_sync_locked_until,
      'last_synced_at', team_row.leaguepedia_last_synced_at
    );
  end if;

  if team_row.leaguepedia_last_synced_at is not null
     and team_row.leaguepedia_last_synced_at > now() - make_interval(mins => least(greatest(p_cooldown_minutes, 5), 1440)) then
    return jsonb_build_object(
      'claimed', false,
      'reason', 'cooldown',
      'retry_at', team_row.leaguepedia_last_synced_at + make_interval(mins => least(greatest(p_cooldown_minutes, 5), 1440)),
      'last_synced_at', team_row.leaguepedia_last_synced_at
    );
  end if;

  update public.opponent_teams
  set leaguepedia_sync_locked_until = lock_until,
      leaguepedia_sync_error = null,
      updated_at = now()
  where id = p_opponent_team_id;

  return jsonb_build_object('claimed', true, 'lock_until', lock_until);
end;
$$;

create or replace function public.finish_leaguepedia_draft_sync(
  p_opponent_team_id uuid,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.opponent_teams
  set leaguepedia_last_synced_at = case when p_error is null then now() else leaguepedia_last_synced_at end,
      leaguepedia_sync_locked_until = null,
      leaguepedia_sync_error = nullif(left(coalesce(p_error, ''), 500), ''),
      updated_at = now()
  where id = p_opponent_team_id;

  if not found then
    raise exception 'Opponent team not found';
  end if;
end;
$$;

revoke all on function public.claim_leaguepedia_draft_sync(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.finish_leaguepedia_draft_sync(uuid, text)
  from public, anon, authenticated;
grant execute on function public.claim_leaguepedia_draft_sync(uuid, integer) to service_role;
grant execute on function public.finish_leaguepedia_draft_sync(uuid, text) to service_role;

create or replace function public.set_preparation_brief_external_drafts(
  p_brief_id uuid,
  p_external_draft_ids uuid[]
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
    from unnest(coalesce(p_external_draft_ids, '{}'::uuid[])) draft_id
    left join public.opponent_external_draft_games game
      on game.id = draft_id
     and game.tenant_id = brief_row.tenant_id
     and game.opponent_team_id = brief_row.opponent_team_id
    where game.id is null
  ) then
    raise exception 'Every imported draft must belong to the same tenant and opponent';
  end if;

  delete from public.preparation_brief_external_drafts
  where brief_id = p_brief_id;

  insert into public.preparation_brief_external_drafts (
    tenant_id, brief_id, external_draft_game_id, display_order
  )
  select brief_row.tenant_id, p_brief_id, draft_id, ordinal::smallint
  from unnest(coalesce(p_external_draft_ids, '{}'::uuid[])) with ordinality as selected(draft_id, ordinal)
  on conflict do nothing;
end;
$$;

revoke all on function public.set_preparation_brief_external_drafts(uuid, uuid[])
  from public, anon;
grant execute on function public.set_preparation_brief_external_drafts(uuid, uuid[])
  to authenticated;

-- Extend immutable publication snapshots with the exact imported source records
-- selected by staff. Later provider refreshes therefore cannot rewrite a brief.
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
  external_draft_snapshot jsonb;
  snapshot_value jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Authentication is required'; end if;

  select * into brief_row from public.preparation_briefs where id = p_brief_id for update;
  if not found or brief_row.status <> 'draft' then
    raise exception 'Only a draft preparation brief can be published';
  end if;
  if not public.user_has_tenant_role(
    brief_row.tenant_id,
    array['owner'::public.tenant_role, 'admin'::public.tenant_role]
  ) then raise exception 'Owner or admin access is required'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', scenario.id, 'name', scenario.name, 'side', scenario.side,
    'parent_scenario_id', scenario.parent_scenario_id,
    'rationale', scenario.rationale, 'contingency_notes', scenario.contingency_notes,
    'actions', coalesce((select jsonb_agg(jsonb_build_object(
      'sequence_number', action.sequence_number, 'phase', action.phase,
      'team_side', action.team_side, 'action_type', action.action_type,
      'champion_name', action.champion_name, 'assigned_role', action.assigned_role,
      'rationale', action.rationale
    ) order by action.sequence_number)
    from public.draft_scenario_actions action
    where action.scenario_id = scenario.id and action.tenant_id = brief_row.tenant_id), '[]'::jsonb)
  ) order by scenario.created_at), '[]'::jsonb)
  into scenario_snapshot
  from public.draft_scenarios scenario
  where scenario.brief_id = p_brief_id
    and scenario.tenant_id = brief_row.tenant_id
    and scenario.status = 'draft';

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', evidence.id, 'source_kind', evidence.source_kind,
    'evidence_type', evidence.evidence_type, 'title', evidence.title,
    'observation', evidence.observation, 'observed_at', evidence.observed_at,
    'confidence', evidence.confidence, 'sample_context', evidence.sample_context,
    'scrim_id', evidence.scrim_id, 'scrim_game_id', evidence.scrim_game_id
  ) order by evidence.observed_at desc), '[]'::jsonb)
  into evidence_snapshot
  from public.preparation_brief_evidence link
  join public.scouting_evidence evidence
    on evidence.id = link.evidence_id and evidence.tenant_id = link.tenant_id
  where link.brief_id = p_brief_id and link.tenant_id = brief_row.tenant_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', game.id, 'provider', game.provider,
    'provider_game_id', game.provider_game_id,
    'provider_match_id', game.provider_match_id,
    'tournament', game.provider_tournament, 'source_url', game.source_url,
    'source_revision', game.source_revision, 'fetched_at', game.fetched_at,
    'played_at', game.played_at, 'patch', game.patch,
    'blue_team', game.blue_team, 'red_team', game.red_team,
    'winner_side', game.winner_side, 'blue_picks', game.blue_picks,
    'red_picks', game.red_picks, 'blue_bans', game.blue_bans,
    'red_bans', game.red_bans
  ) order by link.display_order), '[]'::jsonb)
  into external_draft_snapshot
  from public.preparation_brief_external_drafts link
  join public.opponent_external_draft_games game
    on game.id = link.external_draft_game_id and game.tenant_id = link.tenant_id
  where link.brief_id = p_brief_id and link.tenant_id = brief_row.tenant_id;

  snapshot_value := jsonb_build_object(
    'brief', jsonb_build_object(
      'title', brief_row.title, 'executive_summary', brief_row.executive_summary,
      'priorities', brief_row.priorities, 'scheduled_for', brief_row.scheduled_for,
      'patch_label', brief_row.patch_label, 'revision', brief_row.revision
    ),
    'evidence', evidence_snapshot,
    'external_drafts', external_draft_snapshot,
    'scenarios', scenario_snapshot,
    'published_at', published_at_value
  );

  update public.draft_scenarios set status = 'published', updated_at = published_at_value
  where brief_id = p_brief_id and tenant_id = brief_row.tenant_id and status = 'draft';
  update public.preparation_briefs
  set status = 'published', snapshot = snapshot_value, published_at = published_at_value,
      updated_at = published_at_value
  where id = p_brief_id;
  return snapshot_value;
end;
$$;

revoke all on function public.publish_preparation_brief(uuid) from public, anon;
grant execute on function public.publish_preparation_brief(uuid) to authenticated;

comment on table public.opponent_external_draft_games is
  'Tenant-private Leaguepedia draft imports with attribution and immutable source metadata.';
