-- LOCAL TEST ONLY - NEVER LINK OR RUN AGAINST A HOSTED PROJECT
--
-- Minimal pre-WO-2026-033 schema for a fresh disposable Supabase Postgres
-- container. The repository migration chain assumes an earlier remote schema;
-- this fixture supplies only the contracts required to apply
-- 20260803120727_elite_practice_development_loop.sql and execute
-- supabase/tests/wo033_practice_development.test.sql.
--
-- This is intentionally outside supabase/migrations and supabase/tests so it
-- cannot be discovered by deployment or the pgTAP runner. It refuses a DB that
-- already contains public.tenants.
--
-- Required psql variables:
--   wo033_environment=local-supabase-disposable
--   wo033_ack=BUILD_WO033_MINIMAL_BASELINE
--   wo033_checkpoint=ac71123f86212437780d46647f39535abb1b0b31
--   wo033_apply=true

\set ON_ERROR_STOP on

\if :{?wo033_environment}
\else
  \echo 'Missing -v wo033_environment=local-supabase-disposable; stopping.'
  \quit 3
\endif
\if :{?wo033_ack}
\else
  \echo 'Missing -v wo033_ack=BUILD_WO033_MINIMAL_BASELINE; stopping.'
  \quit 3
\endif
\if :{?wo033_checkpoint}
\else
  \echo 'Missing the reviewed Phase 1 checkpoint; stopping.'
  \quit 3
\endif
\if :{?wo033_apply}
\else
  \echo 'Missing -v wo033_apply=true; stopping.'
  \quit 3
\endif

begin;

select set_config('wo033.environment', :'wo033_environment', true);
select set_config('wo033.ack', :'wo033_ack', true);
select set_config('wo033.checkpoint', :'wo033_checkpoint', true);
select set_config('wo033.apply', :'wo033_apply', true);

do $guard$
begin
  if current_setting('wo033.environment') <> 'local-supabase-disposable'
    or current_setting('wo033.ack') <> 'BUILD_WO033_MINIMAL_BASELINE'
    or current_setting('wo033.checkpoint') <> 'ac71123f86212437780d46647f39535abb1b0b31'
    or current_setting('wo033.apply') <> 'true'
  then
    raise exception 'WO-033 baseline requires exact local-only inputs';
  end if;

  if to_regclass('public.tenants') is not null then
    raise exception 'WO-033 baseline requires a fresh disposable database; public.tenants already exists';
  end if;

  if to_regclass('auth.users') is null
    or to_regprocedure('auth.uid()') is null
  then
    raise exception 'WO-033 baseline requires a Supabase Postgres container with Auth installed';
  end if;
end;
$guard$;

create extension if not exists pgcrypto with schema extensions;
create schema if not exists security;

create type public.subscription_tier as enum (
  'free', 'pro', 'enterprise', 'elite'
);
create type public.tenant_role as enum (
  'owner', 'admin', 'member', 'viewer'
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  subscription_tier public.subscription_tier not null default 'free',
  subscription_status text not null default 'active',
  subscription_period_end timestamptz,
  subscription_past_due_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null default 'member',
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table public.profiles (
  id uuid primary key,
  user_id uuid unique references auth.users(id) on delete cascade,
  display_name text
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  summoner_name text,
  archived_at timestamptz,
  unique (id, tenant_id)
);

create table public.scrims (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  opponent_name text not null,
  match_date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'scheduled',
  review_status text not null default 'not_started',
  review_completed_at timestamptz,
  timezone text,
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, tenant_id)
);

create table public.scrim_games (
  id uuid primary key default gen_random_uuid(),
  scrim_id uuid not null references public.scrims(id) on delete cascade,
  game_number integer not null check (game_number > 0),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  result text check (result is null or result in ('win', 'loss')),
  game_start_time timestamptz,
  game_end_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scrim_id, game_number)
);

create table public.coaching_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  scrim_id uuid references public.scrims(id) on delete set null,
  title text not null,
  status text not null default 'assigned'
    check (status in (
      'assigned', 'acknowledged', 'in_progress', 'ready_for_review',
      'complete', 'dismissed'
    )),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  assignee_user_id uuid references auth.users(id) on delete set null,
  assignee_player_id uuid references public.players(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  scope_type text not null default 'player'
    check (scope_type in ('player', 'unit', 'team')),
  unit_label text,
  category text not null default 'review_discipline',
  participant_player_ids uuid[] not null default '{}'::uuid[],
  checkpoint_scrim_ids uuid[] not null default '{}'::uuid[],
  follow_up_scrim_id uuid references public.scrims(id) on delete set null,
  source_type text not null default 'manual',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_feature_access (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  module_key text not null,
  release_state text not null
    check (release_state in ('planned', 'beta', 'live')),
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (tenant_id, module_key),
  constraint tenant_feature_access_module_key_check check (module_key in (
    'operations', 'soloq', 'analytics', 'scouting', 'draft_preparation',
    'collector', 'discord'
  ))
);

create or replace function security.user_has_any_tenant_role(
  tenant_uuid uuid,
  required_roles public.tenant_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_users membership
    where membership.user_id = (select auth.uid())
      and membership.tenant_id = tenant_uuid
      and membership.role = any(required_roles)
  );
$$;

revoke all on function security.user_has_any_tenant_role(
  uuid, public.tenant_role[]
) from public, anon, authenticated, service_role;

create or replace function public.user_has_tenant_role(
  tenant_uuid uuid,
  required_roles public.tenant_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select security.user_has_any_tenant_role(tenant_uuid, required_roles);
$$;

revoke all on function public.user_has_tenant_role(
  uuid, public.tenant_role[]
) from public, anon;
grant execute on function public.user_has_tenant_role(
  uuid, public.tenant_role[]
) to authenticated;

create or replace function public.collector_entitlement_active(
  p_tier public.subscription_tier,
  p_status text,
  p_period_end timestamptz,
  p_past_due_started_at timestamptz,
  p_now timestamptz default now()
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when p_tier not in ('pro'::public.subscription_tier, 'elite'::public.subscription_tier) then false
    when p_status in ('active', 'trialing') then true
    when p_status = 'past_due' then p_past_due_started_at is not null
      and p_past_due_started_at + interval '7 days' > p_now
    else p_period_end is not null and p_period_end > p_now
  end;
$$;

revoke all on function public.collector_entitlement_active(
  public.subscription_tier, text, timestamptz, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.collector_entitlement_active(
  public.subscription_tier, text, timestamptz, timestamptz, timestamptz
) to service_role;

-- Exact pre-WO-033 synchronizer contract from
-- 20260801111044_enable_free_soloq_entitlement.sql.
create or replace function public.sync_tenant_plan_entitlements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.tenant_feature_access (
    tenant_id, module_key, release_state, is_enabled, updated_at
  )
  values
    (new.id, 'operations', 'live', true, now()),
    (new.id, 'soloq', 'live', true, now()),
    (new.id, 'analytics', 'beta', new.subscription_tier::text in ('pro', 'elite'), now()),
    (new.id, 'scouting', 'beta', new.subscription_tier::text in ('pro', 'elite'), now()),
    (new.id, 'draft_preparation', 'planned', new.subscription_tier::text in ('pro', 'elite'), now()),
    (
      new.id, 'collector', 'live',
      public.collector_entitlement_active(
        new.subscription_tier,
        new.subscription_status,
        new.subscription_period_end,
        new.subscription_past_due_started_at
      ), now()
    ),
    (new.id, 'discord', 'planned', new.subscription_tier::text = 'elite', now())
  on conflict (tenant_id, module_key) do update set
    is_enabled = excluded.is_enabled,
    updated_at = excluded.updated_at,
    updated_by = null;

  return new;
end;
$$;

revoke all on function public.sync_tenant_plan_entitlements()
  from public, anon, authenticated;
grant execute on function public.sync_tenant_plan_entitlements()
  to service_role;

comment on function public.sync_tenant_plan_entitlements() is
  'Synchronizes tenant module access. Collector is available to Pro and Elite workspaces; Discord remains Elite-only.';

create trigger sync_tenant_plan_entitlements_trigger
after insert or update of
  subscription_tier,
  subscription_status,
  subscription_period_end,
  subscription_past_due_started_at
on public.tenants
for each row execute function public.sync_tenant_plan_entitlements();

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

commit;
