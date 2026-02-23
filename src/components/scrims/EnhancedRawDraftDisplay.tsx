
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, Shield, Sword, Timer } from 'lucide-react';
import { parseChampionSelectData, type ParsedChampionSelectData } from '@/utils/championUtils';
import { ChampionAvatar } from './ChampionAvatar';

interface EnhancedRawDraftDisplayProps {
  rawDraftData: any;
  ourTeamSide?: 'blue' | 'red';
}

export const EnhancedRawDraftDisplay: React.FC<EnhancedRawDraftDisplayProps> = ({ 
  rawDraftData, 
  ourTeamSide = 'blue' 
}) => {
  if (!rawDraftData?.raw_champion_select) {
    return (
      <Card className="glass-card">
        <CardContent className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Champion Select Data</h3>
          <p className="text-muted-foreground">
            Champion select data will appear here when the draft begins
          </p>
        </CardContent>
      </Card>
    );
  }

  const parsedData = parseChampionSelectData(rawDraftData.raw_champion_select);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'PLANNING': return 'bg-blue-500/20 text-blue-400 border-blue-400';
      case 'BAN_PICK': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400';
      case 'FINALIZATION': return 'bg-green-500/20 text-green-400 border-green-400';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  const TeamDisplay: React.FC<{ 
    team: ParsedChampionSelectData['ourTeam'], 
    title: string, 
    isOurTeam: boolean 
  }> = ({ team, title, isOurTeam }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isOurTeam ? 'bg-blue-400' : 'bg-red-400'}`}></div>
        <h4 className={`font-semibold ${isOurTeam ? 'text-blue-400' : 'text-red-400'}`}>
          {title}
        </h4>
      </div>
      
      <div className="grid gap-3">
        {team.map((player, index) => (
          <div key={index} className={`p-4 rounded-lg border transition-all hover:shadow-md ${
            isOurTeam 
              ? 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10' 
              : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
          }`}>
            <div className="flex items-center gap-3">
              <ChampionAvatar 
                championName={player.championName} 
                size="md"
              />
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {player.championName}
                  {player.championId === 0 && (
                    <Badge variant="outline" className="text-xs">
                      Not Selected
                    </Badge>
                  )}
                </div>
                {player.position && (
                  <div className="text-sm text-primary">
                    {player.position}
                  </div>
                )}
              </div>
            </div>
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
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isOurTeam ? 'bg-blue-400' : 'bg-red-400'}`}></div>
        <h4 className={`font-semibold ${isOurTeam ? 'text-blue-400' : 'text-red-400'}`}>
          {title}
        </h4>
      </div>
      
      {bans.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {bans.map((ban, index) => (
            <div key={index} className={`p-3 rounded-lg border text-center transition-all hover:shadow-md ${
              isOurTeam 
                ? 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10' 
                : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
            }`}>
              <ChampionAvatar 
                championName={ban.championName} 
                size="sm"
              />
              <div className="mt-2">
                <div className="font-medium text-sm">{ban.championName}</div>
                <div className="text-xs text-muted-foreground">Ban {ban.order}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm italic">No bans yet</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Game Status */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-primary" />
              <span>Champion Select</span>
            </div>
            <Badge className={getPhaseColor(parsedData.phase)}>
              {parsedData.phase.replace('_', ' ')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Game Type</div>
              <div className="font-medium">
                {parsedData.gameInfo.isCustomGame ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Custom Game
                  </Badge>
                ) : (
                  <Badge variant="outline">Matchmade</Badge>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Our Side</div>
              <Badge className={
                ourTeamSide === 'blue' 
                  ? 'bg-blue-500/20 text-blue-400 border-blue-400' 
                  : 'bg-red-500/20 text-red-400 border-red-400'
              }>
                {ourTeamSide?.charAt(0).toUpperCase() + ourTeamSide?.slice(1)} Side
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Time Remaining</div>
              <div className="font-medium text-lg">
                {Math.ceil(parsedData.gameInfo.timeLeftInPhase / 1000)}s
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Status</div>
              <div className="font-medium text-primary">
                {parsedData.phase === 'FINALIZATION' ? 'Ready' : 'In Progress'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Champion Select Tabs */}
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

        <TabsContent value="picks" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sword className="h-5 w-5" />
                Team Compositions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

        <TabsContent value="bans" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Banned Champions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
