import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

export type OpponentPerformanceTrend = Database['public']['Tables']['opponent_performance_trends']['Row'];
export type OpponentPerformanceTrendInsert = Database['public']['Tables']['opponent_performance_trends']['Insert'];

export function useOpponentPerformanceTrends(opponentTeamId?: string) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['opponent-performance-trends', opponentTeamId],
        queryFn: async () => {
            if (!opponentTeamId) return [];
            const { data, error } = await supabase
                .from('opponent_performance_trends')
                .select('*')
                .eq('opponent_team_id', opponentTeamId)
                .order('recorded_at', { ascending: false });

            if (error) throw error;
            return data as OpponentPerformanceTrend[];
        },
        enabled: !!opponentTeamId,
    });

    const createTrend = useMutation({
        mutationFn: async (trendData: OpponentPerformanceTrendInsert) => {
            const { data, error } = await supabase
                .from('opponent_performance_trends')
                .insert(trendData)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-performance-trends', opponentTeamId] });
            toast.success('Performance trend recorded');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to record trend');
        },
    });

    return {
        data,
        isLoading,
        error,
        createTrend: createTrend.mutateAsync,
    };
}
