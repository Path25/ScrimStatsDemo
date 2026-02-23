
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface DraftIntelligenceRequest {
  team_id: string;
  current_draft_state: any;
  analysis_type?: 'recommendations' | 'counter_picks' | 'ban_suggestions' | 'team_composition';
}

export interface DraftAnalysisParams {
  gameId: string;
  draftData: any;
  ourTeamSide: 'blue' | 'red';
}

export const useDraftIntelligence = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const getDraftIntelligence = useMutation({
    mutationFn: async (params: DraftAnalysisParams) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      // Transform our parameters to match the expected API format
      const request: DraftIntelligenceRequest = {
        team_id: tenant.id,
        current_draft_state: params.draftData,
        analysis_type: 'team_composition'
      };

      const { data, error } = await supabase.functions.invoke('draft-intelligence', {
        body: request
      });

      if (error) {
        console.error('Error getting draft intelligence:', error);
        throw error;
      }

      return data;
    },
    onError: (error) => {
      console.error('Failed to get draft intelligence:', error);
      toast.error('Failed to get draft intelligence. Please try again.');
    },
  });

  return {
    getDraftIntelligence: getDraftIntelligence.mutate,
    isLoading: getDraftIntelligence.isPending,
    data: getDraftIntelligence.data,
    error: getDraftIntelligence.error,
  };
};
