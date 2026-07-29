alter table public.tenants
  -- Hosted Supabase recorded this migration with its release-time version.
  add column if not exists subscription_past_due_started_at timestamptz;

create or replace function public.collector_entitlement_active(
  p_tier public.subscription_tier,
  p_status text,
  p_period_end timestamptz,
  p_past_due_started_at timestamptz,
  p_now timestamptz default now()
) returns boolean
language sql stable
set search_path = ''
as $$
  select case
    when p_tier not in ('pro'::public.subscription_tier, 'elite'::public.subscription_tier) then false
    when p_status in ('active', 'trialing') then true
    when p_status = 'past_due' then p_past_due_started_at is not null and p_past_due_started_at + interval '7 days' > p_now
    else p_period_end is not null and p_period_end > p_now
  end;
$$;

revoke all on function public.collector_entitlement_active(public.subscription_tier, text, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.collector_entitlement_active(public.subscription_tier, text, timestamptz, timestamptz, timestamptz) to service_role;

create or replace function public.sync_tenant_plan_entitlements()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.tenant_feature_access (tenant_id, module_key, release_state, is_enabled, updated_at)
  values
    (new.id, 'operations', 'live', true, now()),
    (new.id, 'soloq', 'live', new.subscription_tier::text in ('pro', 'elite'), now()),
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
drop trigger if exists sync_tenant_plan_entitlements_trigger on public.tenants;
create trigger sync_tenant_plan_entitlements_trigger after insert or update of subscription_tier, subscription_status, subscription_period_end, subscription_past_due_started_at on public.tenants for each row execute function public.sync_tenant_plan_entitlements();

update public.tenants set subscription_past_due_started_at = billing_updated_at where subscription_status = 'past_due' and subscription_past_due_started_at is null;
update public.tenant_feature_access access set is_enabled = public.collector_entitlement_active(tenant.subscription_tier, tenant.subscription_status, tenant.subscription_period_end, tenant.subscription_past_due_started_at), updated_at = now(), updated_by = null from public.tenants tenant where access.tenant_id = tenant.id and access.module_key = 'collector';
notify pgrst, 'reload schema';
