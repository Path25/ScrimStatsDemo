
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, Shield, Sword } from 'lucide-react';
import { ChampionAvatar } from './ChampionAvatar';
import { parseChampionSelectData, type ParsedChampionSelectData } from '@/utils/championUtils';

interface RawDraftDisplayProps {
  rawDraftData: any;
  ourTeamSide?: 'blue' | 'red';
}

export const RawDraftDisplay: React.FC<RawDraftDisplayProps> = ({ 
  rawDraftData, 
  ourTeamSide = 'blue' 
}) => {
  if (!rawDraftData?.raw_champion_select) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No champion select data available
      </div>
    );
  }

  const parsedData = parseChampionSelectData(rawDraftData.raw_champion_select);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'PLANNING': return 'bg-blue-500/20 text-blue-400';
      case 'BAN_PICK': return 'bg-yellow-500/20 text-yellow-400';
      case 'FINALIZATION': return 'bg-green-500/20 text-green-400';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const TeamDisplay: React.FC<{ 
    team: ParsedChampionSelectData['ourTeam'], 
    title: string, 
    isOurTeam: boolean 
  }> = ({ team, title, isOurTeam }) => (
    <div>
      <h4 className={`font-medium mb-3 ${isOurTeam ? 'text-blue-400' : 'text-red-400'}`}>
        {title}
      </h4>
      <div className="space-y-2">
        {team.map((player, index) => (
          <div key={index} className={`p-3 rounded-lg border flex items-center space-x-3 ${
            isOurTeam ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'
          }`}>
            <ChampionAvatar 
              championName={player.championName === 'None' ? null : player.championName} 
              size="sm" 
            />
            <div className="flex-1">
              <div className="font-medium">
                {player.championName}
                {player.championId === 0 && (
                  <span className="text-muted-foreground ml-1">(Not selected)</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {player.summonerName}
                {player.position && (
                  <span className="ml-2">• {player.position}</span>
                )}
              </div>
            </div>
            {(player.spell1Id > 0 || player.spell2Id > 0) && (
              <div className="text-xs text-muted-foreground">
                Spells: {player.spell1Id}, {player.spell2Id}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const BansDisplay: React.FC<{ 
    bans: ParsedChampionSelectData['ourBans'], 
    title: string, 
    isOurTeam: boolean 
  }> = ({ bans, title, isOurTeam }) => (
    <div>
      <h4 className={`font-medium mb-3 ${isOurTeam ? 'text-blue-400' : 'text-red-400'}`}>
        {title}
      </h4>
      <div className="space-y-2">
        {bans.length > 0 ? bans.map((ban, index) => (
          <div key={index} className={`p-2 rounded border flex items-center space-x-3 ${
            isOurTeam ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'
          }`}>
            <ChampionAvatar championName={ban.championName} size="sm" />
            <div className="flex items-center justify-between flex-1">
              <span className="font-medium">{ban.championName}</span>
              <span className="text-sm text-muted-foreground">Ban {ban.order}</span>
            </div>
          </div>
        )) : (
          <div className="text-sm text-muted-foreground italic">
            No bans yet
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5" />
              <span>Champion Select Status</span>
            </div>
            <Badge className={getPhaseColor(parsedData.phase)}>
              {parsedData.phase.replace('_', ' ')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Game Type</div>
              <div className="font-medium">
                {parsedData.gameInfo.isCustomGame ? 'Custom Game' : 'Matchmade'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Our Side</div>
              <div className={`font-medium ${
                ourTeamSide === 'blue' ? 'text-blue-400' : 'text-red-400'
              }`}>
                {ourTeamSide?.charAt(0).toUpperCase() + ourTeamSide?.slice(1)} Side
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Time Remaining</div>
              <div className="font-medium">
                {Math.ceil(parsedData.gameInfo.timeLeftInPhase / 1000)}s
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Champion Select Data */}
      <Tabs defaultValue="picks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="picks" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Champion Picks
          </TabsTrigger>
          <TabsTrigger value="bans" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Champion Bans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="picks">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sword className="h-5 w-5" />
                Champion Picks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamDisplay 
                  team={parsedData.ourTeam} 
                  title={`Our Team (${ourTeamSide === 'blue' ? 'Blue' : 'Red'} Side)`}
                  isOurTeam={true}
                />
                <TeamDisplay 
                  team={parsedData.theirTeam} 
                  title={`Enemy Team (${ourTeamSide === 'blue' ? 'Red' : 'Blue'} Side)`}
                  isOurTeam={false}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bans">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Champion Bans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BansDisplay 
                  bans={parsedData.ourBans} 
                  title={`Our Bans (${ourTeamSide === 'blue' ? 'Blue' : 'Red'} Side)`}
                  isOurTeam={true}
                />
                <BansDisplay 
                  bans={parsedData.theirBans} 
                  title={`Enemy Bans (${ourTeamSide === 'blue' ? 'Red' : 'Blue'} Side)`}
                  isOurTeam={false}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
