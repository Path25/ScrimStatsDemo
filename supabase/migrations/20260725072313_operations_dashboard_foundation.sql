-- Canonical scheduling, roster identity, and capture reconciliation.
-- This migration is additive. Legacy scheduling columns remain populated for
-- the existing client while the replacement dashboard moves to starts_at.

alter table public.scrims
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

update public.scrims
set
  starts_at = coalesce(starts_at, scheduled_time, match_date),
  ends_at = coalesce(
    ends_at,
    coalesce(starts_at, scheduled_time, match_date)
      + make_interval(mins => greatest(coalesce(duration_minutes, 120), 15))
  )
where starts_at is null or ends_at is null;

alter table public.scrims
  alter column starts_at set not null;

alter table public.scrims
  drop constraint if exists scrims_schedule_order_check;

alter table public.scrims
  add constraint scrims_schedule_order_check
  check (ends_at is null or ends_at > starts_at);

create index if not exists scrims_tenant_starts_at_idx
  on public.scrims (tenant_id, starts_at desc);

alter table public.players
  add column if not exists linked_user_id uuid references auth.users(id) on delete set null,
  add column if not exists membership_state text not null default 'roster_only',
  add column if not exists archived_at timestamptz;

alter table public.opponent_teams
  add column if not exists archived_at timestamptz;

create index if not exists opponent_teams_active_name_idx
  on public.opponent_teams (tenant_id, lower(name))
  where archived_at is null;

alter table public.players
  drop constraint if exists players_membership_state_check;

alter table public.players
  add constraint players_membership_state_check
  check (membership_state in ('roster_only', 'invited', 'linked', 'revoked'));

create unique index if not exists players_tenant_linked_user_unique
  on public.players (tenant_id, linked_user_id)
  where linked_user_id is not null;

create unique index if not exists players_tenant_riot_identity_unique
  on public.players (
    tenant_id,
    lower(btrim(riot_id)),
    lower(btrim(riot_tag_line)),
    lower(btrim(region))
  )
  where riot_id is not null
    and riot_tag_line is not null
    and region is not null
    and is_active is true;

alter table public.scrim_participants
  add column if not exists tenant_id uuid,
  add column if not exists riot_id text,
  add column if not exists riot_tag_line text,
  add column if not exists region text,
  add column if not exists identity_status text not null default 'unresolved',
  add column if not exists identity_source text;

update public.scrim_participants participant
set tenant_id = scrim.tenant_id
from public.scrim_games game
join public.scrims scrim on scrim.id = game.scrim_id
where participant.scrim_game_id = game.id
  and participant.tenant_id is null;

alter table public.scrim_participants
  alter column tenant_id set not null;

alter table public.scrim_participants
  drop constraint if exists scrim_participants_identity_status_check,
  drop constraint if exists scrim_participants_identity_source_check;

alter table public.scrim_participants
  add constraint scrim_participants_identity_status_check
    check (identity_status in ('matched', 'unresolved', 'ambiguous', 'ignored')),
  add constraint scrim_participants_identity_source_check
    check (
      identity_source is null
      or identity_source in ('riot_identity', 'staff_reconciled', 'collector', 'legacy')
    );

create unique index if not exists players_id_tenant_unique
  on public.players (id, tenant_id);

alter table public.scrim_participants
  drop constraint if exists scrim_participants_player_tenant_fkey;

alter table public.scrim_participants
  add constraint scrim_participants_player_tenant_fkey
  foreign key (player_id, tenant_id)
  references public.players(id, tenant_id)
  on delete set null (player_id);

create index if not exists scrim_participants_tenant_identity_idx
  on public.scrim_participants (tenant_id, identity_status, created_at desc);

-- Exact Riot identities are safe to reconcile automatically. Display-name-only
-- matches remain unresolved because duplicate names are common.
with exact_matches as (
  select
    participant.id as participant_id,
    (array_agg(player.id order by player.id))[1] as player_id,
    count(*) as match_count
  from public.scrim_participants participant
  join public.players player
    on player.tenant_id = participant.tenant_id
   and player.is_active is true
   and participant.riot_id is not null
   and participant.riot_tag_line is not null
   and participant.region is not null
   and lower(btrim(player.riot_id)) = lower(btrim(participant.riot_id))
   and lower(btrim(player.riot_tag_line)) = lower(btrim(participant.riot_tag_line))
   and lower(btrim(player.region)) = lower(btrim(participant.region))
  where participant.player_id is null
  group by participant.id
)
update public.scrim_participants participant
set
  player_id = match.player_id,
  identity_status = case when match.match_count = 1 then 'matched' else 'ambiguous' end,
  identity_source = case when match.match_count = 1 then 'riot_identity' else null end
from exact_matches match
where participant.id = match.participant_id;

update public.scrim_participants
set
  identity_status = 'matched',
  identity_source = coalesce(identity_source, 'legacy')
where player_id is not null;

create or replace function public.resolve_workspace_local_time(
  p_local_date date,
  p_local_time time without time zone,
  p_timezone text
)
returns timestamptz
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from pg_catalog.pg_timezone_names zone
    where zone.name = p_timezone
  ) then
    raise exception 'Unsupported timezone'
      using errcode = '22023';
  end if;

  return (p_local_date + p_local_time) at time zone p_timezone;
end;
$$;

revoke all on function public.resolve_workspace_local_time(date, time without time zone, text)
  from public, anon;
grant execute on function public.resolve_workspace_local_time(date, time without time zone, text)
  to authenticated;

create or replace function public.create_scrim_block(
  p_tenant_id uuid,
  p_opponent_name text,
  p_local_date date,
  p_local_time time without time zone,
  p_timezone text,
  p_duration_minutes integer default 120,
  p_format text default 'bo5',
  p_notes text default null,
  p_opponent_team_id uuid default null
)
returns public.scrims
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_starts_at timestamptz;
  v_scrim public.scrims;
begin
  if not public.user_has_tenant_role(
    p_tenant_id,
    array['owner', 'admin']::public.tenant_role[]
  ) then
    raise exception 'Insufficient workspace permissions'
      using errcode = '42501';
  end if;

  if char_length(btrim(p_opponent_name)) not between 1 and 120 then
    raise exception 'Opponent name is required'
      using errcode = '22023';
  end if;

  if p_duration_minutes not between 15 and 720 then
    raise exception 'Duration must be between 15 and 720 minutes'
      using errcode = '22023';
  end if;

  v_starts_at := public.resolve_workspace_local_time(
    p_local_date,
    p_local_time,
    p_timezone
  );

  insert into public.scrims (
    tenant_id,
    opponent_name,
    opponent_team_id,
    match_date,
    scheduled_time,
    starts_at,
    ends_at,
    timezone,
    duration_minutes,
    format,
    notes,
    status,
    data_source,
    created_by
  )
  values (
    p_tenant_id,
    btrim(p_opponent_name),
    p_opponent_team_id,
    v_starts_at,
    v_starts_at,
    v_starts_at,
    v_starts_at + make_interval(mins => p_duration_minutes),
    p_timezone,
    p_duration_minutes,
    nullif(btrim(p_format), ''),
    nullif(btrim(p_notes), ''),
    'scheduled',
    'manual',
    auth.uid()
  )
  returning * into v_scrim;

  return v_scrim;
end;
$$;

create or replace function public.update_scrim_block_schedule(
  p_scrim_id uuid,
  p_local_date date,
  p_local_time time without time zone,
  p_timezone text,
  p_duration_minutes integer default 120,
  p_status text default null
)
returns public.scrims
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid;
  v_starts_at timestamptz;
  v_scrim public.scrims;
begin
  select scrim.tenant_id
  into v_tenant_id
  from public.scrims scrim
  where scrim.id = p_scrim_id;

  if v_tenant_id is null or not public.user_has_tenant_role(
    v_tenant_id,
    array['owner', 'admin']::public.tenant_role[]
  ) then
    raise exception 'Scrim not found or insufficient workspace permissions'
      using errcode = '42501';
  end if;

  if p_duration_minutes not between 15 and 720 then
    raise exception 'Duration must be between 15 and 720 minutes'
      using errcode = '22023';
  end if;

  v_starts_at := public.resolve_workspace_local_time(
    p_local_date,
    p_local_time,
    p_timezone
  );

  update public.scrims
  set
    match_date = v_starts_at,
    scheduled_time = v_starts_at,
    starts_at = v_starts_at,
    ends_at = v_starts_at + make_interval(mins => p_duration_minutes),
    timezone = p_timezone,
    duration_minutes = p_duration_minutes,
    status = coalesce(nullif(btrim(p_status), ''), status),
    updated_at = now()
  where id = p_scrim_id
  returning * into v_scrim;

  return v_scrim;
end;
$$;

create or replace function public.set_scrim_block_state(
  p_scrim_id uuid,
  p_action text
)
returns public.scrims
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid;
  v_scrim public.scrims;
begin
  select scrim.tenant_id
  into v_tenant_id
  from public.scrims scrim
  where scrim.id = p_scrim_id;

  if v_tenant_id is null or not public.user_has_tenant_role(
    v_tenant_id,
    array['owner', 'admin']::public.tenant_role[]
  ) then
    raise exception 'Scrim not found or insufficient workspace permissions'
      using errcode = '42501';
  end if;

  if p_action = 'cancel' then
    update public.scrims
    set status = 'cancelled', updated_at = now()
    where id = p_scrim_id
    returning * into v_scrim;
  elsif p_action = 'restore' then
    update public.scrims
    set status = 'scheduled', updated_at = now()
    where id = p_scrim_id
    returning * into v_scrim;
  elsif p_action = 'delete' then
    delete from public.scrims
    where id = p_scrim_id
    returning * into v_scrim;
  else
    raise exception 'Unsupported scrim action'
      using errcode = '22023';
  end if;

  return v_scrim;
end;
$$;

create or replace function public.upsert_workspace_calendar_event(
  p_tenant_id uuid,
  p_event_id uuid,
  p_title text,
  p_event_type public.event_type,
  p_local_date date,
  p_local_time time without time zone,
  p_timezone text,
  p_duration_minutes integer default 60,
  p_description text default null,
  p_location text default null
)
returns public.calendar_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_starts_at timestamptz;
  v_event public.calendar_events;
begin
  if not public.user_has_tenant_role(
    p_tenant_id,
    array['owner', 'admin']::public.tenant_role[]
  ) then
    raise exception 'Insufficient workspace permissions'
      using errcode = '42501';
  end if;

  if p_event_id is not null and not exists (
    select 1
    from public.calendar_events event
    where event.id = p_event_id
      and event.tenant_id = p_tenant_id
  ) then
    raise exception 'Calendar event not found'
      using errcode = 'P0002';
  end if;

  if char_length(btrim(p_title)) not between 1 and 160 then
    raise exception 'Event title is required'
      using errcode = '22023';
  end if;

  if p_duration_minutes not between 15 and 1440 then
    raise exception 'Duration must be between 15 and 1440 minutes'
      using errcode = '22023';
  end if;

  v_starts_at := public.resolve_workspace_local_time(
    p_local_date,
    p_local_time,
    p_timezone
  );

  if p_event_id is null then
    insert into public.calendar_events (
      tenant_id,
      title,
      event_type,
      start_time,
      end_time,
      timezone,
      description,
      location,
      created_by
    )
    values (
      p_tenant_id,
      btrim(p_title),
      p_event_type,
      v_starts_at,
      v_starts_at + make_interval(mins => p_duration_minutes),
      p_timezone,
      nullif(btrim(p_description), ''),
      nullif(btrim(p_location), ''),
      auth.uid()
    )
    returning * into v_event;
  else
    update public.calendar_events
    set
      title = btrim(p_title),
      event_type = p_event_type,
      start_time = v_starts_at,
      end_time = v_starts_at + make_interval(mins => p_duration_minutes),
      timezone = p_timezone,
      description = nullif(btrim(p_description), ''),
      location = nullif(btrim(p_location), ''),
      updated_at = now()
    where id = p_event_id
      and tenant_id = p_tenant_id
    returning * into v_event;
  end if;

  return v_event;
end;
$$;

create or replace function public.delete_workspace_calendar_event(
  p_tenant_id uuid,
  p_event_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.user_has_tenant_role(
    p_tenant_id,
    array['owner', 'admin']::public.tenant_role[]
  ) then
    raise exception 'Insufficient workspace permissions'
      using errcode = '42501';
  end if;

  delete from public.calendar_events
  where id = p_event_id
    and tenant_id = p_tenant_id;

  if not found then
    raise exception 'Calendar event not found'
      using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.reconcile_scrim_participant(
  p_participant_id uuid,
  p_player_id uuid,
  p_ignore boolean default false
)
returns public.scrim_participants
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid;
  v_participant public.scrim_participants;
begin
  select participant.tenant_id
  into v_tenant_id
  from public.scrim_participants participant
  where participant.id = p_participant_id;

  if v_tenant_id is null or not public.user_has_tenant_role(
    v_tenant_id,
    array['owner', 'admin']::public.tenant_role[]
  ) then
    raise exception 'Participant not found or insufficient workspace permissions'
      using errcode = '42501';
  end if;

  if p_ignore then
    update public.scrim_participants
    set
      player_id = null,
      identity_status = 'ignored',
      identity_source = 'staff_reconciled',
      updated_at = now()
    where id = p_participant_id
    returning * into v_participant;
  else
    if not exists (
      select 1
      from public.players player
      where player.id = p_player_id
        and player.tenant_id = v_tenant_id
    ) then
      raise exception 'Roster player does not belong to this workspace'
        using errcode = '23503';
    end if;

    update public.scrim_participants
    set
      player_id = p_player_id,
      identity_status = 'matched',
      identity_source = 'staff_reconciled',
      updated_at = now()
    where id = p_participant_id
    returning * into v_participant;
  end if;

  return v_participant;
end;
$$;

create or replace function public.update_roster_player(
  p_player_id uuid,
  p_summoner_name text,
  p_riot_id text,
  p_riot_tag_line text,
  p_region text,
  p_role text,
  p_main_champions jsonb,
  p_discord_username text default null,
  p_notes text default null
)
returns public.players
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid;
  v_player public.players;
begin
  select player.tenant_id
  into v_tenant_id
  from public.players player
  where player.id = p_player_id;

  if v_tenant_id is null or not public.user_has_tenant_role(
    v_tenant_id,
    array['owner', 'admin']::public.tenant_role[]
  ) then
    raise exception 'Player not found or insufficient workspace permissions'
      using errcode = '42501';
  end if;

  if char_length(btrim(p_summoner_name)) not between 1 and 80 then
    raise exception 'Player name is required'
      using errcode = '22023';
  end if;

  update public.players
  set
    summoner_name = btrim(p_summoner_name),
    riot_id = nullif(btrim(p_riot_id), ''),
    riot_tag_line = nullif(btrim(p_riot_tag_line), ''),
    region = nullif(upper(btrim(p_region)), ''),
    role = nullif(btrim(p_role), ''),
    main_champions = coalesce(p_main_champions, '[]'::jsonb),
    discord_username = nullif(btrim(p_discord_username), ''),
    notes = nullif(btrim(p_notes), ''),
    updated_at = now()
  where id = p_player_id
  returning * into v_player;

  return v_player;
end;
$$;

create or replace function public.set_roster_player_state(
  p_player_id uuid,
  p_active boolean
)
returns public.players
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid;
  v_player public.players;
begin
  select player.tenant_id
  into v_tenant_id
  from public.players player
  where player.id = p_player_id;

  if v_tenant_id is null or not public.user_has_tenant_role(
    v_tenant_id,
    array['owner', 'admin']::public.tenant_role[]
  ) then
    raise exception 'Player not found or insufficient workspace permissions'
      using errcode = '42501';
  end if;

  update public.players
  set
    is_active = p_active,
    archived_at = case when p_active then null else now() end,
    updated_at = now()
  where id = p_player_id
  returning * into v_player;

  return v_player;
end;
$$;

revoke all on function public.create_scrim_block(
  uuid, text, date, time without time zone, text, integer, text, text, uuid
) from public, anon;
revoke all on function public.update_scrim_block_schedule(
  uuid, date, time without time zone, text, integer, text
) from public, anon;
revoke all on function public.set_scrim_block_state(uuid, text)
  from public, anon;
revoke all on function public.upsert_workspace_calendar_event(
  uuid, uuid, text, public.event_type, date, time without time zone,
  text, integer, text, text
) from public, anon;
revoke all on function public.delete_workspace_calendar_event(uuid, uuid)
  from public, anon;
revoke all on function public.reconcile_scrim_participant(uuid, uuid, boolean)
  from public, anon;
revoke all on function public.update_roster_player(
  uuid, text, text, text, text, text, jsonb, text, text
) from public, anon;
revoke all on function public.set_roster_player_state(uuid, boolean)
  from public, anon;

grant execute on function public.create_scrim_block(
  uuid, text, date, time without time zone, text, integer, text, text, uuid
) to authenticated;
grant execute on function public.update_scrim_block_schedule(
  uuid, date, time without time zone, text, integer, text
) to authenticated;
grant execute on function public.set_scrim_block_state(uuid, text)
  to authenticated;
grant execute on function public.upsert_workspace_calendar_event(
  uuid, uuid, text, public.event_type, date, time without time zone,
  text, integer, text, text
) to authenticated;
grant execute on function public.delete_workspace_calendar_event(uuid, uuid)
  to authenticated;
grant execute on function public.reconcile_scrim_participant(uuid, uuid, boolean)
  to authenticated;
grant execute on function public.update_roster_player(
  uuid, text, text, text, text, text, jsonb, text, text
) to authenticated;
grant execute on function public.set_roster_player_state(uuid, boolean)
  to authenticated;

comment on column public.scrims.starts_at is
  'Canonical UTC start instant for the practice block.';
comment on column public.scrims.ends_at is
  'Canonical UTC end instant for the practice block.';
comment on column public.scrim_participants.identity_status is
  'Whether a captured participant is linked to a tenant roster record.';

-- Draft-board invariants are enforced below the UI so direct API writes cannot create
-- duplicate champions, role conflicts, or publish incomplete tournament scenarios.
create or replace function public.enforce_draft_scenario_action()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_scenario_status text;
  v_pick_count integer;
  v_ban_count integer;
begin
  select scenario.status
  into v_scenario_status
  from public.draft_scenarios scenario
  where scenario.id = new.scenario_id
    and scenario.tenant_id = new.tenant_id;

  if v_scenario_status is distinct from 'draft' then
    raise exception 'Only draft scenarios can be changed' using errcode = '23514';
  end if;

  new.champion_name := trim(new.champion_name);

  if new.action_type not in ('pick', 'ban') then
    raise exception 'Tournament draft boards support picks and bans only' using errcode = '23514';
  end if;

  if (new.action_type = 'pick' and new.phase not like 'pick_%')
    or (new.action_type = 'ban' and new.phase not like 'ban_%') then
    raise exception 'Draft action phase does not match its action type' using errcode = '23514';
  end if;

  if new.action_type = 'ban' and new.assigned_role is not null then
    raise exception 'Bans cannot have a role assignment' using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.draft_scenario_actions action
    where action.scenario_id = new.scenario_id
      and lower(trim(action.champion_name)) = lower(new.champion_name)
      and action.id <> new.id
  ) then
    raise exception 'A champion cannot appear more than once in a draft scenario'
      using errcode = '23505';
  end if;

  if new.action_type = 'pick'
    and new.assigned_role is not null
    and exists (
      select 1
      from public.draft_scenario_actions action
      where action.scenario_id = new.scenario_id
        and action.team_side = new.team_side
        and action.action_type = 'pick'
        and action.assigned_role = new.assigned_role
        and action.id <> new.id
    ) then
    raise exception 'A role can only be assigned once per side' using errcode = '23505';
  end if;

  select
    count(*) filter (where action.action_type = 'pick'),
    count(*) filter (where action.action_type = 'ban')
  into v_pick_count, v_ban_count
  from public.draft_scenario_actions action
  where action.scenario_id = new.scenario_id
    and action.team_side = new.team_side
    and action.id <> new.id;

  if new.action_type = 'pick' and v_pick_count >= 5 then
    raise exception 'A side cannot contain more than five picks' using errcode = '23514';
  end if;
  if new.action_type = 'ban' and v_ban_count >= 5 then
    raise exception 'A side cannot contain more than five bans' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_draft_scenario_action_trigger on public.draft_scenario_actions;
create trigger enforce_draft_scenario_action_trigger
before insert or update on public.draft_scenario_actions
for each row execute function public.enforce_draft_scenario_action();

create or replace function public.enforce_complete_draft_scenario()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_our_picks integer;
  v_opponent_picks integer;
  v_our_bans integer;
  v_opponent_bans integer;
  v_assigned_roles integer;
begin
  if old.status = 'draft' and new.status = 'published' then
    select
      count(*) filter (where action.team_side = 'ours' and action.action_type = 'pick'),
      count(*) filter (where action.team_side = 'opponent' and action.action_type = 'pick'),
      count(*) filter (where action.team_side = 'ours' and action.action_type = 'ban'),
      count(*) filter (where action.team_side = 'opponent' and action.action_type = 'ban'),
      count(distinct action.assigned_role) filter (
        where action.team_side = 'ours'
          and action.action_type = 'pick'
          and action.assigned_role is not null
      )
    into v_our_picks, v_opponent_picks, v_our_bans, v_opponent_bans, v_assigned_roles
    from public.draft_scenario_actions action
    where action.scenario_id = new.id;

    if v_our_picks <> 5
      or v_opponent_picks <> 5
      or v_our_bans <> 5
      or v_opponent_bans <> 5 then
      raise exception 'Published scenarios require five picks and five bans for each side'
        using errcode = '23514';
    end if;
    if v_assigned_roles <> 5 then
      raise exception 'Every ScrimStats pick requires one unique role before publication'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_complete_draft_scenario_trigger on public.draft_scenarios;
create trigger enforce_complete_draft_scenario_trigger
before update of status on public.draft_scenarios
for each row execute function public.enforce_complete_draft_scenario();

revoke all on function public.enforce_draft_scenario_action() from public, anon, authenticated;
revoke all on function public.enforce_complete_draft_scenario() from public, anon, authenticated;
