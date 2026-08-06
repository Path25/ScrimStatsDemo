-- WO-2026-040 Phase D-B correction: named cron.schedule() reconciles an
-- existing job but does not reactivate a job that was explicitly disabled.
-- Keep Vault values inside the operator-only routine, explicitly activate the
-- two returned job IDs, and fail transactionally unless both rows are active.

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
  v_dispatch_active boolean;
  v_reminder_active boolean;
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

  perform cron.alter_job(job_id := v_reminder_job_id, active := true);

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

  perform cron.alter_job(job_id := v_dispatch_job_id, active := true);

  select active into v_reminder_active
  from cron.job
  where jobid = v_reminder_job_id
    and jobname = 'scrimstats-discord-reminders';

  select active into v_dispatch_active
  from cron.job
  where jobid = v_dispatch_job_id
    and jobname = 'scrimstats-discord-dispatch';

  if v_reminder_active is distinct from true or v_dispatch_active is distinct from true then
    raise exception 'Discord production workers did not activate';
  end if;

  return jsonb_build_object(
    'dispatch_job_id', v_dispatch_job_id,
    'dispatch_active', v_dispatch_active,
    'reminder_job_id', v_reminder_job_id,
    'reminder_active', v_reminder_active,
    'active', v_dispatch_active and v_reminder_active
  );
end;
$$;

revoke all on function security.configure_discord_production_worker_schedule()
  from public, anon, authenticated, service_role;

comment on function security.configure_discord_production_worker_schedule() is
  'Operator-only Discord worker activation. Reconciles both named jobs, explicitly activates their returned IDs, and fails unless both rows report active.';
