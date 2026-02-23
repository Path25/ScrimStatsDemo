-- Fix the RLS policies for player_soloq_stats to use full match_id comparison
DROP POLICY IF EXISTS "Users can view SoloQ stats for their tenant matches" ON public.player_soloq_stats;
DROP POLICY IF EXISTS "Users can view SoloQ stats for their tenant only" ON public.player_soloq_stats;

-- Create correct SELECT policy that compares full match IDs
CREATE POLICY "Users can view SoloQ stats for their tenant matches" 
ON public.player_soloq_stats 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM player_soloq_matches psm
    JOIN players p ON (psm.player_id = p.id)
    WHERE psm.match_id = player_soloq_stats.match_id 
    AND p.tenant_id = get_user_tenant_id()
  )
);

-- Also fix the INSERT policies to use correct match_id comparison
DROP POLICY IF EXISTS "Users can insert SoloQ stats for their tenant matches" ON public.player_soloq_stats;
DROP POLICY IF EXISTS "Users can insert SoloQ stats for their tenant matches only" ON public.player_soloq_stats;

CREATE POLICY "Users can insert SoloQ stats for their tenant matches" 
ON public.player_soloq_stats 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM player_soloq_matches psm
    JOIN players p ON (psm.player_id = p.id)
    WHERE psm.match_id = player_soloq_stats.match_id 
    AND p.tenant_id = get_user_tenant_id()
  )
);