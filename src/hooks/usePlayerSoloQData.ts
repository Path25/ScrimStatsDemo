
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePlayerSoloQData(playerId: string | null) {
  return useQuery({
    queryKey: ['player-soloq-data', playerId],
    queryFn: async () => {
      if (!playerId) return null;

      // Get recent matches
      const { data: matches, error: matchesError } = await supabase
        .from('player_soloq_matches')
        .select('*')
        .eq('player_id', playerId)
        .order('game_creation', { ascending: false })
        .limit(20);

      if (matchesError) {
        throw new Error('Failed to fetch player matches');
      }

      // Get rank history for LP progression
      const { data: rankHistory, error: rankError } = await supabase
        .from('player_rank_history')
        .select('*')
        .eq('player_id', playerId)
        .order('recorded_at', { ascending: false })
        .limit(14); // Last 2 weeks

      if (rankError) {
        throw new Error('Failed to fetch rank history');
      }

      // Get detailed stats for recent matches for this specific player
      let matchStats: any[] = [];
      if (matches && matches.length > 0) {
        const matchIds = matches.map(match => match.match_id);
        
        // Get all stats for these match IDs
        const { data: allStats, error: statsError } = await supabase
          .from('player_soloq_stats')
          .select('*')
          .in('match_id', matchIds)
          .order('created_at', { ascending: false });

        if (statsError) {
          throw new Error('Failed to fetch match statistics');
        }
        
        // Since player_soloq_stats doesn't have a direct player_id reference,
        // we need to filter based on the matches we already have for this player
        // All stats returned should be for this player since we're only querying
        // match IDs that belong to this player
        matchStats = allStats || [];
        
        // Debug logging to help troubleshoot the matching issue
        console.log('Debug player SoloQ data fetch:', {
          playerId,
          matchCount: matches.length,
          statsCount: matchStats.length,
          firstMatchId: matches[0]?.match_id,
          firstStatId: matchStats[0]?.match_id,
          matchIds: matches.slice(0, 3).map(m => m.match_id),
          statIds: matchStats.slice(0, 3).map(s => s.match_id)
        });
      }

      return {
        matches: matches || [],
        rankHistory: rankHistory || [],
        matchStats: matchStats || []
      };
    },
    enabled: !!playerId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
