
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Wifi, WifiOff, Play, Square, Activity, Users, Target, Clock } from 'lucide-react';
import { useLiveGameData } from '@/hooks/useLiveGameData';
import { useScrimGames } from '@/hooks/useScrimGames';
import { useGameDrafts } from '@/hooks/useGameDrafts';
import type { ScrimGame } from '@/types/scrimGame';
import { toast } from 'sonner';

interface LiveMonitoringDashboardProps {
  game: ScrimGame;
}

interface DesktopConnectionStatus {
  isConnected: boolean;
  sessionId: string | null;
  lastHeartbeat: Date | null;
  version: string | null;
}

export const LiveMonitoringDashboard: React.FC<LiveMonitoringDashboardProps> = ({ game }) => {
  const { liveData, latestLiveData, isLoading } = useLiveGameData(game.id, true);
  const { updateScrimGame } = useScrimGames();
  const { draft } = useGameDrafts(game.id);
  const [connectionStatus, setConnectionStatus] = useState<DesktopConnectionStatus>({
    isConnected: false,
    sessionId: null,
    lastHeartbeat: null,
    version: null
  });

  // Check if we should be monitoring for desktop data
  const shouldMonitorDesktop = draft?.draft_mode === 'client' || game.desktop_session_id;

  // Simulate connection status (in real app, this would come from the desktop app heartbeat)
  useEffect(() => {
    if (shouldMonitorDesktop) {
      const interval = setInterval(() => {
        // Check for recent live data to determine connection status
        const recentData = liveData.find(data => 
          new Date(data.timestamp).getTime() > Date.now() - 30000 // 30 seconds
        );
        
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: !!recentData,
          lastHeartbeat: recentData ? new Date(recentData.timestamp) : prev.lastHeartbeat,
          sessionId: game.desktop_session_id || prev.sessionId
        }));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [shouldMonitorDesktop, liveData, game.desktop_session_id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartMonitoring = () => {
    updateScrimGame({
      id: game.id,
      status: 'in_progress',
      game_start_time: new Date().toISOString()
    });
    toast.success('Game monitoring started - Desktop app will begin capturing data');
  };

  const handleStopMonitoring = () => {
    updateScrimGame({
      id: game.id,
      status: 'completed',
      game_end_time: new Date().toISOString()
    });
    toast.success('Game monitoring stopped');
  };

  if (!shouldMonitorDesktop) {
    return (
      <Alert>
        <Monitor className="h-4 w-4" />
        <AlertDescription>
          Live monitoring is only available when using "Live Client Capture" draft mode. 
          Switch to Live Client Capture in the Draft tab to enable real-time monitoring.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-6 w-6 text-primary" />
              <span>Desktop App Connection</span>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus.isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <Badge className="bg-green-500/20 text-green-500">Connected</Badge>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <Badge className="bg-red-500/20 text-red-500">Disconnected</Badge>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Session ID</div>
              <div className="font-mono text-xs">
                {connectionStatus.sessionId || 'Not connected'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Last Heartbeat</div>
              <div className="font-mono text-xs">
                {connectionStatus.lastHeartbeat 
                  ? connectionStatus.lastHeartbeat.toLocaleTimeString()
                  : 'Never'
                }
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">App Version</div>
              <div className="font-mono text-xs">
                {connectionStatus.version || 'Unknown'}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {game.status === 'pending' && (
              <Button onClick={handleStartMonitoring} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Start Monitoring
              </Button>
            )}
            {game.status === 'in_progress' && (
              <Button onClick={handleStopMonitoring} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Stop Monitoring
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Game Data */}
      {latestLiveData && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="objectives">Objectives</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Game Time and Score */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-3">
                  <Clock className="h-6 w-6 text-electric-500" />
                  <span className="text-4xl font-mono text-electric-500">
                    {formatTime(latestLiveData.game_time_seconds)}
                  </span>
                  <Badge className="bg-red-500 animate-pulse">LIVE</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-400">
                      {latestLiveData.blue_team_kills}
                    </div>
                    <div className="text-sm text-muted-foreground">Blue Kills</div>
                  </div>
                  <div>
                    <div className={`text-3xl font-bold ${
                      (latestLiveData.blue_team_kills - latestLiveData.red_team_kills) >= 0 
                        ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {latestLiveData.blue_team_kills - latestLiveData.red_team_kills >= 0 ? '+' : ''}
                      {latestLiveData.blue_team_kills - latestLiveData.red_team_kills}
                    </div>
                    <div className="text-sm text-muted-foreground">Kill Diff</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-400">
                      {latestLiveData.red_team_kills}
                    </div>
                    <div className="text-sm text-muted-foreground">Red Kills</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-400">
                      {latestLiveData.blue_team_gold.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Blue Gold</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-400">
                      {latestLiveData.red_team_gold.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Red Gold</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="players" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Blue Team Players */}
              <Card className="glass-card border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-blue-400 flex items-center gap-2">
                    <Users className="h-5 h-5" />
                    Blue Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {latestLiveData.participants_state
                    ?.filter((p: any) => p.team === 'blue')
                    ?.map((participant: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b border-border/50 last:border-b-0">
                      <div>
                        <div className="font-medium">{participant.summoner_name}</div>
                        <div className="text-sm text-muted-foreground">{participant.champion}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {participant.kills}/{participant.deaths}/{participant.assists}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {participant.gold?.toLocaleString()} gold
                        </div>
                      </div>
                    </div>
                  )) || <div className="text-center py-4 text-muted-foreground">No player data</div>}
                </CardContent>
              </Card>

              {/* Red Team Players */}
              <Card className="glass-card border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <Users className="h-5 h-5" />
                    Red Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {latestLiveData.participants_state
                    ?.filter((p: any) => p.team === 'red')
                    ?.map((participant: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b border-border/50 last:border-b-0">
                      <div>
                        <div className="font-medium">{participant.summoner_name}</div>
                        <div className="text-sm text-muted-foreground">{participant.champion}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {participant.kills}/{participant.deaths}/{participant.assists}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {participant.gold?.toLocaleString()} gold
                        </div>
                      </div>
                    </div>
                  )) || <div className="text-center py-4 text-muted-foreground">No player data</div>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="objectives" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objective Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestLiveData.objectives_state && Object.keys(latestLiveData.objectives_state).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(latestLiveData.objectives_state).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-2xl font-bold">{String(value)}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {key.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No objective data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Game Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {latestLiveData.game_events?.length > 0 ? (
                    latestLiveData.game_events.map((event: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border-b border-border/50 last:border-b-0">
                        <div>
                          <div className="font-medium">{event.type}</div>
                          <div className="text-sm text-muted-foreground">{event.participant}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(event.timestamp)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No game events recorded
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Data Stream Debug (for development) */}
      {process.env.NODE_ENV === 'development' && latestLiveData && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">Debug: Raw Data Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
              {JSON.stringify(latestLiveData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
