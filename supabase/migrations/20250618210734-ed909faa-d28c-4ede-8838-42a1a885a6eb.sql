
-- Add a new column to store player names directly as text
ALTER TABLE public.coach_feedback ADD COLUMN player_name TEXT NULL;

-- Add an index for better performance when filtering by player name
CREATE INDEX idx_coach_feedback_player_name ON public.coach_feedback(player_name);
