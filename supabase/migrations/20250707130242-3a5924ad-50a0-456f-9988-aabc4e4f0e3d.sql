
-- Add timezone column to calendar_events table
ALTER TABLE public.calendar_events 
ADD COLUMN timezone TEXT DEFAULT 'UTC';
