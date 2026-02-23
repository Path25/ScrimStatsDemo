-- Fix contact_submissions security vulnerability
-- Add tenant_id column to properly isolate contact submissions by tenant
-- Update RLS policies to restrict admin access to their own tenant only

-- Add tenant_id column to contact_submissions table
ALTER TABLE public.contact_submissions 
ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

-- Create index for better performance on tenant-based queries
CREATE INDEX idx_contact_submissions_tenant_id ON public.contact_submissions(tenant_id);

-- Drop the existing overly permissive admin policy
DROP POLICY IF EXISTS "Allow admin access to contact submissions" ON public.contact_submissions;

-- Create a new secure policy that only allows admins to see their own tenant's submissions
CREATE POLICY "Allow tenant admin access to own submissions" ON public.contact_submissions
FOR SELECT
USING (
  tenant_id IS NOT NULL AND
  EXISTS (
    SELECT 1 
    FROM tenant_users 
    WHERE tenant_users.user_id = auth.uid() 
      AND tenant_users.tenant_id = contact_submissions.tenant_id
      AND tenant_users.role = ANY (ARRAY['owner'::tenant_role, 'admin'::tenant_role])
  )
);

-- Update the insert policy to require tenant_id for authenticated submissions
DROP POLICY IF EXISTS "Allow public contact form submissions" ON public.contact_submissions;

-- Allow public submissions (for marketing/general contact forms) - these won't have tenant_id
CREATE POLICY "Allow public contact form submissions" ON public.contact_submissions
FOR INSERT
WITH CHECK (
  -- Allow public submissions without tenant_id (for general contact/demo requests)
  tenant_id IS NULL
  OR
  -- Allow authenticated users to submit for their own tenant
  (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 
      FROM tenant_users 
      WHERE tenant_users.user_id = auth.uid() 
        AND tenant_users.tenant_id = contact_submissions.tenant_id
    )
  )
);

-- Create policy for global admins to see all submissions (for the specific admin email)
CREATE POLICY "Allow global admin access to all submissions" ON public.contact_submissions
FOR SELECT
USING (auth.email() = 'pathtoyourdream@gmail.com');