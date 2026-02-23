import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

// Define the Scrim interface to match the database structure
export interface Scrim {
  id: string;
  tenant_id: string;
  opponent_name: string;
  match_date: string;
  scheduled_time: string | null;
  format: string | null;
  status: string;
  result: string | null;
  our_score: number;
  opponent_score: number;
  duration_minutes: number | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  notes: string | null;
  scrim_games?: any[];
}

interface UseOptimizedScrimsDataOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  includeGames?: boolean;
}

// High quality mock data for demo fallback
const MOCK_SCRIMS: Scrim[] = [
  {
    id: 'mock-scrim-1',
    tenant_id: 'demo',
    opponent_name: 'G2 Academy',
    match_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    scheduled_time: '18:00',
    format: 'Bo3',
    status: 'completed',
    result: 'win',
    our_score: 2,
    opponent_score: 1,
    duration_minutes: 95,
    created_at: new Date().toISOString(),
    created_by: 'demo',
    updated_at: new Date().toISOString(),
    notes: 'Strong performance on mid-game rotations.',
    scrim_games: [
      { id: 'g1', game_number: 1, status: 'completed', result: 'win', duration_seconds: 1800, scrim_id: 'mock-scrim-1' },
      { id: 'g2', game_number: 2, status: 'completed', result: 'loss', duration_seconds: 2100, scrim_id: 'mock-scrim-1' },
      { id: 'g3', game_number: 3, status: 'completed', result: 'win', duration_seconds: 1950, scrim_id: 'mock-scrim-1' },
    ]
  },
  {
    id: 'mock-scrim-2',
    tenant_id: 'demo',
    opponent_name: 'FNC TQ',
    match_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    scheduled_time: '19:00',
    format: 'Bo3',
    status: 'completed',
    result: 'loss',
    our_score: 1,
    opponent_score: 2,
    duration_minutes: 110,
    created_at: new Date().toISOString(),
    created_by: 'demo',
    updated_at: new Date().toISOString(),
    notes: 'Difficult time handling their late-game scaling.',
    scrim_games: [
      { id: 'g4', game_number: 1, status: 'completed', result: 'loss', duration_seconds: 2400, scrim_id: 'mock-scrim-2' },
      { id: 'g5', game_number: 2, status: 'completed', result: 'win', duration_seconds: 1700, scrim_id: 'mock-scrim-2' },
      { id: 'g6', game_number: 3, status: 'completed', result: 'loss', duration_seconds: 2200, scrim_id: 'mock-scrim-2' },
    ]
  },
  {
    id: 'mock-scrim-3',
    tenant_id: 'demo',
    opponent_name: 'KCB Blue',
    match_date: new Date(Date.now() - 86400000 * 8).toISOString(),
    scheduled_time: '17:00',
    format: 'Bo3',
    status: 'completed',
    result: 'win',
    our_score: 2,
    opponent_score: 0,
    duration_minutes: 65,
    created_at: new Date().toISOString(),
    created_by: 'demo',
    updated_at: new Date().toISOString(),
    notes: 'Clean sweep. Great objective control.',
    scrim_games: [
      { id: 'g7', game_number: 1, status: 'completed', result: 'win', duration_seconds: 1600, scrim_id: 'mock-scrim-3' },
      { id: 'g8', game_number: 2, status: 'completed', result: 'win', duration_seconds: 1850, scrim_id: 'mock-scrim-3' },
    ]
  }
];

export const useOptimizedScrimsData = (options: UseOptimizedScrimsDataOptions = {}) => {
  const { tenant } = useTenant();
  const {
    page = 1,
    pageSize = 10,
    status,
    dateFrom,
    dateTo,
    includeGames = false
  } = options;

  return useQuery({
    queryKey: ['scrims-optimized', tenant?.id, page, pageSize, status, dateFrom, dateTo, includeGames],
    queryFn: async (): Promise<{ scrims: Scrim[], totalCount: number }> => {
      // Return mock data if no tenant for demo
      if (!tenant?.id) return { scrims: MOCK_SCRIMS, totalCount: MOCK_SCRIMS.length };

      let query = supabase
        .from('scrims')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant.id);

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

      // Apply sorting and pagination
      query = query
        .order('match_date', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data: scrimsData, error: scrimsError, count } = await query;

      if (scrimsError) {
        console.error('Error fetching optimized scrims:', scrimsError);
        throw scrimsError;
      }

      let scrims = scrimsData || [];

      // Fallback for demo if DB is empty
      if (scrims.length === 0 && !status && !dateFrom && !dateTo) {
        return { scrims: MOCK_SCRIMS, totalCount: MOCK_SCRIMS.length };
      }

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
          const gamesByScrimId = (gamesData || []).reduce((acc: any, game: any) => {
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
        totalCount: count || (scrims.length === MOCK_SCRIMS.length ? MOCK_SCRIMS.length : 0)
      };
    },
    enabled: true,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });
};
