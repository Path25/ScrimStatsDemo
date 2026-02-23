import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

export type OpponentPlayer = Database['public']['Tables']['opponent_players']['Row'];
export type OpponentPlayerInsert = Database['public']['Tables']['opponent_players']['Insert'];
export type OpponentPlayerUpdate = Database['public']['Tables']['opponent_players']['Update'];

// Mock players for the mock teams
const MOCK_PLAYERS: Record<string, OpponentPlayer[]> = {
    'mock-team-1': [
        { id: 'mock-p1', opponent_team_id: 'mock-team-1', summoner_name: 'Yike Jr', role: 'jungle', is_active: true, created_at: '', updated_at: '', external_links: null, notes: 'Aggressive invader.', region: 'EUW', riot_id: 'Yike#EUW' },
        { id: 'mock-p2', opponent_team_id: 'mock-team-1', summoner_name: 'Caps Jr', role: 'mid', is_active: true, created_at: '', updated_at: '', external_links: null, notes: 'High roaming frequency.', region: 'EUW', riot_id: 'Caps#EUW' },
        { id: 'mock-p3', opponent_team_id: 'mock-team-1', summoner_name: 'Mikyx Jr', role: 'support', is_active: true, created_at: '', updated_at: '', external_links: null, notes: 'Engage specialist.', region: 'EUW', riot_id: 'Mikyx#EUW' },
    ],
    'mock-team-2': [
        { id: 'mock-p4', opponent_team_id: 'mock-team-2', summoner_name: 'Noah Jr', role: 'adc', is_active: true, created_at: '', updated_at: '', external_links: null, notes: 'Consistent carry.', region: 'EUW', riot_id: 'Noah#EUW' },
        { id: 'mock-p5', opponent_team_id: 'mock-team-2', summoner_name: 'Oscar Jr', role: 'top', is_active: true, created_at: '', updated_at: '', external_links: null, notes: 'Strong weakside.', region: 'EUW', riot_id: 'Oscar#EUW' },
    ],
    'mock-team-3': [
        { id: 'mock-p6', opponent_team_id: 'mock-team-3', summoner_name: 'Cabochard Jr', role: 'top', is_active: true, created_at: '', updated_at: '', external_links: null, notes: 'Main carry thread.', region: 'EUW', riot_id: 'Cabo#EUW' },
    ]
};

export function useOpponentPlayers(teamId?: string) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['opponent-players', teamId],
        queryFn: async () => {
            if (!teamId) return [];

            // Return mock data for mock teams
            if (teamId.startsWith('mock-')) {
                return MOCK_PLAYERS[teamId] || [];
            }

            const { data, error } = await supabase
                .from('opponent_players')
                .select('*')
                .eq('opponent_team_id', teamId)
                .order('summoner_name');

            if (error) throw error;
            return data as OpponentPlayer[];
        },
        enabled: !!teamId,
    });

    const createPlayer = useMutation({
        mutationFn: async (playerData: OpponentPlayerInsert) => {
            const { data, error } = await supabase
                .from('opponent_players')
                .insert(playerData)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-players', teamId] });
            toast.success('Opponent player added');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add player');
        },
    });

    const updatePlayer = useMutation({
        mutationFn: async ({ id, ...updates }: OpponentPlayerUpdate & { id: string }) => {
            if (id.startsWith('mock-')) {
                toast.info("Demo Mode: Simulated player update.");
                return updates as OpponentPlayer;
            }

            const { data, error } = await supabase
                .from('opponent_players')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-players', teamId] });
            toast.success('Opponent player updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update player');
        },
    });

    const deletePlayer = useMutation({
        mutationFn: async (id: string) => {
            if (id.startsWith('mock-')) {
                toast.info("Demo Mode: Simulated player deletion.");
                return;
            }

            const { error } = await supabase
                .from('opponent_players')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-players', teamId] });
            toast.success('Opponent player deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete player');
        },
    });

    return {
        data,
        isLoading,
        error,
        createPlayer: createPlayer.mutateAsync,
        updatePlayer: updatePlayer.mutateAsync,
        deletePlayer: deletePlayer.mutateAsync,
    };
}
