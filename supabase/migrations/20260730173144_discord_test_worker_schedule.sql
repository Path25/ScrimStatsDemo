-- Prepare an operator-only, Vault-backed schedule for the bounded Discord test workflow.
-- This migration does not create secrets or schedule jobs. An approved operator must run
-- public.configure_discord_test_worker_schedule() only after the required Vault values exist.

create or replace function public.configure_discord_test_worker_schedule()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_url text;
  v_publishable_key text;
  v_dispatch_secret text;
  v_job_id bigint;
begin
  select decrypted_secret into v_project_url from vault.decrypted_secrets where name = 'project_url' limit 1;
  select decrypted_secret into v_publishable_key from vault.decrypted_secrets where name = 'publishable_key' limit 1;
  select decrypted_secret into v_dispatch_secret from vault.decrypted_secrets where name = 'discord_dispatch_secret' limit 1;

  if v_project_url is null or v_publishable_key is null or v_dispatch_secret is null then
    raise exception 'Discord worker schedule requires approved Vault configuration';
  end if;

  select jobid into v_job_id from cron.job where jobname = 'scrimstats-discord-reminders';
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  select jobid into v_job_id from cron.job where jobname = 'scrimstats-discord-dispatch';
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;

  perform cron.schedule(
    'scrimstats-discord-reminders',
    '*/15 * * * *',
    format($cron$
      select net.http_post(
        url := %L || '/functions/v1/discord-schedule-reminders',
        headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', %L, 'Authorization', 'Bearer ' || %L),
        body := '{}'::jsonb
      );
    $cron$, v_project_url, v_publishable_key, v_dispatch_secret)
  );
  perform cron.schedule(
    'scrimstats-discord-dispatch',
    '* * * * *',
    format($cron$
      select net.http_post(
        url := %L || '/functions/v1/discord-dispatch',
        headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', %L, 'Authorization', 'Bearer ' || %L),
        body := '{}'::jsonb
      );
    $cron$, v_project_url, v_publishable_key, v_dispatch_secret)
  );
end;
$$;

revoke all on function public.configure_discord_test_worker_schedule() from public, anon, authenticated;
