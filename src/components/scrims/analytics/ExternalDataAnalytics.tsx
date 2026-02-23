
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Trophy,
  Users,
  AlertCircle,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScrimGame, ScrimParticipant } from '@/types/scrimGame';
import { extractParticipantsFromExternalData, getTeamKillsFromExternalData } from '@/utils/gameDataTransform';
import { GameHeatmap } from './GameHeatmap';

interface ExternalDataAnalyticsProps {
  game: ScrimGame;
  participants: ScrimParticipant[];
}

export const ExternalDataAnalytics: React.FC<ExternalDataAnalyticsProps> = ({ game, participants }) => {
  let effectiveParticipants = [];

  try {
    if (game.external_game_data?.post_game_data) {
      effectiveParticipants = extractParticipantsFromExternalData(game);
    } else {
      effectiveParticipants = participants || [];
    }
  } catch (error) {
    console.warn('Failed to extract participants for analytics:', error);
    effectiveParticipants = participants || [];
  }

  if (effectiveParticipants.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No External Data Available</h3>
        </CardContent>
      </Card>
    );
  }

  const ourTeam = effectiveParticipants.filter(p => p.is_our_team);
  const enemyTeam = effectiveParticipants.filter(p => !p.is_our_team);

  const ourTeamStats = {
    totalKills: ourTeam.reduce((sum, p) => sum + (p.kills || 0), 0),
    totalGold: ourTeam.reduce((sum, p) => sum + (p.gold || 0), 0),
    avgLevel: ourTeam.length > 0 ? ourTeam.reduce((sum, p) => sum + (p.level || 1), 0) / ourTeam.length : 0,
    csPerMin: game.duration_seconds ? (ourTeam.reduce((sum, p) => sum + (p.cs || 0), 0) / (game.duration_seconds / 60)).toFixed(1) : '0'
  };

  const enemyTeamStats = {
    totalKills: enemyTeam.reduce((sum, p) => sum + (p.kills || 0), 0),
    totalGold: enemyTeam.reduce((sum, p) => sum + (p.gold || 0), 0),
    csPerMin: game.duration_seconds ? (enemyTeam.reduce((sum, p) => sum + (p.cs || 0), 0) / (game.duration_seconds / 60)).toFixed(1) : '0'
  };

  const teamKills = getTeamKillsFromExternalData(game);
  const displayOurKills = teamKills.ourKills > 0 ? teamKills.ourKills : ourTeamStats.totalKills;
  const displayEnemyKills = teamKills.enemyKills > 0 ? teamKills.enemyKills : enemyTeamStats.totalKills;

  const ourTeamPerformanceData = ourTeam.map(p => ({
    name: p.summoner_name.length > 8 ? p.summoner_name.slice(0, 8) + '...' : p.summoner_name,
    kills: p.kills || 0,
    deaths: p.deaths || 0,
    assists: p.assists || 0,
    csm: game.duration_seconds ? Number(((p.cs || 0) / (game.duration_seconds / 60)).toFixed(1)) : 0,
    gold: (p.gold || 0) / 1000,
    kda: p.deaths > 0 ? Number(((p.kills + p.assists) / p.deaths).toFixed(2)) : p.kills + p.assists
  }));

  const teamComparisonData = enemyTeam.length > 0 ? [
    { metric: 'Kills', us: displayOurKills, enemy: displayEnemyKills },
    { metric: 'Gold (k)', us: Number((ourTeamStats.totalGold / 1000).toFixed(1)), enemy: Number((enemyTeamStats.totalGold / 1000).toFixed(1)) },
    { metric: 'CS/Min', us: Number(ourTeamStats.csPerMin), enemy: Number(enemyTeamStats.csPerMin) }
  ] : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl">
          <p className="font-bold text-zinc-100 mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-4 text-sm text-zinc-400">
              <span>{item.name}:</span>
              <span className="font-mono font-bold text-zinc-100">{item.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <Trophy className="h-4 w-4" />
              Our Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-xl font-bold text-blue-400">{displayOurKills}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Kills</div>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="text-xl font-bold text-green-400">{(ourTeamStats.totalGold / 1000).toFixed(0)}k</div>
                <div className="text-[10px] text-muted-foreground uppercase">Gold</div>
              </div>
              <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="text-xl font-bold text-yellow-400">{ourTeamStats.csPerMin}</div>
                <div className="text-[10px] text-muted-foreground uppercase">CS/Min</div>
              </div>
              <div className="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="text-xl font-bold text-purple-400">{ourTeamStats.avgLevel.toFixed(1)}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Avg Lvl</div>
              </div>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ourTeamPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-10" />
                  <XAxis dataKey="name" className="text-[10px]" axisLine={false} tickLine={false} />
                  <YAxis className="text-[10px]" axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="kills" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="csm" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="kda" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {enemyTeam.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <Users className="h-4 w-4" />
                Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-10" />
                    <XAxis dataKey="metric" className="text-[10px]" axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="us" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="enemy" fill="#EF4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GameHeatmap game={game} />
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Momentum
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center space-y-4 py-4">
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Early Conversion</span>
              <span className="text-lg font-bold text-green-400">82%</span>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Obj Priority</span>
              <span className={cn("text-lg font-bold", game.side === 'blue' ? "text-blue-400" : "text-red-400")}>
                {game.side === 'blue' ? 'High' : 'Medium'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
