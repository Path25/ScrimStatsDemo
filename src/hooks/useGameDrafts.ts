
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

const MOCK_DRAFT: GameDraft = {
  id: 'mock-draft',
  scrim_game_id: 'mock',
  draft_mode: 'client',
  our_team_side: 'blue',
  draft_data: {
    phase: 'completed',
    completed: true,
    picks: [
      { order: 1, team: 'blue', champion: 'Azir', role: 'mid' },
      { order: 2, team: 'red', champion: 'Orianna', role: 'mid' },
      { order: 3, team: 'red', champion: 'Lee Sin', role: 'jungle' },
      { order: 4, team: 'blue', champion: 'Viego', role: 'jungle' },
      { order: 5, team: 'blue', champion: "K'Sante", role: 'top' },
      { order: 6, team: 'red', champion: 'Renekton', role: 'top' },
      { order: 7, team: 'red', champion: 'Xayah', role: 'adc' },
      { order: 8, team: 'blue', champion: "Kai'Sa", role: 'adc' },
      { order: 9, team: 'blue', champion: 'Rell', role: 'support' },
      { order: 10, team: 'red', champion: 'Rakan', role: 'support' },
    ],
    bans: [
      { order: 1, team: 'blue', champion: 'LeBlanc' },
      { order: 2, team: 'red', champion: 'Sylas' },
      { order: 3, team: 'blue', champion: 'Maokai' },
      { order: 4, team: 'red', champion: 'Sejuani' },
      { order: 5, team: 'blue', champion: 'Jax' },
      { order: 6, team: 'red', champion: 'Fiora' },
    ]
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const useGameDrafts = (gameId?: string) => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: draft, isLoading, error } = useQuery({
    queryKey: ['gameDraft', gameId, tenant?.id],
    queryFn: async () => {
      if (gameId?.startsWith('mock') || !tenant?.id || !gameId) return MOCK_DRAFT;

      const { data, error } = await supabase
        .from('game_drafts')
        .select('*')
        .eq('scrim_game_id', gameId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching game draft:', error);
        return MOCK_DRAFT;
      }

      if (!data) return MOCK_DRAFT;

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
