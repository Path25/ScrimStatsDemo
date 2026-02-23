
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { TrendingUp } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

interface OptimizedPerformanceChartProps {
  scrimId?: string;
  playerId?: string;
  timeRange?: 'week' | 'month' | 'season';
  limit?: number;
}

export const OptimizedPerformanceChart = ({ 
  scrimId, 
  playerId, 
  timeRange = 'month',
  limit = 20
}: OptimizedPerformanceChartProps) => {
  const { tenant } = useTenant();

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['performance-chart-optimized', scrimId, playerId, timeRange, tenant?.id, limit],
    queryFn: async () => {
      if (!tenant?.id) return [];

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'season':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      let query = supabase
        .from('scrim_participants')
        .select(`
          kills,
          deaths,
          assists,
          damage_dealt,
          gold,
          vision_score,
          scrim_game_id,
          scrim_games!inner(
            game_start_time,
            result,
            scrim_id,
            scrims!inner(tenant_id)
          )
        `)
        .eq('scrim_games.scrims.tenant_id', tenant.id)
        .eq('is_our_team', true)
        .gte('scrim_games.game_start_time', startDate.toISOString())
        .order('scrim_games.game_start_time', { ascending: false })
        .limit(limit);

      if (scrimId) {
        query = query.eq('scrim_games.scrim_id', scrimId);
      }

      if (playerId) {
        query = query.eq('player_id', playerId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching optimized performance data:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const chartData = useMemo(() => {
    if (!performanceData || performanceData.length === 0) return [];

    // Group by date and calculate performance metrics
    const dailyPerformance = performanceData.reduce((acc: any, participant: any) => {
      const date = new Date(participant.scrim_games.game_start_time).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          games: 0,
          totalKills: 0,
          totalDeaths: 0,
          totalAssists: 0,
          totalDamage: 0,
          totalGold: 0,
          wins: 0
        };
      }

      acc[date].games += 1;
      acc[date].totalKills += participant.kills || 0;
      acc[date].totalDeaths += participant.deaths || 0;
      acc[date].totalAssists += participant.assists || 0;
      acc[date].totalDamage += participant.damage_dealt || 0;
      acc[date].totalGold += participant.gold || 0;
      
      if (participant.scrim_games.result === 'win') {
        acc[date].wins += 1;
      }

      return acc;
    }, {});

    return Object.values(dailyPerformance)
      .map((day: any) => {
        const avgKDA = day.totalDeaths > 0 ? (day.totalKills + day.totalAssists) / day.totalDeaths : day.totalKills + day.totalAssists;
        const winRate = day.games > 0 ? (day.wins / day.games) * 100 : 0;
        
        // Simplified performance score calculation
        let performanceScore = 50;
        if (avgKDA >= 2) performanceScore += 20;
        else if (avgKDA >= 1.5) performanceScore += 10;
        performanceScore += (winRate / 100) * 30;
        
        return {
          date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          performance: Math.round(Math.max(0, Math.min(100, performanceScore))),
          kda: Math.round(avgKDA * 10) / 10,
          winRate: Math.round(winRate),
          games: day.games
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10); // Show last 10 data points for performance
  }, [performanceData]);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>Loading performance data...</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>
            {scrimId ? 'Player performance across games in this scrim' : `Performance trend over the last ${timeRange}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No performance data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Performance Trend</CardTitle>
        <CardDescription>
          Optimized view showing recent performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: any, name: string) => {
                switch (name) {
                  case 'performance':
                    return [`${value}%`, 'Performance Score'];
                  default:
                    return [value, name];
                }
              }}
            />
            <Line 
              type="monotone" 
              dataKey="performance" 
              stroke="hsl(var(--electric-500))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--electric-500))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
