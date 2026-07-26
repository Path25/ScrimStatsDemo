-- Tenant-safe Solo Queue history. Existing legacy tables remain untouched.

create table public.soloq_sync_state (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  player_id uuid not null,
  status text not null default 'never_synced'
    check (status in ('never_synced', 'syncing', 'ready', 'unavailable', 'rate_limited', 'failed')),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  next_allowed_at timestamptz,
  error_code text,
  error_message text,
  updated_at timestamptz not null default now(),
  primary key (player_id),
  constraint soloq_sync_state_player_tenant_fkey
    foreign key (player_id, tenant_id) references public.players(id, tenant_id) on delete cascade
);

create table public.soloq_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  player_id uuid not null,
  snapshot_date date not null default current_date,
  queue_type text not null default 'RANKED_SOLO_5x5',
  tier text not null,
  division text not null,
  league_points integer not null check (league_points >= 0),
  wins integer not null check (wins >= 0),
  losses integer not null check (losses >= 0),
  captured_at timestamptz not null default now(),
  source text not null default 'riot_api' check (source = 'riot_api'),
  unique (player_id, snapshot_date, queue_type),
  constraint soloq_daily_snapshots_player_tenant_fkey
    foreign key (player_id, tenant_id) references public.players(id, tenant_id) on delete cascade
);

create table public.soloq_recent_matches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  player_id uuid not null,
  match_id text not null,
  played_at timestamptz not null,
  game_duration_seconds integer not null check (game_duration_seconds > 0),
  queue_id integer not null,
  game_version text,
  champion_id integer not null,
  champion_name text not null,
  team_position text,
  win boolean not null,
  kills integer not null check (kills >= 0),
  deaths integer not null check (deaths >= 0),
  assists integer not null check (assists >= 0),
  cs integer not null check (cs >= 0),
  gold_earned integer not null check (gold_earned >= 0),
  damage_to_champions integer not null check (damage_to_champions >= 0),
  vision_score integer not null check (vision_score >= 0),
  items jsonb not null default '[]'::jsonb,
  synced_at timestamptz not null default now(),
  source text not null default 'riot_api' check (source = 'riot_api'),
  unique (player_id, match_id),
  constraint soloq_recent_matches_player_tenant_fkey
    foreign key (player_id, tenant_id) references public.players(id, tenant_id) on delete cascade
);

create index soloq_daily_snapshots_player_date_idx
  on public.soloq_daily_snapshots (player_id, snapshot_date desc);
create index soloq_recent_matches_player_played_idx
  on public.soloq_recent_matches (player_id, played_at desc);

alter table public.soloq_sync_state enable row level security;
alter table public.soloq_daily_snapshots enable row level security;
alter table public.soloq_recent_matches enable row level security;

create policy "workspace members read SoloQ sync state"
on public.soloq_sync_state for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

create policy "workspace members read SoloQ daily snapshots"
on public.soloq_daily_snapshots for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

create policy "workspace members read SoloQ recent matches"
on public.soloq_recent_matches for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

revoke all on public.soloq_sync_state from public, anon, authenticated;
revoke all on public.soloq_daily_snapshots from public, anon, authenticated;
revoke all on public.soloq_recent_matches from public, anon, authenticated;
grant select on public.soloq_sync_state to authenticated;
grant select on public.soloq_daily_snapshots to authenticated;
grant select on public.soloq_recent_matches to authenticated;
grant select, insert, update, delete on public.soloq_sync_state to service_role;
grant select, insert, update, delete on public.soloq_daily_snapshots to service_role;
grant select, insert, update, delete on public.soloq_recent_matches to service_role;

create or replace function public.claim_soloq_sync(
  p_player_id uuid,
  p_cooldown interval default interval '15 minutes'
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected_rows integer := 0;
  player_row public.players;
begin
  select * into player_row
  from public.players
  where id = p_player_id and archived_at is null;

  if player_row.id is null then
    return false;
  end if;

  insert into public.soloq_sync_state (
    tenant_id, player_id, status, last_attempt_at, next_allowed_at, updated_at
  )
  values (
    player_row.tenant_id, player_row.id, 'syncing', now(), now() + p_cooldown, now()
  )
  on conflict (player_id) do update
  set status = 'syncing',
      last_attempt_at = now(),
      next_allowed_at = now() + p_cooldown,
      error_code = null,
      error_message = null,
      updated_at = now()
  where public.soloq_sync_state.next_allowed_at is null
     or public.soloq_sync_state.next_allowed_at <= now()
     or public.soloq_sync_state.status in ('failed', 'unavailable');

  get diagnostics affected_rows = row_count;
  return affected_rows > 0;
end;
$$;

revoke all on function public.claim_soloq_sync(uuid, interval)
  from public, anon, authenticated;
grant execute on function public.claim_soloq_sync(uuid, interval) to service_role;

comment on table public.soloq_daily_snapshots is
  'One Riot API ranked snapshot per tracked roster player and UTC day.';
comment on table public.soloq_recent_matches is
  'Idempotent normalized recent ranked match history; never fabricated or estimated.';

notify pgrst, 'reload schema';
