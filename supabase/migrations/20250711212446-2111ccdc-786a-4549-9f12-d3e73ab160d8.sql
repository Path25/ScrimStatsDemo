-- Security fixes for data exposure vulnerabilities

-- 1. Drop overly permissive public policies that expose full data
DROP POLICY IF EXISTS "Allow public read for player count" ON public.players;
DROP POLICY IF EXISTS "Allow public read for scrim count" ON public.scrims;
DROP POLICY IF EXISTS "Allow public read for tenant count" ON public.tenants;

-- 2. Create secure count-only functions for public statistics
CREATE OR REPLACE FUNCTION public.get_public_player_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*) FROM public.players WHERE is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.get_public_scrim_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*) FROM public.scrims;
$$;

CREATE OR REPLACE FUNCTION public.get_public_tenant_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*) FROM public.tenants WHERE subscription_status = 'active';
$$;

-- 3. Fix tenant exposure - remove broad access policy
DROP POLICY IF EXISTS "Users can view accessible tenants" ON public.tenants;

-- 4. Create secure tenant access policy
CREATE POLICY "Users can only view their own tenants"
ON public.tenants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE tenant_id = tenants.id 
    AND user_id = auth.uid()
  )
);

-- 5. Remove overly broad team invitation policies
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON public.team_invitations;

-- 6. Create secure invitation access policy
CREATE POLICY "Users can view invitations by valid token only"
ON public.team_invitations
FOR SELECT
USING (
  (token IS NOT NULL AND expires_at > now() AND accepted_at IS NULL)
  OR 
  (email = get_current_user_email())
  OR
  (invited_by = auth.uid())
  OR
  user_is_tenant_admin(tenant_id)
);

-- 7. Secure SoloQ stats - ensure tenant isolation
DROP POLICY IF EXISTS "Allow authenticated users to read soloq stats" ON public.player_soloq_stats;
DROP POLICY IF EXISTS "Allow service role to delete soloq stats" ON public.player_soloq_stats;
DROP POLICY IF EXISTS "Allow service role to insert soloq stats" ON public.player_soloq_stats;

-- 8. Create proper SoloQ stats policies with tenant isolation
CREATE POLICY "Users can view SoloQ stats for their tenant only"
ON public.player_soloq_stats
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM player_soloq_matches psm
    JOIN players p ON psm.player_id = p.id
    WHERE psm.match_id = split_part(player_soloq_stats.match_id, '_', 2)
    AND p.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "Service can manage SoloQ stats"
ON public.player_soloq_stats
FOR ALL
USING (
  auth.role() = 'service_role'
);

CREATE POLICY "Users can insert SoloQ stats for their tenant matches only"
ON public.player_soloq_stats
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM player_soloq_matches psm
    JOIN players p ON psm.player_id = p.id
    WHERE psm.match_id = split_part(player_soloq_stats.match_id, '_', 2)
    AND p.tenant_id = get_user_tenant_id()
  )
);

-- 9. Grant execute permissions on count functions to anon role
GRANT EXECUTE ON FUNCTION public.get_public_player_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_scrim_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_tenant_count() TO anon;