
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface ExternalDraftTool {
  id: string;
  tenant_id: string;
  tool_type: 'championselect' | 'draftlol' | 'custom_webhook';
  tool_name: string;
  api_endpoint?: string;
  api_key?: string;
  webhook_url?: string;
  is_active: boolean;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

export interface DraftImportData {
  blue_picks: Array<{ champion: string; order: number; role?: string; player?: string }>;
  red_picks: Array<{ champion: string; order: number; role?: string; player?: string }>;
  blue_bans: Array<{ champion: string; order: number }>;
  red_bans: Array<{ champion: string; order: number }>;
  phase: 'draft' | 'completed';
  timestamp: string;
}

export const useExternalDraftTools = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: draftTools = [], isLoading } = useQuery({
    queryKey: ['externalDraftTools', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from('external_draft_tools')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching external draft tools:', error);
        throw error;
      }

      return data as ExternalDraftTool[];
    },
    enabled: !!tenant?.id,
  });

  const connectTool = useMutation({
    mutationFn: async (toolData: Omit<ExternalDraftTool, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      // Use the secure function to insert encrypted data
      const { data, error } = await supabase.rpc('insert_external_draft_tool', {
        p_tenant_id: tenant.id,
        p_tool_type: toolData.tool_type,
        p_tool_name: toolData.tool_name,
        p_api_endpoint: toolData.api_endpoint || null,
        p_api_key: toolData.api_key || null,
        p_webhook_url: toolData.webhook_url || null,
        p_is_active: toolData.is_active
      });

      if (error) {
        console.error('Error connecting draft tool:', error);
        throw error;
      }

      return { id: data, ...toolData, tenant_id: tenant.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalDraftTools'] });
      toast.success('Draft tool connected successfully!');
    },
    onError: (error) => {
      console.error('Failed to connect draft tool:', error);
      toast.error('Failed to connect draft tool. Please try again.');
    },
  });

  const disconnectTool = useMutation({
    mutationFn: async (toolId: string) => {
      const { error } = await supabase
        .from('external_draft_tools')
        .delete()
        .eq('id', toolId);

      if (error) {
        console.error('Error disconnecting draft tool:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalDraftTools'] });
      toast.success('Draft tool disconnected successfully!');
    },
    onError: (error) => {
      console.error('Failed to disconnect draft tool:', error);
      toast.error('Failed to disconnect draft tool. Please try again.');
    },
  });

  const importDraftData = useMutation({
    mutationFn: async ({ gameId, toolId }: { gameId: string; toolId: string }) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      const { data, error } = await supabase.functions.invoke('import-draft-data', {
        body: {
          game_id: gameId,
          tool_id: toolId,
          tenant_id: tenant.id
        }
      });

      if (error) {
        console.error('Error importing draft data:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameDraft'] });
      toast.success('Draft data imported successfully!');
    },
    onError: (error) => {
      console.error('Failed to import draft data:', error);
      toast.error('Failed to import draft data. Please try again.');
    },
  });

  return {
    draftTools,
    isLoading,
    connectTool: connectTool.mutate,
    disconnectTool: disconnectTool.mutate,
    importDraftData: importDraftData.mutate,
    isConnecting: connectTool.isPending,
    isDisconnecting: disconnectTool.isPending,
    isImporting: importDraftData.isPending,
  };
};
