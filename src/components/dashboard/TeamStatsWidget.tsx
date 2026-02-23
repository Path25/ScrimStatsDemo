
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Users, Calendar } from 'lucide-react';
import { useTeamRoster } from '@/hooks/useTeamRoster';
import { useScrimsData } from '@/hooks/useScrimsData';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export function TeamStatsWidget() {
  const { data: teamData, isLoading: teamLoading } = useTeamRoster();
  const { scrims, isLoading: scrimsLoading } = useScrimsData();

  if (teamLoading || scrimsLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Team Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  const completedScrims = scrims.filter(s => s.status === 'completed');
  const wins = completedScrims.filter(s => 
    s.our_score && s.opponent_score && s.our_score > s.opponent_score
  ).length;
  const winRate = completedScrims.length > 0 ? Math.round((wins / completedScrims.length) * 100) : 0;
  const scheduledScrims = scrims.filter(s => s.status === 'scheduled').length;

  const stats = [
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      icon: Trophy,
      color: 'text-performance-excellent'
    },
    {
      label: 'Total Scrims',
      value: scrims.length.toString(),
      icon: Target,
      color: 'text-blue-500'
    },
    {
      label: 'Active Players',
      value: teamData?.roster.length.toString() || '0',
      icon: Users,
      color: 'text-electric-500'
    },
    {
      label: 'Scheduled',
      value: scheduledScrims.toString(),
      icon: Calendar,
      color: 'text-yellow-500'
    }
  ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Team Stats</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-lg font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
