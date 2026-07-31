-- Service-only daily MRR snapshots. Applied live as migration version 20260731151435.
-- This migration deliberately does not schedule
-- a job or write Vault secrets; those are release-gated operational changes.
create table public.stripe_mrr_daily_snapshots (
  business_date date not null,
  currency text not null check (currency ~ '^[a-z]{3}$'),
  snapshot_version smallint not null default 1 check (snapshot_version > 0),
  active_paid_subscription_count integer not null check (active_paid_subscription_count >= 0),
  normalized_monthly_recurring_amount_minor bigint not null check (normalized_monthly_recurring_amount_minor >= 0),
  observed_at timestamptz not null default now(),
  primary key (business_date, currency, snapshot_version)
);

alter table public.stripe_mrr_daily_snapshots enable row level security;
revoke all on table public.stripe_mrr_daily_snapshots from public, anon, authenticated;
grant select, insert on table public.stripe_mrr_daily_snapshots to service_role;

create policy "service role reads Stripe MRR snapshots"
on public.stripe_mrr_daily_snapshots
for select
to service_role
using (true);

create policy "service role appends Stripe MRR snapshots"
on public.stripe_mrr_daily_snapshots
for insert
to service_role
with check (true);

comment on table public.stripe_mrr_daily_snapshots is
  'Service-only append-only Stripe MRR aggregates. No customer, subscription, payment, or raw Stripe payload identifiers are stored.';

create or replace function public.verify_stripe_mrr_snapshot_worker_secret(p_secret text)
returns boolean
language plpgsql
security definer
set search_path = vault, pg_temp
as $$
declare
  worker_secret text;
begin
  if nullif(trim(p_secret), '') is null then
    return false;
  end if;
  select decrypted_secret into worker_secret
  from vault.decrypted_secrets
  where name = 'stripe_mrr_snapshot_worker_secret'
  limit 1;
  return worker_secret is not null and p_secret = worker_secret;
end;
$$;

revoke all on function public.verify_stripe_mrr_snapshot_worker_secret(text) from public, anon, authenticated;
grant execute on function public.verify_stripe_mrr_snapshot_worker_secret(text) to service_role;

-- This is intentionally configuration-on-call: applying the schema migration does
-- not activate a cron job or create secrets. The release operator must separately
-- approve and invoke it with the project URL, publishable key, and worker secret.
create or replace function public.configure_stripe_mrr_snapshot_cron(
  p_project_url text,
  p_publishable_key text,
  p_worker_secret text
)
returns void
language plpgsql
security definer
set search_path = public, vault, cron, extensions, pg_temp
as $$
declare
  existing_id uuid;
  job_id bigint;
begin
  if p_project_url !~ '^https://[a-z0-9-]+\\.supabase\\.co$' then
    raise exception 'Invalid Supabase project URL';
  end if;
  if nullif(trim(p_publishable_key), '') is null then
    raise exception 'Publishable key is required';
  end if;
  if length(p_worker_secret) < 32 then
    raise exception 'Worker secret must be at least 32 characters';
  end if;

  select id into existing_id from vault.secrets where name = 'project_url' limit 1;
  if existing_id is null then
    perform vault.create_secret(p_project_url, 'project_url', 'ScrimStats scheduled worker project URL');
  else
    perform vault.update_secret(existing_id, p_project_url, 'project_url', 'ScrimStats scheduled worker project URL');
  end if;

  select id into existing_id from vault.secrets where name = 'publishable_key' limit 1;
  if existing_id is null then
    perform vault.create_secret(p_publishable_key, 'publishable_key', 'ScrimStats scheduled worker publishable key');
  else
    perform vault.update_secret(existing_id, p_publishable_key, 'publishable_key', 'ScrimStats scheduled worker publishable key');
  end if;

  select id into existing_id from vault.secrets where name = 'stripe_mrr_snapshot_worker_secret' limit 1;
  if existing_id is null then
    perform vault.create_secret(p_worker_secret, 'stripe_mrr_snapshot_worker_secret', 'Stripe MRR snapshot worker secret');
  else
    perform vault.update_secret(existing_id, p_worker_secret, 'stripe_mrr_snapshot_worker_secret', 'Stripe MRR snapshot worker secret');
  end if;

  select jobid into job_id from cron.job where jobname = 'scrimstats-stripe-mrr-snapshot';
  if job_id is not null then
    perform cron.unschedule(job_id);
  end if;
  perform cron.schedule(
    'scrimstats-stripe-mrr-snapshot',
    '30 0 * * *',
    $command$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/stripe-mrr-snapshot',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key'),
          'x-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'stripe_mrr_snapshot_worker_secret')
        ),
        body := '{}'::jsonb
      );
    $command$
  );
end;
$$;

revoke all on function public.configure_stripe_mrr_snapshot_cron(text, text, text) from public, anon, authenticated;
grant execute on function public.configure_stripe_mrr_snapshot_cron(text, text, text) to service_role;
