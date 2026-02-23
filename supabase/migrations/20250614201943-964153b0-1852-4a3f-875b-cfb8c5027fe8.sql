
-- Create external_draft_tools table
CREATE TABLE public.external_draft_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('championselect', 'draftlol', 'custom_webhook')),
  tool_name TEXT NOT NULL,
  api_endpoint TEXT,
  api_key TEXT,
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.external_draft_tools ENABLE ROW LEVEL SECURITY;

-- Create policies for external_draft_tools
CREATE POLICY "Users can view their tenant's external draft tools" 
  ON public.external_draft_tools 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_users.tenant_id = external_draft_tools.tenant_id 
      AND tenant_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create external draft tools for their tenant" 
  ON public.external_draft_tools 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_users.tenant_id = external_draft_tools.tenant_id 
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can update their tenant's external draft tools" 
  ON public.external_draft_tools 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_users.tenant_id = external_draft_tools.tenant_id 
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete their tenant's external draft tools" 
  ON public.external_draft_tools 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_users.tenant_id = external_draft_tools.tenant_id 
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

-- Create index for performance
CREATE INDEX idx_external_draft_tools_tenant_id ON public.external_draft_tools(tenant_id);
