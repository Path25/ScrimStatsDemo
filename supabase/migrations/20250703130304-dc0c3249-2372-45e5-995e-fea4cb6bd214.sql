
-- Add a field to track invitation-based signups that should skip email confirmation
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_confirmed_via_invitation boolean DEFAULT false;

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_users_email_confirmed_via_invitation ON auth.users(email_confirmed_via_invitation);

-- Update the accept_team_invitation function to handle direct acceptance
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  user_record RECORD;
  result JSON;
BEGIN
  -- Find valid invitation
  SELECT * INTO invitation_record
  FROM public.team_invitations
  WHERE token = invitation_token
    AND expires_at > now()
    AND accepted_at IS NULL;
    
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User must be authenticated to accept invitation');
  END IF;
  
  -- Get user email to verify it matches invitation
  SELECT email INTO user_record FROM auth.users WHERE id = auth.uid();
  
  IF user_record.email != invitation_record.email THEN
    RETURN json_build_object('success', false, 'error', 'This invitation was sent to a different email address');
  END IF;
  
  -- Check if user is already a member of this tenant
  IF EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE tenant_id = invitation_record.tenant_id 
      AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('success', false, 'error', 'You are already a member of this team');
  END IF;
  
  -- Add user to tenant
  INSERT INTO public.tenant_users (tenant_id, user_id, role, invited_by)
  VALUES (invitation_record.tenant_id, auth.uid(), invitation_record.role, invitation_record.invited_by);
  
  -- Mark invitation as accepted
  UPDATE public.team_invitations
  SET accepted_at = now(), updated_at = now()
  WHERE id = invitation_record.id;
  
  -- Mark user as email confirmed via invitation (skip email confirmation)
  UPDATE auth.users 
  SET email_confirmed_via_invitation = true,
      email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE id = auth.uid();
  
  RETURN json_build_object(
    'success', true, 
    'tenant_id', invitation_record.tenant_id,
    'role', invitation_record.role
  );
END;
$$;
