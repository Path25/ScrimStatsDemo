
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, Wifi, WifiOff, Activity, AlertTriangle, CheckCircle, Clock, Target, Calendar } from 'lucide-react';
import { useDesktopConnection } from '@/hooks/useDesktopConnection';
import { useActiveScrimMonitoring } from '@/hooks/useActiveScrimMonitoring';
import type { ScrimGame } from '@/types/scrimGame';

interface DesktopAppStatusProps {
  game?: ScrimGame;
}

export const DesktopAppStatus: React.FC<DesktopAppStatusProps> = ({ game }) => {
  const { connectionInfo, startMonitoring, stopMonitoring } = useDesktopConnection(game?.id);
  const { data: activeMonitoring, isLoading: monitoringLoading } = useActiveScrimMonitoring();

  const getStatusIcon = () => {
    switch (connectionInfo.status) {
      case 'monitoring':
        return <Activity className="h-4 w-4 text-green-500 animate-pulse" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'idle':
      default:
        return connectionInfo.isConnected 
          ? <CheckCircle className="h-4 w-4 text-blue-500" />
          : <Monitor className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (connectionInfo.status) {
      case 'monitoring':
        return 'Actively Monitoring';
      case 'error':
        return 'Connection Error';
      case 'idle':
        return connectionInfo.isConnected ? 'Connected (Idle)' : 'Disconnected';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = () => {
    switch (connectionInfo.status) {
      case 'monitoring':
        return 'bg-green-500/20 text-green-500';
      case 'error':
        return 'bg-red-500/20 text-red-500';
      case 'idle':
        return connectionInfo.isConnected 
          ? 'bg-blue-500/20 text-blue-500'
          : 'bg-muted-foreground/20 text-muted-foreground';
      default:
        return 'bg-muted-foreground/20 text-muted-foreground';
    }
  };

  const getMonitoringStatusText = () => {
    if (monitoringLoading) return 'Loading...';
    if (!activeMonitoring) return 'No monitoring data';
    
    if (activeMonitoring.primary_scrim) {
      const scrim = activeMonitoring.primary_scrim;
      if (scrim.minutes_to_start > 0) {
        return `${scrim.opponent_name} (starts in ${scrim.minutes_to_start}m)`;
      } else {
        return `${scrim.opponent_name} (${scrim.hours_active ? `${scrim.hours_active}h active` : 'live'})`;
      }
    }
    
    return 'No active scrims';
  };

  const getMonitoringStatusColor = () => {
    if (!activeMonitoring?.primary_scrim) return 'bg-gray-500/20 text-gray-500';
    
    const scrim = activeMonitoring.primary_scrim;
    if (scrim.minutes_to_start <= 0) {
      return 'bg-green-500/20 text-green-500'; // Live/ongoing
    } else if (scrim.minutes_to_start <= 15) {
      return 'bg-yellow-500/20 text-yellow-500'; // Starting soon
    } else {
      return 'bg-blue-500/20 text-blue-500'; // Scheduled
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="h-5 w-5 text-primary" />
            <span>Desktop App Status</span>
          </div>
          <div className="flex items-center gap-2">
            {connectionInfo.isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Monitoring Target */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Current Target</span>
            </div>
            <Badge className={getMonitoringStatusColor()}>
              <Calendar className="h-3 w-3 mr-1" />
              {getMonitoringStatusText()}
            </Badge>
          </div>
          
          {activeMonitoring?.primary_scrim && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Games: {activeMonitoring.primary_scrim.game_count || 0}</div>
              <div>Window until: {new Date(activeMonitoring.primary_scrim.extended_end_time).toLocaleTimeString()}</div>
              {activeMonitoring.active_session && (
                <div className="text-green-600">Session Active: Desktop monitoring enabled</div>
              )}
            </div>
          )}
        </div>

        {/* Connection Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Session ID</div>
            <div className="font-mono text-xs truncate">
              {connectionInfo.sessionId || 'Not connected'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Last Activity</div>
            <div className="font-mono text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {connectionInfo.lastHeartbeat 
                ? connectionInfo.lastHeartbeat.toLocaleTimeString()
                : 'Never'
              }
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Monitoring</div>
            <div className="font-mono text-xs truncate">
              {activeMonitoring?.monitoring_summary.session_active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {connectionInfo.status === 'idle' && connectionInfo.isConnected && (
          <div className="mt-4">
            <Button 
              onClick={() => startMonitoring(`session_${Date.now()}`)}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              Start Monitoring
            </Button>
          </div>
        )}

        {connectionInfo.status === 'monitoring' && (
          <div className="mt-4">
            <Button 
              onClick={stopMonitoring}
              variant="destructive"
              size="sm"
            >
              Stop Monitoring
            </Button>
          </div>
        )}

        {/* Connection Warning */}
        {!connectionInfo.isConnected && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="text-sm text-yellow-600 dark:text-yellow-400">
              Desktop app not connected. Make sure the ScrimStats Desktop Collector is running and logged in.
            </div>
          </div>
        )}

        {/* No Active Scrims Warning */}
        {connectionInfo.isConnected && !activeMonitoring?.primary_scrim && !monitoringLoading && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400">
              No scrims are currently within the monitoring window (30 minutes before to 1+ hours after start time).
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
