-- Fix remaining database functions that still need search_path protection
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(id uuid, email text, display_name text, created_at timestamp with time zone, avatar_url text, first_name text, last_name text, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  -- Only allow the specific admin email to access this function
  SELECT 
    p.id,
    p.email,
    p.display_name,
    p.created_at,
    p.avatar_url,
    p.first_name,
    p.last_name,
    p.updated_at
  FROM public.profiles p
  WHERE auth.email() = 'pathtoyourdream@gmail.com'
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_all_tenant_users_for_admin()
RETURNS TABLE(user_id uuid, tenant_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  -- Only allow the specific admin email to access this function
  SELECT 
    tu.user_id,
    COUNT(*) as tenant_count
  FROM public.tenant_users tu
  WHERE auth.email() = 'pathtoyourdream@gmail.com'
  GROUP BY tu.user_id;
$$;

CREATE OR REPLACE FUNCTION public.create_tenant_with_owner(_name text, _slug text, _subscription_tier subscription_tier)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _tenant_id uuid;
  _tenant_record jsonb;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if slug is already taken
  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = _slug) THEN
    RAISE EXCEPTION 'Slug already exists';
  END IF;

  -- Create the tenant
  INSERT INTO public.tenants (name, slug, subscription_tier)
  VALUES (_name, _slug, _subscription_tier)
  RETURNING id INTO _tenant_id;

  -- Add the user as owner to tenant_users
  INSERT INTO public.tenant_users (tenant_id, user_id, role)
  VALUES (_tenant_id, auth.uid(), 'owner');

  -- Return the tenant data
  SELECT row_to_json(t) INTO _tenant_record
  FROM (
    SELECT id, name, slug, subscription_tier, subscription_status, created_at, updated_at
    FROM public.tenants 
    WHERE id = _tenant_id
  ) t;

  RETURN _tenant_record;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_subscribers_for_admin()
RETURNS TABLE(id uuid, email text, subscribed boolean, subscription_tier text, trial_expired boolean, created_at timestamp with time zone, updated_at timestamp with time zone, subscription_end timestamp with time zone, trial_end_date timestamp with time zone, stripe_customer_id text, user_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  -- Only allow the specific admin email to access this function
  SELECT 
    s.id,
    s.email,
    s.subscribed,
    s.subscription_tier,
    s.trial_expired,
    s.created_at,
    s.updated_at,
    s.subscription_end,
    s.trial_end_date,
    s.stripe_customer_id,
    s.user_id
  FROM public.subscribers s
  WHERE auth.email() = 'pathtoyourdream@gmail.com';
$$;

CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  display_name_value text;
  first_name_value text;
  last_name_value text;
BEGIN
  -- Get the display name from metadata, fallback to full_name, then email
  display_name_value := new.raw_user_meta_data->>'display_name';
  
  IF display_name_value IS NULL OR trim(display_name_value) = '' THEN
    display_name_value := new.raw_user_meta_data->>'full_name';
  END IF;
  
  IF display_name_value IS NULL OR trim(display_name_value) = '' THEN
    -- Use email prefix as fallback
    display_name_value := split_part(new.email, '@', 1);
  END IF;

  -- Still populate first_name and last_name for backward compatibility
  IF new.raw_user_meta_data->>'full_name' IS NOT NULL THEN
    first_name_value := split_part(trim(new.raw_user_meta_data->>'full_name'), ' ', 1);
    last_name_value := trim(substring(new.raw_user_meta_data->>'full_name' from position(' ' in new.raw_user_meta_data->>'full_name') + 1));
    IF last_name_value = '' THEN
      last_name_value := NULL;
    END IF;
  ELSE
    first_name_value := split_part(new.email, '@', 1);
    last_name_value := NULL;
  END IF;

  -- Insert the profile with display_name
  INSERT INTO public.profiles (id, email, first_name, last_name, display_name)
  VALUES (
    new.id,
    new.email,
    first_name_value,
    last_name_value,
    display_name_value
  );
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE LOG 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;