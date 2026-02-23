
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Users, Calendar } from 'lucide-react';
import { useScrimGames } from '@/hooks/useScrimGames';
import { useScrimParticipants } from '@/hooks/useScrimParticipants';
import { useLiveGameData } from '@/hooks/useLiveGameData';
import { GameOverviewTab } from './GameOverviewTab';
import { DraftView } from './DraftView';
import { CoachFeedback } from './CoachFeedback';
import { LiveGameChart } from './LiveGameChart';
import { GameTimeline } from './GameTimeline';
import { ExternalDataAnalytics } from './analytics/ExternalDataAnalytics';
import { TeamCompositionAnalysis } from './analytics/TeamCompositionAnalysis';
import { DamageAnalysisChart } from './analytics/DamageAnalysisChart';
import { PageHeader } from '@/components/layout/PageHeader';

interface GameDetailsViewProps {
  scrimId: string;
  gameId?: string;
  onClose: () => void;
}

export const GameDetailsView: React.FC<GameDetailsViewProps> = ({
  scrimId,
  gameId,
  onClose
}) => {
  const { scrimGames, isLoading: gamesLoading } = useScrimGames(scrimId);
  const { participants, isLoading: participantsLoading } = useScrimParticipants(gameId);
  const { liveData, isLoading: liveDataLoading } = useLiveGameData(gameId);

  const game = gameId ? scrimGames.find(g => g.id === gameId) : scrimGames[0];

  if (gamesLoading || participantsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading game details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">Game not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-electric-500/20 text-electric-500 animate-pulse';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const badges = [
    {
      label: game.status.replace('_', ' ').toUpperCase(),
      className: getStatusColor(game.status)
    }
  ];

  if (game.result) {
    badges.push({
      label: game.result.toUpperCase(),
      className: game.result === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
    });
  }

  if (game.side) {
    badges.push({
      label: game.side === 'blue' ? 'Blue Side' : 'Red Side',
      className: game.side === 'blue' ? 'text-blue-400 border-blue-400' : 'text-red-400 border-red-400'
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Enhanced Header */}
        <PageHeader
          title={`Game ${game.game_number}`}
          subtitle={`Scrim match details and analysis`}
          onBack={onClose}
          badges={badges}
          icon={<Trophy className="h-6 w-6 text-primary" />}
        />

        {/* Enhanced Tabs */}
        <Tabs defaultValue="overview" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="draft" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Draft</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview" className="mt-0">
              <GameOverviewTab game={game} participants={participants} />
            </TabsContent>

            <TabsContent value="draft" className="mt-0">
              <DraftView game={game} />
            </TabsContent>

            <TabsContent value="feedback" className="mt-0">
              <CoachFeedback 
                game={game} 
                participants={participants}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div className="space-y-8">
                {/* External Data Analytics - now using client-side approach */}
                <ExternalDataAnalytics game={game} participants={participants} />
                
                {/* Team Composition Analysis */}
                <TeamCompositionAnalysis game={game} participants={participants} />
                
                {/* Damage Analysis */}
                <DamageAnalysisChart game={game} participants={participants} />
                
                {/* Live Data Charts (if available) */}
                {liveData.length > 0 && (
                  <div className="space-y-6">
                    <div className="border-t pt-8">
                      <h3 className="text-lg font-semibold mb-6">Live Game Timeline</h3>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <LiveGameChart liveData={liveData} metric="kills" />
                        <LiveGameChart liveData={liveData} metric="gold" />
                      </div>
                      <div className="mt-6">
                        <GameTimeline liveData={liveData} />
                      </div>
                    </div>
                  </div>
                )}

                {liveData.length === 0 && (
                  <div className="text-center py-8 glass-card rounded-lg border-t">
                    <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Live timeline data not available for this game
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
