-- Discord interactions are provider-originated mutations.  Browser clients
-- can only read the configured role records; all writes go through narrowly
-- scoped server functions after the caller has been authenticated.

create table if not exists public.discord_permitted_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  installation_id uuid not null references public.discord_installations(id) on delete cascade,
  role_id text not null check (role_id ~ '^[0-9]{17,20}$'),
  role_name text,
  configured_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, role_id)
);

create table if not exists public.discord_interaction_receipts (
  interaction_id text primary key check (interaction_id ~ '^[0-9]{17,20}$'),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  guild_id text not null check (guild_id ~ '^[0-9]{17,20}$'),
  scrim_id uuid not null references public.scrims(id) on delete restrict,
  received_at timestamptz not null default now()
);

create index if not exists discord_permitted_roles_tenant_installation_idx
  on public.discord_permitted_roles (tenant_id, installation_id);
create index if not exists discord_interaction_receipts_tenant_received_idx
  on public.discord_interaction_receipts (tenant_id, received_at desc);

alter table public.discord_permitted_roles enable row level security;
alter table public.discord_interaction_receipts enable row level security;

revoke all on table public.discord_permitted_roles, public.discord_interaction_receipts
  from public, anon;
grant select on table public.discord_permitted_roles, public.discord_interaction_receipts to authenticated;
grant select, insert, update, delete on table public.discord_permitted_roles, public.discord_interaction_receipts to service_role;

create policy "staff read permitted discord roles"
on public.discord_permitted_roles for select to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));

create policy "staff read discord interaction receipts"
on public.discord_interaction_receipts for select to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));

create or replace function public.replace_discord_permitted_roles(
  p_tenant_id uuid,
  p_actor_user_id uuid,
  p_roles jsonb
)
returns table(role_id text, role_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_installation_id uuid;
  v_role jsonb;
  v_role_id text;
  v_role_name text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Server authorization is required' using errcode = '42501';
  end if;

  if p_actor_user_id is null or not exists (
    select 1 from public.tenant_users member
    where member.tenant_id = p_tenant_id
      and member.user_id = p_actor_user_id
      and member.role in ('owner', 'admin')
  ) then
    raise exception 'Owner or admin access is required' using errcode = '42501';
  end if;

  select installation.id into v_installation_id
  from public.tenants tenant
  join public.tenant_feature_access feature
    on feature.tenant_id = tenant.id
   and feature.module_key = 'discord'
   and feature.release_state = 'live'
   and feature.is_enabled = true
  join public.discord_installations installation
    on installation.tenant_id = tenant.id
   and installation.status = 'active'
  where tenant.id = p_tenant_id
    and tenant.subscription_tier = 'elite';

  if v_installation_id is null then
    raise exception 'Discord automation is unavailable for this workspace' using errcode = '42501';
  end if;

  if jsonb_typeof(p_roles) <> 'array' or jsonb_array_length(p_roles) > 20 then
    raise exception 'Choose no more than twenty Discord roles' using errcode = '22023';
  end if;

  for v_role in select value from jsonb_array_elements(p_roles)
  loop
    v_role_id := v_role ->> 'id';
    v_role_name := nullif(left(coalesce(v_role ->> 'name', ''), 100), '');
    if v_role_id is null or v_role_id !~ '^[0-9]{17,20}$' then
      raise exception 'Choose valid Discord roles' using errcode = '22023';
    end if;
  end loop;

  if (select count(distinct value ->> 'id') from jsonb_array_elements(p_roles)) <> jsonb_array_length(p_roles) then
    raise exception 'Choose each Discord role once' using errcode = '22023';
  end if;

  delete from public.discord_permitted_roles where tenant_id = p_tenant_id;
  insert into public.discord_permitted_roles (tenant_id, installation_id, role_id, role_name, configured_by)
  select p_tenant_id, v_installation_id, value ->> 'id', nullif(left(coalesce(value ->> 'name', ''), 100), ''), p_actor_user_id
  from jsonb_array_elements(p_roles);

  return query
  select role.role_id, role.role_name
  from public.discord_permitted_roles role
  where role.tenant_id = p_tenant_id
  order by role.role_name nulls last, role.role_id;
end;
$$;

revoke all on function public.replace_discord_permitted_roles(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_discord_permitted_roles(uuid, uuid, jsonb) to service_role;

create or replace function public.create_discord_scrim_block(
  p_interaction_id text,
  p_tenant_id uuid,
  p_guild_id text,
  p_role_ids text[],
  p_opponent_name text,
  p_starts_at timestamptz,
  p_timezone text,
  p_duration_minutes integer,
  p_format text,
  p_notes text default null
)
returns table(scrim_id uuid, result text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scrim public.scrims;
  v_existing_scrim_id uuid;
  v_installation public.discord_installations;
  v_end_at timestamptz;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Server authorization is required' using errcode = '42501';
  end if;
  if p_interaction_id !~ '^[0-9]{17,20}$' or p_guild_id !~ '^[0-9]{17,20}$' then
    raise exception 'Invalid interaction identity' using errcode = '22023';
  end if;

  -- Serialise per workspace so two independently valid commands cannot create
  -- overlapping blocks between their conflict checks and inserts.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_tenant_id::text, 0));

  select receipt.scrim_id into v_existing_scrim_id
  from public.discord_interaction_receipts receipt
  where receipt.interaction_id = p_interaction_id;
  if v_existing_scrim_id is not null then
    return query select v_existing_scrim_id, 'replay'::text;
    return;
  end if;

  select installation.* into v_installation
  from public.tenants tenant
  join public.tenant_feature_access feature
    on feature.tenant_id = tenant.id
   and feature.module_key = 'discord'
   and feature.release_state = 'live'
   and feature.is_enabled = true
  join public.discord_installations installation
    on installation.tenant_id = tenant.id
   and installation.status = 'active'
   and installation.guild_id = p_guild_id
  where tenant.id = p_tenant_id
    and tenant.subscription_tier = 'elite';
  if v_installation.id is null then
    raise exception 'Discord automation is unavailable for this workspace' using errcode = '42501';
  end if;

  if coalesce(array_length(p_role_ids, 1), 0) = 0 or not exists (
    select 1 from public.discord_permitted_roles role
    where role.tenant_id = p_tenant_id
      and role.installation_id = v_installation.id
      and role.role_id = any(p_role_ids)
  ) then
    raise exception 'A permitted Discord role is required' using errcode = '42501';
  end if;

  if nullif(btrim(p_opponent_name), '') is null or char_length(btrim(p_opponent_name)) > 120 then
    raise exception 'Opponent name must be between 1 and 120 characters' using errcode = '22023';
  end if;
  if p_starts_at is null or p_duration_minutes not between 15 and 720 then
    raise exception 'Choose a valid start time and duration' using errcode = '22023';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names zone where zone.name = p_timezone) then
    raise exception 'Choose a supported IANA timezone' using errcode = '22023';
  end if;

  v_end_at := p_starts_at + pg_catalog.make_interval(mins => p_duration_minutes);
  if exists (
    select 1 from public.scrims scrim
    where scrim.tenant_id = p_tenant_id
      and scrim.status in ('scheduled', 'in_progress')
      and scrim.starts_at < v_end_at
      and coalesce(scrim.ends_at, scrim.starts_at + pg_catalog.make_interval(mins => coalesce(scrim.duration_minutes, 120))) > p_starts_at
  ) then
    raise exception 'A practice block already overlaps that time' using errcode = '23P01';
  end if;

  insert into public.scrims (
    tenant_id, opponent_name, match_date, scheduled_time, starts_at, ends_at,
    timezone, duration_minutes, format, notes, status, data_source, created_by
  ) values (
    p_tenant_id, btrim(p_opponent_name), p_starts_at, p_starts_at, p_starts_at, v_end_at,
    p_timezone, p_duration_minutes, coalesce(nullif(btrim(p_format), ''), 'BO5'),
    nullif(btrim(p_notes), ''), 'scheduled', 'manual', v_installation.installed_by
  ) returning * into v_scrim;

  insert into public.discord_interaction_receipts (interaction_id, tenant_id, guild_id, scrim_id)
  values (p_interaction_id, p_tenant_id, p_guild_id, v_scrim.id);

  return query select v_scrim.id, 'created'::text;
end;
$$;

revoke all on function public.create_discord_scrim_block(text, uuid, text, text[], text, timestamptz, text, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.create_discord_scrim_block(text, uuid, text, text[], text, timestamptz, text, integer, text, text)
  to service_role;

notify pgrst, 'reload schema';
