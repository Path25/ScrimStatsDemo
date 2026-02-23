import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

export type OpponentChampionPool = Database['public']['Tables']['opponent_champion_pools']['Row'];
export type OpponentChampionPoolInsert = Database['public']['Tables']['opponent_champion_pools']['Insert'];
export type OpponentChampionPoolUpdate = Database['public']['Tables']['opponent_champion_pools']['Update'];

export function useOpponentChampionPools(playerId?: string) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['opponent-champion-pools', playerId],
        queryFn: async () => {
            if (!playerId) return [];
            const { data, error } = await supabase
                .from('opponent_champion_pools')
                .select('*')
                .eq('opponent_player_id', playerId)
                .order('games_played', { ascending: false });

            if (error) throw error;
            return data as OpponentChampionPool[];
        },
        enabled: !!playerId,
    });

    const createChampionPoolEntry = useMutation({
        mutationFn: async (poolData: OpponentChampionPoolInsert) => {
            const { data, error } = await supabase
                .from('opponent_champion_pools')
                .insert(poolData)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-champion-pools', playerId] });
            toast.success('Champion pool entry added');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add entry');
        },
    });

    const updateChampionPoolEntry = useMutation({
        mutationFn: async ({ id, ...updates }: OpponentChampionPoolUpdate & { id: string }) => {
            const { data, error } = await supabase
                .from('opponent_champion_pools')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-champion-pools', playerId] });
            toast.success('Champion pool entry updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update entry');
        },
    });

    const deleteChampionPoolEntry = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('opponent_champion_pools')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-champion-pools', playerId] });
            toast.success('Champion pool entry deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete entry');
        },
    });

    return {
        data,
        isLoading,
        error,
        createChampionPoolEntry: createChampionPoolEntry.mutateAsync,
        updateChampionPoolEntry: updateChampionPoolEntry.mutateAsync,
        deleteChampionPoolEntry: deleteChampionPoolEntry.mutateAsync,
    };
}
