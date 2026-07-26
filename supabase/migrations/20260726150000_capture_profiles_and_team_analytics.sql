-- Capture-profile and capability-aware analytics foundation.

create table public.tenant_capture_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  profile text not null default 'desktop_manual'
    check (profile in ('desktop_manual', 'grid_manual')),
  selected_by uuid references auth.users(id) on delete set null,
  selected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.tenant_capture_settings (tenant_id, profile)
select tenant.id,
       case when coalesce(tenant.grid_integration_enabled, false)
         then 'grid_manual'
         else 'desktop_manual'
       end
from public.tenants tenant
on conflict (tenant_id) do nothing;

create table public.scrim_game_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  scrim_game_id uuid not null unique references public.scrim_games(id) on delete cascade,
  provider text not null check (provider in ('manual', 'desktop_collector', 'grid')),
  provider_record_id text,
  payload_version text not null default 'legacy-v1',
  captured_at timestamptz not null,
  capabilities text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (capabilities <@ array[
    'result', 'draft', 'participant_stats', 'timeline', 'objectives',
    'position_samples', 'movement_detail', 'coach_review'
  ]::text[])
);

create unique index scrim_game_evidence_provider_record_idx
  on public.scrim_game_evidence (tenant_id, provider, provider_record_id)
  where provider_record_id is not null;
create index scrim_game_evidence_tenant_provider_idx
  on public.scrim_game_evidence (tenant_id, provider, captured_at desc);
create index scrim_game_evidence_capabilities_idx
  on public.scrim_game_evidence using gin (capabilities);

insert into public.scrim_game_evidence (
  tenant_id,
  scrim_game_id,
  provider,
  provider_record_id,
  payload_version,
  captured_at,
  capabilities,
  metadata
)
select
  scrim.tenant_id,
  game.id,
  case
    when game.external_game_data ? 'grid_metadata' then 'grid'
    when game.desktop_session_id is not null
      or game.external_game_data ->> 'source' = 'desktop_collector' then 'desktop_collector'
    else 'manual'
  end,
  case
    when game.external_game_data ? 'grid_metadata'
      then concat(
        game.external_game_data -> 'grid_metadata' ->> 'seriesId',
        ':',
        game.game_number::text
      )
    when game.desktop_session_id is not null
      then coalesce(game.external_game_id, game.desktop_session_id)
    else null
  end,
  coalesce(
    game.external_game_data ->> 'schema_version',
    game.external_game_data -> 'grid_metadata' ->> 'schemaVersion',
    'legacy-v1'
  ),
  coalesce(game.game_end_time, game.game_start_time, game.created_at),
  array_remove(array[
    case when game.result in ('win', 'loss', 'draw') then 'result' end,
    case when exists (
      select 1 from public.scrim_participants participant
      where participant.scrim_game_id = game.id
        and participant.champion_name is not null
    ) then 'draft' end,
    case when exists (
      select 1 from public.scrim_participants participant
      where participant.scrim_game_id = game.id
        and participant.is_our_team = true
    ) then 'participant_stats' end,
    case when jsonb_typeof(game.external_game_data -> 'timeline') = 'array'
      and jsonb_array_length(game.external_game_data -> 'timeline') > 0 then 'timeline' end,
    case when coalesce(game.objectives, '{}'::jsonb) <> '{}'::jsonb then 'objectives' end,
    case when game.external_game_data ? 'grid_metadata'
      and jsonb_typeof(game.external_game_data -> 'game_timeline') = 'array'
      and jsonb_array_length(game.external_game_data -> 'game_timeline') > 0 then 'position_samples' end,
    case when game.external_game_data ? 'grid_metadata'
      and jsonb_typeof(game.external_game_data -> 'game_timeline') = 'array'
      and jsonb_array_length(game.external_game_data -> 'game_timeline') > 0 then 'movement_detail' end,
    case when game.performance_rating is not null
      and nullif(trim(game.performance_summary), '') is not null then 'coach_review' end
  ], null)::text[],
  jsonb_build_object('backfilled', true)
from public.scrim_games game
join public.scrims scrim on scrim.id = game.scrim_id
on conflict (scrim_game_id) do nothing;

create table public.scrim_game_reconciliations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  first_game_id uuid not null references public.scrim_games(id) on delete cascade,
  second_game_id uuid not null references public.scrim_games(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  match_reasons text[] not null default '{}'::text[],
  accepted_game_id uuid references public.scrim_games(id) on delete set null,
  resolution_notes text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (first_game_id <> second_game_id),
  check (accepted_game_id is null or accepted_game_id in (first_game_id, second_game_id))
);

create unique index scrim_game_reconciliations_pair_idx
  on public.scrim_game_reconciliations (
    tenant_id,
    least(first_game_id, second_game_id),
    greatest(first_game_id, second_game_id)
  );
create index scrim_game_reconciliations_tenant_status_idx
  on public.scrim_game_reconciliations (tenant_id, status, created_at desc);

alter table public.tenant_capture_settings enable row level security;
alter table public.scrim_game_evidence enable row level security;
alter table public.scrim_game_reconciliations enable row level security;

create policy "Members can view capture settings"
on public.tenant_capture_settings for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

create policy "Members can view game evidence"
on public.scrim_game_evidence for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

create policy "Members can view game reconciliations"
on public.scrim_game_reconciliations for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

revoke all on public.tenant_capture_settings,
  public.scrim_game_evidence,
  public.scrim_game_reconciliations from public, anon, authenticated;
grant select on public.tenant_capture_settings,
  public.scrim_game_evidence,
  public.scrim_game_reconciliations to authenticated;
grant all on public.tenant_capture_settings,
  public.scrim_game_evidence,
  public.scrim_game_reconciliations to service_role;

create or replace function public.set_workspace_capture_profile(
  p_tenant_id uuid,
  p_profile text
)
returns public.tenant_capture_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.tenant_capture_settings;
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
  if p_profile not in ('desktop_manual', 'grid_manual') then
    raise exception 'Unsupported capture profile';
  end if;

  insert into public.tenant_capture_settings (
    tenant_id, profile, selected_by, selected_at, updated_at
  ) values (
    p_tenant_id, p_profile, (select auth.uid()), now(), now()
  )
  on conflict (tenant_id) do update
  set profile = excluded.profile,
      selected_by = excluded.selected_by,
      selected_at = excluded.selected_at,
      updated_at = excluded.updated_at
  returning * into result;

  return result;
end;
$$;

revoke all on function public.set_workspace_capture_profile(uuid, text)
  from public, anon;
grant execute on function public.set_workspace_capture_profile(uuid, text)
  to authenticated;

create or replace function public.enforce_capture_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured_profile text;
begin
  if new.provider = 'manual' then
    return new;
  end if;

  select setting.profile into configured_profile
  from public.tenant_capture_settings setting
  where setting.tenant_id = new.tenant_id;

  configured_profile := coalesce(configured_profile, 'desktop_manual');
  if (new.provider = 'desktop_collector' and configured_profile <> 'desktop_manual')
    or (new.provider = 'grid' and configured_profile <> 'grid_manual') then
    raise exception 'The % provider is inactive for this workspace capture profile', new.provider;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_capture_profile() from public, anon, authenticated;
create trigger enforce_capture_profile_before_evidence
before insert on public.scrim_game_evidence
for each row execute function public.enforce_capture_profile();

create or replace function public.prevent_evidence_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'Game provenance is immutable';
end;
$$;

revoke all on function public.prevent_evidence_mutation() from public, anon, authenticated;
create trigger prevent_game_evidence_update
before update or delete on public.scrim_game_evidence
for each row execute function public.prevent_evidence_mutation();

create or replace function public.create_manual_game_evidence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  evidence_tenant_id uuid;
begin
  if new.desktop_session_id is not null
    or new.external_game_data ? 'grid_metadata'
    or new.external_game_data ->> 'source' = 'desktop_collector' then
    return new;
  end if;

  select scrim.tenant_id into evidence_tenant_id
  from public.scrims scrim where scrim.id = new.scrim_id;

  insert into public.scrim_game_evidence (
    tenant_id, scrim_game_id, provider, payload_version, captured_at, capabilities
  ) values (
    evidence_tenant_id,
    new.id,
    'manual',
    'manual-v1',
    coalesce(new.game_end_time, new.game_start_time, new.created_at),
    array_remove(array[
      case when new.result in ('win', 'loss', 'draw') then 'result' end,
      case when coalesce(new.objectives, '{}'::jsonb) <> '{}'::jsonb then 'objectives' end,
      case when new.performance_rating is not null
        and nullif(trim(new.performance_summary), '') is not null then 'coach_review' end
    ], null)::text[]
  ) on conflict (scrim_game_id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_manual_game_evidence() from public, anon, authenticated;
create trigger create_manual_evidence_after_game
after insert on public.scrim_games
for each row execute function public.create_manual_game_evidence();

create or replace function public.flag_possible_game_duplicate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate record;
begin
  for candidate in
    select other.id
    from public.scrim_games current_game
    join public.scrim_games other
      on other.scrim_id = current_game.scrim_id
     and other.id <> current_game.id
    left join public.scrim_game_evidence other_evidence
      on other_evidence.scrim_game_id = other.id
    where current_game.id = new.scrim_game_id
      and (
        other.game_number = current_game.game_number
        or (
          other.game_start_time is not null
          and current_game.game_start_time is not null
          and abs(extract(epoch from (other.game_start_time - current_game.game_start_time))) <= 600
        )
      )
      and coalesce(other_evidence.provider, 'manual') <> new.provider
  loop
    insert into public.scrim_game_reconciliations (
      tenant_id, first_game_id, second_game_id, match_reasons
    ) values (
      new.tenant_id,
      candidate.id,
      new.scrim_game_id,
      array['same block and game number or start time']
    ) on conflict do nothing;
  end loop;
  return new;
end;
$$;

revoke all on function public.flag_possible_game_duplicate() from public, anon, authenticated;
create trigger flag_possible_duplicate_after_evidence
after insert on public.scrim_game_evidence
for each row execute function public.flag_possible_game_duplicate();

create or replace function public.resolve_game_reconciliation(
  p_reconciliation_id uuid,
  p_action text,
  p_accepted_game_id uuid default null,
  p_notes text default null
)
returns public.scrim_game_reconciliations
language plpgsql
security definer
set search_path = ''
as $$
declare
  reconciliation public.scrim_game_reconciliations;
begin
  select * into reconciliation
  from public.scrim_game_reconciliations
  where id = p_reconciliation_id
  for update;

  if not found then raise exception 'Reconciliation was not found'; end if;
  if not public.user_has_tenant_role(
    reconciliation.tenant_id,
    array['owner'::public.tenant_role, 'admin'::public.tenant_role]
  ) then
    raise exception 'Owner or admin access is required';
  end if;
  if p_action not in ('resolved', 'dismissed') then
    raise exception 'Unsupported reconciliation action';
  end if;
  if p_action = 'resolved'
    and p_accepted_game_id not in (reconciliation.first_game_id, reconciliation.second_game_id) then
    raise exception 'Choose one of the compared games';
  end if;

  update public.scrim_game_reconciliations
  set status = p_action,
      accepted_game_id = case when p_action = 'resolved' then p_accepted_game_id else null end,
      resolution_notes = nullif(trim(p_notes), ''),
      resolved_by = (select auth.uid()),
      resolved_at = now()
  where id = p_reconciliation_id
  returning * into reconciliation;
  return reconciliation;
end;
$$;

revoke all on function public.resolve_game_reconciliation(uuid, text, uuid, text)
  from public, anon;
grant execute on function public.resolve_game_reconciliation(uuid, text, uuid, text)
  to authenticated;

create or replace function public.get_team_analytics_dataset(
  p_tenant_id uuid,
  p_date_from date default (current_date - 29),
  p_date_to date default current_date
)
returns jsonb
language sql
security invoker
set search_path = ''
stable
as $$
  with scoped_games as (
    select
      game.id,
      game.scrim_id,
      game.game_number,
      coalesce(game.game_start_time, scrim.starts_at, scrim.match_date::timestamptz) as played_at,
      scrim.opponent_team_id,
      coalesce(nullif(trim(scrim.opponent_name), ''), 'Opponent not recorded') as opponent_name,
      scrim.format,
      game.result,
      lower(game.side) as side,
      game.duration_seconds,
      game.our_team_kills,
      game.enemy_team_kills,
      game.our_team_gold,
      game.enemy_team_gold,
      game.performance_rating,
      game.early_game_rating,
      game.mid_game_rating,
      game.late_game_rating,
      coalesce(evidence.provider, 'manual') as provider,
      array_remove(array_cat(
        coalesce(evidence.capabilities, '{}'::text[]),
        array[
          case when game.result in ('win', 'loss', 'draw') then 'result' end,
          case when exists (
            select 1 from public.scrim_participants participant
            where participant.scrim_game_id = game.id
              and participant.champion_name is not null
          ) then 'draft' end,
          case when exists (
            select 1 from public.scrim_participants participant
            where participant.scrim_game_id = game.id
              and participant.is_our_team = true
          ) then 'participant_stats' end,
          case when coalesce(game.objectives, '{}'::jsonb) <> '{}'::jsonb then 'objectives' end,
          case when game.performance_rating is not null
            and nullif(trim(game.performance_summary), '') is not null then 'coach_review' end
        ]::text[]
      ), null) as capabilities,
      evidence.payload_version,
      evidence.captured_at,
      coalesce(
        nullif(split_part(game.external_game_data ->> 'gameVersion', '.', 1), ''),
        nullif(game.external_game_data ->> 'patch', '')
      ) as patch
    from public.scrim_games game
    join public.scrims scrim on scrim.id = game.scrim_id
    left join public.scrim_game_evidence evidence on evidence.scrim_game_id = game.id
    where scrim.tenant_id = p_tenant_id
      and public.user_belongs_to_tenant(p_tenant_id)
      and game.status = 'completed'
      and not exists (
        select 1
        from public.scrim_game_reconciliations reconciliation
        where reconciliation.tenant_id = scrim.tenant_id
          and game.id in (reconciliation.first_game_id, reconciliation.second_game_id)
          and (
            reconciliation.status = 'pending'
            or (
              reconciliation.status = 'resolved'
              and reconciliation.accepted_game_id <> game.id
            )
          )
      )
      and coalesce(game.game_start_time, scrim.starts_at, scrim.match_date::timestamptz)::date
        between p_date_from and p_date_to
  ),
  scoped_participants as (
    select
      participant.scrim_game_id,
      participant.player_id,
      participant.summoner_name,
      participant.champion_name,
      lower(participant.role) as role,
      participant.is_our_team,
      participant.kills,
      participant.deaths,
      participant.assists,
      participant.cs,
      participant.gold,
      participant.damage_dealt,
      participant.damage_taken,
      participant.vision_score
    from public.scrim_participants participant
    join scoped_games game on game.id = participant.scrim_game_id
  )
  select jsonb_build_object(
    'contract_version', 'team-analytics-v2',
    'date_from', p_date_from,
    'date_to', p_date_to,
    'capture_profile', coalesce((
      select setting.profile
      from public.tenant_capture_settings setting
      where setting.tenant_id = p_tenant_id
    ), 'desktop_manual'),
    'games', coalesce((
      select jsonb_agg(to_jsonb(game) order by game.played_at desc, game.game_number desc)
      from scoped_games game
    ), '[]'::jsonb),
    'participants', coalesce((
      select jsonb_agg(to_jsonb(participant))
      from scoped_participants participant
    ), '[]'::jsonb),
    'filter_options', jsonb_build_object(
      'opponents', coalesce((
        select jsonb_agg(to_jsonb(option_row) order by option_row.name)
        from (
          select distinct
            coalesce(opponent_team_id::text, 'name:' || lower(opponent_name)) as key,
            opponent_name as name
          from scoped_games
        ) option_row
      ), '[]'::jsonb),
      'formats', coalesce((
        select jsonb_agg(option_row.format order by option_row.format)
        from (select distinct format from scoped_games where nullif(trim(format), '') is not null) option_row
      ), '[]'::jsonb),
      'patches', coalesce((
        select jsonb_agg(option_row.patch order by option_row.patch desc)
        from (select distinct patch from scoped_games where patch is not null) option_row
      ), '[]'::jsonb)
    )
  );
$$;

revoke all on function public.get_team_analytics_dataset(uuid, date, date)
  from public, anon;
grant execute on function public.get_team_analytics_dataset(uuid, date, date)
  to authenticated;

comment on table public.tenant_capture_settings is
  'One automatic capture provider plus manual fallback per workspace.';
comment on table public.scrim_game_evidence is
  'Immutable provenance and metric capabilities for a captured or manually reviewed game.';
comment on function public.get_team_analytics_dataset(uuid, date, date) is
  'Returns normalized factual analytics rows without exposing raw provider payloads.';
