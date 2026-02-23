
-- Phase 1: Database Schema Updates for Draft and Coach Feedback System

-- Create enum for draft modes
CREATE TYPE public.draft_mode AS ENUM ('client', 'external', 'manual');

-- Create enum for champion roles
CREATE TYPE public.champion_role AS ENUM ('top', 'jungle', 'mid', 'adc', 'support');

-- Create enum for pick/ban types
CREATE TYPE public.draft_action_type AS ENUM ('pick', 'ban');

-- Create enum for team sides in draft
CREATE TYPE public.draft_team_side AS ENUM ('blue', 'red');

-- Create game_drafts table to store draft information
CREATE TABLE public.game_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scrim_game_id UUID NOT NULL REFERENCES public.scrim_games(id) ON DELETE CASCADE,
  draft_mode public.draft_mode NOT NULL DEFAULT 'client',
  draft_url TEXT NULL,
  our_team_side public.draft_team_side NULL,
  draft_data JSONB NOT NULL DEFAULT '{"picks": [], "bans": [], "phase": "draft", "completed": false}',
  session_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create coach_feedback table for storing coaching notes and feedback
CREATE TABLE public.coach_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scrim_game_id UUID NOT NULL REFERENCES public.scrim_games(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL,
  feedback_type TEXT NOT NULL DEFAULT 'general',
  player_id UUID NULL REFERENCES public.players(id),
  timestamp_seconds INTEGER NULL,
  title TEXT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  tags JSONB NOT NULL DEFAULT '[]',
  is_during_game BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create champion_pools table for storing player champion preferences
CREATE TABLE public.champion_pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  champion_name TEXT NOT NULL,
  role public.champion_role NOT NULL,
  comfort_level INTEGER NOT NULL DEFAULT 5 CHECK (comfort_level >= 1 AND comfort_level <= 10),
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  notes TEXT NULL,
  last_played TIMESTAMP WITH TIME ZONE NULL,
  win_rate DECIMAL(5,2) NULL CHECK (win_rate >= 0 AND win_rate <= 100),
  games_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(player_id, champion_name, role)
);

-- Update scrim_games table to add draft-related fields
ALTER TABLE public.scrim_games 
ADD COLUMN draft_mode public.draft_mode DEFAULT 'client',
ADD COLUMN draft_url TEXT NULL,
ADD COLUMN coaching_notes TEXT NULL;

-- Enable Row Level Security on new tables
ALTER TABLE public.game_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.champion_pools ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for game_drafts
CREATE POLICY "Users can view drafts for their tenant games" ON public.game_drafts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.scrim_games sg
    JOIN public.scrims s ON sg.scrim_id = s.id
    WHERE sg.id = scrim_game_id AND s.tenant_id = (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert drafts for their tenant games" ON public.game_drafts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scrim_games sg
    JOIN public.scrims s ON sg.scrim_id = s.id
    WHERE sg.id = scrim_game_id AND s.tenant_id = (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update drafts for their tenant games" ON public.game_drafts
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.scrim_games sg
    JOIN public.scrims s ON sg.scrim_id = s.id
    WHERE sg.id = scrim_game_id AND s.tenant_id = (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  )
);

-- Create RLS policies for coach_feedback
CREATE POLICY "Users can view feedback for their tenant games" ON public.coach_feedback
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.scrim_games sg
    JOIN public.scrims s ON sg.scrim_id = s.id
    WHERE sg.id = scrim_game_id AND s.tenant_id = (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert feedback for their tenant games" ON public.coach_feedback
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scrim_games sg
    JOIN public.scrims s ON sg.scrim_id = s.id
    WHERE sg.id = scrim_game_id AND s.tenant_id = (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own feedback" ON public.coach_feedback
FOR UPDATE USING (coach_id = auth.uid());

CREATE POLICY "Users can delete their own feedback" ON public.coach_feedback
FOR DELETE USING (coach_id = auth.uid());

-- Create RLS policies for champion_pools
CREATE POLICY "Users can view champion pools for their tenant players" ON public.champion_pools
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = player_id AND p.tenant_id = (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert champion pools for their tenant players" ON public.champion_pools
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = player_id AND p.tenant_id = (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update champion pools for their tenant players" ON public.champion_pools
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = player_id AND p.tenant_id = (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete champion pools for their tenant players" ON public.champion_pools
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = player_id AND p.tenant_id = (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  )
);

-- Create indexes for better performance
CREATE INDEX idx_game_drafts_scrim_game_id ON public.game_drafts(scrim_game_id);
CREATE INDEX idx_game_drafts_session_id ON public.game_drafts(session_id);
CREATE INDEX idx_coach_feedback_scrim_game_id ON public.coach_feedback(scrim_game_id);
CREATE INDEX idx_coach_feedback_coach_id ON public.coach_feedback(coach_id);
CREATE INDEX idx_coach_feedback_player_id ON public.coach_feedback(player_id);
CREATE INDEX idx_champion_pools_player_id ON public.champion_pools(player_id);
CREATE INDEX idx_champion_pools_champion_role ON public.champion_pools(champion_name, role);

-- Create triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_drafts_updated_at
  BEFORE UPDATE ON public.game_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_coach_feedback_updated_at
  BEFORE UPDATE ON public.coach_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_champion_pools_updated_at
  BEFORE UPDATE ON public.champion_pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
