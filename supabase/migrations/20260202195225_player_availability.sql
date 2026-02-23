-- Player Availability System Migration
-- Adds support for tracking player availability and role assignments

-- Add role column to players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('top', 'jungle', 'mid', 'adc', 'support')),
ADD COLUMN IF NOT EXISTS role_assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS role_assigned_by UUID REFERENCES auth.users(id);

-- Create player_availability table
CREATE TABLE IF NOT EXISTS public.player_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  recurrence_rule TEXT, -- iCal RRULE format for recurring availability
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_role ON public.players(role);
CREATE INDEX IF NOT EXISTS idx_player_availability_player_id ON public.player_availability(player_id);
CREATE INDEX IF NOT EXISTS idx_player_availability_tenant_id ON public.player_availability(tenant_id);
CREATE INDEX IF NOT EXISTS idx_player_availability_time_range ON public.player_availability(start_time, end_time);

-- Enable Row Level Security
ALTER TABLE public.player_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for player_availability
CREATE POLICY "Users can view availability for their tenant" 
ON public.player_availability FOR SELECT 
USING (user_belongs_to_tenant(tenant_id));

CREATE POLICY "Users can create availability for their tenant players" 
ON public.player_availability FOR INSERT 
WITH CHECK (
  user_belongs_to_tenant(tenant_id) AND
  EXISTS (
    SELECT 1 FROM public.players p 
    WHERE p.id = player_id 
    AND p.tenant_id = player_availability.tenant_id
  )
);

CREATE POLICY "Users can update availability for their tenant" 
ON public.player_availability FOR UPDATE 
USING (user_belongs_to_tenant(tenant_id));

CREATE POLICY "Users can delete availability for their tenant" 
ON public.player_availability FOR DELETE 
USING (user_belongs_to_tenant(tenant_id));

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_player_availability_updated_at
  BEFORE UPDATE ON public.player_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create a view for team availability (all 5 roles available)
CREATE OR REPLACE VIEW public.team_availability_slots AS
WITH role_availability AS (
  SELECT 
    pa.tenant_id,
    p.role,
    pa.start_time,
    pa.end_time,
    pa.is_available
  FROM public.player_availability pa
  JOIN public.players p ON p.id = pa.player_id
  WHERE pa.is_available = true
    AND p.role IS NOT NULL
)
SELECT 
  tenant_id,
  start_time,
  end_time
FROM role_availability
GROUP BY tenant_id, start_time, end_time
HAVING COUNT(DISTINCT role) = 5; -- All 5 roles available

-- Grant access to the view
GRANT SELECT ON public.team_availability_slots TO authenticated;
