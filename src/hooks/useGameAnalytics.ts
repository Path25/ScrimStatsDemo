
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export interface GameAnalyticsParams {
  game_id: string;
  analysis_type?: 'summary' | 'draft' | 'performance' | 'timeline';
}

export const useGameAnalytics = (params: GameAnalyticsParams) => {
  const { user } = useAuth();
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['gameAnalytics', params.game_id, params.analysis_type, tenant?.id],
    queryFn: async () => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      console.log('Fetching game analytics for:', params);

      const { data, error } = await supabase.functions.invoke('game-analytics', {
        body: {
          game_id: params.game_id,
          analysis_type: params.analysis_type || 'summary'
        },
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error('Error fetching game analytics:', error);
        throw error;
      }

      console.log('Game analytics response:', data);
      return data;
    },
    enabled: !!user && !!tenant?.id && !!params.game_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
