-- WO-2026-040 Phase D: source-only controls for a separately approved,
-- non-customer Discord nonce and delivered-evidence deduplication probe.
-- This migration does not create fixture data, configure secrets, activate
-- workers, or call Discord.

create table security.discord_qa_nonce_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  event_id uuid not null references public.integration_events(id) on delete restrict,
  channel_id text not null check (channel_id ~ '^[0-9]{17,20}$'),
  state text not null default 'armed'
    check (state in ('armed', 'claimed', 'completed', 'disabled', 'expired')),
  outcome text
    check (outcome is null or outcome in ('confirmed', 'provider_failed', 'mismatch', 'evidence_failed')),
  first_http_status smallint check (first_http_status is null or first_http_status between 100 and 599),
  second_http_status smallint check (second_http_status is null or second_http_status between 100 and 599),
  same_provider_reference boolean,
  delivery_evidence_recorded boolean,
  function_version text
    check (function_version is null or (length(function_version) between 1 and 160 and function_version ~ '^[A-Za-z0-9._:/-]+$')),
  armed_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  claimed_at timestamptz,
  completed_at timestamptz,
  check (expires_at > armed_at),
  check (expires_at <= armed_at + interval '15 minutes'),
  check (
    (state = 'armed' and claimed_at is null and completed_at is null and outcome is null)
    or (state = 'claimed' and claimed_at is not null and completed_at is null and outcome is null)
    or (
      state = 'completed'
      and claimed_at is not null
      and completed_at is not null
      and outcome is not null
      and delivery_evidence_recorded is not null
      and (
        (outcome = 'confirmed' and first_http_status between 200 and 299 and second_http_status between 200 and 299 and same_provider_reference is true and delivery_evidence_recorded is true)
        or (outcome <> 'confirmed')
      )
    )
    or (state in ('disabled', 'expired') and completed_at is not null and outcome is null)
  )
);

alter table security.discord_qa_nonce_runs enable row level security;

revoke all on table security.discord_qa_nonce_runs from public, anon, authenticated, service_role;

create unique index discord_qa_nonce_runs_one_active_idx
  on security.discord_qa_nonce_runs ((true))
  where state in ('armed', 'claimed');

create index discord_qa_nonce_runs_event_armed_idx
  on security.discord_qa_nonce_runs (tenant_id, event_id, armed_at desc);

create index discord_qa_nonce_runs_event_fk_idx
  on security.discord_qa_nonce_runs (event_id);

create or replace function security.arm_discord_qa_nonce_probe(
  p_tenant_id uuid,
  p_event_id uuid,
  p_channel_id text,
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
  if p_tenant_id is null
     or p_event_id is null
     or p_channel_id is null
     or p_channel_id !~ '^[0-9]{17,20}$' then
    raise exception using errcode = '22023', message = 'Valid tenant, event, and channel are required';
  end if;

  if p_expires_at is null
     or p_expires_at <= clock_timestamp()
     or p_expires_at > clock_timestamp() + interval '15 minutes' then
    raise exception using errcode = '22023', message = 'Expiry must be within 15 minutes';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('discord_qa_dispatch', 0)
  );

  update security.discord_qa_nonce_runs
  set state = 'expired', completed_at = clock_timestamp()
  where state in ('armed', 'claimed')
    and expires_at <= clock_timestamp();

  update security.discord_qa_dispatch_runs
  set state = 'expired', completed_at = clock_timestamp()
  where state in ('armed', 'claimed')
    and expires_at <= clock_timestamp();

  if exists (
    select 1 from security.discord_qa_nonce_runs where state in ('armed', 'claimed')
  ) or exists (
    select 1 from security.discord_qa_dispatch_runs where state in ('armed', 'claimed')
  ) then
    raise exception using errcode = '55000', message = 'A Discord QA control is already active';
  end if;

  if not exists (
    select 1
    from public.integration_events event
    join public.tenants tenant on tenant.id = event.tenant_id
    join public.tenant_feature_access feature
      on feature.tenant_id = event.tenant_id
     and feature.module_key = 'discord'
    join public.discord_channel_subscriptions subscription
      on subscription.tenant_id = event.tenant_id
     and subscription.event_type = event.event_type
     and subscription.channel_id = p_channel_id
     and subscription.enabled is true
    join public.discord_installations installation
      on installation.id = subscription.installation_id
     and installation.status = 'active'
    where event.id = p_event_id
      and event.tenant_id = p_tenant_id
      and event.provider = 'discord'
      and event.event_type in ('schedule_created', 'schedule_changed', 'schedule_cancelled', 'practice_reminder')
      and event.status in ('pending', 'failed')
      and event.available_at <= clock_timestamp()
      and event.attempt_count = 0
      and tenant.subscription_tier = 'elite'
      and feature.release_state = 'live'
      and feature.is_enabled is true
      and not exists (
        select 1
        from public.integration_delivery_attempts attempt
        where attempt.tenant_id = event.tenant_id
          and attempt.event_id = event.id
      )
  ) then
    raise exception using errcode = '22023', message = 'Event is not eligible for the Discord nonce probe';
  end if;

  insert into security.discord_qa_nonce_runs (tenant_id, event_id, channel_id, expires_at)
  values (p_tenant_id, p_event_id, p_channel_id, p_expires_at)
  returning id into v_run_id;

  return v_run_id;
end;
$$;

create or replace function security.disable_discord_qa_nonce_probe(p_run_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update security.discord_qa_nonce_runs
  set state = 'disabled', completed_at = clock_timestamp()
  where id = p_run_id and state in ('armed', 'claimed');
  return found;
end;
$$;

revoke all on function security.arm_discord_qa_nonce_probe(uuid, uuid, text, timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function security.disable_discord_qa_nonce_probe(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.claim_discord_qa_nonce_probe(p_run_id uuid)
returns table (run_id uuid, tenant_id uuid, event_id uuid, channel_id text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run security.discord_qa_nonce_runs%rowtype;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Server authorization is required';
  end if;
  if p_run_id is null then
    raise exception using errcode = '22023', message = 'Valid nonce run is required';
  end if;

  select probe.* into v_run
  from security.discord_qa_nonce_runs probe
  where probe.id = p_run_id
  for update;

  if not found then
    return;
  end if;

  if v_run.state = 'armed' and v_run.expires_at <= clock_timestamp() then
    update security.discord_qa_nonce_runs
    set state = 'expired', completed_at = clock_timestamp()
    where id = v_run.id and state = 'armed';
    return;
  end if;

  if v_run.state <> 'armed' then
    return;
  end if;

  if not exists (
    select 1
    from public.integration_events event
    join public.tenants tenant on tenant.id = event.tenant_id
    join public.tenant_feature_access feature
      on feature.tenant_id = event.tenant_id
     and feature.module_key = 'discord'
    join public.discord_channel_subscriptions subscription
      on subscription.tenant_id = event.tenant_id
     and subscription.event_type = event.event_type
     and subscription.channel_id = v_run.channel_id
     and subscription.enabled is true
    join public.discord_installations installation
      on installation.id = subscription.installation_id
     and installation.status = 'active'
    where event.id = v_run.event_id
      and event.tenant_id = v_run.tenant_id
      and event.provider = 'discord'
      and event.event_type in ('schedule_created', 'schedule_changed', 'schedule_cancelled', 'practice_reminder')
      and event.status in ('pending', 'failed')
      and event.available_at <= clock_timestamp()
      and event.attempt_count = 0
      and tenant.subscription_tier = 'elite'
      and feature.release_state = 'live'
      and feature.is_enabled is true
      and not exists (
        select 1
        from public.integration_delivery_attempts attempt
        where attempt.tenant_id = event.tenant_id
          and attempt.event_id = event.id
      )
  ) then
    return;
  end if;

  update security.discord_qa_nonce_runs
  set state = 'claimed', claimed_at = clock_timestamp()
  where id = v_run.id and state = 'armed';

  if not found then
    return;
  end if;

  return query select v_run.id, v_run.tenant_id, v_run.event_id, v_run.channel_id;
end;
$$;

create or replace function public.complete_discord_qa_nonce_probe(
  p_run_id uuid,
  p_outcome text,
  p_first_http_status integer,
  p_second_http_status integer,
  p_same_provider_reference boolean,
  p_delivery_evidence_recorded boolean,
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
     or p_outcome not in ('confirmed', 'provider_failed', 'mismatch', 'evidence_failed')
     or (p_first_http_status is not null and p_first_http_status not between 100 and 599)
     or (p_second_http_status is not null and p_second_http_status not between 100 and 599)
     or p_delivery_evidence_recorded is null
     or p_function_version is null
     or length(p_function_version) not between 1 and 160
     or p_function_version !~ '^[A-Za-z0-9._:/-]+$'
     or (
       p_outcome = 'confirmed'
       and not (
         p_first_http_status between 200 and 299
         and p_second_http_status between 200 and 299
         and p_same_provider_reference is true
         and p_delivery_evidence_recorded is true
       )
     ) then
    raise exception using errcode = '22023', message = 'Invalid nonce probe result';
  end if;

  update security.discord_qa_nonce_runs probe
  set state = 'completed',
      outcome = p_outcome,
      first_http_status = p_first_http_status,
      second_http_status = p_second_http_status,
      same_provider_reference = p_same_provider_reference,
      delivery_evidence_recorded = p_delivery_evidence_recorded,
      function_version = p_function_version,
      completed_at = clock_timestamp()
  where probe.id = p_run_id
    and probe.state = 'claimed'
    and (
      p_delivery_evidence_recorded is false
      or exists (
        select 1
        from public.integration_delivery_attempts attempt
        where attempt.tenant_id = probe.tenant_id
          and attempt.event_id = probe.event_id
          and attempt.provider = 'discord'
          and attempt.delivery_target_id = probe.channel_id
          and attempt.outcome = 'delivered'
          and attempt.provider_reference is not null
      )
    );

  return found;
end;
$$;

revoke all on function public.claim_discord_qa_nonce_probe(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.complete_discord_qa_nonce_probe(uuid, text, integer, integer, boolean, boolean, text)
  from public, anon, authenticated, service_role;
grant execute on function public.claim_discord_qa_nonce_probe(uuid) to service_role;
grant execute on function public.complete_discord_qa_nonce_probe(uuid, text, integer, integer, boolean, boolean, text) to service_role;

comment on table security.discord_qa_nonce_runs is
  'Private, one-use WO-040 nonce-probe evidence. Stores bounded statuses and equality only; provider references remain in the delivery-attempt ledger.';
comment on function security.arm_discord_qa_nonce_probe(uuid, uuid, text, timestamptz) is
  'Operator-only arm for one fresh non-customer Discord event and its existing subscribed channel.';
comment on function security.disable_discord_qa_nonce_probe(uuid) is
  'Operator-only stop for an unused or interrupted nonce probe; durable evidence is retained.';
comment on function public.claim_discord_qa_nonce_probe(uuid) is
  'Service-only one-use claim for the exact operator-armed nonce fixture.';
comment on function public.complete_discord_qa_nonce_probe(uuid, text, integer, integer, boolean, boolean, text) is
  'Service-only bounded completion evidence for the exact nonce fixture; stores no provider identifier.';

-- Keep the existing exact-event dispatch arm mutually exclusive with the new
-- nonce probe. Its eligibility and one-use behavior otherwise remain unchanged.
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

  update security.discord_qa_nonce_runs
  set state = 'expired', completed_at = clock_timestamp()
  where state in ('armed', 'claimed')
    and expires_at <= clock_timestamp();

  if exists (
    select 1
    from security.discord_qa_dispatch_runs run
    where run.case_key = 'exact_event_dispatch'
      and run.state in ('armed', 'claimed')
  ) then
    raise exception using errcode = '55000', message = 'An exact-event dispatch run is already active';
  end if;

  if exists (
    select 1 from security.discord_qa_nonce_runs where state in ('armed', 'claimed')
  ) then
    raise exception using errcode = '55000', message = 'A Discord QA control is already active';
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

revoke all on function security.arm_discord_qa_dispatch(uuid, uuid, timestamptz)
  from public, anon, authenticated, service_role;
