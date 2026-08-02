-- Free, Pro, and Elite workspaces include the Solo Queue tracker. Keep the
-- existing Collector lifecycle rule and all other module tiers unchanged.
create or replace function public.sync_tenant_plan_entitlements()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.tenant_feature_access (tenant_id, module_key, release_state, is_enabled, updated_at)
  values
    (new.id, 'operations', 'live', true, now()),
    (new.id, 'soloq', 'live', true, now()),
    (new.id, 'analytics', 'beta', new.subscription_tier::text in ('pro', 'elite'), now()),
    (new.id, 'scouting', 'beta', new.subscription_tier::text in ('pro', 'elite'), now()),
    (new.id, 'draft_preparation', 'planned', new.subscription_tier::text in ('pro', 'elite'), now()),
    (new.id, 'collector', 'live', public.collector_entitlement_active(new.subscription_tier, new.subscription_status, new.subscription_period_end, new.subscription_past_due_started_at), now()),
    (new.id, 'discord', 'planned', new.subscription_tier::text = 'elite', now())
  on conflict (tenant_id, module_key) do update set is_enabled = excluded.is_enabled, updated_at = excluded.updated_at, updated_by = null;
  return new;
end;
$$;

revoke all on function public.sync_tenant_plan_entitlements() from public, anon, authenticated;
grant execute on function public.sync_tenant_plan_entitlements() to service_role;

-- Reconcile every existing workspace without touching its subscription or
-- unrelated module records. This also repairs tenants missing the Solo Queue row.
insert into public.tenant_feature_access (tenant_id, module_key, release_state, is_enabled, updated_at)
select tenant.id, 'soloq', 'live', true, now()
from public.tenants tenant
on conflict (tenant_id, module_key) do update
set release_state = excluded.release_state,
    is_enabled = excluded.is_enabled,
    updated_at = excluded.updated_at,
    updated_by = null;

notify pgrst, 'reload schema';
