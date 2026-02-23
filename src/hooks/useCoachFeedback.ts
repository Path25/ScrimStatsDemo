
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

export interface UpdateFeedbackData extends Partial<CreateFeedbackData> { }

const MOCK_FEEDBACK: CoachFeedback[] = [
  {
    id: 'f1',
    scrim_game_id: 'mock',
    coach_id: 'coach1',
    feedback_type: 'General',
    player_name: 'Theory',
    timestamp_seconds: 420,
    title: 'Mid lane priority',
    content: 'Great rotate at 7:00 to help with Crab. Azir spacing was excellent.',
    priority: 'medium',
    tags: ['Positioning', 'Tactical'],
    is_during_game: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'f2',
    scrim_game_id: 'mock',
    coach_id: 'coach1',
    feedback_type: 'Objective',
    player_name: 'Vortex',
    timestamp_seconds: 1340,
    title: 'Baron Setup',
    content: 'Viego pathing around Baron pit was a bit exposed. Need to wait for Shield to lead.',
    priority: 'high',
    tags: ['Objective Control', 'Teamfight'],
    is_during_game: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'f3',
    scrim_game_id: 'mock',
    coach_id: 'coach1',
    feedback_type: 'Communications',
    player_name: 'Pulse',
    timestamp_seconds: 960,
    title: 'Dive Coordination',
    content: 'Clean dive bot lane. Kai\'Sa ult timing was perfect for the reset.',
    priority: 'low',
    tags: ['Communication', 'Execution'],
    is_during_game: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useCoachFeedback = (gameId?: string) => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: feedback = [], isLoading, error } = useQuery({
    queryKey: ['coachFeedback', gameId, tenant?.id],
    queryFn: async () => {
      if (!gameId || gameId.startsWith('mock')) return MOCK_FEEDBACK;

      try {
        const { data, error } = await supabase
          .from('coach_feedback')
          .select('*')
          .eq('scrim_game_id', gameId)
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          return MOCK_FEEDBACK;
        }

        return data as CoachFeedback[];
      } catch (err) {
        return MOCK_FEEDBACK;
      }
    },
    enabled: !!gameId,
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: CreateFeedbackData) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      console.log('Creating feedback with data:', feedbackData);

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
      console.log('Updating feedback with ID:', id, 'and data:', updateData);

      const updatePayload = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      console.log('Final update payload:', updatePayload);

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

      console.log('Successfully updated feedback:', data);
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
