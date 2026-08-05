-- WO-2026-040: private, one-use evidence control for an exact signed replay.
-- This migration is source-only until Theo separately approves hosted application.

create schema if not exists security;

create table security.discord_qa_replay_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  case_key text not null default 'exact_signed_replay'
    check (case_key = 'exact_signed_replay'),
  state text not null default 'armed'
    check (state in ('armed', 'claimed', 'completed', 'failed', 'disabled', 'expired')),
  interaction_id text
    check (interaction_id is null or interaction_id ~ '^[0-9]{17,20}$'),
  first_result text
    check (first_result is null or first_result in ('created', 'replay', 'rejected', 'error')),
  replay_result text
    check (replay_result is null or replay_result in ('replay', 'created', 'rejected', 'error', 'not_run')),
  elapsed_ms integer check (elapsed_ms is null or elapsed_ms >= 0),
  function_version text
    check (function_version is null or (length(function_version) between 1 and 160 and function_version ~ '^[A-Za-z0-9._:/-]+$')),
  armed_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  claimed_at timestamptz,
  completed_at timestamptz,
  check (expires_at > armed_at),
  check (expires_at <= armed_at + interval '15 minutes'),
  check (
    (state = 'armed' and interaction_id is null and claimed_at is null and completed_at is null)
    or (state = 'claimed' and interaction_id is not null and claimed_at is not null and completed_at is null)
    or (state in ('completed', 'failed') and interaction_id is not null and claimed_at is not null and completed_at is not null)
    or (state in ('disabled', 'expired') and completed_at is not null)
  )
);

alter table security.discord_qa_replay_runs enable row level security;

revoke all on schema security from public, anon, authenticated, service_role;
revoke all on table security.discord_qa_replay_runs from public, anon, authenticated, service_role;

create unique index discord_qa_replay_runs_one_active_case_idx
  on security.discord_qa_replay_runs (tenant_id, case_key)
  where state in ('armed', 'claimed');

create index discord_qa_replay_runs_tenant_armed_idx
  on security.discord_qa_replay_runs (tenant_id, armed_at desc);

create or replace function security.arm_discord_qa_replay(
  p_tenant_id uuid,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, security, public
as $$
declare
  v_run_id uuid;
begin
  if p_tenant_id is null or not exists (
    select 1 from public.tenants tenant where tenant.id = p_tenant_id
  ) then
    raise exception using errcode = '22023', message = 'Valid tenant is required';
  end if;

  if p_expires_at is null
     or p_expires_at <= clock_timestamp()
     or p_expires_at > clock_timestamp() + interval '15 minutes' then
    raise exception using errcode = '22023', message = 'Expiry must be within 15 minutes';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || ':discord_qa_replay', 0));

  update security.discord_qa_replay_runs
  set state = case when expires_at <= clock_timestamp() then 'expired' else 'disabled' end,
      completed_at = clock_timestamp()
  where tenant_id = p_tenant_id
    and case_key = 'exact_signed_replay'
    and state in ('armed', 'claimed');

  insert into security.discord_qa_replay_runs (tenant_id, expires_at)
  values (p_tenant_id, p_expires_at)
  returning id into v_run_id;

  return v_run_id;
end;
$$;

create or replace function security.disable_discord_qa_replay(p_run_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, security
as $$
begin
  update security.discord_qa_replay_runs
  set state = 'disabled', completed_at = clock_timestamp()
  where id = p_run_id and state in ('armed', 'claimed');
  return found;
end;
$$;

revoke all on function security.arm_discord_qa_replay(uuid, timestamptz) from public, anon, authenticated, service_role;
revoke all on function security.disable_discord_qa_replay(uuid) from public, anon, authenticated, service_role;

create or replace function public.claim_discord_qa_replay_run(
  p_tenant_id uuid,
  p_interaction_id text
)
returns table (run_id uuid)
language plpgsql
security definer
set search_path = pg_catalog, security
as $$
declare
  v_run_id uuid;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Server authorization is required';
  end if;
  if p_tenant_id is null or p_interaction_id is null or p_interaction_id !~ '^[0-9]{17,20}$' then
    raise exception using errcode = '22023', message = 'Invalid replay claim';
  end if;

  update security.discord_qa_replay_runs
  set state = 'expired', completed_at = clock_timestamp()
  where tenant_id = p_tenant_id
    and case_key = 'exact_signed_replay'
    and state = 'armed'
    and expires_at <= clock_timestamp();

  select replay.id into v_run_id
  from security.discord_qa_replay_runs replay
  where replay.tenant_id = p_tenant_id
    and replay.case_key = 'exact_signed_replay'
    and replay.state = 'armed'
    and replay.expires_at > clock_timestamp()
  order by replay.armed_at
  for update skip locked
  limit 1;

  if v_run_id is null then
    return;
  end if;

  update security.discord_qa_replay_runs
  set state = 'claimed', interaction_id = p_interaction_id, claimed_at = clock_timestamp()
  where id = v_run_id and state = 'armed';

  if found then
    run_id := v_run_id;
    return next;
  end if;
end;
$$;

create or replace function public.complete_discord_qa_replay_run(
  p_run_id uuid,
  p_interaction_id text,
  p_first_result text,
  p_replay_result text,
  p_elapsed_ms integer,
  p_function_version text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, security
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Server authorization is required';
  end if;
  if p_first_result not in ('created', 'replay', 'rejected', 'error')
     or p_replay_result not in ('replay', 'created', 'rejected', 'error', 'not_run')
     or p_elapsed_ms is null or p_elapsed_ms < 0
     or p_function_version is null
     or length(p_function_version) not between 1 and 160
     or p_function_version !~ '^[A-Za-z0-9._:/-]+$' then
    raise exception using errcode = '22023', message = 'Invalid replay result';
  end if;

  update security.discord_qa_replay_runs
  set state = case
        when p_first_result = 'created' and p_replay_result = 'replay' then 'completed'
        else 'failed'
      end,
      first_result = p_first_result,
      replay_result = p_replay_result,
      elapsed_ms = p_elapsed_ms,
      function_version = p_function_version,
      completed_at = clock_timestamp()
  where id = p_run_id
    and interaction_id = p_interaction_id
    and state = 'claimed';

  return found;
end;
$$;

revoke all on function public.claim_discord_qa_replay_run(uuid, text) from public, anon, authenticated;
revoke all on function public.complete_discord_qa_replay_run(uuid, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.claim_discord_qa_replay_run(uuid, text) to service_role;
grant execute on function public.complete_discord_qa_replay_run(uuid, text, text, text, integer, text) to service_role;

comment on table security.discord_qa_replay_runs is
  'Private, one-use WO-040 evidence state. Never stores signed Discord request material.';
comment on function security.arm_discord_qa_replay(uuid, timestamptz) is
  'Database-operator-only control; no API role receives execute permission.';
comment on function security.disable_discord_qa_replay(uuid) is
  'Database-operator-only recovery control that preserves the evidence row.';
