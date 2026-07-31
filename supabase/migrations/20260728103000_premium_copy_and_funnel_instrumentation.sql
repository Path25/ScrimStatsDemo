-- Privacy-preserving commercial funnel milestones.
--
-- This is a service-only, append-only ledger. It deliberately excludes email
-- addresses, IP addresses, device identifiers, game payloads, player records,
-- and free-form metadata. Milestones are generated from authoritative database
-- writes so retries and browser instrumentation cannot inflate the funnel.

create table if not exists public.workspace_funnel_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_key text not null check (event_key in (
    'account_registered',
    'workspace_created',
    'first_scheduled_block',
    'first_recorded_game',
    'workspace_activated',
    'first_paid_upgrade'
  )),
  occurred_at timestamptz not null default now(),
  constraint workspace_funnel_events_tenant_required
    check (event_key = 'account_registered' or tenant_id is not null)
);

create unique index if not exists workspace_funnel_events_account_registered_once
  on public.workspace_funnel_events (actor_id, event_key)
  where event_key = 'account_registered' and actor_id is not null;

create unique index if not exists workspace_funnel_events_tenant_milestone_once
  on public.workspace_funnel_events (tenant_id, event_key)
  where tenant_id is not null;

create index if not exists workspace_funnel_events_scorecard_idx
  on public.workspace_funnel_events (event_key, occurred_at desc);

alter table public.workspace_funnel_events enable row level security;
revoke all on table public.workspace_funnel_events from public, anon, authenticated;
grant select, insert on table public.workspace_funnel_events to service_role;

create or replace function public.record_account_registered()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_funnel_events (actor_id, event_key)
  values (new.id, 'account_registered')
  on conflict do nothing;
  return new;
end;
$$;

revoke all on function public.record_account_registered() from public, anon, authenticated;

drop trigger if exists record_account_registered_trigger on auth.users;
create trigger record_account_registered_trigger
after insert on auth.users
for each row execute function public.record_account_registered();

create or replace function public.record_workspace_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'owner' then
    insert into public.workspace_funnel_events (tenant_id, actor_id, event_key)
    values (new.tenant_id, new.user_id, 'workspace_created')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.record_workspace_created() from public, anon, authenticated;

drop trigger if exists record_workspace_created_trigger on public.tenant_users;
create trigger record_workspace_created_trigger
after insert on public.tenant_users
for each row execute function public.record_workspace_created();

create or replace function public.record_workspace_funnel_milestone(
  p_tenant_id uuid,
  p_event_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_funnel_events (tenant_id, event_key)
  values (p_tenant_id, p_event_key)
  on conflict do nothing;

  if p_event_key in ('first_scheduled_block', 'first_recorded_game')
    and exists (
      select 1 from public.workspace_funnel_events
      where tenant_id = p_tenant_id and event_key = 'first_scheduled_block'
    )
    and exists (
      select 1 from public.workspace_funnel_events
      where tenant_id = p_tenant_id and event_key = 'first_recorded_game'
    ) then
    insert into public.workspace_funnel_events (tenant_id, event_key)
    values (p_tenant_id, 'workspace_activated')
    on conflict do nothing;
  end if;
end;
$$;

revoke all on function public.record_workspace_funnel_milestone(uuid, text) from public, anon, authenticated;

create or replace function public.record_first_scheduled_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'scheduled' then
    perform public.record_workspace_funnel_milestone(new.tenant_id, 'first_scheduled_block');
  end if;
  return new;
end;
$$;

revoke all on function public.record_first_scheduled_block() from public, anon, authenticated;

drop trigger if exists record_first_scheduled_block_trigger on public.scrims;
create trigger record_first_scheduled_block_trigger
after insert on public.scrims
for each row execute function public.record_first_scheduled_block();

create or replace function public.record_first_recorded_game()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid;
begin
  select tenant_id into v_tenant_id from public.scrims where id = new.scrim_id;
  if v_tenant_id is not null and new.status = 'completed' then
    perform public.record_workspace_funnel_milestone(v_tenant_id, 'first_recorded_game');
  end if;
  return new;
end;
$$;

revoke all on function public.record_first_recorded_game() from public, anon, authenticated;

drop trigger if exists record_first_recorded_game_trigger on public.scrim_games;
create trigger record_first_recorded_game_trigger
after insert on public.scrim_games
for each row execute function public.record_first_recorded_game();

create or replace function public.record_first_paid_upgrade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.subscription_tier::text = 'free'
    and new.subscription_tier::text in ('pro', 'elite')
    and new.subscription_status = 'active' then
    perform public.record_workspace_funnel_milestone(new.id, 'first_paid_upgrade');
  end if;
  return new;
end;
$$;

revoke all on function public.record_first_paid_upgrade() from public, anon, authenticated;

drop trigger if exists record_first_paid_upgrade_trigger on public.tenants;
create trigger record_first_paid_upgrade_trigger
after update of subscription_tier, subscription_status on public.tenants
for each row execute function public.record_first_paid_upgrade();

create or replace function public.get_founder_funnel_scorecard(
  p_since timestamptz default now() - interval '30 days'
)
returns table (
  event_key text,
  milestone_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select event_key, count(*)::bigint
  from public.workspace_funnel_events
  where occurred_at >= p_since
  group by event_key
  order by case event_key
    when 'account_registered' then 1
    when 'workspace_created' then 2
    when 'first_scheduled_block' then 3
    when 'first_recorded_game' then 4
    when 'workspace_activated' then 5
    when 'first_paid_upgrade' then 6
    else 99
  end;
$$;

revoke all on function public.get_founder_funnel_scorecard(timestamptz) from public, anon, authenticated;
grant execute on function public.get_founder_funnel_scorecard(timestamptz) to service_role;

comment on table public.workspace_funnel_events is
  'Service-only, immutable commercial funnel milestones. Contains no email, IP, device, player, or gameplay payload.';
comment on function public.get_founder_funnel_scorecard(timestamptz) is
  'Service-only aggregate scorecard for post-release funnel milestones; it intentionally does not backfill historical data.';

notify pgrst, 'reload schema';
