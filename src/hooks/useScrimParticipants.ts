import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type { ScrimParticipant, ScrimParticipantDB } from '@/types/scrimGame';
import { transformParticipantFromDB } from '@/types/scrimGame';

export interface CreateParticipantData {
  scrim_game_id: string;
  player_id?: string;
  summoner_name: string;
  champion_name?: string;
  role?: 'top' | 'jungle' | 'mid' | 'adc' | 'support';
  is_our_team: boolean;
}

export interface UpdateParticipantData extends Partial<CreateParticipantData> {
  kills?: number;
  deaths?: number;
  assists?: number;
  cs?: number;
  gold?: number;
  damage_dealt?: number;
  damage_taken?: number;
  vision_score?: number;
  items?: Json;
  runes?: Json;
  summoner_spells?: Json;
  level?: number;
}

export const useScrimParticipants = (gameId?: string) => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  async function assertGameInActiveTenant(targetGameId: string) {
    if (!tenant?.id) throw new Error('No active team workspace');
    const { data, error } = await supabase
      .from('scrim_games')
      .select('id, scrims!inner(tenant_id)')
      .eq('id', targetGameId)
      .eq('scrims.tenant_id', tenant.id)
      .maybeSingle();
    if (error || !data) throw error || new Error('The game is not available in this workspace');
  }

  const { data: participants = [], isLoading, error } = useQuery({
    queryKey: ['scrimParticipants', gameId, tenant?.id],
    queryFn: async () => {
      if (!gameId) return [];

      try {
        const { data, error } = await supabase
          .from('scrim_participants')
          .select('*, scrim_games!inner(scrims!inner(tenant_id))')
          .eq('scrim_game_id', gameId)
          .eq('scrim_games.scrims.tenant_id', tenant?.id)
          .order('role', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) return [];

        // Transform the data from DB format to application format
        const transformedParticipants = (data as ScrimParticipantDB[]).map(transformParticipantFromDB);

        return transformedParticipants;
      } catch (err) {
        console.error('Unexpected error in useScrimParticipants:', err);
        throw err;
      }
    },
    enabled: !!gameId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const createParticipantMutation = useMutation({
    mutationFn: async (participantData: CreateParticipantData) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }
      if (!gameId || participantData.scrim_game_id !== gameId) {
        throw new Error('Participant changes must target the active game');
      }
      await assertGameInActiveTenant(gameId);

      const { data, error } = await supabase
        .from('scrim_participants')
        .insert([{ ...participantData, tenant_id: tenant.id }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrimParticipants'] });
      toast.success('Participant added successfully!');
    },
    onError: (error) => {
      toast.error('Failed to add participant. Please try again.');
    },
  });

  const createMultipleParticipantsMutation = useMutation({
    mutationFn: async (participantsData: CreateParticipantData[]) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }
      if (
        !gameId
        || participantsData.some((participant) => participant.scrim_game_id !== gameId)
      ) {
        throw new Error('Participant changes must target the active game');
      }
      await assertGameInActiveTenant(gameId);

      const { data, error } = await supabase
        .from('scrim_participants')
        .insert(participantsData.map((participant) => ({ ...participant, tenant_id: tenant.id })))
        .select();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrimParticipants'] });
    },
    onError: (error) => {
      console.error('Failed to create participants:', error);
    },
  });

  const updateParticipantMutation = useMutation({
    mutationFn: async ({ id, scrim_game_id: _ignoredGameId, ...updateData }: UpdateParticipantData & { id: string }) => {
      if (!gameId) throw new Error('An active game is required');
      await assertGameInActiveTenant(gameId);
      const { data, error } = await supabase
        .from('scrim_participants')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('scrim_game_id', gameId)
        .select()
        .single();

      if (error) {
        console.error('Error updating participant:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrimParticipants'] });
      toast.success('Participant updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update participant:', error);
      toast.error('Failed to update participant. Please try again.');
    },
  });

  const deleteParticipantMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!gameId) throw new Error('An active game is required');
      await assertGameInActiveTenant(gameId);
      const { error } = await supabase
        .from('scrim_participants')
        .delete()
        .eq('id', id)
        .eq('scrim_game_id', gameId);

      if (error) {
        console.error('Error deleting participant:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrimParticipants'] });
      toast.success('Participant removed successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete participant:', error);
      toast.error('Failed to remove participant. Please try again.');
    },
  });

  return {
    participants,
    isLoading,
    error,
    createParticipant: createParticipantMutation.mutate,
    createMultipleParticipants: createMultipleParticipantsMutation.mutate,
    updateParticipant: updateParticipantMutation.mutate,
    deleteParticipant: deleteParticipantMutation.mutate,
    isCreating: createParticipantMutation.isPending,
    isUpdating: updateParticipantMutation.isPending,
    isDeleting: deleteParticipantMutation.isPending,
  };
};
