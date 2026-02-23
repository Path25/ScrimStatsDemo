
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export interface ChampionPoolAnalysisParams {
  player_id?: string;
  team_id?: string;
  analysis_type: 'individual' | 'team' | 'meta';
}

export const useChampionPoolAnalysis = (params: ChampionPoolAnalysisParams) => {
  const { user } = useAuth();
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['championPoolAnalysis', params, tenant?.id],
    queryFn: async () => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      const searchParams = new URLSearchParams();
      if (params.player_id) searchParams.set('player_id', params.player_id);
      if (params.team_id) searchParams.set('team_id', params.team_id);
      searchParams.set('type', params.analysis_type);

      const { data, error } = await supabase.functions.invoke('champion-pool-analysis', {
        body: null,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error('Error fetching champion pool analysis:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user && !!tenant?.id && (!!params.player_id || !!params.team_id || params.analysis_type === 'meta'),
  });
};
