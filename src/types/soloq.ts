export type SoloQSyncStatus =
  | "never_synced"
  | "queued"
  | "syncing"
  | "ready"
  | "unranked"
  | "invalid_identity"
  | "unavailable"
  | "rate_limited"
  | "failed";

export interface SoloQTrackedPlayer {
  id: string;
  summoner_name: string;
  riot_id: string | null;
  riot_tag_line: string | null;
  region: string | null;
  puuid: string | null;
}

export interface SoloQDailySnapshot {
  id: string;
  tenant_id: string;
  player_id: string;
  snapshot_date: string;
  queue_type: string;
  tier: string;
  division: string;
  league_points: number;
  wins: number;
  losses: number;
  captured_at: string;
}

export interface SoloQScoreboardParticipant {
  puuid: string;
  riotName: string;
  riotTag: string | null;
  teamId: number;
  championId: number;
  championName: string;
  role: string | null;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  damage: number;
  vision: number;
  items: number[];
}

export interface SoloQTeamContext {
  teamId: number;
  win: boolean;
  bans: Array<{ championId: number; pickTurn: number }>;
  objectives: Record<string, { first: boolean; kills: number }>;
}

export interface SoloQMatchContext {
  participants: SoloQScoreboardParticipant[];
  teams: SoloQTeamContext[];
}

export interface SoloQRecentMatch {
  id: string;
  tenant_id: string;
  player_id: string;
  match_id: string;
  played_at: string;
  game_duration_seconds: number;
  queue_id: number;
  game_version: string | null;
  champion_id: number;
  champion_name: string;
  team_position: string | null;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold_earned: number;
  damage_to_champions: number;
  vision_score: number;
  items: number[];
  match_context: SoloQMatchContext;
  synced_at: string;
}

export interface SoloQSyncState {
  tenant_id: string;
  player_id: string;
  status: SoloQSyncStatus;
  last_attempt_at: string | null;
  last_success_at: string | null;
  next_allowed_at: string | null;
  error_code: string | null;
  error_message: string | null;
}

export interface SoloQSyncRun {
  id: string;
  tenant_id: string;
  run_kind: "daily" | "manual";
  local_date: string | null;
  timezone: string;
  status: "pending" | "running" | "succeeded" | "partial" | "failed";
  total_jobs: number;
  completed_jobs: number;
  succeeded_jobs: number;
  skipped_jobs: number;
  failed_jobs: number;
  scheduled_at: string;
  completed_at: string | null;
}

export interface SoloQSyncJob {
  id: string;
  run_id: string;
  tenant_id: string;
  player_id: string;
  status: "pending" | "running" | "succeeded" | "skipped" | "rate_limited" | "failed";
  attempts: number;
  available_at: string;
  last_error_code: string | null;
  last_error_message: string | null;
}
