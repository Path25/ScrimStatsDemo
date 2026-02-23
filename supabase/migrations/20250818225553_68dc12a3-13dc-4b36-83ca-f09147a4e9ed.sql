-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create functions for encrypting and decrypting sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF data IS NULL OR data = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use a fixed key derived from a known value for consistency
  encryption_key := 'scrimstats_encryption_key_2024';
  
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
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use the same fixed key
  encryption_key := 'scrimstats_encryption_key_2024';
  
  -- Return decrypted data
  RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    -- Return original data if decryption fails (for migration purposes)
    RETURN encrypted_data;
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
  END;

-- Drop the old plaintext columns
ALTER TABLE public.external_draft_tools 
DROP COLUMN api_key,
DROP COLUMN webhook_url;

-- Rename encrypted columns to original names
ALTER TABLE public.external_draft_tools 
RENAME COLUMN api_key_encrypted TO api_key;
ALTER TABLE public.external_draft_tools 
RENAME COLUMN webhook_url_encrypted TO webhook_url;

-- Create secure functions for insert/update operations
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
    public.encrypt_sensitive_data(p_api_key),
    public.encrypt_sensitive_data(p_webhook_url),
    p_is_active
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Create function to get decrypted external draft tools for edge functions
CREATE OR REPLACE FUNCTION public.get_external_draft_tool_decrypted(p_tool_id uuid, p_tenant_id uuid)
RETURNS TABLE(
  id uuid,
  tenant_id uuid,
  tool_type text,
  tool_name text,
  api_endpoint text,
  api_key text,
  webhook_url text,
  is_active boolean,
  last_sync timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    edt.id,
    edt.tenant_id,
    edt.tool_type,
    edt.tool_name,
    edt.api_endpoint,
    public.decrypt_sensitive_data(edt.api_key) as api_key,
    public.decrypt_sensitive_data(edt.webhook_url) as webhook_url,
    edt.is_active,
    edt.last_sync,
    edt.created_at,
    edt.updated_at
  FROM public.external_draft_tools edt
  WHERE edt.id = p_tool_id AND edt.tenant_id = p_tenant_id;
END;
$$;