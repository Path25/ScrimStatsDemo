
// Scrim types with timezone support
export interface Scrim {
  id: string;
  opponent_name: string;
  match_date: string;
  scheduled_time?: string;
  format?: 'BO1' | 'BO2' | 'BO3' | 'BO4' | 'BO5' | '1G' | '2G' | '3G' | '4G' | '5G';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  data_source?: 'manual' | 'grid' | 'desktop_app';
  grid_match_id?: string;
  notes?: string;
  timezone?: string;
  result?: string;
  our_score?: number;
  opponent_score?: number;
  duration_minutes?: number;
  created_by: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  scrim_games?: any[]; // Will be populated with detailed game data
}

export interface CreateScrimData {
  opponent_name: string;
  match_date: string;
  scheduled_time?: string;
  format?: 'BO1' | 'BO2' | 'BO3' | 'BO4' | 'BO5' | '1G' | '2G' | '3G' | '4G' | '5G';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  data_source?: 'manual' | 'grid' | 'desktop_app';
  grid_match_id?: string;
  notes?: string;
  timezone?: string;
}

export interface UpdateScrimData extends Partial<CreateScrimData> {
  id: string;
}
