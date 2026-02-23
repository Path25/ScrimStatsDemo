import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Trophy, Users, Calendar, Filter } from 'lucide-react';
import { useScrimsData } from '@/hooks/useScrimsData';
import { useScrimAnalytics } from '@/hooks/useScrimAnalytics';
import { extractParticipantsFromExternalData } from '@/utils/gameDataTransform';
import { PerformanceChart } from './analytics/PerformanceChart';
import { TeamStatsCard } from './analytics/TeamStatsCard';
import { GameTimelineChart } from './analytics/GameTimelineChart';
import { ChampionPerformance } from './analytics/ChampionPerformance';
import { PlayerPerformanceTable } from './analytics/PlayerPerformanceTable';
import { DataExportDialog } from '../analytics/DataExportDialog';
import type { PlayerRole } from '@/types/scrimGame';

// Auto-assign roles in standard order: Top, Jungle, Mid, ADC, Support
const assignStandardRoles = (participants: any[]) => {
  const standardRoles: PlayerRole[] = ['top', 'jungle', 'mid', 'adc', 'support'];
  
  // Separate teams
  const ourTeam = participants.filter(p => p.is_our_team);
  const enemyTeam = participants.filter(p => !p.is_our_team);
  
  // Assign roles to our team
  const ourTeamWithRoles = ourTeam.map((participant, index) => ({
    ...participant,
    role: standardRoles[index] || 'top'
  }));
  
  // Assign roles to enemy team
  const enemyTeamWithRoles = enemyTeam.map((participant, index) => ({
    ...participant,
    role: standardRoles[index] || 'top'
  }));
  
  return [...ourTeamWithRoles, ...enemyTeamWithRoles];
};

export const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'season'>('month');
  const { scrims } = useScrimsData();
  const analytics = useScrimAnalytics(scrims, timeRange);

  // Get all games with proper filtering for team stats
  const allAnalyticsGames = scrims.flatMap(scrim => {
    const scrimGames = scrim.scrim_games || [];
    return scrimGames
      .filter(game => {
        const hasExternalData = game.external_game_data && Object.keys(game.external_game_data).length > 0;
        const isValidStatus = game.status === 'completed' || game.status === 'in_progress';
        return hasExternalData || isValidStatus;
      })
      .map(game => {
        // Determine side from external data with better logic
        let side = 'blue'; // default
        if (game.external_game_data?.grid_metadata?.ourTeamSide) {
          side = game.external_game_data.grid_metadata.ourTeamSide;
        } else if (game.side) {
          side = game.side;
        }

        // Get proper duration with improved extraction
        let gameDuration = game.duration_seconds || 0;
        if (!gameDuration && game.external_game_data?.post_game_data) {
          if (game.external_game_data.post_game_data.gameDuration) {
            gameDuration = game.external_game_data.post_game_data.gameDuration;
          } else if (game.external_game_data.post_game_data.gameLength) {
            gameDuration = Math.floor(game.external_game_data.post_game_data.gameLength / 1000);
          }
        }

        // Determine game result with proper logic
        let result = 'loss'; // default
        if (game.external_game_data?.grid_metadata?.didWeWin !== undefined) {
          result = game.external_game_data.grid_metadata.didWeWin ? 'win' : 'loss';
        } else if (game.result) {
          result = game.result;
        } else if (game.our_team_kills && game.enemy_team_kills) {
          result = game.our_team_kills > game.enemy_team_kills ? 'win' : 'loss';
        }

        return {
          ...game,
          scrim,
          side,
          gameDuration,
          result,
          // Get participants with proper role assignment
          gameParticipants: (() => {
            try {
              if (game.external_game_data?.post_game_data) {
                const extractedParticipants = extractParticipantsFromExternalData(game);
                return assignStandardRoles(extractedParticipants);
              }
              return assignStandardRoles(game.participants || []);
            } catch (error) {
              console.warn('Failed to extract participants:', error);
              return assignStandardRoles(game.participants || []);
            }
          })()
        };
      });
  });

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Performance insights and trends analysis
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <DataExportDialog />
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Time Range:</span>
            <div className="flex space-x-1">
              {[
                { value: 'week', label: '7D' },
                { value: 'month', label: '30D' },
                { value: 'season', label: '90D' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={timeRange === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(option.value as any)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.team.totalGames}</div>
            <p className="text-xs text-muted-foreground">
              {scrims.filter(s => s.status === 'completed').length} scrims completed
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Trophy className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-performance-excellent">{analytics.team.winRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.team.wins}/{analytics.team.totalGames} games won
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Game Time</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(analytics.team.avgGameDuration / 60)}:{((analytics.team.avgGameDuration % 60)).toFixed(0).padStart(2, '0')}
            </div>
            <p className="text-xs text-muted-foreground">
              minutes per game
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Form</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex space-x-1">
              {analytics.team.recentForm.map((result, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    result === 'W' ? 'bg-performance-excellent text-black' : 'bg-performance-terrible text-white'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last {analytics.team.recentForm.length} games
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="team">Team Stats</TabsTrigger>
          <TabsTrigger value="champions">Champions</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <PerformanceChart performanceData={analytics.performanceData} />
            <TeamStatsCard analytics={analytics.team} />
          </div>
          
          <PlayerPerformanceTable players={analytics.players} />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Side Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['blue', 'red'].map(side => {
                    const sideGames = allAnalyticsGames.filter(g => g.side === side);
                    const sideWins = sideGames.filter(g => g.result === 'win').length;
                    const sideWinRate = sideGames.length > 0 ? Math.round((sideWins / sideGames.length) * 100) : 0;
                    
                    return (
                      <div key={side} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            side === 'blue' ? 'bg-blue-500' : 'bg-red-500'
                          }`} />
                          <span className="font-medium capitalize">{side} Side</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{sideWinRate}%</div>
                          <div className="text-xs text-muted-foreground">
                            {sideWins}/{sideGames.length}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Game Length Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Early Game (< 25m)', min: 0, max: 25 },
                    { label: 'Mid Game (25-35m)', min: 25, max: 35 },
                    { label: 'Late Game (> 35m)', min: 35, max: Infinity }
                  ].map(range => {
                    const rangeGames = allAnalyticsGames.filter(g => {
                      const minutes = g.gameDuration / 60;
                      return minutes >= range.min && minutes < range.max;
                    });
                    const rangeWins = rangeGames.filter(g => g.result === 'win').length;
                    const rangeWinRate = rangeGames.length > 0 ? Math.round((rangeWins / rangeGames.length) * 100) : 0;
                    
                    return (
                      <div key={range.label} className="flex items-center justify-between">
                        <span className="text-sm">{range.label}</span>
                        <div className="text-right">
                          <div className="font-bold">{rangeWinRate}%</div>
                          <div className="text-xs text-muted-foreground">
                            {rangeWins}/{rangeGames.length}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="champions" className="space-y-6">
          <ChampionPerformance scrims={scrims} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <GameTimelineChart timeline={analytics.timeline} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
