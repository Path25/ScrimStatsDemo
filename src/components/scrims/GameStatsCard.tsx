
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Sword, Shield, Target, Clock } from 'lucide-react';
import { getGameDurationFromExternalData, getTeamKillsFromExternalData } from '@/utils/gameDataTransform';
import { determineGameResult, getGameResultDisplay } from '@/utils/gameResultHelpers';
import type { ScrimGame } from '@/types/scrimGame';

interface GameStatsCardProps {
  game: ScrimGame;
}

export const GameStatsCard: React.FC<GameStatsCardProps> = ({ game }) => {
  const formatDuration = () => {
    // First try to get duration from external data
    const externalDuration = getGameDurationFromExternalData(game);
    const duration = externalDuration || game.duration_seconds;
    
    if (!duration) return 'In Progress';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getKillCounts = () => {
    // Try to get kills from external data first
    const externalKills = getTeamKillsFromExternalData(game);
    if (externalKills.ourKills > 0 || externalKills.enemyKills > 0) {
      return {
        ourKills: externalKills.ourKills,
        enemyKills: externalKills.enemyKills
      };
    }
    
    // Fall back to database values
    return {
      ourKills: game.our_team_kills || 0,
      enemyKills: game.enemy_team_kills || 0
    };
  };

  const { ourKills, enemyKills } = getKillCounts();

  const getKillParticipation = () => {
    const totalKills = ourKills + enemyKills;
    return totalKills > 0 ? (ourKills / totalKills) * 100 : 50;
  };

  const getResultColor = () => {
    const result = determineGameResult(game);
    if (result === 'win') return 'text-green-400';
    if (result === 'loss') return 'text-red-400';
    return 'text-muted-foreground';
  };

  const getResultIcon = () => {
    const result = determineGameResult(game);
    if (result === 'win') return <Trophy className="h-5 w-5 text-green-400" />;
    if (result === 'loss') return <Shield className="h-5 w-5 text-red-400" />;
    return <Clock className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getResultIcon()}
            <span>Game {game.game_number} Statistics</span>
          </div>
          <Badge variant={determineGameResult(game) === 'win' ? 'default' : determineGameResult(game) === 'loss' ? 'destructive' : 'outline'}>
            {getGameResultDisplay(game)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Duration */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Duration</span>
            </div>
            <div className="text-2xl font-bold">{formatDuration()}</div>
          </div>

          {/* Kill Score */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sword className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Kills</span>
            </div>
            <div className="text-2xl font-bold">
              <span className="text-blue-400">{ourKills}</span>
              <span className="mx-2 text-muted-foreground">:</span>
              <span className="text-red-400">{enemyKills}</span>
            </div>
          </div>

          {/* Side */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Side</span>
            </div>
            <Badge variant="outline" className={
              game.side === 'blue' ? 'text-blue-400 border-blue-400' : 'text-red-400 border-red-400'
            }>
              {game.side?.toUpperCase() || 'TBD'}
            </Badge>
          </div>
        </div>

        {/* Kill Participation Progress */}
        {game.status === 'completed' && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Kill Participation</span>
              <span className="text-sm font-medium">{getKillParticipation().toFixed(1)}%</span>
            </div>
            <Progress value={getKillParticipation()} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
