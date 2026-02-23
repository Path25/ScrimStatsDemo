
-- Add external_game_data column to scrim_games table
ALTER TABLE public.scrim_games 
ADD COLUMN external_game_data jsonb DEFAULT '{}'::jsonb;

-- Add a comment to document what this column stores
COMMENT ON COLUMN public.scrim_games.external_game_data IS 'Stores additional game data from external sources like desktop app, including League Client data, raw game data, detected players, etc.';
