-- Fix RLS policy vulnerability in subscribers table
-- The current policy allows access via user_id OR email, which could expose other users' data
-- We'll restrict to only allow access via user_id for better security

-- Drop the existing policy
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

-- Create a new, more secure policy that only allows access via user_id
CREATE POLICY "select_own_subscription_secure" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid());

-- Also update the update policy to be more restrictive
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create a more secure update policy - only allow updates via user_id match
CREATE POLICY "update_own_subscription_secure" ON public.subscribers  
FOR UPDATE
USING (user_id = auth.uid());