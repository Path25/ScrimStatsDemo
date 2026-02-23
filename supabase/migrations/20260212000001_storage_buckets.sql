-- Phase 1 Storage: Buckets and Policies

-- Insert buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('team-resources', 'team-resources', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('public-resources', 'public-resources', false)
ON CONFLICT (id) DO NOTHING;

-- Avatars: Public Read, Auth Write (Own folder)
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);

-- Team Resources: Private to Tenant
-- Policy assumes objects are stored as "{tenant_id}/{filename}"
CREATE POLICY "Tenant members can view team resources" ON storage.objects
FOR SELECT USING (
  bucket_id = 'team-resources'
  AND EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_users.user_id = auth.uid()
    AND CAST(tenant_users.tenant_id AS TEXT) = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Tenant managers can upload team resources" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'team-resources'
  AND EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_users.user_id = auth.uid()
    AND tenant_users.role IN ('owner', 'manager', 'coach')
    AND CAST(tenant_users.tenant_id AS TEXT) = (storage.foldername(name))[1]
  )
);

-- Public Resources: Read only for Authenticated (Premium check handled in UI/Signer, here just Auth)
CREATE POLICY "Authenticated users can view public resources" ON storage.objects
FOR SELECT USING (
  bucket_id = 'public-resources'
  AND auth.role() = 'authenticated'
);

-- Only service role can upload to public-resources (Admin via Dashboard)
