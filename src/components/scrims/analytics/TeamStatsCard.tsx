
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TeamAnalytics } from '@/hooks/useScrimAnalytics';

interface TeamStatsCardProps {
  analytics: TeamAnalytics;
}

export const TeamStatsCard: React.FC<TeamStatsCardProps> = ({ analytics }) => {
  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < -5) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 5) return 'text-green-500';
    if (trend < -5) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const formatTrend = (trend: number) => {
    const sign = trend > 0 ? '+' : '';
    return `${sign}${Math.round(trend)}%`;
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Team Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex items-center justify-between p-3 rounded border border-border/50">
            <div>
              <p className="text-sm font-medium">Average Kills</p>
              <p className="text-2xl font-bold">{Math.round(analytics.avgKills)}</p>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(analytics.killsTrend)}
              <span className={`text-sm font-medium ${getTrendColor(analytics.killsTrend)}`}>
                {formatTrend(analytics.killsTrend)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded border border-border/50">
            <div>
              <p className="text-sm font-medium">Average Gold</p>
              <p className="text-2xl font-bold">{Math.round(analytics.avgGold / 1000)}k</p>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(analytics.goldTrend)}
              <span className={`text-sm font-medium ${getTrendColor(analytics.goldTrend)}`}>
                {formatTrend(analytics.goldTrend)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded border border-border/50">
            <div>
              <p className="text-sm font-medium">Avg Game Duration</p>
              <p className="text-2xl font-bold">
                {Math.floor(analytics.avgGameDuration / 60)}:{((analytics.avgGameDuration % 60)).toFixed(0).padStart(2, '0')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(-analytics.durationTrend)} {/* Negative because shorter games might be better */}
              <span className={`text-sm font-medium ${getTrendColor(-analytics.durationTrend)}`}>
                {formatTrend(-analytics.durationTrend)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick insights */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-medium mb-2">Quick Insights</p>
          <div className="space-y-2">
            {analytics.killsTrend > 10 && (
              <Badge variant="default" className="bg-green-500/20 text-green-400">
                Improving kill participation
              </Badge>
            )}
            {analytics.goldTrend > 10 && (
              <Badge variant="default" className="bg-blue-500/20 text-blue-400">
                Better economic control
              </Badge>
            )}
            {analytics.durationTrend < -10 && (
              <Badge variant="default" className="bg-purple-500/20 text-purple-400">
                Faster game closing
              </Badge>
            )}
            {Math.abs(analytics.killsTrend) < 5 && Math.abs(analytics.goldTrend) < 5 && analytics.totalGames > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                Consistent performance
              </Badge>
            )}
            {analytics.totalGames === 0 && (
              <p className="text-sm text-muted-foreground">No game data available yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
