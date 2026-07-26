-- Cover tenant/composite foreign keys used by RLS and cascade maintenance.
create index if not exists soloq_snapshots_tenant_idx
  on public.soloq_daily_snapshots (tenant_id);
create index if not exists soloq_snapshots_player_tenant_idx
  on public.soloq_daily_snapshots (player_id, tenant_id);
create index if not exists soloq_matches_tenant_idx
  on public.soloq_recent_matches (tenant_id);
create index if not exists soloq_matches_player_tenant_idx
  on public.soloq_recent_matches (player_id, tenant_id);
create index if not exists soloq_state_tenant_idx
  on public.soloq_sync_state (tenant_id);
create index if not exists soloq_state_player_tenant_idx
  on public.soloq_sync_state (player_id, tenant_id);
create index if not exists soloq_jobs_player_tenant_idx
  on public.soloq_sync_jobs (player_id, tenant_id);
create index if not exists soloq_runs_requested_by_idx
  on public.soloq_sync_runs (requested_by) where requested_by is not null;

create index if not exists opponent_soloq_state_team_tenant_idx
  on public.opponent_soloq_sync_state (opponent_team_id, tenant_id);
create index if not exists opponent_soloq_state_player_team_idx
  on public.opponent_soloq_sync_state (opponent_player_id, opponent_team_id);
create index if not exists opponent_soloq_snapshots_team_tenant_idx
  on public.opponent_soloq_daily_snapshots (opponent_team_id, tenant_id);
create index if not exists opponent_soloq_snapshots_player_team_idx
  on public.opponent_soloq_daily_snapshots (opponent_player_id, opponent_team_id);
create index if not exists opponent_soloq_matches_team_tenant_idx
  on public.opponent_soloq_recent_matches (opponent_team_id, tenant_id);
create index if not exists opponent_soloq_matches_player_team_idx
  on public.opponent_soloq_recent_matches (opponent_player_id, opponent_team_id);

-- Legacy tables are retained for audit only. Removing their historical client
-- policies prevents accidental re-exposure and avoids evaluating obsolete RLS.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in ('player_soloq_matches', 'player_soloq_stats', 'player_rank_history')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end;
$$;
