import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Timer,
  Activity,
  AlertTriangle,
  Search
} from 'lucide-react';
import { useGridMonitoring } from '@/hooks/useGridMonitoring';
import { useScrimMonitoring } from '@/hooks/useScrimMonitoring';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface GridMonitoringPanelProps {
  scrimId: string;
  onViewGameData?: (gameData: any) => void;
  onCreateManualDraft?: (seriesId: string, gameNumber: number) => void;
}

export const GridMonitoringPanel: React.FC<GridMonitoringPanelProps> = ({
  scrimId,
  onViewGameData,
  onCreateManualDraft
}) => {
  const {
    isMonitoring,
    currentSeries,
    gameData,
    pendingUpdates,
    nextCheckTime,
    shouldBeMonitoring,
    monitoringStartTime,
    startMonitoring,
    stopMonitoring,
    manualCheck,
    lastError,
    retryCount,
  } = useGridMonitoring(scrimId);

  const { 
    activeSessions, 
    incompleteGames,
    refreshIncompleteGames,
  } = useScrimMonitoring();

  const [isScanningMissedGames, setIsScanningMissedGames] = React.useState(false);

  const scanForMissedGames = async () => {
    setIsScanningMissedGames(true);
    try {
      console.log('🔍 Scanning for missed games...');
      
      // Use Supabase function invoke with the scan_type parameter in the body
      const { data: result, error } = await supabase.functions.invoke('grid-auto-monitoring', {
        body: { scan_type: 'manual' }
      });

      if (error) {
        console.error('Error scanning for missed games:', error);
        toast.error('Failed to scan for missed games');
        return;
      }

      console.log('✅ Missed games scan completed:', result);
      
      if (result && result.success) {
        const totalGames = result.total_games_processed || 0;
        const totalTeams = result.processed_tenants || 0;
        const scanType = result.scan_type || 'manual';
        
        if (totalGames > 0) {
          toast.success(`${scanType} scan completed! Found and processed ${totalGames} game(s) across ${totalTeams} team(s)`);
        } else {
          toast.success(`${scanType} scan completed! No missed games found across ${totalTeams} team(s)`);
        }
        
        // Refresh the scrim games data
        refreshIncompleteGames();
        manualCheck();
      } else {
        toast.error(`Scan failed: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during missed games scan:', error);
      toast.error('Failed to scan for missed games');
    } finally {
      setIsScanningMissedGames(false);
    }
  };

  const getStatusIcon = () => {
    if (lastError) {
      return <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />;
    }
    if (isMonitoring) {
      return <Zap className="w-4 h-4 text-electric-500 animate-pulse" />;
    }
    if (shouldBeMonitoring || incompleteGames.length > 0) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (lastError) return `Error: ${lastError}`;
    if (isMonitoring) return 'Monitoring Active';
    if (incompleteGames.length > 0) return 'Games Incomplete';
    if (shouldBeMonitoring) return 'Ready to Monitor';
    if (monitoringStartTime && new Date() < monitoringStartTime) {
      return `Starts ${formatDistanceToNow(monitoringStartTime, { addSuffix: true })}`;
    }
    return 'Monitoring Unavailable';
  };

  const getProgressValue = () => {
    if (!monitoringStartTime || !isMonitoring) return 0;
    
    const now = new Date();
    const start = monitoringStartTime;
    const end = new Date(start.getTime() + 4 * 60 * 60 * 1000); // 4 hours total monitoring
    
    const elapsed = now.getTime() - start.getTime();
    const total = end.getTime() - start.getTime();
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  // Auto-start monitoring only once when incomplete games are detected
  const hasAutoStarted = React.useRef(false);
  React.useEffect(() => {
    if (incompleteGames.length > 0 && !isMonitoring && !hasAutoStarted.current) {
      console.log('🔄 Auto-starting Grid monitoring due to incomplete games:', incompleteGames.length);
      hasAutoStarted.current = true;
      startMonitoring(true);
    } else if (incompleteGames.length === 0) {
      hasAutoStarted.current = false; // Reset when no incomplete games
    }
  }, [incompleteGames.length, isMonitoring, startMonitoring]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>GRID Auto-Monitoring</span>
          </div>
          <Badge variant={isMonitoring || incompleteGames.length > 0 ? 'default' : lastError ? 'destructive' : 'outline'}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Display */}
        {lastError && (
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  GRID API Error
                </p>
                <p className="text-sm text-muted-foreground">
                  {lastError}
                </p>
                {retryCount > 0 && (
                  <p className="text-xs text-red-400 mt-1">
                    Retries: {retryCount}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={manualCheck}
                className="text-red-400 border-red-400 hover:bg-red-500/10"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry Now
              </Button>
            </div>
          </div>
        )}

        {/* Monitoring Controls */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {monitoringStartTime && (
              <p className="text-sm text-muted-foreground">
                Window: {format(monitoringStartTime, 'HH:mm')} - {format(new Date(monitoringStartTime.getTime() + 4 * 60 * 60 * 1000), 'HH:mm')}
              </p>
            )}
            {nextCheckTime && (
              <p className="text-sm text-muted-foreground">
                Next check: {formatDistanceToNow(nextCheckTime, { addSuffix: true })}
              </p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={scanForMissedGames}
              disabled={isScanningMissedGames}
              className="bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
            >
              <Search className="w-3 h-3 mr-1" />
              {isScanningMissedGames ? 'Scanning...' : 'Scan Missed Games'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={manualCheck}
              disabled={!isMonitoring && !lastError}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {lastError ? 'Retry' : 'Refresh Now'}
            </Button>
            
            {isMonitoring ? (
              <Button
                variant="outline"
                size="sm"
                onClick={stopMonitoring}
                disabled={incompleteGames.length > 0}
              >
                <Pause className="w-3 h-3 mr-1" />
                {incompleteGames.length > 0 ? 'Auto-Active' : 'Stop'}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => startMonitoring(incompleteGames.length > 0)}
                className="bg-electric-500 hover:bg-electric-600"
              >
                <Play className="w-3 h-3 mr-1" />
                Start Monitoring
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isMonitoring && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monitoring Progress</span>
              <span>{Math.round(getProgressValue())}%</span>
            </div>
            <Progress value={getProgressValue()} className="h-2" />
          </div>
        )}

        {/* Missed Games Scan Info */}
        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-start space-x-2">
            <Search className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-blue-400">Manual Scan for Missed Games</p>
              <p className="text-blue-300 mt-1">
                This will scan ALL scrims from the past 7 days, regardless of their monitoring window status.
              </p>
              <p className="text-blue-300 mt-1">
                Perfect for finding games that were missed while the browser was closed or monitoring was disabled.
              </p>
            </div>
          </div>
        </div>

        {/* Incomplete Games Alert */}
        {incompleteGames.length > 0 && (
          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-yellow-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Incomplete Games Detected
                </p>
                <p className="text-sm text-muted-foreground">
                  {incompleteGames.length} game(s) need completion data
                </p>
                {incompleteGames.length > 0 && isMonitoring && (
                  <p className="text-xs text-green-400 mt-1">
                    ✅ Auto-monitoring active to fetch completion data
                  </p>
                )}
                {incompleteGames.length > 0 && !isMonitoring && (
                  <p className="text-xs text-red-400 mt-1">
                    ⚠️ Starting auto-monitoring for incomplete games...
                  </p>
                )}
              </div>
              {!isMonitoring && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startMonitoring(true)}
                  className="bg-electric-500 hover:bg-electric-600 text-white"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Start Now
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Current Series Info */}
        {currentSeries && (
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-400">Series Detected</p>
                <p className="text-sm text-muted-foreground">
                  Series ID: {currentSeries.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  Started: {format(new Date(currentSeries.startTimeScheduled), 'PPp')}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className="bg-blue-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Pending Updates */}
        {pendingUpdates.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Waiting for Data ({pendingUpdates.length})
            </h4>
            {pendingUpdates.map((update, index) => (
              <div key={`${update.seriesId}-${update.gameNumber}`} className="flex items-center justify-between p-2 border border-border/50 rounded text-sm">
                <div>
                  <p className="font-medium">Game {update.gameNumber}</p>
                  <p className="text-muted-foreground">
                    Attempt {update.attempts}/{update.maxAttempts}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">
                    Last: {formatDistanceToNow(update.lastAttempt, { addSuffix: true })}
                  </p>
                  <Progress 
                    value={(update.attempts / update.maxAttempts) * 100} 
                    className="h-1 w-16"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Game Data */}
        {gameData.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Detected Games</h4>
            {gameData.map((game, index) => (
              <div key={`${game.seriesId}-${game.gameNumber}`} className="flex items-center justify-between p-3 border border-border/50 rounded">
                <div>
                  <p className="font-medium">Game {game.gameNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {game.status} | Series: {game.seriesId}
                  </p>
                  {game.lastPolled && (
                    <p className="text-xs text-muted-foreground">
                      Last polled: {formatDistanceToNow(game.lastPolled, { addSuffix: true })}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={
                    game.status === 'completed' 
                      ? 'bg-green-500' 
                      : game.status === 'live' 
                        ? 'bg-electric-500 animate-pulse' 
                        : game.status === 'placeholder'
                          ? 'bg-yellow-500'
                          : 'bg-gray-500'
                  }>
                    {game.status}
                  </Badge>
                  {onViewGameData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewGameData(game)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Auto-starts when incomplete games detected</p>
          <p>• Continuously checks for game completion</p>
          <p>• Stops automatically when all games complete</p>
          <p>• Manual scan processes ALL scrims from past 7 days</p>
          <p>• Includes retry logic for transient failures</p>
        </div>
      </CardContent>
    </Card>
  );
};
