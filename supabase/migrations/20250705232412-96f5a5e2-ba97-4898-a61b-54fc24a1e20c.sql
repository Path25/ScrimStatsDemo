
-- Add timezone column to scrims table
ALTER TABLE public.scrims 
ADD COLUMN timezone text;

-- Set default timezone for existing scrims to avoid null values
UPDATE public.scrims 
SET timezone = 'UTC' 
WHERE timezone IS NULL;
