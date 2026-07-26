
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { GameDraft, DraftData, DraftMode, DraftTeamSide } from '@/types/scrimGame';

export interface CreateDraftData {
  scrim_game_id: string;
  draft_mode: DraftMode;
  draft_url?: string;
  our_team_side?: DraftTeamSide;
  session_id?: string;
}

export interface UpdateDraftData extends Partial<CreateDraftData> {
  draft_data?: DraftData;
  completed_at?: string;
}

export const useGameDrafts = (gameId?: string) => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: draft, isLoading, error } = useQuery({
    queryKey: ['gameDraft', gameId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id || !gameId) return null;

      const { data, error } = await supabase
        .from('game_drafts')
        .select('*')
        .eq('scrim_game_id', gameId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Safely parse draft_data as DraftData
      const draftData = data.draft_data as unknown as DraftData;

      return {
        ...data,
        draft_data: draftData
      } as GameDraft;
    },
    enabled: !!gameId,
  });

  const createDraftMutation = useMutation({
    mutationFn: async (draftData: CreateDraftData) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      const { data, error } = await supabase
        .from('game_drafts')
        .insert(draftData)
        .select()
        .single();

      if (error) {
        console.error('Error creating game draft:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameDraft'] });
      toast.success('Draft created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create draft:', error);
      toast.error('Failed to create draft. Please try again.');
    },
  });

  const updateDraftMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateDraftData & { id: string }) => {
      // Convert DraftData to JSON for Supabase
      const supabaseUpdateData = {
        ...updateData,
        updated_at: new Date().toISOString(),
        draft_data: updateData.draft_data ? JSON.parse(JSON.stringify(updateData.draft_data)) : undefined,
      };

      const { data, error } = await supabase
        .from('game_drafts')
        .update(supabaseUpdateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating game draft:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameDraft'] });
      toast.success('Draft updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update draft:', error);
      toast.error('Failed to update draft. Please try again.');
    },
  });

  return {
    draft,
    isLoading,
    error,
    createDraft: createDraftMutation.mutate,
    updateDraft: updateDraftMutation.mutate,
    isCreating: createDraftMutation.isPending,
    isUpdating: updateDraftMutation.isPending,
  };
};
