-- Make the complete competitive product direction visible for testing.
-- Release labels remain truthful: enabling a module does not promote it to live.

alter table public.tenant_feature_access
  alter column is_enabled set default true;

insert into public.tenant_feature_access (
  tenant_id,
  module_key,
  release_state,
  is_enabled
)
select
  tenant.id,
  module.module_key,
  module.release_state,
  true
from public.tenants tenant
cross join (
  values
    ('operations', 'live'),
    ('analytics', 'beta'),
    ('scouting', 'beta'),
    ('draft_preparation', 'planned'),
    ('collector', 'live'),
    ('discord', 'planned')
) as module(module_key, release_state)
on conflict (tenant_id, module_key)
do update set
  is_enabled = true,
  updated_at = now();

comment on column public.tenant_feature_access.is_enabled is
  'Controls route availability. Release state separately communicates planned, beta, or live maturity.';

create or replace function security.seed_tenant_feature_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.tenant_feature_access (
    tenant_id,
    module_key,
    release_state,
    is_enabled
  )
  values
    (new.id, 'operations', 'live', true),
    (new.id, 'analytics', 'beta', true),
    (new.id, 'scouting', 'beta', true),
    (new.id, 'draft_preparation', 'planned', true),
    (new.id, 'collector', 'live', true),
    (new.id, 'discord', 'planned', true)
  on conflict (tenant_id, module_key) do update set
    is_enabled = true,
    updated_at = now();

  return new;
end;
$$;

revoke all on function security.seed_tenant_feature_access()
  from public, anon, authenticated, service_role;

drop trigger if exists seed_tenant_feature_access on public.tenants;
create trigger seed_tenant_feature_access
after insert on public.tenants
for each row execute function security.seed_tenant_feature_access();
