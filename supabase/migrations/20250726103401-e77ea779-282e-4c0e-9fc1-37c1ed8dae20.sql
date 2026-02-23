-- CRITICAL SECURITY FIX: Enable RLS on all public tables
-- This is the most critical vulnerability - all tables currently have RLS disabled

-- Enable RLS on all tables
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.champion_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_draft_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_game_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailing_list_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_rank_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_soloq_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_soloq_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrim_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrim_monitoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrim_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Fix database functions - Add proper search_path protection to prevent schema hijacking
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT tenant_id 
  FROM public.tenant_users 
  WHERE user_id = auth.uid() 
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.user_has_tenant_role(tenant_uuid uuid, required_role tenant_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.tenant_users 
    WHERE user_id = auth.uid() 
      AND tenant_id = tenant_uuid 
      AND role = required_role
  )
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(tenant_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.tenant_users 
    WHERE user_id = auth.uid() 
      AND tenant_id = tenant_uuid
  )
$$;

CREATE OR REPLACE FUNCTION public.user_is_tenant_admin(tenant_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.tenant_users 
    WHERE user_id = auth.uid() 
      AND tenant_id = tenant_uuid 
      AND role IN ('owner', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.check_trial_expired(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT trial_end_date < NOW() AND subscription_tier = 'free' 
     FROM public.subscribers 
     WHERE email = user_email), 
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.get_public_player_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COUNT(*) FROM public.players WHERE is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.get_public_scrim_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COUNT(*) FROM public.scrims;
$$;

CREATE OR REPLACE FUNCTION public.get_public_tenant_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COUNT(*) FROM public.tenants WHERE subscription_status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_subscription_cancellation(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_tenant_id UUID;
BEGIN
  -- Get the user's tenant ID
  SELECT t.id INTO user_tenant_id
  FROM public.tenants t
  JOIN public.tenant_users tu ON t.id = tu.tenant_id
  JOIN public.subscribers s ON tu.user_id = s.user_id
  WHERE s.email = user_email;
  
  IF user_tenant_id IS NOT NULL THEN
    -- Mark tenant as cancelled instead of deleting data immediately
    UPDATE public.tenants 
    SET 
      subscription_status = 'cancelled',
      updated_at = NOW()
    WHERE id = user_tenant_id;
    
    -- Update subscriber record
    UPDATE public.subscribers 
    SET 
      subscribed = false,
      subscription_tier = NULL,
      subscription_end = NOW(),
      updated_at = NOW()
    WHERE email = user_email;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;