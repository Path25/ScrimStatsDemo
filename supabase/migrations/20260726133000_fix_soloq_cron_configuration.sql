create or replace function public.configure_soloq_cron(
  p_project_url text,
  p_publishable_key text
)
returns void
language plpgsql
security definer
set search_path = public, vault, cron, extensions, pg_temp
as $$
declare
  worker_secret text;
  existing_id uuid;
begin
  if p_project_url not like 'https://%.supabase.co' then
    raise exception 'Invalid Supabase project URL';
  end if;
  if nullif(trim(p_publishable_key), '') is null then
    raise exception 'Publishable key is required';
  end if;

  select id into existing_id from vault.secrets where name = 'project_url' limit 1;
  if existing_id is null then
    perform vault.create_secret(p_project_url, 'project_url', 'Solo Queue cron project URL');
  else
    perform vault.update_secret(existing_id, p_project_url, 'project_url', 'Solo Queue cron project URL');
  end if;

  select id into existing_id from vault.secrets where name = 'publishable_key' limit 1;
  if existing_id is null then
    perform vault.create_secret(p_publishable_key, 'publishable_key', 'Solo Queue cron publishable key');
  else
    perform vault.update_secret(existing_id, p_publishable_key, 'publishable_key', 'Solo Queue cron publishable key');
  end if;

  select decrypted_secret into worker_secret
  from vault.decrypted_secrets where name = 'soloq_worker_secret' limit 1;
  if worker_secret is null then
    worker_secret := encode(extensions.gen_random_bytes(32), 'hex');
    perform vault.create_secret(worker_secret, 'soloq_worker_secret', 'Solo Queue cron worker secret');
  end if;

  perform cron.unschedule(jobid) from cron.job
  where jobname in ('soloq-coordinator', 'soloq-worker');

  perform cron.schedule(
    'soloq-coordinator', '*/15 * * * *',
    format($cron$
      select net.http_post(
        url := %L || '/functions/v1/soloq-sync-v2',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', %L,
          'x-soloq-worker-secret', %L
        ),
        body := '{"mode":"coordinate"}'::jsonb
      );
    $cron$, p_project_url, p_publishable_key, worker_secret)
  );

  perform cron.schedule(
    'soloq-worker', '* * * * *',
    format($cron$
      select net.http_post(
        url := %L || '/functions/v1/soloq-sync-v2',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', %L,
          'x-soloq-worker-secret', %L
        ),
        body := '{"mode":"work"}'::jsonb
      );
    $cron$, p_project_url, p_publishable_key, worker_secret)
  );
end;
$$;

revoke all on function public.configure_soloq_cron(text, text) from public, anon, authenticated;
grant execute on function public.configure_soloq_cron(text, text) to service_role;
