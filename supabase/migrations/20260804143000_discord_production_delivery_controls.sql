-- Prepare Discord delivery for a separately approved controlled production release.
-- Applying this migration pauses the existing Discord workers. It does not create
-- secrets or reactivate either worker; an approved operator must explicitly call
-- security.configure_discord_production_worker_schedule() after the deployment and
-- configuration gates in WO-2026-040 have passed.

alter table public.integration_delivery_attempts
  add column if not exists delivery_target_id text;

comment on column public.integration_delivery_attempts.delivery_target_id is
  'Provider-side destination identifier used for per-target retry and delivery evidence.';

alter table public.integration_delivery_attempts
  drop constraint if exists integration_delivery_attempts_target_id_check;

alter table public.integration_delivery_attempts
  add constraint integration_delivery_attempts_target_id_check
  check (delivery_target_id is null or delivery_target_id ~ '^[0-9]{17,20}$')
  not valid;

alter table public.integration_delivery_attempts
  validate constraint integration_delivery_attempts_target_id_check;

create unique index if not exists integration_delivery_attempts_delivered_target_key
  on public.integration_delivery_attempts (tenant_id, event_id, provider, delivery_target_id)
  where outcome = 'delivered' and delivery_target_id is not null;

create or replace function security.disable_discord_production_worker_schedule()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dispatch_job_id bigint;
  v_reminder_job_id bigint;
begin
  select jobid into v_dispatch_job_id
  from cron.job
  where jobname = 'scrimstats-discord-dispatch';

  select jobid into v_reminder_job_id
  from cron.job
  where jobname = 'scrimstats-discord-reminders';

  if v_dispatch_job_id is not null then
    perform cron.alter_job(job_id := v_dispatch_job_id, active := false);
  end if;

  if v_reminder_job_id is not null then
    perform cron.alter_job(job_id := v_reminder_job_id, active := false);
  end if;

  return jsonb_build_object(
    'dispatch_job_id', v_dispatch_job_id,
    'reminder_job_id', v_reminder_job_id,
    'active', false
  );
end;
$$;

create or replace function security.configure_discord_production_worker_schedule()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_url text;
  v_publishable_key text;
  v_dispatch_secret text;
  v_dispatch_job_id bigint;
  v_reminder_job_id bigint;
begin
  select decrypted_secret into v_project_url
  from vault.decrypted_secrets
  where name = 'project_url'
  limit 1;

  select decrypted_secret into v_publishable_key
  from vault.decrypted_secrets
  where name = 'publishable_key'
  limit 1;

  select decrypted_secret into v_dispatch_secret
  from vault.decrypted_secrets
  where name = 'discord_dispatch_secret'
  limit 1;

  if v_project_url is null or v_publishable_key is null or v_dispatch_secret is null then
    raise exception 'Discord production workers require approved Vault configuration';
  end if;

  select cron.schedule(
    'scrimstats-discord-reminders',
    '*/15 * * * *',
    format($cron$
      select net.http_post(
        url := %L || '/functions/v1/discord-schedule-reminders',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', %L,
          'Authorization', 'Bearer ' || %L
        ),
        body := '{}'::jsonb
      );
    $cron$, v_project_url, v_publishable_key, v_dispatch_secret)
  ) into v_reminder_job_id;

  select cron.schedule(
    'scrimstats-discord-dispatch',
    '* * * * *',
    format($cron$
      select net.http_post(
        url := %L || '/functions/v1/discord-dispatch',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', %L,
          'Authorization', 'Bearer ' || %L
        ),
        body := '{}'::jsonb
      );
    $cron$, v_project_url, v_publishable_key, v_dispatch_secret)
  ) into v_dispatch_job_id;

  return jsonb_build_object(
    'dispatch_job_id', v_dispatch_job_id,
    'reminder_job_id', v_reminder_job_id,
    'active', true
  );
end;
$$;

revoke all on function security.disable_discord_production_worker_schedule()
  from public, anon, authenticated, service_role;
revoke all on function security.configure_discord_production_worker_schedule()
  from public, anon, authenticated, service_role;

-- Retire the test-only activation entry point so it cannot bypass the reviewed path.
create or replace function public.configure_discord_test_worker_schedule()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Test-only Discord worker activation is retired; use the approved production release procedure';
end;
$$;

revoke all on function public.configure_discord_test_worker_schedule()
  from public, anon, authenticated, service_role;

-- Default safe state: applying the migration pauses existing jobs but retains their
-- definitions and cron.job_run_details history for operator review and rollback.
select security.disable_discord_production_worker_schedule();
