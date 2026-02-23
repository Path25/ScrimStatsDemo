import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Users } from 'lucide-react';
import { extractParticipantsFromExternalData } from '@/utils/gameDataTransform';
import { determineGameResult } from '@/utils/gameResultHelpers';
import type { Scrim } from '@/hooks/useScrimsData';
import type { PlayerRole } from '@/types/scrimGame';

interface ChampionPerformanceProps {
  scrims: Scrim[];
}

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

export const ChampionPerformance: React.FC<ChampionPerformanceProps> = ({ scrims }) => {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  
  // Get all games with proper filtering and participant extraction
  const allGames = scrims.flatMap(scrim => {
    const scrimGames = scrim.scrim_games || [];
    return scrimGames
      .filter(game => {
        const hasExternalData = game.external_game_data && Object.keys(game.external_game_data).length > 0;
        const isValidStatus = game.status === 'completed' || game.status === 'in_progress';
        return hasExternalData || isValidStatus;
      })
      .map(game => {
        // Get game result
        const result = determineGameResult(game);
        
        // Extract participants with proper role assignment
        let participants = [];
        try {
          if (game.external_game_data?.post_game_data) {
            const extractedParticipants = extractParticipantsFromExternalData(game);
            participants = assignStandardRoles(extractedParticipants);
          } else {
            participants = assignStandardRoles(game.participants || []);
          }
        } catch (error) {
          console.warn('Failed to extract participants for champion analysis:', error);
          participants = assignStandardRoles(game.participants || []);
        }
        
        return {
          ...game,
          scrim,
          result,
          participants
        };
      });
  });

  console.log('Champion Performance - Processing games:', allGames.length);
  
  // Get all participants from our team
  const ourParticipants = allGames.flatMap(game => 
    game.participants.filter((p: any) => p.is_our_team)
  );

  console.log('Champion Performance - Our participants:', ourParticipants.length);
  
  // Log role assignments for debugging
  ourParticipants.forEach(p => {
    console.log(`Champion: ${p.champion_name}, Player: ${p.summoner_name}, Role: ${p.role}`);
  });

  // Analyze champion performance
  const championStats = ourParticipants.reduce((acc, participant) => {
    if (!participant.champion_name) return acc;
    
    const champion = participant.champion_name;
    const game = allGames.find(g => 
      g.participants.some((p: any) => p.id === participant.id)
    );
    const gameResult = game?.result;
    
    if (!acc[champion]) {
      acc[champion] = {
        name: champion,
        games: 0,
        wins: 0,
        totalKills: 0,
        totalDeaths: 0,
        totalAssists: 0,
        totalCS: 0,
        totalVisionScore: 0,
        roles: new Set(),
        champions: new Set(),
        players: new Set()
      };
    }
    
    acc[champion].games += 1;
    if (gameResult === 'win') acc[champion].wins += 1;
    acc[champion].totalKills += participant.kills || 0;
    acc[champion].totalDeaths += participant.deaths || 0;
    acc[champion].totalAssists += participant.assists || 0;
    acc[champion].totalCS += participant.cs || 0;
    acc[champion].totalVisionScore += participant.vision_score || 0;
    if (participant.role) acc[champion].roles.add(participant.role);
    if (participant.champion_name) acc[champion].champions.add(participant.champion_name);
    if (participant.summoner_name) acc[champion].players.add(participant.summoner_name);
    
    return acc;
  }, {} as Record<string, any>);

  // Convert to array and calculate derived stats
  const championData = Object.values(championStats).map((champ: any) => ({
    ...champ,
    winRate: champ.games > 0 ? Math.round((champ.wins / champ.games) * 100) : 0,
    avgKDA: champ.games > 0 ? ((champ.totalKills + champ.totalAssists) / Math.max(champ.totalDeaths, 1)) : 0,
    avgKills: champ.games > 0 ? Math.round((champ.totalKills / champ.games) * 10) / 10 : 0,
    avgCS: champ.games > 0 ? Math.round(champ.totalCS / champ.games) : 0,
    rolesArray: Array.from(champ.roles),
    playersArray: Array.from(champ.players)
  }));

  console.log('Champion Performance - Final champion data:', championData.length, championData);

  // Filter by role if selected
  const filteredChampions = selectedRole === 'all' 
    ? championData 
    : championData.filter(champ => champ.rolesArray.includes(selectedRole));

  // Sort by different criteria with minimum games filter
  const topByWinRate = [...filteredChampions]
    .filter(c => c.games >= 1)
    .sort((a, b) => {
      if (b.winRate === a.winRate) {
        return b.games - a.games;
      }
      return b.winRate - a.winRate;
    })
    .slice(0, 10);

  const topByGames = [...filteredChampions]
    .sort((a, b) => b.games - a.games)
    .slice(0, 10);

  const topByKDA = [...filteredChampions]
    .filter(c => c.games >= 1)
    .sort((a, b) => {
      if (Math.abs(b.avgKDA - a.avgKDA) < 0.1) {
        return b.games - a.games;
      }
      return b.avgKDA - a.avgKDA;
    })
    .slice(0, 10);

  const roles = ['all', 'top', 'jungle', 'mid', 'adc', 'support'];

  const getPerformanceColor = (winRate: number) => {
    if (winRate >= 70) return 'text-performance-excellent';
    if (winRate >= 50) return 'text-performance-average';
    return 'text-performance-terrible';
  };

  const ChampionCard = ({ champion }: { champion: any }) => (
    <div className="p-4 rounded border border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{champion.name}</p>
          <div className="flex space-x-2 mt-1">
            {champion.rolesArray.slice(0, 2).map((role: string) => (
              <Badge key={role} variant="outline" className="text-xs">
                {role.toUpperCase()}
              </Badge>
            ))}
            {champion.rolesArray.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{champion.rolesArray.length - 2}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${getPerformanceColor(champion.winRate)}`}>
            {champion.winRate}%
          </p>
          <p className="text-xs text-muted-foreground">
            {champion.wins}/{champion.games} games
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="text-muted-foreground">KDA</p>
          <p className="font-medium">{champion.avgKDA.toFixed(1)}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Avg Kills</p>
          <p className="font-medium">{champion.avgKills}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Avg CS</p>
          <p className="font-medium">{champion.avgCS}</p>
        </div>
      </div>
      
      <div>
        <p className="text-xs text-muted-foreground">
          Played by: {champion.playersArray.slice(0, 3).join(', ')}
          {champion.playersArray.length > 3 && ` +${champion.playersArray.length - 3} more`}
        </p>
      </div>
    </div>
  );

  // Show data status for debugging
  if (championData.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Champion Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No champion data available</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Games processed: {allGames.length}</p>
                <p>Our participants: {ourParticipants.length}</p>
                <p>Champion stats entries: {Object.keys(championStats).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Filter */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Filter by Role:</span>
        <div className="flex space-x-2">
          {roles.map(role => (
            <Badge
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedRole(role)}
            >
              {role === 'all' ? 'All Roles' : role.toUpperCase()}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="winrate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="winrate">
            <Trophy className="w-4 h-4 mr-2" />
            Top Win Rate
          </TabsTrigger>
          <TabsTrigger value="popular">
            <Users className="w-4 h-4 mr-2" />
            Most Played
          </TabsTrigger>
          <TabsTrigger value="kda">
            <TrendingUp className="w-4 h-4 mr-2" />
            Best KDA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="winrate">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Champions with Highest Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {topByWinRate.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {topByWinRate.map((champion, index) => (
                    <ChampionCard key={champion.name} champion={champion} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No champions found for the selected role filter.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popular">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Most Played Champions</CardTitle>
            </CardHeader>
            <CardContent>
              {topByGames.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {topByGames.map((champion, index) => (
                    <ChampionCard key={champion.name} champion={champion} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No champions found for the selected role filter.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kda">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Champions with Best KDA</CardTitle>
            </CardHeader>
            <CardContent>
              {topByKDA.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {topByKDA.map((champion, index) => (
                    <ChampionCard key={champion.name} champion={champion} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No champions found for the selected role filter.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
