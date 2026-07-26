import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

// Define the Scrim interface to match the database structure
export interface Scrim {
  id: string;
  tenant_id: string;
  opponent_name: string;
  opponent_team_id?: string | null;
  match_date: string;
  scheduled_time: string | null;
  starts_at: string;
  ends_at: string | null;
  format: string | null;
  status: string;
  result: string | null;
  our_score: number | null;
  opponent_score: number | null;
  result_source: string;
  result_override_reason: string | null;
  review_status: string;
  review_completed_at: string | null;
  review_completed_by: string | null;
  duration_minutes: number | null;
  data_source?: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  notes: string | null;
  scrim_games?: ScrimGameSummary[];
}

export interface ScrimGameSummary {
  id: string;
  game_number: number;
  status: string;
  result: string | null;
  duration_seconds: number | null;
  scrim_id: string;
}

interface UseOptimizedScrimsDataOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  includeGames?: boolean;
  mode?: 'all' | 'upcoming' | 'history' | 'archived';
  opponent?: string;
  result?: 'win' | 'loss' | 'draw' | 'unrecorded';
  reviewStatus?: 'not_started' | 'in_review' | 'complete';
}

export const useOptimizedScrimsData = (options: UseOptimizedScrimsDataOptions = {}) => {
  const { tenant } = useTenant();
  const {
    page = 1,
    pageSize = 10,
    status,
    dateFrom,
    dateTo,
    includeGames = false,
    mode = 'all',
    opponent,
    result,
    reviewStatus,
  } = options;

  return useQuery({
    queryKey: [
      'scrims-optimized',
      tenant?.id,
      page,
      pageSize,
      status,
      dateFrom,
      dateTo,
      includeGames,
      mode,
      opponent,
      result,
      reviewStatus,
    ],
    queryFn: async (): Promise<{ scrims: Scrim[], totalCount: number }> => {
      if (!tenant?.id) return { scrims: [], totalCount: 0 };

      let query = supabase
        .from('scrims')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant.id);

      query = mode === 'archived' ? query.not('archived_at', 'is', null) : query.is('archived_at', null);

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (dateFrom) {
        query = query.gte('match_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('match_date', dateTo);
      }

      const now = new Date().toISOString();
      if (mode === 'upcoming') {
        query = query
          .gte('starts_at', now)
          .not('status', 'in', '("completed","cancelled")');
      } else if (mode === 'history') {
        query = query.or(`starts_at.lt.${now},status.in.(completed,cancelled)`);
      }

      if (opponent?.trim()) {
        query = query.ilike('opponent_name', `%${opponent.trim()}%`);
      }

      if (result === 'unrecorded') {
        query = query.is('result', null);
      } else if (result) {
        query = query.eq('result', result);
      }

      if (reviewStatus) {
        query = query.eq('review_status', reviewStatus);
      }

      // Apply sorting and pagination
      query = query
        .order(mode === 'archived' ? 'archived_at' : 'starts_at', { ascending: mode === 'upcoming' })
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data: scrimsData, error: scrimsError, count } = await query;

      if (scrimsError) {
        console.error('Error fetching optimized scrims:', scrimsError);
        throw scrimsError;
      }

      let scrims = scrimsData || [];

      // If includeGames is true, fetch scrim_games separately
      if (includeGames && scrims.length > 0) {
        const scrimIds = scrims.map(scrim => scrim.id);

        const { data: gamesData, error: gamesError } = await supabase
          .from('scrim_games')
          .select('id, game_number, status, result, duration_seconds, scrim_id')
          .in('scrim_id', scrimIds);

        if (gamesError) {
          console.error('Error fetching scrim games:', gamesError);
        } else {
          // Group games by scrim_id and attach to scrims
          const gamesByScrimId = (gamesData || []).reduce<Record<string, ScrimGameSummary[]>>((acc, game) => {
            if (!acc[game.scrim_id]) {
              acc[game.scrim_id] = [];
            }
            acc[game.scrim_id].push(game);
            return acc;
          }, {});

          scrims = scrims.map(scrim => ({
            ...scrim,
            scrim_games: gamesByScrimId[scrim.id] || []
          }));
        }
      }

      return {
        scrims,
        totalCount: count || 0
      };
    },
    enabled: true,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });
};
