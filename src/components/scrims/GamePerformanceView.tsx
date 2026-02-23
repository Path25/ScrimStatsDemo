
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Clock, TrendingUp, Users, Shield } from 'lucide-react';
import type { ScrimGame } from '@/types/scrimGame';

interface GamePerformanceViewProps {
  game: ScrimGame;
}

export const GamePerformanceView: React.FC<GamePerformanceViewProps> = ({ game }) => {
  const calculateKDA = (kills: number, deaths: number, assists: number) => {
    return deaths === 0 ? (kills + assists) : ((kills + assists) / deaths);
  };

  const formatKDA = (kda: number) => {
    return kda.toFixed(2);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getKDAColor = (kda: number) => {
    if (kda >= 2.0) return 'text-green-400';
    if (kda >= 1.0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const ourTeamParticipants = game.participants?.filter(p => p.is_our_team) || [];
  const enemyTeamParticipants = game.participants?.filter(p => !p.is_our_team) || [];

  // Calculate team stats
  const ourTeamStats = {
    totalKills: ourTeamParticipants.reduce((sum, p) => sum + p.kills, 0),
    totalDeaths: ourTeamParticipants.reduce((sum, p) => sum + p.deaths, 0),
    totalAssists: ourTeamParticipants.reduce((sum, p) => sum + p.assists, 0),
    totalGold: ourTeamParticipants.reduce((sum, p) => sum + p.gold, 0),
    totalCS: ourTeamParticipants.reduce((sum, p) => sum + p.cs, 0),
    totalDamage: ourTeamParticipants.reduce((sum, p) => sum + p.damage_dealt, 0),
    avgVisionScore: ourTeamParticipants.length > 0 
      ? ourTeamParticipants.reduce((sum, p) => sum + p.vision_score, 0) / ourTeamParticipants.length 
      : 0
  };

  const enemyTeamStats = {
    totalKills: enemyTeamParticipants.reduce((sum, p) => sum + p.kills, 0),
    totalDeaths: enemyTeamParticipants.reduce((sum, p) => sum + p.deaths, 0),
    totalAssists: enemyTeamParticipants.reduce((sum, p) => sum + p.assists, 0),
    totalGold: enemyTeamParticipants.reduce((sum, p) => sum + p.gold, 0),
    totalCS: enemyTeamParticipants.reduce((sum, p) => sum + p.cs, 0),
    totalDamage: enemyTeamParticipants.reduce((sum, p) => sum + p.damage_dealt, 0),
    avgVisionScore: enemyTeamParticipants.length > 0 
      ? enemyTeamParticipants.reduce((sum, p) => sum + p.vision_score, 0) / enemyTeamParticipants.length 
      : 0
  };

  // Calculate advantages
  const goldAdvantage = ourTeamStats.totalGold - enemyTeamStats.totalGold;
  const killAdvantage = ourTeamStats.totalKills - enemyTeamStats.totalKills;
  const damageAdvantage = ourTeamStats.totalDamage - enemyTeamStats.totalDamage;

  return (
    <div className="space-y-6">
      {/* Game Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Duration</div>
                <div className="text-2xl font-bold">{formatDuration(game.duration_seconds)}</div>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Kill Score</div>
                <div className="text-2xl font-bold">
                  <span className={goldAdvantage >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {ourTeamStats.totalKills}
                  </span>
                  <span className="text-muted-foreground mx-1">:</span>
                  <span className={goldAdvantage < 0 ? 'text-green-400' : 'text-red-400'}>
                    {enemyTeamStats.totalKills}
                  </span>
                </div>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Gold Advantage</div>
                <div className={`text-2xl font-bold ${goldAdvantage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {goldAdvantage >= 0 ? '+' : ''}{goldAdvantage.toLocaleString()}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Result</div>
                <div className={`text-2xl font-bold ${
                  game.result === 'win' ? 'text-green-400' : 
                  game.result === 'loss' ? 'text-red-400' : 
                  'text-muted-foreground'
                }`}>
                  {game.result ? game.result.toUpperCase() : 'PENDING'}
                </div>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Tabs */}
      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="players">Player Performance</TabsTrigger>
          <TabsTrigger value="teams">Team Comparison</TabsTrigger>
          <TabsTrigger value="objectives">Objectives</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Our Team */}
            <Card className="glass-card border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Our Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ourTeamParticipants.map((participant, index) => {
                    const kda = calculateKDA(participant.kills, participant.deaths, participant.assists);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{participant.summoner_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {participant.champion_name} ({participant.role || 'Unknown'})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            {participant.kills}/{participant.deaths}/{participant.assists}
                          </div>
                          <div className={`text-sm font-medium ${getKDAColor(kda)}`}>
                            {formatKDA(kda)} KDA
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm">{participant.cs} CS</div>
                          <div className="text-xs text-muted-foreground">
                            {participant.gold.toLocaleString()} gold
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Enemy Team */}
            <Card className="glass-card border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Enemy Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {enemyTeamParticipants.map((participant, index) => {
                    const kda = calculateKDA(participant.kills, participant.deaths, participant.assists);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{participant.summoner_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {participant.champion_name} ({participant.role || 'Unknown'})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            {participant.kills}/{participant.deaths}/{participant.assists}
                          </div>
                          <div className={`text-sm font-medium ${getKDAColor(kda)}`}>
                            {formatKDA(kda)} KDA
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm">{participant.cs} CS</div>
                          <div className="text-xs text-muted-foreground">
                            {participant.gold.toLocaleString()} gold
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

        <TabsContent value="teams" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Team Statistics Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Total Kills</span>
                    <span>{ourTeamStats.totalKills} vs {enemyTeamStats.totalKills}</span>
                  </div>
                  <Progress value={(ourTeamStats.totalKills / Math.max(ourTeamStats.totalKills + enemyTeamStats.totalKills, 1)) * 100} />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Total Gold</span>
                    <span>{ourTeamStats.totalGold.toLocaleString()} vs {enemyTeamStats.totalGold.toLocaleString()}</span>
                  </div>
                  <Progress value={(ourTeamStats.totalGold / Math.max(ourTeamStats.totalGold + enemyTeamStats.totalGold, 1)) * 100} />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Total Damage</span>
                    <span>{ourTeamStats.totalDamage.toLocaleString()} vs {enemyTeamStats.totalDamage.toLocaleString()}</span>
                  </div>
                  <Progress value={(ourTeamStats.totalDamage / Math.max(ourTeamStats.totalDamage + enemyTeamStats.totalDamage, 1)) * 100} />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Average Vision Score</span>
                    <span>{ourTeamStats.avgVisionScore.toFixed(1)} vs {enemyTeamStats.avgVisionScore.toFixed(1)}</span>
                  </div>
                  <Progress value={(ourTeamStats.avgVisionScore / Math.max(ourTeamStats.avgVisionScore + enemyTeamStats.avgVisionScore, 1)) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Key Advantages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Gold Advantage</span>
                  <Badge className={goldAdvantage >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                    {goldAdvantage >= 0 ? '+' : ''}{goldAdvantage.toLocaleString()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Kill Advantage</span>
                  <Badge className={killAdvantage >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                    {killAdvantage >= 0 ? '+' : ''}{killAdvantage}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Damage Advantage</span>
                  <Badge className={damageAdvantage >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                    {damageAdvantage >= 0 ? '+' : ''}{damageAdvantage.toLocaleString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="objectives" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Objective Control</CardTitle>
            </CardHeader>
            <CardContent>
              {game.objectives && Object.keys(game.objectives).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(game.objectives).map(([objectiveType, events]) => (
                    <div key={objectiveType} className="text-center">
                      <div className="text-2xl font-bold">
                        {Array.isArray(events) ? events.filter((e: any) => e.team === 'our').length : 0}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {objectiveType}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No objective data available for this game
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
