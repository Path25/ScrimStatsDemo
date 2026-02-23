
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Trophy, Sword, Shield, Target, Clock, Coins } from 'lucide-react';
import { getChampionName } from '@/utils/championUtils';
import type { ScrimGame } from '@/types/scrimGame';

interface PostGameDataViewerProps {
  game: ScrimGame;
}

export const PostGameDataViewer: React.FC<PostGameDataViewerProps> = ({ game }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Access the nested post game data structure
  const postGameData = game.external_game_data?.post_game_data;
  
  // Debug logging to see what data we have
  console.log('Full external_game_data:', game.external_game_data);
  console.log('Post game data:', postGameData);
  
  if (!postGameData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No post-game data available</p>
          {game.external_game_data && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-blue-400">Show available data</summary>
              <pre className="text-xs bg-background/50 p-4 rounded mt-2 overflow-auto max-h-48">
                {JSON.stringify(game.external_game_data, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatStatValue = (key: string, value: any) => {
    if (typeof value !== 'number') return value;
    
    // Gold and damage values
    if (key.includes('gold') || key.includes('Gold') || key.includes('GOLD') || 
        key.includes('damage') || key.includes('Damage') || key.includes('DAMAGE')) {
      return value.toLocaleString();
    }
    
    // Time values (assuming they're in seconds)
    if (key.includes('TIME') && key !== 'TOTAL_TIME_SPENT_DEAD') {
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return value;
  };

  const getStatIcon = (key: string) => {
    if (key.includes('kill') || key.includes('death') || key.includes('assist') ||
        key.includes('Kill') || key.includes('Death') || key.includes('Assist')) return <Sword className="h-3 w-3" />;
    if (key.includes('damage') || key.includes('Damage')) return <Target className="h-3 w-3" />;
    if (key.includes('gold') || key.includes('Gold')) return <Coins className="h-3 w-3" />;
    if (key.includes('time') || key.includes('Time')) return <Clock className="h-3 w-3" />;
    if (key.includes('heal') || key.includes('shield') || key.includes('Heal') || key.includes('Shield')) return <Shield className="h-3 w-3" />;
    return null;
  };

  const renderPlayerCard = (player: any, teamIndex: number) => {
    console.log('Rendering player:', player);
    
    return (
      <Card key={player.puuid || player.summonerName || player.riotIdGameName || `player-${teamIndex}`} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-xs font-medium">
                  {player.championName ? player.championName.slice(0, 3) : 
                   player.championId ? getChampionName(player.championId).slice(0, 3) : 'N/A'}
                </span>
              </div>
              <div>
                <h4 className="font-semibold">
                  {player.riotIdGameName || player.summonerName || 'Unknown Player'}
                  {player.riotIdTagLine && `#${player.riotIdTagLine}`}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {player.championName || (player.championId ? getChampionName(player.championId) : 'Unknown Champion')} • Level {player.champLevel || player.level || 1}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={player.win ? "default" : "secondary"}>
                {player.win ? 'Victory' : 'Defeat'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">
                Team {player.teamId}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="kda" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="kda">KDA</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="damage">Damage</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>
            
            <TabsContent value="kda" className="mt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">{player.kills || 0}</div>
                  <div className="text-xs text-muted-foreground">Kills</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{player.deaths || 0}</div>
                  <div className="text-xs text-muted-foreground">Deaths</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{player.assists || 0}</div>
                  <div className="text-xs text-muted-foreground">Assists</div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">KDA Ratio:</span>
                  <span className="ml-2 font-medium">
                    {player.deaths > 0 
                      ? ((player.kills + player.assists) / player.deaths).toFixed(2)
                      : 'Perfect'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">CS:</span>
                  <span className="ml-2 font-medium">{player.totalMinionsKilled || player.neutralMinionsKilled || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Vision Score:</span>
                  <span className="ml-2 font-medium">{player.visionScore || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gold:</span>
                  <span className="ml-2 font-medium">{formatStatValue('gold', player.goldEarned || 0)}</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="items" className="mt-4">
              <div className="grid grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((slot) => {
                  const itemId = player[`item${slot}`] || 0;
                  return (
                    <div key={slot} className="w-8 h-8 bg-muted rounded border flex items-center justify-center">
                      <span className="text-xs">{itemId || '—'}</span>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="damage" className="mt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Damage Dealt:</span>
                  <span className="font-medium">{formatStatValue('damage', player.totalDamageDealt || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Damage to Champions:</span>
                  <span className="font-medium">{formatStatValue('damage', player.totalDamageDealtToChampions || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Damage Taken:</span>
                  <span className="font-medium">{formatStatValue('damage', player.totalDamageTaken || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gold Earned:</span>
                  <span className="font-medium">{formatStatValue('gold', player.goldEarned || 0)}</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="mt-4">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0">
                    View All Stats
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 max-h-48 overflow-y-auto">
                  <div className="space-y-1 text-xs">
                    {Object.entries(player).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          {getStatIcon(key)}
                          <span className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        </div>
                        <span className="font-medium">{formatStatValue(key, value)}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Game Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Post-Game Data Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold">{formatDuration(postGameData.gameDuration || 0)}</div>
              <div className="text-sm text-muted-foreground">Game Duration</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{postGameData.gameMode || 'Unknown'}</div>
              <div className="text-sm text-muted-foreground">Game Mode</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{postGameData.gameType || 'Unknown'}</div>
              <div className="text-sm text-muted-foreground">Game Type</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{postGameData.gameId || 'Unknown'}</div>
              <div className="text-sm text-muted-foreground">Game ID</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams and Players */}
      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="teams">Teams & Players</TabsTrigger>
          <TabsTrigger value="localPlayer">Local Player</TabsTrigger>
          <TabsTrigger value="rawData">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-6">
          {postGameData.teams?.map((team: any, index: number) => (
            <Card key={team.teamId || index} className={`glass-card ${
              team.win ? 'border-green-500/30' : 'border-red-500/30'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Team {team.teamId} {team.name && `- ${team.name}`}</span>
                  <Badge variant={team.win ? "default" : "secondary"}>
                    {team.win ? 'Victory' : 'Defeat'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {team.participants?.length > 0 ? (
                  <div className="space-y-4">
                    {team.participants.map((player: any, playerIndex: number) => renderPlayerCard(player, playerIndex))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No player data available</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="localPlayer" className="space-y-4">
          {postGameData.localPlayer ? (
            renderPlayerCard(postGameData.localPlayer, 0)
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No local player data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rawData" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Raw JSON Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-background/50 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(game.external_game_data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
