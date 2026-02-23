
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Shield, User } from 'lucide-react';
import { useTeamRoster } from '@/hooks/useTeamRoster';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export function TeamRosterWidget() {
  const { data: teamData, isLoading, error } = useTeamRoster();

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Team Roster</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton className="h-48" />
        </CardContent>
      </Card>
    );
  }

  if (error || !teamData) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Team Roster</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load team roster</p>
        </CardContent>
      </Card>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>{teamData.team.name} Roster</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your Role:</span>
            <div className="flex items-center space-x-1">
              {getRoleIcon(teamData.user.role)}
              <Badge variant="outline" className="capitalize">
                {teamData.user.role}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Active Players ({teamData.roster.length})</h4>
            {teamData.roster.length > 0 ? (
              <div className="space-y-2">
                {teamData.roster.slice(0, 5).map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-500 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
                        {player.summoner_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{player.summoner_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.role || 'No role assigned'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {player.rank || 'Unranked'}
                      </Badge>
                      {player.lp !== null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {player.lp} LP
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {teamData.roster.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{teamData.roster.length - 5} more players
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active players</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
