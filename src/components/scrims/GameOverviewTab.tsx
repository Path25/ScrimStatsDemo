
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, Users, Target } from 'lucide-react';
import { ChampionAvatar } from './ChampionAvatar';
import { ItemIcon } from './ItemIcon';
import { extractParticipantsFromExternalData } from '@/utils/gameDataTransform';
import { determineGameResult } from '@/utils/gameResultHelpers';
import type { ScrimGame, ScrimParticipant, PlayerRole } from '@/types/scrimGame';

interface GameOverviewTabProps {
  game: ScrimGame;
  participants: ScrimParticipant[];
}

export const GameOverviewTab: React.FC<GameOverviewTabProps> = ({ game, participants }) => {
  // Extract participants with same logic as other components
  const externalParticipants = extractParticipantsFromExternalData(game);
  
  // DEBUG: Log both sources to see which has correct order and items structure
  console.log('🔧 PASSED participants:', participants.map(p => `${p.summoner_name} (${p.champion_name}) - Team: ${p.is_our_team ? 'OUR' : 'ENEMY'}`));
  console.log('🔧 EXTRACTED participants:', externalParticipants.map(p => `${p.summoner_name} (${p.champion_name}) - Team: ${p.is_our_team ? 'OUR' : 'ENEMY'}`));
  
  // DEBUG: Check items structure
  if (participants.length > 0) {
    console.log('🔧 PASSED participant items sample:', participants[0].items);
  }
  if (externalParticipants.length > 0) {
    console.log('🔧 EXTRACTED participant items sample:', externalParticipants[0].items);
  }
  
  // Use extracted data for correct order, but merge with original data for items
  const shouldUseExternalData = externalParticipants.length > 0;
  
  let effectiveParticipants = shouldUseExternalData ? externalParticipants : participants;
  
  // If using extracted data, merge items from original participants
  if (shouldUseExternalData && participants.length > 0) {
    effectiveParticipants = externalParticipants.map(extractedParticipant => {
      // Find matching participant in original array by summoner name
      const originalParticipant = participants.find(p => 
        p.summoner_name === extractedParticipant.summoner_name
      );
      
      // Use items from original participant if found, otherwise keep extracted
      return {
        ...extractedParticipant,
        items: originalParticipant?.items || extractedParticipant.items
      };
    });
    console.log('🔧 MERGED: Using extracted order with original items');
  } else {
    console.log('🔧 USING:', shouldUseExternalData ? 'EXTRACTED' : 'PASSED');
  }
  const gameResult = determineGameResult(game);

  // Smart role assignment: use actual roles from data, fallback to standard order only when needed
  const standardRoles: PlayerRole[] = ['top', 'jungle', 'mid', 'adc', 'support'];
  
  const assignRoles = (teamParticipants: ScrimParticipant[]) => {
    // Log the exact order we receive the participants
    console.log('📋 assignRoles input order:', teamParticipants.map(p => `${p.summoner_name} (${p.champion_name})`));
    
    // Assign roles based purely on the order we receive them - NO REORDERING
    const result = teamParticipants.map((participant, index) => ({
      ...participant,
      role: standardRoles[index] || 'top'
    }));
    
    console.log('📋 assignRoles output:', result.map(p => `${p.summoner_name}: ${p.role}`));
    return result;
  };

  // Log the order BEFORE filtering to debug any reordering
  console.log('🔍 effectiveParticipants order BEFORE filtering:', effectiveParticipants.map(p => `${p.summoner_name} (${p.champion_name}) - Team: ${p.is_our_team ? 'OUR' : 'ENEMY'}`));

  const ourTeamRaw = effectiveParticipants.filter(p => p.is_our_team);
  const enemyTeamRaw = effectiveParticipants.filter(p => !p.is_our_team);
  
  console.log('🔍 ourTeamRaw AFTER filtering:', ourTeamRaw.map(p => `${p.summoner_name} (${p.champion_name})`));
  console.log('🔍 enemyTeamRaw AFTER filtering:', enemyTeamRaw.map(p => `${p.summoner_name} (${p.champion_name})`));
  
  const ourTeam = assignRoles(ourTeamRaw);
  const enemyTeam = assignRoles(enemyTeamRaw);

  // Calculate actual kill totals from participants
  const ourTeamKills = ourTeam.reduce((sum, p) => sum + (p.kills || 0), 0);
  const enemyTeamKills = enemyTeam.reduce((sum, p) => sum + (p.kills || 0), 0);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'text-green-400';
      case 'loss': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getSideColor = (side: string) => {
    switch (side) {
      case 'blue': return 'text-blue-400';
      case 'red': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const ParticipantRow: React.FC<{ participant: ScrimParticipant }> = ({ participant }) => {
    // Debug items structure
    console.log(`🔧 Items for ${participant.summoner_name}:`, participant.items);
    
    // Handle different items structures between passed and extracted data
    let itemIds: number[] = [];
    
    if (participant.items && Array.isArray(participant.items)) {
      itemIds = participant.items
        .map(item => {
          // Handle both number[] format and {id: number}[] format
          if (typeof item === 'number') return item;
          if (typeof item === 'object' && item.id) return item.id;
          return null;
        })
        .filter(Boolean) as number[];
    }
    
    console.log(`🔧 Processed itemIds for ${participant.summoner_name}:`, itemIds);

    const handleItemError = (itemId: number) => {
      console.warn(`Failed to load item ${itemId} - may need manual endpoint configuration`);
    };

    return (
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
        <div className="flex items-center space-x-3">
          <ChampionAvatar championName={participant.champion_name} size="sm" />
          <div>
            <div className="font-medium">{participant.summoner_name}</div>
            <div className="text-sm text-muted-foreground">
              {participant.champion_name}
              {participant.role && (
                <span className="ml-2">• {participant.role.charAt(0).toUpperCase() + participant.role.slice(1)}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-sm font-medium">
              {participant.kills}/{participant.deaths}/{participant.assists}
            </div>
            <div className="text-xs text-muted-foreground">K/D/A</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium">{participant.cs || 0}</div>
            <div className="text-xs text-muted-foreground">CS</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium">{participant.gold?.toLocaleString() || 0}</div>
            <div className="text-xs text-muted-foreground">Gold</div>
          </div>

          <div className="flex space-x-1">
            {itemIds.slice(0, 6).map((itemId, index) => (
              <div key={index} onError={() => handleItemError(itemId)}>
                <ItemIcon 
                  itemId={itemId} 
                  size="sm" 
                  showTooltip={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (effectiveParticipants.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Game Data</h3>
            <p className="text-muted-foreground">
              Game overview will appear here when participant data is available
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Result</span>
            </div>
            <div className={`text-2xl font-bold ${getResultColor(gameResult)}`}>
              {gameResult ? gameResult.toUpperCase() : 'PENDING'}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Duration</span>
            </div>
            <div className="text-2xl font-bold">
              {formatDuration(game.duration_seconds)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Kills</span>
            </div>
            <div className="text-2xl font-bold">
              {ourTeamKills} - {enemyTeamKills}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Side</span>
            </div>
            <div className={`text-2xl font-bold ${getSideColor(game.side || '')}`}>
              {game.side ? game.side.toUpperCase() : 'UNKNOWN'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center justify-between">
              <span>Our Team</span>
              <Badge className="bg-blue-500/20 text-blue-400">
                {ourTeam.length} players
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ourTeam.map((participant, index) => (
              <ParticipantRow key={participant.id || index} participant={participant} />
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center justify-between">
              <span>Enemy Team</span>
              <Badge className="bg-red-500/20 text-red-400">
                {enemyTeam.length} players
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {enemyTeam.map((participant, index) => (
              <ParticipantRow key={participant.id || index} participant={participant} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
