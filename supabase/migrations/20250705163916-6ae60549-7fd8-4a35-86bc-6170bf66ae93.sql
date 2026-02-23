
-- Remove the problematic column from auth.users (this will fail safely if it doesn't exist)
-- We can't actually modify the auth schema, so we'll focus on fixing the RPC function

-- Update the accept_team_invitation function to remove auth.users modifications
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
  -- Log the invitation token being processed
  RAISE LOG 'Processing invitation token: %', invitation_token;
  
  -- Find valid invitation
  SELECT * INTO invitation_record
  FROM public.team_invitations
  WHERE token = invitation_token
    AND expires_at > now()
    AND accepted_at IS NULL;
    
  IF NOT FOUND THEN
    RAISE LOG 'Invalid or expired invitation for token: %', invitation_token;
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Log invitation details
  RAISE LOG 'Found invitation: tenant_id=%, role=%, email=%', invitation_record.tenant_id, invitation_record.role, invitation_record.email;
  
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE LOG 'User not authenticated for invitation token: %', invitation_token;
    RETURN json_build_object('success', false, 'error', 'User must be authenticated to accept invitation');
  END IF;
  
  -- Get user email to verify it matches invitation
  SELECT email INTO user_record FROM auth.users WHERE id = auth.uid();
  
  -- Log user details
  RAISE LOG 'User email: %, Invitation email: %', user_record.email, invitation_record.email;
  
  IF user_record.email != invitation_record.email THEN
    RAISE LOG 'Email mismatch: user=%, invitation=%', user_record.email, invitation_record.email;
    RETURN json_build_object('success', false, 'error', 'This invitation was sent to a different email address');
  END IF;
  
  -- Check if user is already a member of this tenant
  IF EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE tenant_id = invitation_record.tenant_id 
      AND user_id = auth.uid()
  ) THEN
    RAISE LOG 'User already member of tenant: user_id=%, tenant_id=%', auth.uid(), invitation_record.tenant_id;
    RETURN json_build_object('success', false, 'error', 'You are already a member of this team');
  END IF;
  
  -- Log before adding user to tenant
  RAISE LOG 'Adding user to tenant: user_id=%, tenant_id=%, role=%', auth.uid(), invitation_record.tenant_id, invitation_record.role;
  
  -- Add user to tenant with explicit role handling for all roles including viewer
  INSERT INTO public.tenant_users (tenant_id, user_id, role, invited_by)
  VALUES (invitation_record.tenant_id, auth.uid(), invitation_record.role::tenant_role, invitation_record.invited_by);
  
  -- Log successful tenant user creation
  RAISE LOG 'Successfully added user to tenant with role: %', invitation_record.role;
  
  -- Mark invitation as accepted
  UPDATE public.team_invitations
  SET accepted_at = now(), updated_at = now()
  WHERE id = invitation_record.id;
  
  -- Log successful completion
  RAISE LOG 'Invitation acceptance completed successfully for user: %, role: %', auth.uid(), invitation_record.role;
  
  RETURN json_build_object(
    'success', true, 
    'tenant_id', invitation_record.tenant_id,
    'role', invitation_record.role,
    'message', 'Successfully joined team with role: ' || invitation_record.role
  );
END;
$$;
