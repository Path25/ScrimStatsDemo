
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { DraftData } from '@/types/scrimGame';

export interface AutoDraftDetectionRequest {
  game_id: string;
  draft_data: DraftData;
  source?: 'external' | 'client' | 'manual';
}

export const useAutoDraftDetection = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const submitDraftData = useMutation({
    mutationFn: async (request: AutoDraftDetectionRequest) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      const { data, error } = await supabase.functions.invoke('auto-draft-detection', {
        body: request
      });

      if (error) {
        console.error('Error submitting draft data:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameDraft'] });
      toast.success('Draft data synchronized successfully!');
    },
    onError: (error) => {
      console.error('Failed to sync draft data:', error);
      toast.error('Failed to sync draft data. Please try again.');
    },
  });

  return {
    submitDraftData: submitDraftData.mutate,
    isSubmitting: submitDraftData.isPending,
    error: submitDraftData.error,
  };
};
