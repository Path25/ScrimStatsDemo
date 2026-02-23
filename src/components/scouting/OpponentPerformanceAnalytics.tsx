import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { useOpponentPerformanceTrends } from '@/hooks/useOpponentPerformanceTrends';
import { useOpponentDrafts } from '@/hooks/useOpponentDrafts';
import { OpponentTrendChart } from './OpponentTrendChart';
import { OpponentInsightsPanel } from './OpponentInsightsPanel';
import { OpponentMatchupMatrix } from './OpponentMatchupMatrix';
import { cn } from '@/lib/utils';

interface OpponentPerformanceAnalyticsProps {
  opponentTeamId: string;
}

export function OpponentPerformanceAnalytics({ opponentTeamId }: OpponentPerformanceAnalyticsProps) {
  const { data: trends, isLoading: trendsLoading } = useOpponentPerformanceTrends(opponentTeamId);
  const { data: drafts } = useOpponentDrafts(opponentTeamId);

  const calculateWinRate = () => {
    if (!drafts?.length) return 0;
    const wins = drafts.filter(draft => draft.result === 'win').length;
    return Math.round((wins / drafts.length) * 100);
  };

  const getRecentPerformance = () => {
    if (!drafts?.length) return 'neutral';
    const recentGames = drafts.slice(0, 5);
    const wins = recentGames.filter(draft => draft.result === 'win').length;
    const winRate = wins / recentGames.length;

    if (winRate >= 0.7) return 'improving';
    if (winRate <= 0.3) return 'declining';
    return 'stable';
  };

  const performance = getRecentPerformance();

  return (
    <div className="space-y-6">
      {/* Performance Overview Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-brand-primary/10 overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 bg-brand-primary/5 blur-2xl rounded-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-label">Win Rate</CardTitle>
            <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Target className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-value glow-text group-hover:scale-105 transition-transform origin-left duration-500">{calculateWinRate()}%</div>
            <p className="text-[10px] text-zinc-500 mt-1 font-bold">
              {drafts?.length || 0} GAMES TRACKED
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-label">Performance Trend</CardTitle>
            <div className={cn(
              "p-1.5 rounded-lg",
              performance === 'improving' ? "bg-green-500/10 text-green-500" :
                performance === 'declining' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
            )}>
              <Activity className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-3">
              {performance === 'improving' && (
                <div className="flex items-center gap-2">
                  <span className="text-value text-green-500 group-hover:scale-105 transition-all">Strong</span>
                </div>
              )}
              {performance === 'declining' && (
                <div className="flex items-center gap-2">
                  <span className="text-value text-red-500 group-hover:scale-105 transition-all">Weak</span>
                </div>
              )}
              {performance === 'stable' && (
                <div className="flex items-center gap-2">
                  <span className="text-value text-blue-500 group-hover:scale-105 transition-all">Stable</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 font-bold">
              BASED ON LAST 5 GAMES
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-label">Blue Side WR</CardTitle>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-value text-blue-400 group-hover:scale-105 transition-all duration-500">
              {drafts?.length ?
                Math.round((drafts.filter(d => d.our_side === 'blue' && d.result === 'win').length /
                  (drafts.filter(d => d.our_side === 'blue').length || 1)) * 100) : 0}%
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 font-bold">
              {drafts?.filter(d => d.our_side === 'blue').length || 0} BLUE GAMES
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden group text-right">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-label">Red Side WR</CardTitle>
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-value text-red-400 group-hover:scale-105 transition-all duration-500">
              {drafts?.length ?
                Math.round((drafts.filter(d => d.our_side === 'red' && d.result === 'win').length /
                  (drafts.filter(d => d.our_side === 'red').length || 1)) * 100) : 0}%
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase">
              {drafts?.filter(d => d.our_side === 'red').length || 0} RED GAMES
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="glass-panel p-1 inline-flex rounded-xl">
          <TabsTrigger value="trends" className="h-8 px-4 text-xs font-bold data-[state=active]:bg-brand-primary/20 data-[state=active]:text-white rounded-lg transition-all">
            Performance Trends
          </TabsTrigger>
          <TabsTrigger value="insights" className="h-8 px-4 text-xs font-bold data-[state=active]:bg-brand-primary/20 data-[state=active]:text-white rounded-lg transition-all">
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="matchups" className="h-8 px-4 text-xs font-bold data-[state=active]:bg-brand-primary/20 data-[state=active]:text-white rounded-lg transition-all">
            Matchup Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <OpponentTrendChart
            opponentTeamId={opponentTeamId}
            trends={trends}
            isLoading={trendsLoading}
          />
        </TabsContent>

        <TabsContent value="insights">
          <OpponentInsightsPanel
            opponentTeamId={opponentTeamId}
            drafts={drafts}
          />
        </TabsContent>

        <TabsContent value="matchups">
          <OpponentMatchupMatrix
            opponentTeamId={opponentTeamId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
