
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface PlayerAnalytics {
  radar: Array<{
    subject: string;
    A: number;
    fullMark: number;
  }>;
  recentPerformance: Array<{
    game: string;
    rating: number;
  }>;
}

export function usePlayerAnalytics(playerId: string | null) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['player-analytics', playerId, tenant?.id],
    queryFn: async (): Promise<PlayerAnalytics> => {
      console.log('🔍 Starting analytics calculation for player:', playerId);
      
      if (!playerId || !tenant?.id) {
        console.log('❌ Missing playerId or tenant:', { playerId, tenantId: tenant?.id });
        return {
          radar: [],
          recentPerformance: []
        };
      }

      // Get recent matches first
      const { data: matches, error: matchesError } = await supabase
        .from('player_soloq_matches')
        .select('*')
        .eq('player_id', playerId)
        .order('game_creation', { ascending: false })
        .limit(10);

      if (matchesError) {
        console.error('❌ Error fetching matches:', matchesError);
        return {
          radar: [],
          recentPerformance: []
        };
      }

      if (!matches || matches.length === 0) {
        console.log('⚠️ No matches found for player:', playerId);
        return {
          radar: [],
          recentPerformance: []
        };
      }

      console.log('✅ Found matches:', matches.length, matches.map(m => ({ id: m.match_id, date: m.game_creation })));

      // Get match statistics using match IDs
      const matchIds = matches.map(match => match.match_id);
      console.log('🔍 Looking for stats with match IDs:', matchIds);
      
      const { data: matchStats, error: statsError } = await supabase
        .from('player_soloq_stats')
        .select('*')
        .in('match_id', matchIds);

      if (statsError) {
        console.error('❌ Error fetching match stats:', statsError);
        return {
          radar: [],
          recentPerformance: []
        };
      }

      console.log('📊 Found match stats:', matchStats?.length || 0);
      console.log('📊 Stats sample:', matchStats?.[0]);

      if (!matchStats || matchStats.length === 0) {
        console.log('⚠️ No match stats found, but matches exist. Creating basic analytics from match data only.');
        
        // Create basic analytics from match data only
        const winRate = matches.filter(match => match.win).length / matches.length;
        
        const radar = [
          { subject: 'Win Rate', A: Math.round(winRate * 100), fullMark: 100 },
          { subject: 'Games Played', A: Math.min(100, matches.length * 10), fullMark: 100 },
          { subject: 'Recent Activity', A: 75, fullMark: 100 },
          { subject: 'Consistency', A: 60, fullMark: 100 },
          { subject: 'Performance', A: 50, fullMark: 100 },
          { subject: 'Champion Pool', A: 70, fullMark: 100 }
        ];

        const recentPerformance = matches.slice(0, 5).map((match, index) => ({
          game: `Game ${index + 1}`,
          rating: match.win ? 7.5 : 4.5
        }));

        console.log('📈 Created basic analytics:', { radar: radar.length, performance: recentPerformance.length });
        
        return {
          radar,
          recentPerformance
        };
      }

      // Create a map for easier lookup
      const statsMap = new Map();
      matchStats.forEach(stat => {
        statsMap.set(stat.match_id, stat);
      });

      console.log('🗺️ Created stats map with', statsMap.size, 'entries');

      // Calculate radar chart data based on actual performance
      const totalGames = matchStats.length;
      console.log('📊 Calculating metrics for', totalGames, 'games');
      
      // Calculate KDA average
      const avgKDA = matchStats.reduce((sum, stat) => {
        const kda = stat.deaths > 0 ? (stat.kills + stat.assists) / stat.deaths : stat.kills + stat.assists;
        return sum + kda;
      }, 0) / totalGames;

      // Calculate vision score average
      const avgVision = matchStats.reduce((sum, stat) => sum + (stat.vision_score || 0), 0) / totalGames;

      // Calculate damage efficiency
      const avgDamageRatio = matchStats.reduce((sum, stat) => {
        const damageRatio = stat.total_damage_dealt > 0 ? 
          stat.total_damage_dealt_to_champions / stat.total_damage_dealt : 0;
        return sum + damageRatio;
      }, 0) / totalGames;

      // Calculate CS per minute using matches data
      const avgCSPerMin = matches.reduce((sum, match) => {
        const stat = statsMap.get(match.match_id);
        if (!stat) return sum;
        const csPerMin = match.game_duration > 0 ? 
          (stat.total_minions_killed + stat.neutral_minions_killed) / (match.game_duration / 60) : 0;
        return sum + csPerMin;
      }, 0) / matches.length;

      // Calculate gold efficiency using matches data
      const avgGoldPerMin = matches.reduce((sum, match) => {
        const stat = statsMap.get(match.match_id);
        if (!stat) return sum;
        const goldPerMin = match.game_duration > 0 ? stat.gold_earned / (match.game_duration / 60) : 0;
        return sum + goldPerMin;
      }, 0) / matches.length;

      // Win rate using matches data
      const winRate = matches.filter(match => match.win).length / matches.length;

      console.log('📈 Calculated averages:', {
        avgKDA: avgKDA.toFixed(2),
        avgVision: avgVision.toFixed(1),
        avgDamageRatio: avgDamageRatio.toFixed(3),
        avgCSPerMin: avgCSPerMin.toFixed(1),
        avgGoldPerMin: avgGoldPerMin.toFixed(0),
        winRate: (winRate * 100).toFixed(1) + '%'
      });

      // Normalize values to 0-100 scale for radar chart
      const radar = [
        { 
          subject: 'Combat', 
          A: Math.min(100, Math.max(0, Math.round((avgKDA / 3) * 100))), 
          fullMark: 100 
        },
        { 
          subject: 'Vision', 
          A: Math.min(100, Math.max(0, Math.round((avgVision / 50) * 100))), 
          fullMark: 100 
        },
        { 
          subject: 'Farming', 
          A: Math.min(100, Math.max(0, Math.round((avgCSPerMin / 8) * 100))), 
          fullMark: 100 
        },
        { 
          subject: 'Damage', 
          A: Math.min(100, Math.max(0, Math.round(avgDamageRatio * 100))), 
          fullMark: 100 
        },
        { 
          subject: 'Economy', 
          A: Math.min(100, Math.max(0, Math.round((avgGoldPerMin / 500) * 100))), 
          fullMark: 100 
        },
        { 
          subject: 'Win Rate', 
          A: Math.round(winRate * 100), 
          fullMark: 100 
        }
      ];

      // Calculate recent performance ratings using both matches and stats
      const recentPerformance = matches.slice(0, 5).map((match, index) => {
        const stat = statsMap.get(match.match_id);
        if (!stat) {
          console.log('⚠️ No stats found for match:', match.match_id);
          return {
            game: `Game ${index + 1}`,
            rating: match.win ? 6.0 : 4.0
          };
        }

        const kda = stat.deaths > 0 ? (stat.kills + stat.assists) / stat.deaths : stat.kills + stat.assists;
        const csPerMin = match.game_duration > 0 ? 
          (stat.total_minions_killed + stat.neutral_minions_killed) / (match.game_duration / 60) : 0;
        const visionScore = stat.vision_score || 0;
        
        // Calculate a performance rating out of 10
        let rating = 5; // Base rating
        
        // KDA contribution (0-3 points)
        if (kda >= 3) rating += 2;
        else if (kda >= 2) rating += 1;
        else if (kda < 1) rating -= 1;
        
        // CS contribution (0-2 points)
        if (csPerMin >= 7) rating += 1;
        else if (csPerMin < 4) rating -= 1;
        
        // Vision contribution (0-1 point)
        if (visionScore >= 30) rating += 1;
        else if (visionScore < 15) rating -= 0.5;
        
        // Win/Loss impact (0-2 points)
        if (match.win) rating += 1.5;
        else rating -= 1;
        
        // Clamp between 1-10
        rating = Math.max(1, Math.min(10, rating));
        
        return {
          game: `Game ${index + 1}`,
          rating: Math.round(rating * 10) / 10
        };
      });

      console.log('📊 Final analytics:', { 
        radarDataPoints: radar.filter(r => r.A > 0).length,
        performanceDataPoints: recentPerformance.length,
        radarValues: radar.map(r => `${r.subject}: ${r.A}`),
        performanceValues: recentPerformance.map(p => `${p.game}: ${p.rating}`)
      });

      return {
        radar,
        recentPerformance
      };
    },
    enabled: !!playerId && !!tenant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
