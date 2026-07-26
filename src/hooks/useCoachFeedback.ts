
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { CoachFeedback } from '@/types/scrimGame';

export interface CreateFeedbackData {
  scrim_game_id: string;
  coach_id: string;
  feedback_type: string;
  player_name?: string | null;
  timestamp_seconds?: number;
  title?: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  is_during_game: boolean;
}

export type UpdateFeedbackData = Partial<CreateFeedbackData>;

export const useCoachFeedback = (gameId?: string) => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: feedback = [], isLoading, error } = useQuery({
    queryKey: ['coachFeedback', gameId, tenant?.id],
    queryFn: async () => {
      if (!gameId) return [];
      const { data, error } = await supabase
        .from('coach_feedback')
        .select('*')
        .eq('scrim_game_id', gameId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CoachFeedback[];
    },
    enabled: !!gameId,
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: CreateFeedbackData) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      const { data, error } = await supabase
        .from('coach_feedback')
        .insert([feedbackData])
        .select()
        .single();

      if (error) {
        console.error('Error creating coach feedback:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachFeedback'] });
      toast.success('Feedback added successfully!');
    },
    onError: (error) => {
      console.error('Failed to create feedback:', error);
      toast.error('Failed to add feedback. Please try again.');
    },
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateFeedbackData & { id: string }) => {
      const updatePayload = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('coach_feedback')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating coach feedback:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachFeedback'] });
      toast.success('Feedback updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update feedback:', error);
      toast.error('Failed to update feedback. Please try again.');
    },
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coach_feedback')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting coach feedback:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachFeedback'] });
      toast.success('Feedback deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete feedback:', error);
      toast.error('Failed to delete feedback. Please try again.');
    },
  });

  return {
    feedback,
    isLoading,
    error,
    createFeedback: createFeedbackMutation.mutate,
    updateFeedback: updateFeedbackMutation.mutate,
    deleteFeedback: deleteFeedbackMutation.mutate,
    isCreating: createFeedbackMutation.isPending,
    isUpdating: updateFeedbackMutation.isPending,
    isDeleting: deleteFeedbackMutation.isPending,
  };
};
