-- Create functions for encrypting and decrypting sensitive data
-- This uses Postgres built-in encryption functions with a key derived from the Supabase service role key

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Use a hash of the service role key as encryption key
  encryption_key := encode(digest(current_setting('app.settings.service_role_key', true), 'sha256'), 'hex');
  
  -- Return encrypted data using pgcrypto
  RETURN encode(encrypt(data::bytea, encryption_key::bytea, 'aes'), 'base64');
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if encryption fails
    RETURN NULL;
END;
$$;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Use the same hash of the service role key
  encryption_key := encode(digest(current_setting('app.settings.service_role_key', true), 'sha256'), 'hex');
  
  -- Return decrypted data
  RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if decryption fails
    RETURN NULL;
END;
$$;

-- Add new encrypted columns to external_draft_tools table
ALTER TABLE public.external_draft_tools 
ADD COLUMN api_key_encrypted text,
ADD COLUMN webhook_url_encrypted text;

-- Migrate existing data to encrypted columns
UPDATE public.external_draft_tools 
SET 
  api_key_encrypted = CASE 
    WHEN api_key IS NOT NULL AND api_key != '' 
    THEN public.encrypt_sensitive_data(api_key) 
    ELSE NULL 
  END,
  webhook_url_encrypted = CASE 
    WHEN webhook_url IS NOT NULL AND webhook_url != '' 
    THEN public.encrypt_sensitive_data(webhook_url) 
    ELSE NULL 
  END
WHERE api_key IS NOT NULL OR webhook_url IS NOT NULL;

-- Drop the old plaintext columns
ALTER TABLE public.external_draft_tools 
DROP COLUMN api_key,
DROP COLUMN webhook_url;

-- Rename encrypted columns to original names
ALTER TABLE public.external_draft_tools 
RENAME COLUMN api_key_encrypted TO api_key;
ALTER TABLE public.external_draft_tools 
RENAME COLUMN webhook_url_encrypted TO webhook_url;

-- Create a view that automatically decrypts data for authorized users
CREATE OR REPLACE VIEW public.external_draft_tools_decrypted AS
SELECT 
  id,
  tenant_id,
  tool_type,
  tool_name,
  api_endpoint,
  CASE 
    WHEN api_key IS NOT NULL 
    THEN public.decrypt_sensitive_data(api_key) 
    ELSE NULL 
  END as api_key,
  CASE 
    WHEN webhook_url IS NOT NULL 
    THEN public.decrypt_sensitive_data(webhook_url) 
    ELSE NULL 
  END as webhook_url,
  is_active,
  last_sync,
  created_at,
  updated_at
FROM public.external_draft_tools;

-- Grant access to the decrypted view with same RLS policies as the original table
ALTER VIEW public.external_draft_tools_decrypted OWNER TO postgres;

-- Enable RLS on the view (inherits from base table policies)
-- Create RLS policies for the decrypted view that match the original table
CREATE POLICY "Users can view their tenant's external draft tools decrypted" 
ON public.external_draft_tools_decrypted 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM tenant_users
    WHERE tenant_users.tenant_id = external_draft_tools_decrypted.tenant_id 
    AND tenant_users.user_id = auth.uid()
  )
);

-- Create functions for secure insert/update operations
CREATE OR REPLACE FUNCTION public.insert_external_draft_tool(
  p_tenant_id uuid,
  p_tool_type text,
  p_tool_name text,
  p_api_endpoint text DEFAULT NULL,
  p_api_key text DEFAULT NULL,
  p_webhook_url text DEFAULT NULL,
  p_is_active boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Check if user has permission to create tools for this tenant
  IF NOT EXISTS (
    SELECT 1 FROM tenant_users 
    WHERE tenant_id = p_tenant_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.external_draft_tools (
    tenant_id,
    tool_type,
    tool_name,
    api_endpoint,
    api_key,
    webhook_url,
    is_active
  ) VALUES (
    p_tenant_id,
    p_tool_type,
    p_tool_name,
    p_api_endpoint,
    CASE 
      WHEN p_api_key IS NOT NULL AND p_api_key != '' 
      THEN public.encrypt_sensitive_data(p_api_key) 
      ELSE NULL 
    END,
    CASE 
      WHEN p_webhook_url IS NOT NULL AND p_webhook_url != '' 
      THEN public.encrypt_sensitive_data(p_webhook_url) 
      ELSE NULL 
    END,
    p_is_active
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Create function for secure updates
CREATE OR REPLACE FUNCTION public.update_external_draft_tool(
  p_id uuid,
  p_tool_name text DEFAULT NULL,
  p_api_endpoint text DEFAULT NULL,
  p_api_key text DEFAULT NULL,
  p_webhook_url text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if user has permission to update this tool
  IF NOT EXISTS (
    SELECT 1 FROM external_draft_tools edt
    JOIN tenant_users tu ON edt.tenant_id = tu.tenant_id
    WHERE edt.id = p_id 
    AND tu.user_id = auth.uid() 
    AND tu.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.external_draft_tools 
  SET 
    tool_name = COALESCE(p_tool_name, tool_name),
    api_endpoint = COALESCE(p_api_endpoint, api_endpoint),
    api_key = CASE 
      WHEN p_api_key IS NOT NULL 
      THEN CASE 
        WHEN p_api_key = '' THEN NULL 
        ELSE public.encrypt_sensitive_data(p_api_key) 
      END
      ELSE api_key 
    END,
    webhook_url = CASE 
      WHEN p_webhook_url IS NOT NULL 
      THEN CASE 
        WHEN p_webhook_url = '' THEN NULL 
        ELSE public.encrypt_sensitive_data(p_webhook_url) 
      END
      ELSE webhook_url 
    END,
    is_active = COALESCE(p_is_active, is_active),
    updated_at = now()
  WHERE id = p_id;

  RETURN true;
END;
$$;