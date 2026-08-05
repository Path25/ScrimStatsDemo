-- WO-2026-040 Phase C: private, one-use control for claiming exactly one
-- approved non-customer Discord outbox event. This migration remains source-only
-- until Theo separately approves hosted application.

create schema if not exists security;

create table security.discord_qa_dispatch_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  event_id uuid not null references public.integration_events(id) on delete restrict,
  case_key text not null default 'exact_event_dispatch'
    check (case_key = 'exact_event_dispatch'),
  state text not null default 'armed'
    check (state in ('armed', 'claimed', 'completed', 'disabled', 'expired')),
  result_status text
    check (result_status is null or result_status in ('pending', 'failed', 'delivered', 'cancelled')),
  function_version text
    check (function_version is null or (length(function_version) between 1 and 160 and function_version ~ '^[A-Za-z0-9._:/-]+$')),
  armed_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  claimed_at timestamptz,
  completed_at timestamptz,
  check (expires_at > armed_at),
  check (expires_at <= armed_at + interval '15 minutes'),
  check (
    (state = 'armed' and claimed_at is null and completed_at is null and result_status is null)
    or (state = 'claimed' and claimed_at is not null and completed_at is null and result_status is null)
    or (state = 'completed' and claimed_at is not null and completed_at is not null and result_status is not null)
    or (state in ('disabled', 'expired') and completed_at is not null and result_status is null)
  )
);

alter table security.discord_qa_dispatch_runs enable row level security;

revoke all on schema security from public, anon, authenticated, service_role;
revoke all on table security.discord_qa_dispatch_runs from public, anon, authenticated, service_role;

create unique index discord_qa_dispatch_runs_one_active_case_idx
  on security.discord_qa_dispatch_runs (case_key)
  where state in ('armed', 'claimed');

create index discord_qa_dispatch_runs_event_armed_idx
  on security.discord_qa_dispatch_runs (tenant_id, event_id, armed_at desc);

create index discord_qa_dispatch_runs_event_fk_idx
  on security.discord_qa_dispatch_runs (event_id);

create or replace function security.arm_discord_qa_dispatch(
  p_tenant_id uuid,
  p_event_id uuid,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run_id uuid;
begin
  if p_tenant_id is null or p_event_id is null then
    raise exception using errcode = '22023', message = 'Valid tenant and event are required';
  end if;

  if p_expires_at is null
     or p_expires_at <= clock_timestamp()
     or p_expires_at > clock_timestamp() + interval '15 minutes' then
    raise exception using errcode = '22023', message = 'Expiry must be within 15 minutes';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('discord_qa_dispatch', 0)
  );

  update security.discord_qa_dispatch_runs
  set state = 'expired', completed_at = clock_timestamp()
  where case_key = 'exact_event_dispatch'
    and state in ('armed', 'claimed')
    and expires_at <= clock_timestamp();

  if exists (
    select 1
    from security.discord_qa_dispatch_runs run
    where run.case_key = 'exact_event_dispatch'
      and run.state in ('armed', 'claimed')
  ) then
    raise exception using errcode = '55000', message = 'An exact-event dispatch run is already active';
  end if;

  if not exists (
    select 1
    from public.integration_events event
    where event.id = p_event_id
      and event.tenant_id = p_tenant_id
      and event.provider = 'discord'
      and event.status in ('pending', 'failed')
      and event.available_at <= clock_timestamp()
      and event.attempt_count < 5
  ) then
    raise exception using errcode = '22023', message = 'Event is not eligible for exact Discord dispatch';
  end if;

  insert into security.discord_qa_dispatch_runs (tenant_id, event_id, expires_at)
  values (p_tenant_id, p_event_id, p_expires_at)
  returning id into v_run_id;

  return v_run_id;
end;
$$;

create or replace function security.disable_discord_qa_dispatch(p_run_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update security.discord_qa_dispatch_runs
  set state = 'disabled', completed_at = clock_timestamp()
  where id = p_run_id and state in ('armed', 'claimed');
  return found;
end;
$$;

revoke all on function security.arm_discord_qa_dispatch(uuid, uuid, timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function security.disable_discord_qa_dispatch(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.claim_discord_qa_dispatch_event(p_run_id uuid)
returns setof public.integration_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run security.discord_qa_dispatch_runs%rowtype;
  v_event public.integration_events%rowtype;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Server authorization is required';
  end if;
  if p_run_id is null then
    raise exception using errcode = '22023', message = 'Valid dispatch run is required';
  end if;

  select run.* into v_run
  from security.discord_qa_dispatch_runs run
  where run.id = p_run_id
  for update;

  if not found then
    return;
  end if;

  if v_run.state = 'armed' and v_run.expires_at <= clock_timestamp() then
    update security.discord_qa_dispatch_runs
    set state = 'expired', completed_at = clock_timestamp()
    where id = v_run.id and state = 'armed';
    return;
  end if;

  if v_run.state <> 'armed' then
    return;
  end if;

  select event.* into v_event
  from public.integration_events event
  where event.id = v_run.event_id
    and event.tenant_id = v_run.tenant_id
    and event.provider = 'discord'
    and event.status in ('pending', 'failed')
    and event.available_at <= clock_timestamp()
    and event.attempt_count < 5
  for update;

  if not found then
    return;
  end if;

  update security.discord_qa_dispatch_runs
  set state = 'claimed', claimed_at = clock_timestamp()
  where id = v_run.id and state = 'armed';

  if not found then
    return;
  end if;

  update public.integration_events event
  set status = 'processing', claimed_at = clock_timestamp()
  where event.id = v_run.event_id
    and event.tenant_id = v_run.tenant_id
  returning event.* into v_event;

  return next v_event;
end;
$$;

create or replace function public.complete_discord_qa_dispatch_run(
  p_run_id uuid,
  p_event_id uuid,
  p_result_status text,
  p_function_version text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Server authorization is required';
  end if;
  if p_run_id is null
     or p_event_id is null
     or p_result_status not in ('pending', 'failed', 'delivered', 'cancelled')
     or p_function_version is null
     or length(p_function_version) not between 1 and 160
     or p_function_version !~ '^[A-Za-z0-9._:/-]+$' then
    raise exception using errcode = '22023', message = 'Invalid dispatch result';
  end if;

  update security.discord_qa_dispatch_runs run
  set state = 'completed',
      result_status = p_result_status,
      function_version = p_function_version,
      completed_at = clock_timestamp()
  where run.id = p_run_id
    and run.event_id = p_event_id
    and run.state = 'claimed'
    and exists (
      select 1
      from public.integration_events event
      where event.id = run.event_id
        and event.tenant_id = run.tenant_id
        and event.provider = 'discord'
        and event.status = p_result_status
    );

  return found;
end;
$$;

revoke all on function public.claim_discord_qa_dispatch_event(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.complete_discord_qa_dispatch_run(uuid, uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.claim_discord_qa_dispatch_event(uuid) to service_role;
grant execute on function public.complete_discord_qa_dispatch_run(uuid, uuid, text, text) to service_role;

comment on table security.discord_qa_dispatch_runs is
  'Private, one-use WO-040 exact-event dispatch control. Never stores provider credentials or request material.';
comment on function security.arm_discord_qa_dispatch(uuid, uuid, timestamptz) is
  'Database-operator-only control that binds one short-lived run to one tenant and Discord event.';
comment on function security.disable_discord_qa_dispatch(uuid) is
  'Database-operator-only recovery control that preserves the dispatch evidence row.';
