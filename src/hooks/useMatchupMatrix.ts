import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export function useMatchupMatrix(opponentTeamId?: string) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['matchup-matrix', opponentTeamId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      let query = supabase
        .from('matchup_matrix_data')
        .select(`
          *,
          opponent_players!inner(
            summoner_name,
            role,
            opponent_teams!inner(
              id,
              name
            )
          )
        `)
        .order('last_matchup', { ascending: false });

      if (opponentTeamId) {
        query = query.eq('opponent_players.opponent_teams.id', opponentTeamId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreateMatchupMatrix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchupData: any) => {
      const { data, error } = await supabase
        .from('matchup_matrix_data')
        .insert([matchupData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchup-matrix'] });
    },
  });
}

export function useUpdateMatchupMatrix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('matchup_matrix_data')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchup-matrix'] });
    },
  });
}

export function useDeleteMatchupMatrix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('matchup_matrix_data')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchup-matrix'] });
    },
  });
}