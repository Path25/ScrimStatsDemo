import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type {
    ScrimGame,
    ScrimGameDB,
    CreateScrimGameData,
    UpdateScrimGameData,
    GameResult,
    GameSide,
    GameStatus,
} from '@/types/scrimGame';
import { transformScrimGameFromDB } from '@/types/scrimGame';

export interface SaveGameReviewInput {
    id?: string;
    gameNumber: number;
    status: GameStatus;
    side: GameSide | null;
    result: GameResult | null;
    durationSeconds: number | null;
    ourTeamKills: number | null;
    enemyTeamKills: number | null;
    ourTeamGold: number | null;
    enemyTeamGold: number | null;
    performanceRating: number | null;
    performanceSummary: string | null;
    earlyGameRating: number | null;
    midGameRating: number | null;
    lateGameRating: number | null;
    notes: string | null;
}

function errorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

export function useScrimGames(scrimId?: string) {
    const { tenant } = useTenant();
    const queryClient = useQueryClient();

    const { data: scrimGames = [], isLoading, error } = useQuery({
        queryKey: ['scrim-games', tenant?.id, scrimId],
        queryFn: async () => {
            if (!tenant?.id || !scrimId) return [];

            const { data: block, error: blockError } = await supabase
                .from('scrims')
                .select('id')
                .eq('tenant_id', tenant.id)
                .eq('id', scrimId)
                .maybeSingle();

            if (blockError) throw blockError;
            if (!block) throw new Error('Practice block was not found in this workspace');

            const { data, error } = await supabase
                .from('scrim_games')
                .select('*')
                .eq('scrim_id', scrimId)
                .order('game_number', { ascending: true });

            if (error) throw error;

            return (data || []).map((game) => transformScrimGameFromDB(game as ScrimGameDB));
        },
        enabled: Boolean(tenant?.id && scrimId),
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['scrim-games', tenant?.id, scrimId] });
        queryClient.invalidateQueries({ queryKey: ['scrim-block', tenant?.id, scrimId] });
        queryClient.invalidateQueries({ queryKey: ['scrims-optimized'] });
        queryClient.invalidateQueries({ queryKey: ['overview-briefing'] });
    };

    const saveGameReview = useMutation({
        mutationFn: async (input: SaveGameReviewInput) => {
            if (!scrimId) throw new Error('Practice block is unavailable');
            const { data, error: saveError } = await supabase.rpc('save_scrim_game_review', {
                p_scrim_id: scrimId,
                p_game_id: input.id || null,
                p_game_number: input.gameNumber,
                p_status: input.status,
                p_side: input.side,
                p_result: input.result,
                p_duration_seconds: input.durationSeconds,
                p_our_team_kills: input.ourTeamKills,
                p_enemy_team_kills: input.enemyTeamKills,
                p_our_team_gold: input.ourTeamGold,
                p_enemy_team_gold: input.enemyTeamGold,
                p_performance_rating: input.performanceRating,
                p_performance_summary: input.performanceSummary,
                p_early_game_rating: input.earlyGameRating,
                p_mid_game_rating: input.midGameRating,
                p_late_game_rating: input.lateGameRating,
                p_notes: input.notes,
            });
            if (saveError) throw saveError;
            return data;
        },
        onSuccess: () => {
            invalidate();
            toast.success('Game review saved');
        },
        onError: (saveError: unknown) =>
            toast.error(errorMessage(saveError, 'Failed to save the game review')),
    });

    const createScrimGame = useMutation({
        mutationFn: async (gameData: CreateScrimGameData) => {
            if (!scrimId || gameData.scrim_id !== scrimId) throw new Error('Invalid practice block');
            const { data, error } = await supabase
                .from('scrim_games')
                .insert(gameData)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            invalidate();
            toast.success('Game created');
        },
        onError: (error: unknown) => toast.error(errorMessage(error, 'Failed to create game')),
    });

    const updateScrimGame = useMutation({
        mutationFn: async ({ id, ...updates }: UpdateScrimGameData & { id: string }) => {
            if (!scrimId) throw new Error('Invalid practice block');
            const { scrim_id: _ignoredScrimId, ...safeUpdates } = updates;
            const { data, error } = await supabase
                .from('scrim_games')
                .update(safeUpdates)
                .eq('id', id)
                .eq('scrim_id', scrimId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            invalidate();
            toast.success('Game updated');
        },
        onError: (error: unknown) => toast.error(errorMessage(error, 'Failed to update game')),
    });

    const deleteScrimGame = useMutation({
        mutationFn: async (gameId: string) => {
            if (!scrimId) throw new Error('Invalid practice block');
            const { error } = await supabase
                .from('scrim_games')
                .delete()
                .eq('id', gameId)
                .eq('scrim_id', scrimId);
            if (error) throw error;
        },
        onSuccess: () => {
            invalidate();
            toast.success('Game deleted');
        },
        onError: (error: unknown) => toast.error(errorMessage(error, 'Failed to delete game')),
    });

    return {
        scrimGames,
        isLoading,
        error: error ? errorMessage(error, 'Games could not be loaded') : null,
        createScrimGame: createScrimGame.mutate,
        updateScrimGame: updateScrimGame.mutate,
        deleteScrimGame: deleteScrimGame.mutate,
        saveGameReview: saveGameReview.mutateAsync,
        isCreating: createScrimGame.isPending,
        isUpdating: updateScrimGame.isPending,
        isDeleting: deleteScrimGame.isPending,
        isSavingReview: saveGameReview.isPending,
    };
}
