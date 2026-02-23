
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sword, Shield, Heart, Star } from 'lucide-react';
import { ChampionAvatar } from './ChampionAvatar';
import { ItemIcon } from './ItemIcon';
import { SummonerSpellIcon } from './SummonerSpellIcon';
import { RuneIcon } from './RuneIcon';
import type { ScrimParticipant } from '@/types/scrimGame';

interface EnhancedParticipantCardProps {
  participant: ScrimParticipant;
  isOurTeam: boolean;
  teamKills: number;
}

export const EnhancedParticipantCard: React.FC<EnhancedParticipantCardProps> = ({
  participant,
  isOurTeam,
  teamKills
}) => {
  const getKDA = () => {
    const kills = participant.kills || 0;
    const deaths = participant.deaths || 0;
    const assists = participant.assists || 0;
    
    if (deaths === 0) return kills + assists > 0 ? 'Perfect' : '0.00';
    return ((kills + assists) / deaths).toFixed(2);
  };

  const getKillParticipation = () => {
    if (teamKills === 0) return 0;
    const playerKills = (participant.kills || 0) + (participant.assists || 0);
    return (playerKills / teamKills) * 100;
  };

  const getPerformanceColor = () => {
    const kda = parseFloat(getKDA());
    if (kda >= 2.0) return 'text-green-400';
    if (kda >= 1.0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPerformanceLevel = () => {
    const kda = parseFloat(getKDA());
    if (kda >= 3.0) return 'Excellent';
    if (kda >= 2.0) return 'Good';
    if (kda >= 1.0) return 'Average';
    return 'Below Average';
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'top': return 'text-blue-400 border-blue-400';
      case 'jungle': return 'text-green-400 border-green-400';
      case 'mid': return 'text-yellow-400 border-yellow-400';
      case 'adc': return 'text-red-400 border-red-400';
      case 'support': return 'text-purple-400 border-purple-400';
      default: return 'text-muted-foreground border-border';
    }
  };

  return (
    <Card className={`hover:esports-glow transition-all duration-300 ${
      isOurTeam 
        ? 'border-blue-500/20 bg-blue-500/5' 
        : 'border-red-500/20 bg-red-500/5'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <ChampionAvatar 
              championName={participant.champion_name || 'Unknown'} 
              size="md" 
            />
            <div>
              <div className="font-semibold text-lg">{participant.summoner_name}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{participant.champion_name}</span>
                {participant.role && (
                  <Badge variant="outline" className={`text-xs ${getRoleColor(participant.role)}`}>
                    {participant.role.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Badge variant="outline" className={getPerformanceColor()}>
            {getPerformanceLevel()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* KDA */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sword className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">KDA</span>
            </div>
            <div className="font-bold">
              <span>{participant.kills || 0}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-red-400">{participant.deaths || 0}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span>{participant.assists || 0}</span>
            </div>
            <div className={`text-sm ${getPerformanceColor()}`}>
              {getKDA()} KDA
            </div>
          </div>

          {/* CS & Gold */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Farm</span>
            </div>
            <div className="font-bold">
              {participant.cs || 0} CS
            </div>
            {participant.gold && (
              <div className="text-sm text-muted-foreground">
                {(participant.gold / 1000).toFixed(1)}k gold
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        {participant.items && participant.items.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2">Items</div>
            <div className="flex gap-1 flex-wrap">
              {participant.items.slice(0, 6).map((item, index) => (
                <ItemIcon
                  key={index}
                  itemId={item.id}
                  itemName={item.name}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Summoner Spells & Runes */}
        <div className="flex items-center justify-between mb-4">
          {/* Summoner Spells */}
          {participant.summoner_spells && participant.summoner_spells.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Summoners</div>
              <div className="flex gap-1">
                {participant.summoner_spells.map((spell, index) => (
                  <SummonerSpellIcon
                    key={index}
                    spellId={spell.id}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Primary Rune */}
          {participant.runes?.runes && participant.runes.runes.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Keystone</div>
              <div className="flex gap-1">
                <RuneIcon
                  runeId={participant.runes.runes[0]}
                  size="md"
                  isPrimary={true}
                />
                {participant.runes.runes[4] && (
                  <RuneIcon
                    runeId={participant.runes.runes[4]}
                    size="sm"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Kill Participation */}
        {teamKills > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">Kill Participation</span>
              <span className="text-xs font-medium">{getKillParticipation().toFixed(0)}%</span>
            </div>
            <Progress value={getKillParticipation()} className="h-1" />
          </div>
        )}

        {/* Performance Stats */}
        {(participant.damage_dealt || participant.damage_taken) && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {participant.damage_dealt && (
                <div>
                  <span className="text-muted-foreground">To Champions:</span>
                  <span className="ml-1 font-medium">
                    {(participant.damage_dealt / 1000).toFixed(0)}k
                  </span>
                </div>
              )}
              {participant.damage_taken && (
                <div>
                  <span className="text-muted-foreground">Taken:</span>
                  <span className="ml-1 font-medium">
                    {(participant.damage_taken / 1000).toFixed(0)}k
                  </span>
                </div>
              )}
              {participant.vision_score && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Vision Score:</span>
                  <span className="ml-1 font-medium">{participant.vision_score}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
