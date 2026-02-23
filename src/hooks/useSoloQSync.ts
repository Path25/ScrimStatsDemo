
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTenant } from '@/contexts/TenantContext';

export function useSoloQSync() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const syncPlayerData = useMutation({
    mutationFn: async (playerId: string) => {
      if (!tenant?.settings?.riot_api_key) {
        throw new Error('Riot API key not configured');
      }

      const { data, error } = await supabase.functions.invoke('sync-soloq-data', {
        body: {
          playerId,
          apiKey: tenant.settings.riot_api_key,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data, playerId) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['player-soloq-data', playerId] });
      toast.success(`Successfully synced SoloQ data for ${data.summonerName}`);
    },
    onError: (error: any) => {
      console.error('SoloQ sync failed:', error);
      toast.error(error.message || 'Failed to sync SoloQ data');
    },
  });

  return {
    syncPlayerData: syncPlayerData.mutate,
    isSyncing: syncPlayerData.isPending,
  };
}
