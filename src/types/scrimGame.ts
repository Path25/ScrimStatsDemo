export type GameStatus = 'pending' | 'draft' | 'in_progress' | 'completed' | 'cancelled';
export type GameSide = 'blue' | 'red';
export type GameResult = 'win' | 'loss';
export type PlayerRole = 'top' | 'jungle' | 'mid' | 'adc' | 'support';

// Database types that match Supabase Json
export interface ScrimGameDB {
  id: string;
  scrim_id: string;
  game_number: number;
  status: GameStatus;
  side?: GameSide;
  result?: GameResult;
  duration_seconds?: number;
  game_start_time?: string;
  game_end_time?: string;
  our_team_kills: number;
  enemy_team_kills: number;
  our_team_gold: number;
  enemy_team_gold: number;
  objectives: any; // Json type from DB
  bans: any; // Json type from DB
  external_game_id?: string;
  external_game_data?: any; // Added this field for desktop app data
  match_history_url?: string;
  replay_url?: string;
  notes?: string;
  // New fields for auto-monitoring
  grid_series_number?: number;
  desktop_session_id?: string;
  auto_created?: boolean;
  created_at: string;
  updated_at: string;
}

// Application types with proper typing
export interface ScrimGame {
  id: string;
  scrim_id: string;
  game_number: number;
  status: GameStatus;
  side?: GameSide;
  result?: GameResult;
  duration_seconds?: number;
  game_start_time?: string;
  game_end_time?: string;
  our_team_kills: number;
  enemy_team_kills: number;
  our_team_gold: number;
  enemy_team_gold: number;
  objectives: GameObjectives;
  bans: GameBans;
  external_game_id?: string;
  external_game_data?: any; // Added this field for desktop app data
  match_history_url?: string;
  replay_url?: string;
  notes?: string;
  // New fields for auto-monitoring
  grid_series_number?: number;
  desktop_session_id?: string;
  auto_created?: boolean;
  created_at: string;
  updated_at: string;
  participants?: ScrimParticipant[];
  live_data?: LiveGameData[];
  draft_mode?: DraftMode;
  draft_url?: string;
  coaching_notes?: string; // Add this field for coaching notes
  draft?: GameDraft;
  coach_feedback?: CoachFeedback[];
}

export interface GameObjectives {
  dragons: ObjectiveEvent[];
  barons: ObjectiveEvent[];
  towers: ObjectiveEvent[];
  inhibitors: ObjectiveEvent[];
}

export interface ObjectiveEvent {
  timestamp: number;
  team: 'our' | 'enemy';
  type?: string;
  position?: string;
}

export interface GameBans {
  our_bans: ChampionBan[];
  enemy_bans: ChampionBan[];
}

export interface ChampionBan {
  champion: string;
  order: number;
}

export interface ScrimParticipantDB {
  id: string;
  scrim_game_id: string;
  player_id?: string;
  summoner_name: string;
  champion_name?: string;
  role?: PlayerRole;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  damage_dealt: number;
  damage_taken: number;
  vision_score: number;
  items: any; // Json type from DB
  runes: any; // Json type from DB
  summoner_spells: any; // Json type from DB
  level: number;
  is_our_team: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScrimParticipant {
  id: string;
  scrim_game_id: string;
  player_id?: string;
  summoner_name: string;
  champion_name?: string;
  role?: PlayerRole;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  damage_dealt: number;
  damage_taken: number;
  vision_score: number;
  items: GameItem[];
  runes: RuneSetup;
  summoner_spells: SummonerSpell[];
  level: number;
  is_our_team: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameItem {
  id: number;
  name: string;
  slot: number;
}

export interface RuneSetup {
  primary_tree: string;
  secondary_tree: string;
  runes: number[];
  stat_mods: number[];
}

export interface SummonerSpell {
  id: number;
  name: string;
  slot: 1 | 2;
}

export interface LiveGameDataDB {
  id: string;
  scrim_game_id: string;
  game_time_seconds: number;
  blue_team_kills: number;
  red_team_kills: number;
  blue_team_gold: number;
  red_team_gold: number;
  objectives_state: any; // Json type from DB
  participants_state: any; // Json type from DB
  game_events: any; // Json type from DB
  timestamp: string;
  data_source: 'manual' | 'grid' | 'desktop_app';
}

export interface LiveGameData {
  id: string;
  scrim_game_id: string;
  game_time_seconds: number;
  blue_team_kills: number;
  red_team_kills: number;
  blue_team_gold: number;
  red_team_gold: number;
  objectives_state: any;
  participants_state: LiveParticipantState[];
  game_events: GameEvent[];
  timestamp: string;
  data_source: 'manual' | 'grid' | 'desktop_app';
}

export interface LiveParticipantState {
  summoner_name: string;
  champion: string;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  items: number[];
  position: { x: number; y: number };
  health: number;
  mana: number;
  ultimate_ready: boolean;
}

export interface GameEvent {
  timestamp: number;
  type: 'kill' | 'death' | 'assist' | 'objective' | 'item_purchase' | 'level_up';
  participant: string;
  details: any;
}

export interface CreateScrimGameData {
  scrim_id: string;
  game_number: number;
  status?: GameStatus;
  side?: GameSide;
  notes?: string;
  // New optional fields for auto-creation
  grid_series_number?: number;
  desktop_session_id?: string;
  auto_created?: boolean;
  external_game_id?: string;
}

export interface UpdateScrimGameData extends Partial<CreateScrimGameData> {
  result?: GameResult;
  duration_seconds?: number;
  game_start_time?: string;
  game_end_time?: string;
  our_team_kills?: number;
  enemy_team_kills?: number;
  our_team_gold?: number;
  enemy_team_gold?: number;
  objectives?: any; // Allow any for database compatibility
  bans?: any; // Allow any for database compatibility
  external_game_data?: any; // Add this field to allow GRID data updates
  match_history_url?: string;
  replay_url?: string;
  coaching_notes?: string; // Add this field for coaching notes
}

// New types for draft system
export type DraftMode = 'client' | 'external' | 'manual' | 'grid';
export type ChampionRole = 'top' | 'jungle' | 'mid' | 'adc' | 'support';
export type DraftActionType = 'pick' | 'ban';
export type DraftTeamSide = 'blue' | 'red';

export interface GameDraft {
  id: string;
  scrim_game_id: string;
  draft_mode: DraftMode;
  draft_url?: string;
  our_team_side?: DraftTeamSide;
  draft_data: DraftData;
  session_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface DraftData {
  picks: DraftPick[];
  bans: DraftBan[];
  phase: 'draft' | 'completed';
  completed: boolean;
}

export interface DraftPick {
  order: number;
  team: DraftTeamSide;
  champion: string;
  player?: string;
  role?: ChampionRole;
  timestamp?: number;
}

export interface DraftBan {
  order: number;
  team: DraftTeamSide;
  champion: string;
  timestamp?: number;
}

export interface CoachFeedback {
  id: string;
  scrim_game_id: string;
  coach_id: string;
  feedback_type: string;
  player_id?: string;
  player_name?: string; // Add this field for storing player names directly
  timestamp_seconds?: number;
  title?: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  is_during_game: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChampionPool {
  id: string;
  player_id: string;
  champion_name: string;
  role: ChampionRole;
  comfort_level: number; // 1-10
  priority: number; // 1-5
  notes?: string;
  last_played?: string;
  win_rate?: number;
  games_played: number;
  created_at: string;
  updated_at: string;
}

// Utility functions to transform data
export const transformScrimGameFromDB = (dbGame: ScrimGameDB & { participants?: ScrimParticipantDB[]; live_data?: LiveGameDataDB[] }): ScrimGame => {
  return {
    ...dbGame,
    objectives: dbGame.objectives || { dragons: [], barons: [], towers: [], inhibitors: [] },
    bans: dbGame.bans || { our_bans: [], enemy_bans: [] },
    participants: dbGame.participants?.map(transformParticipantFromDB),
    live_data: dbGame.live_data?.map(transformLiveDataFromDB),
  };
};

export const transformParticipantFromDB = (dbParticipant: ScrimParticipantDB): ScrimParticipant => {
  return {
    ...dbParticipant,
    items: Array.isArray(dbParticipant.items) ? dbParticipant.items : [],
    runes: dbParticipant.runes || { primary_tree: '', secondary_tree: '', runes: [], stat_mods: [] },
    summoner_spells: Array.isArray(dbParticipant.summoner_spells) ? dbParticipant.summoner_spells : [],
  };
};

export const transformLiveDataFromDB = (dbLiveData: LiveGameDataDB): LiveGameData => {
  return {
    ...dbLiveData,
    participants_state: Array.isArray(dbLiveData.participants_state) ? dbLiveData.participants_state : [],
    game_events: Array.isArray(dbLiveData.game_events) ? dbLiveData.game_events : [],
  };
};
