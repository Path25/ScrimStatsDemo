-- Tenant-owned Stripe billing, webhook idempotency, and plan-level module access.

alter table public.tenants
  add column if not exists stripe_price_id text,
  add column if not exists subscription_period_end timestamptz,
  add column if not exists subscription_cancel_at_period_end boolean not null default false,
  add column if not exists billing_updated_at timestamptz;

create unique index if not exists tenants_stripe_customer_unique
  on public.tenants (stripe_customer_id) where stripe_customer_id is not null;
create unique index if not exists tenants_stripe_subscription_unique
  on public.tenants (stripe_subscription_id) where stripe_subscription_id is not null;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  tenant_id uuid references public.tenants(id) on delete set null,
  status text not null check (status in ('processing', 'completed', 'failed')),
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.stripe_webhook_events enable row level security;
revoke all on table public.stripe_webhook_events from public, anon, authenticated;
grant select, insert, update, delete on table public.stripe_webhook_events to service_role;

alter table public.tenant_feature_access
  drop constraint if exists tenant_feature_access_module_key_check;
alter table public.tenant_feature_access
  add constraint tenant_feature_access_module_key_check check (module_key in (
    'operations', 'soloq', 'analytics', 'scouting', 'draft_preparation', 'collector', 'discord'
  ));

create or replace function public.sync_tenant_plan_entitlements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.tenant_feature_access (tenant_id, module_key, release_state, is_enabled, updated_at)
  values
    (new.id, 'operations', 'live', true, now()),
    (new.id, 'soloq', 'live', new.subscription_tier::text in ('pro', 'elite'), now()),
    (new.id, 'analytics', 'beta', new.subscription_tier::text in ('pro', 'elite'), now()),
    (new.id, 'scouting', 'beta', new.subscription_tier::text in ('pro', 'elite'), now()),
    (new.id, 'draft_preparation', 'planned', new.subscription_tier::text in ('pro', 'elite'), now()),
    (new.id, 'collector', 'live', new.subscription_tier::text = 'elite', now()),
    (new.id, 'discord', 'planned', new.subscription_tier::text = 'elite', now())
  on conflict (tenant_id, module_key) do update set
    is_enabled = excluded.is_enabled,
    updated_at = excluded.updated_at,
    updated_by = null;
  return new;
end;
$$;

revoke all on function public.sync_tenant_plan_entitlements() from public, anon, authenticated;
grant execute on function public.sync_tenant_plan_entitlements() to service_role;

drop trigger if exists sync_tenant_plan_entitlements_trigger on public.tenants;
create trigger sync_tenant_plan_entitlements_trigger
after insert or update of subscription_tier on public.tenants
for each row execute function public.sync_tenant_plan_entitlements();

insert into public.tenant_feature_access (tenant_id, module_key, release_state, is_enabled, updated_at)
select tenant.id, module.module_key, module.release_state,
  case
    when module.module_key = 'operations' then true
    when module.module_key in ('soloq', 'analytics', 'scouting', 'draft_preparation') then tenant.subscription_tier::text in ('pro', 'elite')
    else tenant.subscription_tier::text = 'elite'
  end,
  now()
from public.tenants tenant
cross join (values
  ('operations', 'live'), ('soloq', 'live'), ('analytics', 'beta'), ('scouting', 'beta'),
  ('draft_preparation', 'planned'), ('collector', 'live'), ('discord', 'planned')
) as module(module_key, release_state)
on conflict (tenant_id, module_key) do update set
  is_enabled = excluded.is_enabled,
  updated_at = excluded.updated_at,
  updated_by = null;

comment on table public.stripe_webhook_events is 'Service-only Stripe webhook idempotency and delivery audit ledger.';
