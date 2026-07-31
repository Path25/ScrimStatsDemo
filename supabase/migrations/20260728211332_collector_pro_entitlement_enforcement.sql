-- The browser and billing contract already present Collector as a Pro feature.
-- Keep the stored module state in sync so database-backed capability checks do
-- not contradict that product promise.
-- Applied to the hosted project under this release-time migration version.

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
    (new.id, 'collector', 'live', new.subscription_tier::text in ('pro', 'elite'), now()),
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

update public.tenant_feature_access access
set
  is_enabled = tenant.subscription_tier::text in ('pro', 'elite'),
  updated_at = now(),
  updated_by = null
from public.tenants tenant
where access.tenant_id = tenant.id
  and access.module_key = 'collector';

comment on function public.sync_tenant_plan_entitlements() is
  'Synchronizes tenant module access. Collector is available to Pro and Elite workspaces; Discord remains Elite-only.';

notify pgrst, 'reload schema';
