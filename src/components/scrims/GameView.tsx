
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Zap, Play } from 'lucide-react';
import { DraftView } from './DraftView';
import { LiveGameTracker } from './LiveGameTracker';
import { LiveMonitoringDashboard } from './LiveMonitoringDashboard';
import { DesktopAppStatus } from './DesktopAppStatus';
import { GamePerformanceView } from './GamePerformanceView';
import { PostGameDataViewer } from './PostGameDataViewer';
import { useGridMonitoring } from '@/hooks/useGridMonitoring';
import type { ScrimGame } from '@/types/scrimGame';

interface GameViewProps {
  game: ScrimGame;
}

export const GameView: React.FC<GameViewProps> = ({ game }) => {
  const hasPostGameData = game.external_game_data?.post_game_data;
  
  // Check if this game has GRID metadata and needs data completion
  const gridMetadata = game.external_game_data?.grid_metadata;
  const hasGridData = !!gridMetadata?.seriesId;
  const isGridPlaceholder = gridMetadata?.status === 'placeholder' || gridMetadata?.created_as_placeholder;
  const needsGridCompletion = hasGridData && (
    game.status !== 'completed' || 
    !hasPostGameData?.participants?.length ||
    gridMetadata?.didWeWin === undefined ||
    isGridPlaceholder
  );

  // Get Grid monitoring functions
  const { 
    isMonitoring, 
    manualCheck, 
    startMonitoring 
  } = useGridMonitoring(game.scrim_id);

  return (
    <div className="w-full space-y-4">
      {/* Grid Data Status & Actions */}
      {needsGridCompletion && (
        <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  GRID Data Incomplete
                </Badge>
                {isMonitoring && (
                  <Badge className="bg-electric-500 animate-pulse">
                    <Zap className="w-3 h-3 mr-1" />
                    Monitoring Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isGridPlaceholder 
                  ? "Placeholder game - waiting for completion data from GRID API"
                  : "Game needs additional data from GRID API (duration, side, participant details)"
                }
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={manualCheck}
              disabled={!hasGridData}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Check Now
            </Button>
            {!isMonitoring && (
              <Button
                variant="default"
                size="sm"
                onClick={() => startMonitoring(true)}
                className="bg-electric-500 hover:bg-electric-600"
              >
                <Play className="w-3 h-3 mr-1" />
                Start Monitoring
              </Button>
            )}
          </div>
        </div>
      )}

      <Tabs defaultValue="draft" className="w-full">
        <TabsList className={`grid w-full ${hasPostGameData ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="live">Live Tracking</TabsTrigger>
          <TabsTrigger value="monitoring">Desktop Monitor</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          {hasPostGameData && <TabsTrigger value="postgame">Post-Game Data</TabsTrigger>}
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

      <TabsContent value="draft">
        <DraftView game={game} />
      </TabsContent>

      <TabsContent value="live">
        <LiveGameTracker gameId={game.id} />
      </TabsContent>

      <TabsContent value="monitoring">
        <LiveMonitoringDashboard game={game} />
      </TabsContent>

      <TabsContent value="performance">
        <GamePerformanceView game={game} />
      </TabsContent>

      {hasPostGameData && (
        <TabsContent value="postgame">
          <PostGameDataViewer game={game} />
        </TabsContent>
      )}

      <TabsContent value="status">
        <DesktopAppStatus game={game} />
      </TabsContent>
      </Tabs>
    </div>
  );
};
