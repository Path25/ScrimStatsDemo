-- Create practice blocks from one canonical instant.
-- This supplements the original local-date RPC and does not alter existing rows.

create or replace function public.schedule_scrim_block(
  p_tenant_id uuid,
  p_opponent_name text,
  p_starts_at timestamptz,
  p_timezone text,
  p_duration_minutes integer default 120,
  p_format text default 'BO5',
  p_notes text default null,
  p_opponent_team_id uuid default null
)
returns public.scrims
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scrim public.scrims;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if not public.user_has_tenant_role(
    p_tenant_id,
    array['owner', 'admin']::public.tenant_role[]
  ) then
    raise exception 'Only team staff can schedule practice blocks'
      using errcode = '42501';
  end if;

  if nullif(btrim(p_opponent_name), '') is null
     or char_length(btrim(p_opponent_name)) > 120 then
    raise exception 'Opponent name must be between 1 and 120 characters'
      using errcode = '22023';
  end if;

  if p_starts_at is null then
    raise exception 'A start time is required' using errcode = '22023';
  end if;

  if p_duration_minutes not between 15 and 720 then
    raise exception 'Duration must be between 15 and 720 minutes'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_timezone_names zone
    where zone.name = p_timezone
  ) then
    raise exception 'Choose a supported IANA timezone'
      using errcode = '22023';
  end if;

  if p_opponent_team_id is not null and not exists (
    select 1
    from public.opponent_teams opponent
    where opponent.id = p_opponent_team_id
      and opponent.tenant_id = p_tenant_id
      and opponent.archived_at is null
  ) then
    raise exception 'The selected opponent is not active in this workspace'
      using errcode = '23503';
  end if;

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
    p_starts_at,
    p_starts_at,
    p_starts_at,
    p_starts_at + make_interval(mins => p_duration_minutes),
    p_timezone,
    p_duration_minutes,
    coalesce(nullif(btrim(p_format), ''), 'BO5'),
    nullif(btrim(p_notes), ''),
    'scheduled',
    'manual',
    auth.uid()
  )
  returning * into v_scrim;

  return v_scrim;
end;
$$;

revoke all on function public.schedule_scrim_block(
  uuid, text, timestamptz, text, integer, text, text, uuid
) from public, anon;
grant execute on function public.schedule_scrim_block(
  uuid, text, timestamptz, text, integer, text, text, uuid
) to authenticated;

notify pgrst, 'reload schema';
