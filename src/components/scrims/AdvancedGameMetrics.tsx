
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Sword, 
  Eye,
  Crown,
  Zap
} from 'lucide-react';
import type { ScrimGame, ScrimParticipant } from '@/types/scrimGame';

interface AdvancedGameMetricsProps {
  game: ScrimGame;
  participants: ScrimParticipant[];
}

export const AdvancedGameMetrics: React.FC<AdvancedGameMetricsProps> = ({ 
  game, 
  participants 
}) => {
  const ourTeam = participants.filter(p => p.is_our_team);
  const enemyTeam = participants.filter(p => !p.is_our_team);

  // Calculate advanced metrics
  const calculateKDA = (team: ScrimParticipant[]) => {
    const totalKills = team.reduce((sum, p) => sum + (p.kills || 0), 0);
    const totalDeaths = team.reduce((sum, p) => sum + (p.deaths || 0), 0);
    const totalAssists = team.reduce((sum, p) => sum + (p.assists || 0), 0);
    
    return totalDeaths === 0 
      ? (totalKills + totalAssists) 
      : (totalKills + totalAssists) / totalDeaths;
  };

  const calculateDamageShare = (participant: ScrimParticipant, team: ScrimParticipant[]) => {
    const totalTeamDamage = team.reduce((sum, p) => sum + (p.damage_dealt || 0), 0);
    return totalTeamDamage > 0 ? ((participant.damage_dealt || 0) / totalTeamDamage) * 100 : 0;
  };

  const calculateGoldEfficiency = (participant: ScrimParticipant) => {
    const goldPerDamage = (participant.gold || 0) > 0 
      ? (participant.damage_dealt || 0) / (participant.gold || 1)
      : 0;
    return goldPerDamage;
  };

  const ourKDA = calculateKDA(ourTeam);
  const enemyKDA = calculateKDA(enemyTeam);
  
  const mvpPlayer = ourTeam.reduce((mvp, player) => {
    const playerScore = (player.kills || 0) * 3 + (player.assists || 0) - (player.deaths || 0) * 2;
    const mvpScore = (mvp.kills || 0) * 3 + (mvp.assists || 0) - (mvp.deaths || 0) * 2;
    return playerScore > mvpScore ? player : mvp;
  }, ourTeam[0]);

  return (
    <div className="grid gap-6">
      {/* Team Performance Comparison */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Team Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KDA Comparison */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sword className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Team KDA</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-blue-400 text-sm">Our Team</span>
                  <span className="font-bold text-blue-400">{ourKDA.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-400 text-sm">Enemy</span>
                  <span className="font-bold text-red-400">{enemyKDA.toFixed(2)}</span>
                </div>
                <Progress 
                  value={ourKDA > enemyKDA ? 75 : 25} 
                  className="h-2" 
                />
              </div>
            </div>

            {/* Gold Lead */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">Gold Advantage</span>
              </div>
              <div className="space-y-2">
                <div className={`text-2xl font-bold ${
                  (game.our_team_gold || 0) > (game.enemy_team_gold || 0) 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  {((game.our_team_gold || 0) - (game.enemy_team_gold || 0) > 0 ? '+' : '') + 
                   Math.round(((game.our_team_gold || 0) - (game.enemy_team_gold || 0)) / 1000)}k
                </div>
                <Progress 
                  value={(game.our_team_gold || 0) > (game.enemy_team_gold || 0) ? 65 : 35} 
                  className="h-2" 
                />
              </div>
            </div>

            {/* Vision Control */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium">Vision Score</span>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-400">
                  {ourTeam.reduce((sum, p) => sum + (p.vision_score || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg: {(ourTeam.reduce((sum, p) => sum + (p.vision_score || 0), 0) / ourTeam.length).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Performance Highlights */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Performance Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* MVP */}
            {mvpPlayer && (
              <div className="glass-card p-4 border border-yellow-400/20">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">MVP</span>
                </div>
                <div className="font-semibold">{mvpPlayer.summoner_name}</div>
                <div className="text-sm text-muted-foreground">
                  {mvpPlayer.kills}/{mvpPlayer.deaths}/{mvpPlayer.assists}
                </div>
                <Badge variant="outline" className="mt-2 text-yellow-400 border-yellow-400">
                  {mvpPlayer.champion_name}
                </Badge>
              </div>
            )}

            {/* Highest Damage */}
            {ourTeam.length > 0 && (
              <div className="glass-card p-4 border border-red-400/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sword className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Highest Damage</span>
                </div>
                {(() => {
                  const topDamage = ourTeam.reduce((top, player) => 
                    (player.damage_dealt || 0) > (top.damage_dealt || 0) ? player : top
                  );
                  return (
                    <>
                      <div className="font-semibold">{topDamage.summoner_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {(topDamage.damage_dealt || 0).toLocaleString()} damage
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {calculateDamageShare(topDamage, ourTeam).toFixed(1)}% of team damage
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Best Vision */}
            {ourTeam.length > 0 && (
              <div className="glass-card p-4 border border-purple-400/20">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">Vision Control</span>
                </div>
                {(() => {
                  const topVision = ourTeam.reduce((top, player) => 
                    (player.vision_score || 0) > (top.vision_score || 0) ? player : top
                  );
                  return (
                    <>
                      <div className="font-semibold">{topVision.summoner_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {topVision.vision_score || 0} vision score
                      </div>
                      <Badge variant="outline" className="mt-2 text-purple-400 border-purple-400">
                        {topVision.role?.toUpperCase()}
                      </Badge>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Player Performance */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Player Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ourTeam.map((player) => {
              const kda = (player.deaths || 0) === 0 
                ? (player.kills || 0) + (player.assists || 0)
                : ((player.kills || 0) + (player.assists || 0)) / (player.deaths || 0);
              
              const damageShare = calculateDamageShare(player, ourTeam);
              const goldEfficiency = calculateGoldEfficiency(player);

              return (
                <div key={player.id} className="glass-card p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {player.summoner_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{player.summoner_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {player.champion_name} • {player.role?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={kda >= 2 ? 'default' : kda >= 1 ? 'secondary' : 'destructive'}>
                      {kda.toFixed(2)} KDA
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">K/D/A</div>
                      <div className="font-medium">
                        {player.kills}/{player.deaths}/{player.assists}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Damage Share</div>
                      <div className="font-medium">{damageShare.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">CS</div>
                      <div className="font-medium">{player.cs || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Vision</div>
                      <div className="font-medium">{player.vision_score || 0}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
