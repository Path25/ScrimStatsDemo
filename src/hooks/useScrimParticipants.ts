import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
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
  items?: any[];
  runes?: any;
  summoner_spells?: any[];
  level?: number;
}

const MOCK_PARTICIPANTS: ScrimParticipant[] = [
  // Our Team (Blue)
  { id: 'p1', scrim_game_id: 'mock', summoner_name: 'Theory', champion_name: 'Azir', role: 'mid', kills: 8, deaths: 2, assists: 12, cs: 284, gold: 15400, damage_dealt: 28400, damage_taken: 12000, vision_score: 32, items: [], runes: { primary_tree: '', secondary_tree: '', runes: [], stat_mods: [] }, summoner_spells: [], level: 18, is_our_team: true, created_at: '', updated_at: '' },
  { id: 'p2', scrim_game_id: 'mock', summoner_name: 'Vortex', champion_name: 'Viego', role: 'jungle', kills: 6, deaths: 3, assists: 10, cs: 182, gold: 13200, damage_dealt: 18200, damage_taken: 24000, vision_score: 45, items: [], runes: { primary_tree: '', secondary_tree: '', runes: [], stat_mods: [] }, summoner_spells: [], level: 17, is_our_team: true, created_at: '', updated_at: '' },
  { id: 'p3', scrim_game_id: 'mock', summoner_name: 'Shield', champion_name: "K'Sante", role: 'top', kills: 2, deaths: 1, assists: 15, cs: 245, gold: 12800, damage_dealt: 14500, damage_taken: 42000, vision_score: 28, items: [], runes: { primary_tree: '', secondary_tree: '', runes: [], stat_mods: [] }, summoner_spells: [], level: 18, is_our_team: true, created_at: '', updated_at: '' },
  { id: 'p4', scrim_game_id: 'mock', summoner_name: 'Pulse', champion_name: "Kai'Sa", role: 'adc', kills: 12, deaths: 2, assists: 6, cs: 312, gold: 17200, damage_dealt: 38200, damage_taken: 11000, vision_score: 18, items: [], runes: { primary_tree: '', secondary_tree: '', runes: [], stat_mods: [] }, summoner_spells: [], level: 18, is_our_team: true, created_at: '', updated_at: '' },
  { id: 'p5', scrim_game_id: 'mock', summoner_name: 'Aura', champion_name: 'Rell', role: 'support', kills: 1, deaths: 4, assists: 22, cs: 42, gold: 8400, damage_dealt: 5200, damage_taken: 28000, vision_score: 84, items: [], runes: { primary_tree: '', secondary_tree: '', runes: [], stat_mods: [] }, summoner_spells: [], level: 15, is_our_team: true, created_at: '', updated_at: '' },
  // Enemy Team (Red)
  { id: 'p6', scrim_game_id: 'mock', summoner_name: 'Caps', champion_name: 'Orianna', role: 'mid', kills: 3, deaths: 7, assists: 4, cs: 265, gold: 13200, damage_dealt: 22000, damage_taken: 15000, vision_score: 28, items: [], runes: { primary_tree: '', secondary_tree: '', runes: [], stat_mods: [] }, summoner_spells: [], level: 17, is_our_team: false, created_at: '', updated_at: '' },
  { id: 'p7', scrim_game_id: 'mock', summoner_name: 'Yike', champion_name: 'Lee Sin', role: 'jungle', kills: 4, deaths: 6, assists: 8, cs: 165, gold: 11800, damage_dealt: 12500, damage_taken: 32000, vision_score: 38, items: [], runes: { primary_tree: '', secondary_tree: '', runes: [], stat_mods: [] }, summoner_spells: [], level: 16, is_our_team: false, created_at: '', updated_at: '' },
  { id: 'p8', scrim_game_id: 'mock', summoner_name: 'BrokenBlade', champion_name: 'Renekton', role: 'top', kills: 2, deaths: 5, assists: 3, cs: 228, gold: 12100, damage_dealt: 16800, damage_taken: 38000, vision_score: 22, items: [], runes: { primary_tree: '', secondary_tree: '', runes: [], stat_mods: [] }, summoner_spells: [], level: 17, is_our_team: false, created_at: '', updated_at: '' },
  { id: 'p9', scrim_game_id: 'mock', summoner_name: 'Hans Sama', champion_name: 'Xayah', role: 'adc', kills: 0, deaths: 9, assists: 5, cs: 295, gold: 14500, damage_dealt: 24500, damage_taken: 14000, vision_score: 15, items: [], runes: { primary_tree: '', secondary_tree: '', runes: [], stat_mods: [] }, summoner_spells: [], level: 17, is_our_team: false, created_at: '', updated_at: '' },
  { id: 'p10', scrim_game_id: 'mock', summoner_name: 'Mikyx', champion_name: 'Rakan', role: 'support', kills: 0, deaths: 12, assists: 11, cs: 38, gold: 7800, damage_dealt: 4800, damage_taken: 26000, vision_score: 72, items: [], runes: { primary_tree: '', secondary_tree: '', runes: [], stat_mods: [] }, summoner_spells: [], level: 14, is_our_team: false, created_at: '', updated_at: '' },
];

export const useScrimParticipants = (gameId?: string) => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: participants = [], isLoading, error } = useQuery({
    queryKey: ['scrimParticipants', gameId, tenant?.id],
    queryFn: async () => {
      // Always return mock data for mock IDs or if no gameId provided (for demo)
      if (!gameId || gameId.startsWith('mock')) {
        console.log('Returning MOCK_PARTICIPANTS for gameId:', gameId);
        return MOCK_PARTICIPANTS;
      }

      try {
        const { data, error } = await supabase
          .from('scrim_participants')
          .select('*')
          .eq('scrim_game_id', gameId)
          .order('role', { ascending: true });

        if (error) {
          console.error('Error fetching scrim participants:', error);
          return MOCK_PARTICIPANTS;
        }

        if (!data || data.length === 0) {
          console.log('No participants found in DB, returning MOCK_PARTICIPANTS');
          return MOCK_PARTICIPANTS;
        }

        // Transform the data from DB format to application format
        let transformedParticipants = (data as ScrimParticipantDB[]).map(transformParticipantFromDB);

        // If we don't have sufficient participant data, try to get it from external game data
        if (transformedParticipants.length < 5 || transformedParticipants.some(p => p.summoner_name === 'Unknown Player')) {
          console.log('Insufficient participant data in database, checking for external data');

          const { data: gameData, error: gameError } = await supabase
            .from('scrim_games')
            .select('external_game_data')
            .eq('id', gameId)
            .single();

          if (!gameError && gameData?.external_game_data) {
            const externalData = gameData.external_game_data as any;
            if (externalData?.post_game_data) {
              const { extractParticipantsFromExternalData } = await import('@/utils/gameDataTransform');
              const externalParticipants = extractParticipantsFromExternalData(gameData as any);

              if (externalParticipants.length > transformedParticipants.length) {
                transformedParticipants = externalParticipants;
              }
            }
          }
        }

        return transformedParticipants;
      } catch (err) {
        console.error('Unexpected error in useScrimParticipants:', err);
        return MOCK_PARTICIPANTS;
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

      const { data, error } = await supabase
        .from('scrim_participants')
        .insert([participantData])
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

      const { data, error } = await supabase
        .from('scrim_participants')
        .insert(participantsData)
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
    mutationFn: async ({ id, ...updateData }: UpdateParticipantData & { id: string }) => {
      const { data, error } = await supabase
        .from('scrim_participants')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
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
      const { error } = await supabase
        .from('scrim_participants')
        .delete()
        .eq('id', id);

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
