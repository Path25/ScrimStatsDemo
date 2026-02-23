-- Create opponent teams table
CREATE TABLE public.opponent_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  region TEXT,
  logo_url TEXT,
  description TEXT,
  social_links JSONB DEFAULT '{"twitter": null, "instagram": null, "discord": null, "website": null}'::jsonb,
  fandom_links JSONB DEFAULT '{"leaguepedia": null, "liquipedia": null, "other": []}'::jsonb,
  strategic_notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create opponent players table
CREATE TABLE public.opponent_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent_team_id UUID NOT NULL REFERENCES public.opponent_teams(id) ON DELETE CASCADE,
  summoner_name TEXT NOT NULL,
  riot_id TEXT,
  role TEXT CHECK (role IN ('top', 'jungle', 'mid', 'adc', 'support')),
  region TEXT DEFAULT 'na1',
  external_links JSONB DEFAULT '{"opgg": null, "ugg": null, "mobalytics": null, "other": []}'::jsonb,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create opponent champion pools table
CREATE TABLE public.opponent_champion_pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent_player_id UUID NOT NULL REFERENCES public.opponent_players(id) ON DELETE CASCADE,
  champion_name TEXT NOT NULL,
  pool_type TEXT NOT NULL CHECK (pool_type IN ('pocket_pick', 'comfort_pick', 'secondary_pick')),
  confidence_level INTEGER DEFAULT 5 CHECK (confidence_level >= 1 AND confidence_level <= 10),
  games_played INTEGER DEFAULT 0,
  win_rate NUMERIC,
  last_played TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(opponent_player_id, champion_name, pool_type)
);

-- Create opponent drafts table
CREATE TABLE public.opponent_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent_team_id UUID NOT NULL REFERENCES public.opponent_teams(id) ON DELETE CASCADE,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  opponent_name TEXT NOT NULL,
  our_side TEXT CHECK (our_side IN ('blue', 'red')),
  draft_data JSONB NOT NULL DEFAULT '{"bans": {"our_bans": [], "enemy_bans": []}, "picks": {"our_picks": [], "enemy_picks": []}, "draft_order": []}'::jsonb,
  result TEXT CHECK (result IN ('win', 'loss', 'unknown')),
  game_duration INTEGER,
  tournament_context TEXT,
  patch_version TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create opponent performance trends table
CREATE TABLE public.opponent_performance_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent_team_id UUID NOT NULL REFERENCES public.opponent_teams(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('win_rate', 'avg_game_time', 'first_blood_rate', 'baron_rate', 'dragon_rate', 'tower_rate')),
  time_period TEXT NOT NULL CHECK (time_period IN ('last_7_days', 'last_30_days', 'current_patch', 'all_time')),
  metric_value NUMERIC NOT NULL,
  sample_size INTEGER DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(opponent_team_id, metric_type, time_period)
);

-- Create opponent playstyle tags table
CREATE TABLE public.opponent_playstyle_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent_team_id UUID,
  opponent_player_id UUID,
  tag_name TEXT NOT NULL,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('playstyle', 'tendency', 'strength', 'weakness')),
  confidence_level INTEGER DEFAULT 5 CHECK (confidence_level >= 1 AND confidence_level <= 10),
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK ((opponent_team_id IS NOT NULL AND opponent_player_id IS NULL) OR 
         (opponent_team_id IS NULL AND opponent_player_id IS NOT NULL))
);

-- Create strategic annotations table
CREATE TABLE public.strategic_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent_team_id UUID NOT NULL REFERENCES public.opponent_teams(id) ON DELETE CASCADE,
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('level_1_path', 'ward_placement', 'positioning', 'rotation', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  map_coordinates JSONB, -- Store x,y coordinates and drawings
  game_phase TEXT CHECK (game_phase IN ('early', 'mid', 'late', 'all')),
  confidence_level INTEGER DEFAULT 5 CHECK (confidence_level >= 1 AND confidence_level <= 10),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scouting timeline events table
CREATE TABLE public.scouting_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent_team_id UUID NOT NULL REFERENCES public.opponent_teams(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  event_description TEXT,
  game_time_minutes INTEGER, -- When in game this typically happens
  event_type TEXT CHECK (event_type IN ('objective', 'rotation', 'teamfight', 'macro', 'draft', 'other')),
  frequency TEXT CHECK (frequency IN ('always', 'often', 'sometimes', 'rarely')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create matchup matrix data table
CREATE TABLE public.matchup_matrix_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent_player_id UUID NOT NULL REFERENCES public.opponent_players(id) ON DELETE CASCADE,
  our_player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  matchup_context TEXT, -- e.g., "Yasuo vs Zed", "top lane matchup"
  our_performance JSONB DEFAULT '{"wins": 0, "losses": 0, "avg_kda": null, "cs_diff": null}'::jsonb,
  opponent_performance JSONB DEFAULT '{"wins": 0, "losses": 0, "avg_kda": null, "cs_diff": null}'::jsonb,
  notes TEXT,
  last_matchup TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.opponent_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opponent_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opponent_champion_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opponent_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opponent_performance_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opponent_playstyle_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scouting_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchup_matrix_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for opponent_teams
CREATE POLICY "Users can view opponent teams in their tenant" 
ON public.opponent_teams FOR SELECT 
USING (user_belongs_to_tenant(tenant_id));

CREATE POLICY "Users can create opponent teams for their tenant" 
ON public.opponent_teams FOR INSERT 
WITH CHECK (user_belongs_to_tenant(tenant_id));

CREATE POLICY "Users can update opponent teams in their tenant" 
ON public.opponent_teams FOR UPDATE 
USING (user_belongs_to_tenant(tenant_id));

CREATE POLICY "Users can delete opponent teams in their tenant" 
ON public.opponent_teams FOR DELETE 
USING (user_belongs_to_tenant(tenant_id));

-- Create RLS policies for opponent_players
CREATE POLICY "Users can view opponent players from their tenant teams" 
ON public.opponent_players FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.opponent_teams ot 
  WHERE ot.id = opponent_players.opponent_team_id 
  AND user_belongs_to_tenant(ot.tenant_id)
));

CREATE POLICY "Users can create opponent players for their tenant teams" 
ON public.opponent_players FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.opponent_teams ot 
  WHERE ot.id = opponent_players.opponent_team_id 
  AND user_belongs_to_tenant(ot.tenant_id)
));

CREATE POLICY "Users can update opponent players from their tenant teams" 
ON public.opponent_players FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.opponent_teams ot 
  WHERE ot.id = opponent_players.opponent_team_id 
  AND user_belongs_to_tenant(ot.tenant_id)
));

CREATE POLICY "Users can delete opponent players from their tenant teams" 
ON public.opponent_players FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.opponent_teams ot 
  WHERE ot.id = opponent_players.opponent_team_id 
  AND user_belongs_to_tenant(ot.tenant_id)
));

-- Create RLS policies for opponent_champion_pools
CREATE POLICY "Users can manage opponent champion pools for their tenant" 
ON public.opponent_champion_pools FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.opponent_players op
  JOIN public.opponent_teams ot ON ot.id = op.opponent_team_id
  WHERE op.id = opponent_champion_pools.opponent_player_id 
  AND user_belongs_to_tenant(ot.tenant_id)
));

-- Create RLS policies for opponent_drafts
CREATE POLICY "Users can manage opponent drafts for their tenant" 
ON public.opponent_drafts FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.opponent_teams ot 
  WHERE ot.id = opponent_drafts.opponent_team_id 
  AND user_belongs_to_tenant(ot.tenant_id)
));

-- Create RLS policies for opponent_performance_trends
CREATE POLICY "Users can manage opponent performance trends for their tenant" 
ON public.opponent_performance_trends FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.opponent_teams ot 
  WHERE ot.id = opponent_performance_trends.opponent_team_id 
  AND user_belongs_to_tenant(ot.tenant_id)
));

-- Create RLS policies for opponent_playstyle_tags
CREATE POLICY "Users can manage opponent playstyle tags for their tenant" 
ON public.opponent_playstyle_tags FOR ALL 
USING (
  (opponent_team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.opponent_teams ot 
    WHERE ot.id = opponent_playstyle_tags.opponent_team_id 
    AND user_belongs_to_tenant(ot.tenant_id)
  ))
  OR
  (opponent_player_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.opponent_players op
    JOIN public.opponent_teams ot ON ot.id = op.opponent_team_id
    WHERE op.id = opponent_playstyle_tags.opponent_player_id 
    AND user_belongs_to_tenant(ot.tenant_id)
  ))
);

-- Create RLS policies for strategic_annotations
CREATE POLICY "Users can manage strategic annotations for their tenant" 
ON public.strategic_annotations FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.opponent_teams ot 
  WHERE ot.id = strategic_annotations.opponent_team_id 
  AND user_belongs_to_tenant(ot.tenant_id)
));

-- Create RLS policies for scouting_timeline_events
CREATE POLICY "Users can manage scouting timeline events for their tenant" 
ON public.scouting_timeline_events FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.opponent_teams ot 
  WHERE ot.id = scouting_timeline_events.opponent_team_id 
  AND user_belongs_to_tenant(ot.tenant_id)
));

-- Create RLS policies for matchup_matrix_data
CREATE POLICY "Users can manage matchup matrix data for their tenant" 
ON public.matchup_matrix_data FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.opponent_players op
  JOIN public.opponent_teams ot ON ot.id = op.opponent_team_id
  WHERE op.id = matchup_matrix_data.opponent_player_id 
  AND user_belongs_to_tenant(ot.tenant_id)
));

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_opponent_teams_updated_at
  BEFORE UPDATE ON public.opponent_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_opponent_players_updated_at
  BEFORE UPDATE ON public.opponent_players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_opponent_champion_pools_updated_at
  BEFORE UPDATE ON public.opponent_champion_pools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_opponent_drafts_updated_at
  BEFORE UPDATE ON public.opponent_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_opponent_playstyle_tags_updated_at
  BEFORE UPDATE ON public.opponent_playstyle_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_strategic_annotations_updated_at
  BEFORE UPDATE ON public.strategic_annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_scouting_timeline_events_updated_at
  BEFORE UPDATE ON public.scouting_timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_matchup_matrix_data_updated_at
  BEFORE UPDATE ON public.matchup_matrix_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_opponent_teams_tenant_id ON public.opponent_teams(tenant_id);
CREATE INDEX idx_opponent_players_team_id ON public.opponent_players(opponent_team_id);
CREATE INDEX idx_opponent_champion_pools_player_id ON public.opponent_champion_pools(opponent_player_id);
CREATE INDEX idx_opponent_drafts_team_id ON public.opponent_drafts(opponent_team_id);
CREATE INDEX idx_opponent_performance_trends_team_id ON public.opponent_performance_trends(opponent_team_id);
CREATE INDEX idx_strategic_annotations_team_id ON public.strategic_annotations(opponent_team_id);
CREATE INDEX idx_scouting_timeline_events_team_id ON public.scouting_timeline_events(opponent_team_id);
CREATE INDEX idx_matchup_matrix_data_player_id ON public.matchup_matrix_data(opponent_player_id);