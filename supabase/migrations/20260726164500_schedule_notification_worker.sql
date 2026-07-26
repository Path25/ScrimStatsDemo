-- Reuse the existing server-only worker secret and Vault-backed project values.
do $$
declare v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname = 'scrimstats-notification-worker';
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  perform cron.schedule(
    'scrimstats-notification-worker',
    '* * * * *',
    $command$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/notification-worker',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key'),
          'x-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'soloq_worker_secret')
        ),
        body := '{}'::jsonb
      );
    $command$
  );
end;
$$;
