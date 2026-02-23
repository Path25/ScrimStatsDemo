
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface OptimizedPlayer {
  id: string;
  summoner_name: string;
  role: string | null;
  rank: string | null;
  lp: number | null;
  is_active: boolean;
  join_date: string | null;
  last_soloq_sync: string | null;
  region: string | null;
}

interface UseOptimizedPlayersDataOptions {
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
  sortBy?: 'name' | 'rank' | 'join_date' | 'last_sync';
  sortOrder?: 'asc' | 'desc';
}

// High quality mock data for demo fallback
const MOCK_PLAYERS: OptimizedPlayer[] = [
  {
    id: 'mock-player-1',
    summoner_name: 'Theory',
    role: 'mid',
    rank: 'Challenger',
    lp: 842,
    is_active: true,
    join_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    last_soloq_sync: new Date().toISOString(),
    region: 'EUW'
  },
  {
    id: 'mock-player-2',
    summoner_name: 'Vortex',
    role: 'jungle',
    rank: 'Grandmaster',
    lp: 512,
    is_active: true,
    join_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    last_soloq_sync: new Date().toISOString(),
    region: 'EUW'
  },
  {
    id: 'mock-player-3',
    summoner_name: 'Shield',
    role: 'top',
    rank: 'Master',
    lp: 124,
    is_active: true,
    join_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    last_soloq_sync: new Date().toISOString(),
    region: 'EUW'
  },
  {
    id: 'mock-player-4',
    summoner_name: 'Pulse',
    role: 'adc',
    rank: 'Challenger',
    lp: 756,
    is_active: true,
    join_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    last_soloq_sync: new Date().toISOString(),
    region: 'EUW'
  },
  {
    id: 'mock-player-5',
    summoner_name: 'Aura',
    role: 'support',
    rank: 'Grandmaster',
    lp: 489,
    is_active: true,
    join_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    last_soloq_sync: new Date().toISOString(),
    region: 'EUW'
  }
];

export const useOptimizedPlayersData = (options: UseOptimizedPlayersDataOptions = {}) => {
  const { tenant } = useTenant();
  const {
    page = 1,
    pageSize = 20,
    includeInactive = false,
    sortBy = 'summoner_name',
    sortOrder = 'asc'
  } = options;

  return useQuery({
    queryKey: ['players-optimized', tenant?.id, page, pageSize, includeInactive, sortBy, sortOrder],
    queryFn: async (): Promise<{ players: OptimizedPlayer[], totalCount: number }> => {
      if (!tenant?.id) return { players: MOCK_PLAYERS, totalCount: MOCK_PLAYERS.length };

      let query = supabase
        .from('players')
        .select(`
          id,
          summoner_name,
          role,
          rank,
          lp,
          is_active,
          join_date,
          last_soloq_sync,
          region
        `, { count: 'exact' })
        .eq('tenant_id', tenant.id);

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching optimized players:', error);
        throw error;
      }

      return {
        players: data || [],
        totalCount: count || 0
      };
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
