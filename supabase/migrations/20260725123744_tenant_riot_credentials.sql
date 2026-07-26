create table public.tenant_riot_integrations (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  secret_id uuid not null,
  key_kind text not null default 'development'
    check (key_kind in ('development', 'personal', 'production')),
  key_hint text not null,
  status text not null default 'untested'
    check (status in ('untested', 'active', 'invalid', 'rate_limited', 'unavailable')),
  last_tested_at timestamptz,
  last_success_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenant_riot_integrations enable row level security;

create policy "Workspace members can read Riot integration status"
on public.tenant_riot_integrations for select to authenticated
using (
  exists (
    select 1
    from public.tenant_users membership
    where membership.tenant_id = tenant_riot_integrations.tenant_id
      and membership.user_id = (select auth.uid())
  )
);

revoke all on public.tenant_riot_integrations from public, anon, authenticated;
grant select on public.tenant_riot_integrations to authenticated;
grant select, insert, update, delete on public.tenant_riot_integrations to service_role;

create or replace function public.store_tenant_riot_api_key(
  p_tenant_id uuid,
  p_api_key text,
  p_key_kind text,
  p_actor_id uuid
)
returns public.tenant_riot_integrations
language plpgsql
security definer
set search_path = public, vault, extensions, pg_temp
as $$
declare
  existing public.tenant_riot_integrations;
  stored_id uuid;
  result public.tenant_riot_integrations;
begin
  if p_api_key is null
     or char_length(trim(p_api_key)) < 20
     or char_length(trim(p_api_key)) > 256 then
    raise exception 'Invalid Riot API key';
  end if;
  if p_key_kind not in ('development', 'personal', 'production') then
    raise exception 'Unsupported Riot API key type';
  end if;

  select * into existing
  from public.tenant_riot_integrations
  where tenant_id = p_tenant_id
  for update;

  if existing.secret_id is null then
    stored_id := vault.create_secret(
      trim(p_api_key),
      'scrimstats-riot-' || p_tenant_id::text,
      'Tenant-managed Riot API credential for ScrimStats',
      null
    );
  else
    stored_id := existing.secret_id;
    perform vault.update_secret(
      stored_id,
      trim(p_api_key),
      'scrimstats-riot-' || p_tenant_id::text,
      'Tenant-managed Riot API credential for ScrimStats',
      null
    );
  end if;

  insert into public.tenant_riot_integrations (
    tenant_id, secret_id, key_kind, key_hint, status,
    last_tested_at, last_success_at, last_error_code, last_error_message,
    created_by, updated_by
  )
  values (
    p_tenant_id, stored_id, p_key_kind, right(trim(p_api_key), 4), 'active',
    now(), now(), null, null, p_actor_id, p_actor_id
  )
  on conflict (tenant_id) do update set
    secret_id = excluded.secret_id,
    key_kind = excluded.key_kind,
    key_hint = excluded.key_hint,
    status = 'active',
    last_tested_at = now(),
    last_success_at = now(),
    last_error_code = null,
    last_error_message = null,
    updated_by = p_actor_id,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

create or replace function public.get_tenant_riot_api_key(p_tenant_id uuid)
returns text
language sql
security definer
stable
set search_path = public, vault, extensions, pg_temp
as $$
  select decrypted_secret
  from vault.decrypted_secrets secret
  join public.tenant_riot_integrations integration
    on integration.secret_id = secret.id
  where integration.tenant_id = p_tenant_id
    and integration.status in ('active', 'rate_limited')
  limit 1;
$$;

create or replace function public.remove_tenant_riot_api_key(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public, vault, extensions, pg_temp
as $$
declare
  stored_id uuid;
begin
  delete from public.tenant_riot_integrations
  where tenant_id = p_tenant_id
  returning secret_id into stored_id;
  if stored_id is not null then
    delete from vault.secrets where id = stored_id;
  end if;
end;
$$;

revoke all on function public.store_tenant_riot_api_key(uuid, text, text, uuid)
  from public, anon, authenticated;
revoke all on function public.get_tenant_riot_api_key(uuid)
  from public, anon, authenticated;
revoke all on function public.remove_tenant_riot_api_key(uuid)
  from public, anon, authenticated;
grant execute on function public.store_tenant_riot_api_key(uuid, text, text, uuid)
  to service_role;
grant execute on function public.get_tenant_riot_api_key(uuid)
  to service_role;
grant execute on function public.remove_tenant_riot_api_key(uuid)
  to service_role;

comment on table public.tenant_riot_integrations is
  'Tenant-visible Riot connection metadata. API key material is encrypted in Supabase Vault.';

notify pgrst, 'reload schema';
