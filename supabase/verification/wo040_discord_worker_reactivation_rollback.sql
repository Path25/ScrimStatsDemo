-- WO-2026-040 disposable-only scheduler reactivation proof.
-- Run only against the zero-data PostgreSQL 17 clone named below. The script
-- refuses every other database, including the shared hosted project.
-- The two jobs exist and are inactive before the proof transaction. Configure,
-- inspection, and disable occur in one transaction which is always rolled back.

\set ON_ERROR_STOP on

do $$
begin
  if current_database() <> 'scrimstats_wo040_phase_db_fix_20260806' then
    raise exception 'WO-040 scheduler proof requires the named disposable database';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname in ('scrimstats-discord-dispatch', 'scrimstats-discord-reminders')
  ) then
    raise exception 'WO-040 scheduler proof requires no pre-existing named jobs before fixture setup';
  end if;

  if exists (
    select 1
    from vault.decrypted_secrets
    where name in ('project_url', 'publishable_key', 'discord_dispatch_secret')
  ) then
    raise exception 'WO-040 scheduler proof requires an empty Vault fixture baseline';
  end if;

  if exists (select 1 from public.integration_events)
    or exists (select 1 from public.integration_delivery_attempts)
    or exists (select 1 from net.http_request_queue) then
    raise exception 'WO-040 scheduler proof requires zero event, attempt, and HTTP queue rows';
  end if;
end;
$$;

do $$
declare
  v_job_id bigint;
begin
  perform vault.create_secret('https://wo040.invalid', 'project_url');
  perform vault.create_secret('wo040-local-publishable-placeholder', 'publishable_key');
  perform vault.create_secret('wo040-local-dispatch-placeholder', 'discord_dispatch_secret');

  select cron.schedule(
    'scrimstats-discord-reminders',
    '*/15 * * * *',
    'select 1'
  ) into v_job_id;
  perform cron.alter_job(job_id := v_job_id, active := false);

  select cron.schedule(
    'scrimstats-discord-dispatch',
    '* * * * *',
    'select 1'
  ) into v_job_id;
  perform cron.alter_job(job_id := v_job_id, active := false);
end;
$$;

create temporary table wo040_scheduler_baseline on commit preserve rows as
select
  (select jobid from cron.job where jobname = 'scrimstats-discord-dispatch') as dispatch_job_id,
  (select jobid from cron.job where jobname = 'scrimstats-discord-reminders') as reminder_job_id,
  (select count(*) from cron.job_run_details) as run_history_count,
  (select count(*) from net.http_request_queue) as http_queue_count,
  (select count(*) from public.integration_events) as event_count,
  (select count(*) from public.integration_delivery_attempts) as attempt_count;

do $$
begin
  if (select count(*) from cron.job where jobname in (
    'scrimstats-discord-dispatch',
    'scrimstats-discord-reminders'
  )) <> 2 then
    raise exception 'WO-040 fixture did not create exactly two named jobs';
  end if;

  if exists (
    select 1
    from cron.job
    where jobname in ('scrimstats-discord-dispatch', 'scrimstats-discord-reminders')
      and active
  ) then
    raise exception 'WO-040 fixture jobs must be inactive before the proof transaction';
  end if;
end;
$$;

begin;
set local statement_timeout = '20s';

do $$
declare
  v_result jsonb;
begin
  select security.configure_discord_production_worker_schedule() into v_result;

  if v_result ->> 'active' <> 'true'
    or v_result ->> 'dispatch_active' <> 'true'
    or v_result ->> 'reminder_active' <> 'true' then
    raise exception 'WO-040 configure result did not report verified active state';
  end if;

  if (select count(*) from cron.job where jobname in (
    'scrimstats-discord-dispatch',
    'scrimstats-discord-reminders'
  ) and active) <> 2 then
    raise exception 'WO-040 configure did not activate both named jobs';
  end if;

  if (v_result ->> 'dispatch_job_id')::bigint
      <> (select dispatch_job_id from wo040_scheduler_baseline)
    or (v_result ->> 'reminder_job_id')::bigint
      <> (select reminder_job_id from wo040_scheduler_baseline) then
    raise exception 'WO-040 configure replaced rather than reconciled a named job';
  end if;
end;
$$;

do $$
declare
  v_result jsonb;
begin
  select security.disable_discord_production_worker_schedule() into v_result;

  if v_result ->> 'active' <> 'false' then
    raise exception 'WO-040 disable result did not report inactive state';
  end if;

  if exists (
    select 1
    from cron.job
    where jobname in ('scrimstats-discord-dispatch', 'scrimstats-discord-reminders')
      and active
  ) then
    raise exception 'WO-040 disable did not return both named jobs to inactive';
  end if;
end;
$$;

do $$
begin
  if (select count(*) from cron.job_run_details)
      <> (select run_history_count from wo040_scheduler_baseline)
    or (select count(*) from net.http_request_queue)
      <> (select http_queue_count from wo040_scheduler_baseline)
    or (select count(*) from public.integration_events)
      <> (select event_count from wo040_scheduler_baseline)
    or (select count(*) from public.integration_delivery_attempts)
      <> (select attempt_count from wo040_scheduler_baseline) then
    raise exception 'WO-040 proof transaction changed HTTP, cron-history, event, or attempt data';
  end if;
end;
$$;

rollback;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname in ('scrimstats-discord-dispatch', 'scrimstats-discord-reminders')
      and active
  ) then
    raise exception 'WO-040 rollback did not restore the original inactive job state';
  end if;

  if (select jobid from cron.job where jobname = 'scrimstats-discord-dispatch')
      <> (select dispatch_job_id from wo040_scheduler_baseline)
    or (select jobid from cron.job where jobname = 'scrimstats-discord-reminders')
      <> (select reminder_job_id from wo040_scheduler_baseline)
    or (select count(*) from cron.job_run_details)
      <> (select run_history_count from wo040_scheduler_baseline)
    or (select count(*) from net.http_request_queue)
      <> (select http_queue_count from wo040_scheduler_baseline)
    or (select count(*) from public.integration_events)
      <> (select event_count from wo040_scheduler_baseline)
    or (select count(*) from public.integration_delivery_attempts)
      <> (select attempt_count from wo040_scheduler_baseline) then
    raise exception 'WO-040 rollback did not preserve fixture IDs or zero-mutation baselines';
  end if;
end;
$$;

select
  count(*) = 2 as named_jobs_preserved,
  count(*) filter (where active) = 0 as both_jobs_inactive
from cron.job
where jobname in ('scrimstats-discord-dispatch', 'scrimstats-discord-reminders');

-- The containing disposable container is the cleanup boundary. Do not unschedule
-- the fixtures here: retaining them inactive is part of the rollback evidence.
