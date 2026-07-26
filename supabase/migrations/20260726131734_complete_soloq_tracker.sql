-- Durable, tenant-scoped Solo Queue synchronization and normalized match context.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

alter table public.soloq_recent_matches
  add column if not exists match_context jsonb not null default '{"participants":[],"teams":[]}'::jsonb;

alter table public.soloq_recent_matches
  drop constraint if exists soloq_recent_matches_match_context_check;
alter table public.soloq_recent_matches
  add constraint soloq_recent_matches_match_context_check
  check (
    jsonb_typeof(match_context) = 'object'
    and jsonb_typeof(match_context->'participants') = 'array'
    and jsonb_typeof(match_context->'teams') = 'array'
  );

alter table public.soloq_sync_state
  drop constraint if exists soloq_sync_state_status_check;
alter table public.soloq_sync_state
  add constraint soloq_sync_state_status_check
  check (status in (
    'never_synced', 'queued', 'syncing', 'ready', 'unranked',
    'invalid_identity', 'unavailable', 'rate_limited', 'failed'
  ));

create table public.soloq_sync_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  run_kind text not null default 'daily' check (run_kind in ('daily', 'manual')),
  local_date date,
  timezone text not null default 'UTC',
  status text not null default 'pending'
    check (status in ('pending', 'running', 'succeeded', 'partial', 'failed')),
  total_jobs integer not null default 0 check (total_jobs >= 0),
  completed_jobs integer not null default 0 check (completed_jobs >= 0),
  succeeded_jobs integer not null default 0 check (succeeded_jobs >= 0),
  skipped_jobs integer not null default 0 check (skipped_jobs >= 0),
  failed_jobs integer not null default 0 check (failed_jobs >= 0),
  requested_by uuid references auth.users(id) on delete set null,
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((run_kind = 'daily' and local_date is not null) or run_kind = 'manual')
);

create unique index soloq_sync_runs_daily_tenant_date_idx
  on public.soloq_sync_runs (tenant_id, local_date)
  where run_kind = 'daily';
create index soloq_sync_runs_tenant_scheduled_idx
  on public.soloq_sync_runs (tenant_id, scheduled_at desc);

create table public.soloq_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.soloq_sync_runs(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  player_id uuid not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'succeeded', 'skipped', 'rate_limited', 'failed')),
  priority integer not null default 0,
  attempts integer not null default 0 check (attempts between 0 and 3),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error_code text,
  last_error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, player_id),
  constraint soloq_sync_jobs_player_tenant_fkey
    foreign key (player_id, tenant_id) references public.players(id, tenant_id) on delete cascade
);

create index soloq_sync_jobs_claim_idx
  on public.soloq_sync_jobs (priority desc, available_at, created_at)
  where status in ('pending', 'rate_limited');
create index soloq_sync_jobs_run_status_idx
  on public.soloq_sync_jobs (run_id, status);
create index soloq_sync_jobs_tenant_status_idx
  on public.soloq_sync_jobs (tenant_id, status, available_at);

alter table public.soloq_sync_runs enable row level security;
alter table public.soloq_sync_jobs enable row level security;

create policy "Workspace members read SoloQ sync runs"
on public.soloq_sync_runs for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

create policy "Workspace members read SoloQ sync jobs"
on public.soloq_sync_jobs for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

revoke all on public.soloq_sync_runs from public, anon, authenticated;
revoke all on public.soloq_sync_jobs from public, anon, authenticated;
grant select on public.soloq_sync_runs to authenticated;
grant select on public.soloq_sync_jobs to authenticated;
grant select, insert, update, delete on public.soloq_sync_runs to service_role;
grant select, insert, update, delete on public.soloq_sync_jobs to service_role;

-- Queue every eligible profile once the workspace's local clock passes 05:15.
create or replace function public.coordinate_soloq_daily_runs()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  workspace record;
  created_run_id uuid;
  created_count integer := 0;
  job_count integer;
begin
  for workspace in
    select
      tenant.id,
      case
        when exists (
          select 1 from pg_catalog.pg_timezone_names zone
          where zone.name = coalesce(nullif(tenant.settings->>'timezone', ''), 'UTC')
        ) then coalesce(nullif(tenant.settings->>'timezone', ''), 'UTC')
        else 'UTC'
      end as timezone
    from public.tenants tenant
    join public.tenant_riot_integrations integration on integration.tenant_id = tenant.id
    where integration.status = 'active'
  loop
    if (now() at time zone workspace.timezone)::time < time '05:15' then
      continue;
    end if;

    created_run_id := null;
    insert into public.soloq_sync_runs (tenant_id, run_kind, local_date, timezone)
    values (workspace.id, 'daily', (now() at time zone workspace.timezone)::date, workspace.timezone)
    on conflict (tenant_id, local_date) where run_kind = 'daily' do nothing
    returning id into created_run_id;

    if created_run_id is null then
      continue;
    end if;

    insert into public.soloq_sync_jobs (run_id, tenant_id, player_id)
    select created_run_id, player.tenant_id, player.id
    from public.players player
    where player.tenant_id = workspace.id
      and player.archived_at is null
      and coalesce(player.is_active, true)
      and lower(coalesce(player.region, '')) = any (
        array['br1','la1','la2','na1','eun1','eune','eune1','euw1','euw','tr1','ru','jp1','kr','oc1','oce','ph2','sg2','th2','tw2','vn2']
      )
      and nullif(trim(coalesce(nullif(split_part(player.riot_id, '#', 1), ''), player.summoner_name)), '') is not null
      and nullif(trim(coalesce(nullif(split_part(player.riot_id, '#', 2), ''), player.riot_tag_line)), '') is not null;

    get diagnostics job_count = row_count;
    update public.soloq_sync_runs
    set total_jobs = job_count,
        status = case when job_count = 0 then 'succeeded' else 'pending' end,
        completed_at = case when job_count = 0 then now() else null end,
        updated_at = now()
    where id = created_run_id;

    insert into public.soloq_sync_state (tenant_id, player_id, status, updated_at)
    select job.tenant_id, job.player_id, 'queued', now()
    from public.soloq_sync_jobs job
    where job.run_id = created_run_id
    on conflict (player_id) do update
    set status = case
          when public.soloq_sync_state.status = 'syncing' then public.soloq_sync_state.status
          else 'queued'
        end,
        updated_at = now();

    created_count := created_count + 1;
  end loop;
  return created_count;
end;
$$;

-- Recover stale locks and claim a small ordered batch atomically.
create or replace function public.claim_soloq_sync_jobs(
  p_worker_id text,
  p_limit integer default 2
)
returns setof public.soloq_sync_jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.soloq_sync_jobs
  set status = case when attempts >= 3 then 'failed' else 'pending' end,
      locked_at = null,
      locked_by = null,
      available_at = case when attempts >= 3 then available_at else now() end,
      completed_at = case when attempts >= 3 then now() else null end,
      last_error_code = 'stale_lock',
      last_error_message = 'Recovered after the previous worker stopped.',
      updated_at = now()
  where status = 'running' and locked_at < now() - interval '10 minutes';

  return query
  with candidates as (
    select job.id
    from public.soloq_sync_jobs job
    where job.status in ('pending', 'rate_limited')
      and job.available_at <= now()
      and job.attempts < 3
      and not exists (
        select 1 from public.soloq_sync_jobs active
        where active.tenant_id = job.tenant_id
          and active.status = 'running'
      )
    order by job.priority desc, job.available_at, job.created_at
    for update skip locked
    limit least(greatest(p_limit, 1), 2)
  )
  update public.soloq_sync_jobs job
  set status = 'running',
      attempts = attempts + 1,
      locked_at = now(),
      locked_by = left(p_worker_id, 120),
      started_at = coalesce(started_at, now()),
      completed_at = null,
      updated_at = now()
  from candidates
  where job.id = candidates.id
  returning job.*;
end;
$$;

create or replace function public.refresh_soloq_run_progress(p_run_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  counts record;
begin
  select
    count(*)::integer as total,
    count(*) filter (where status in ('succeeded','skipped','failed'))::integer as completed,
    count(*) filter (where status = 'succeeded')::integer as succeeded,
    count(*) filter (where status = 'skipped')::integer as skipped,
    count(*) filter (where status = 'failed')::integer as failed,
    count(*) filter (where status in ('pending','running','rate_limited'))::integer as open
  into counts
  from public.soloq_sync_jobs where run_id = p_run_id;

  update public.soloq_sync_runs
  set total_jobs = counts.total,
      completed_jobs = counts.completed,
      succeeded_jobs = counts.succeeded,
      skipped_jobs = counts.skipped,
      failed_jobs = counts.failed,
      started_at = case when counts.completed > 0 or counts.open < counts.total then coalesce(started_at, now()) else started_at end,
      status = case
        when counts.open > 0 and counts.completed = 0 then 'pending'
        when counts.open > 0 then 'running'
        when counts.failed = 0 then 'succeeded'
        when counts.succeeded > 0 or counts.skipped > 0 then 'partial'
        else 'failed'
      end,
      completed_at = case when counts.open = 0 then now() else null end,
      updated_at = now()
  where id = p_run_id;
end;
$$;

revoke all on function public.coordinate_soloq_daily_runs() from public, anon, authenticated;
revoke all on function public.claim_soloq_sync_jobs(text, integer) from public, anon, authenticated;
revoke all on function public.refresh_soloq_run_progress(uuid) from public, anon, authenticated;
grant execute on function public.coordinate_soloq_daily_runs() to service_role;
grant execute on function public.claim_soloq_sync_jobs(text, integer) to service_role;
grant execute on function public.refresh_soloq_run_progress(uuid) to service_role;

-- Vault-backed custom authentication and pg_cron installation helper.
create or replace function public.verify_soloq_worker_secret(p_secret text)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'soloq_worker_secret'
      and decrypted_secret = p_secret
  );
$$;

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
  if p_project_url !~ '^https://[a-z0-9-]+\\.supabase\\.co$' then
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

revoke all on function public.verify_soloq_worker_secret(text) from public, anon, authenticated;
revoke all on function public.configure_soloq_cron(text, text) from public, anon, authenticated;
grant execute on function public.verify_soloq_worker_secret(text) to service_role;
grant execute on function public.configure_soloq_cron(text, text) to service_role;

-- The legacy Solo Queue cache stays for audit, but is no longer a client API.
revoke all on table public.player_soloq_matches from public, anon, authenticated;
revoke all on table public.player_soloq_stats from public, anon, authenticated;
revoke all on table public.player_rank_history from public, anon, authenticated;

comment on table public.soloq_sync_runs is 'Observable daily and manual Solo Queue synchronization runs.';
comment on table public.soloq_sync_jobs is 'Durable paced per-player Riot synchronization jobs.';
comment on column public.soloq_recent_matches.match_context is 'Sanitized factual participant and team context; never a raw Riot response.';

notify pgrst, 'reload schema';
