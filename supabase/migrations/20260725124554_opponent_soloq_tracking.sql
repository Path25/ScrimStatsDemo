create unique index if not exists opponent_players_id_team_unique
  on public.opponent_players(id, opponent_team_id);

create table public.opponent_soloq_sync_state (
  opponent_player_id uuid primary key,
  opponent_team_id uuid not null,
  tenant_id uuid not null,
  status text not null default 'pending'
    check (status in ('pending','syncing','ready','rate_limited','failed','unavailable')),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  next_allowed_at timestamptz,
  error_code text,
  error_message text,
  updated_at timestamptz not null default now(),
  foreign key (opponent_player_id, opponent_team_id)
    references public.opponent_players(id, opponent_team_id) on delete cascade,
  foreign key (opponent_team_id, tenant_id)
    references public.opponent_teams(id, tenant_id) on delete cascade
);

create table public.opponent_soloq_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  opponent_player_id uuid not null,
  opponent_team_id uuid not null,
  tenant_id uuid not null,
  snapshot_date date not null default current_date,
  queue_type text not null default 'RANKED_SOLO_5x5',
  tier text not null,
  division text not null,
  league_points integer not null check (league_points >= 0),
  wins integer not null check (wins >= 0),
  losses integer not null check (losses >= 0),
  captured_at timestamptz not null default now(),
  unique (opponent_player_id, snapshot_date, queue_type),
  foreign key (opponent_player_id, opponent_team_id)
    references public.opponent_players(id, opponent_team_id) on delete cascade,
  foreign key (opponent_team_id, tenant_id)
    references public.opponent_teams(id, tenant_id) on delete cascade
);

create table public.opponent_soloq_recent_matches (
  id uuid primary key default gen_random_uuid(),
  opponent_player_id uuid not null,
  opponent_team_id uuid not null,
  tenant_id uuid not null,
  match_id text not null,
  played_at timestamptz not null,
  game_duration_seconds integer not null check (game_duration_seconds > 0),
  queue_id integer not null,
  game_version text,
  champion_id integer not null,
  champion_name text not null,
  team_position text,
  win boolean not null,
  kills integer not null,
  deaths integer not null,
  assists integer not null,
  cs integer not null,
  gold_earned integer,
  damage_to_champions integer,
  vision_score integer,
  synced_at timestamptz not null default now(),
  unique (opponent_player_id, match_id),
  foreign key (opponent_player_id, opponent_team_id)
    references public.opponent_players(id, opponent_team_id) on delete cascade,
  foreign key (opponent_team_id, tenant_id)
    references public.opponent_teams(id, tenant_id) on delete cascade
);

create index opponent_soloq_snapshots_player_date_idx
  on public.opponent_soloq_daily_snapshots(opponent_player_id, snapshot_date desc);
create index opponent_soloq_matches_player_date_idx
  on public.opponent_soloq_recent_matches(opponent_player_id, played_at desc);

alter table public.opponent_soloq_sync_state enable row level security;
alter table public.opponent_soloq_daily_snapshots enable row level security;
alter table public.opponent_soloq_recent_matches enable row level security;

create policy "Members read opponent Solo Queue sync status"
on public.opponent_soloq_sync_state for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));
create policy "Members read opponent Solo Queue snapshots"
on public.opponent_soloq_daily_snapshots for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));
create policy "Members read opponent Solo Queue matches"
on public.opponent_soloq_recent_matches for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

revoke all on public.opponent_soloq_sync_state from public, anon, authenticated;
revoke all on public.opponent_soloq_daily_snapshots from public, anon, authenticated;
revoke all on public.opponent_soloq_recent_matches from public, anon, authenticated;
grant select on public.opponent_soloq_sync_state to authenticated;
grant select on public.opponent_soloq_daily_snapshots to authenticated;
grant select on public.opponent_soloq_recent_matches to authenticated;
grant select, insert, update, delete on public.opponent_soloq_sync_state to service_role;
grant select, insert, update, delete on public.opponent_soloq_daily_snapshots to service_role;
grant select, insert, update, delete on public.opponent_soloq_recent_matches to service_role;

create or replace function public.claim_opponent_soloq_sync(p_opponent_player_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  claimed boolean;
begin
  insert into public.opponent_soloq_sync_state (
    opponent_player_id, opponent_team_id, tenant_id, status,
    last_attempt_at, next_allowed_at, updated_at
  )
  select player.id, player.opponent_team_id, team.tenant_id, 'syncing',
    now(), now() + interval '15 minutes', now()
  from public.opponent_players player
  join public.opponent_teams team on team.id = player.opponent_team_id
  where player.id = p_opponent_player_id and coalesce(player.is_active, true)
  on conflict (opponent_player_id) do update set
    status = 'syncing',
    last_attempt_at = now(),
    next_allowed_at = now() + interval '15 minutes',
    updated_at = now()
  where public.opponent_soloq_sync_state.next_allowed_at is null
     or public.opponent_soloq_sync_state.next_allowed_at <= now()
     or public.opponent_soloq_sync_state.status in ('failed','unavailable')
  returning true into claimed;
  return coalesce(claimed, false);
end;
$$;

revoke all on function public.claim_opponent_soloq_sync(uuid)
  from public, anon, authenticated;
grant execute on function public.claim_opponent_soloq_sync(uuid) to service_role;

notify pgrst, 'reload schema';
