import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { ScrimGame, CreateScrimGameData, UpdateScrimGameData, ScrimGameDB, transformScrimGameFromDB } from '@/types/scrimGame';

// Mock games for demo
const MOCK_GAMES: ScrimGame[] = [
    {
        id: 'mock-game-1',
        scrim_id: 'mock-scrim-1',
        game_number: 1,
        status: 'completed',
        side: 'blue',
        result: 'win',
        duration_seconds: 1842,
        our_team_kills: 18,
        enemy_team_kills: 9,
        our_team_gold: 54200,
        enemy_team_gold: 45800,
        objectives: { dragons: [], barons: [], towers: [], inhibitors: [] },
        bans: { our_bans: [], enemy_bans: [] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'mock-game-2',
        scrim_id: 'mock-scrim-1',
        game_number: 2,
        status: 'completed',
        side: 'red',
        result: 'loss',
        duration_seconds: 2156,
        our_team_kills: 11,
        enemy_team_kills: 16,
        our_team_gold: 48300,
        enemy_team_gold: 56100,
        objectives: { dragons: [], barons: [], towers: [], inhibitors: [] },
        bans: { our_bans: [], enemy_bans: [] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'mock-game-3',
        scrim_id: 'mock-scrim-1',
        game_number: 3,
        status: 'completed',
        side: 'blue',
        result: 'win',
        duration_seconds: 1654,
        our_team_kills: 22,
        enemy_team_kills: 7,
        our_team_gold: 58900,
        enemy_team_gold: 41200,
        objectives: { dragons: [], barons: [], towers: [], inhibitors: [] },
        bans: { our_bans: [], enemy_bans: [] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export function useScrimGames(scrimId?: string) {
    const { tenant } = useTenant();
    const queryClient = useQueryClient();

    const { data: scrimGames = [], isLoading } = useQuery({
        queryKey: ['scrim-games', scrimId],
        queryFn: async () => {
            if (!tenant?.id || !scrimId) return MOCK_GAMES;

            const { data, error } = await supabase
                .from('scrim_games')
                .select('*')
                .eq('scrim_id', scrimId)
                .order('game_number', { ascending: true });

            if (error) {
                console.error('Error fetching scrim games:', error);
                return MOCK_GAMES;
            }

            if (!data || data.length === 0) return MOCK_GAMES;

            return data as unknown as ScrimGame[];
        },
        enabled: true,
    });

    const createScrimGame = useMutation({
        mutationFn: async (gameData: CreateScrimGameData) => {
            const { data, error } = await supabase
                .from('scrim_games')
                .insert(gameData)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrim-games', scrimId] });
            toast.success('Game created');
        },
        onError: (err: any) => toast.error(err.message || 'Failed to create game'),
    });

    const updateScrimGame = useMutation({
        mutationFn: async ({ id, ...updates }: UpdateScrimGameData & { id: string }) => {
            const { data, error } = await supabase
                .from('scrim_games')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrim-games', scrimId] });
            toast.success('Game updated');
        },
        onError: (err: any) => toast.error(err.message || 'Failed to update game'),
    });

    const deleteScrimGame = useMutation({
        mutationFn: async (gameId: string) => {
            const { error } = await supabase.from('scrim_games').delete().eq('id', gameId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrim-games', scrimId] });
            toast.success('Game deleted');
        },
        onError: (err: any) => toast.error(err.message || 'Failed to delete game'),
    });

    return {
        scrimGames,
        isLoading,
        createScrimGame: createScrimGame.mutate,
        updateScrimGame: updateScrimGame.mutate,
        deleteScrimGame: deleteScrimGame.mutate,
        isCreating: createScrimGame.isPending,
        isUpdating: updateScrimGame.isPending,
        isDeleting: deleteScrimGame.isPending,
    };
}
