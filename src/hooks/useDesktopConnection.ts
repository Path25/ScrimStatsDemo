
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface DesktopConnectionInfo {
  isConnected: boolean;
  sessionId: string | null;
  lastHeartbeat: Date | null;
  version: string | null;
  gameId: string | null;
  status: 'idle' | 'monitoring' | 'error';
}

export const useDesktopConnection = (gameId?: string) => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [connectionInfo, setConnectionInfo] = useState<DesktopConnectionInfo>({
    isConnected: false,
    sessionId: null,
    lastHeartbeat: null,
    version: null,
    gameId: null,
    status: 'idle'
  });

  // Check for active monitoring sessions
  useEffect(() => {
    if (!tenant?.id || !gameId) return;

    const checkConnection = async () => {
      try {
        const { data: sessions, error } = await supabase
          .from('scrim_monitoring_sessions')
          .select('*')
          .eq('scrim_id', gameId)
          .eq('session_status', 'active')
          .order('started_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error checking monitoring sessions:', error);
          return;
        }

        if (sessions && sessions.length > 0) {
          const session = sessions[0];
          const lastActivity = session.last_activity_at ? new Date(session.last_activity_at) : null;
          const isRecentActivity = lastActivity && (Date.now() - lastActivity.getTime()) < 60000; // 1 minute

          setConnectionInfo({
            isConnected: isRecentActivity || false,
            sessionId: session.desktop_session_id,
            lastHeartbeat: lastActivity,
            version: null, // Would come from desktop app metadata
            gameId: gameId,
            status: isRecentActivity ? 'monitoring' : 'idle'
          });
        } else {
          setConnectionInfo(prev => ({
            ...prev,
            isConnected: false,
            status: 'idle'
          }));
        }
      } catch (error) {
        console.error('Error in connection check:', error);
        setConnectionInfo(prev => ({
          ...prev,
          status: 'error'
        }));
      }
    };

    // Initial check
    checkConnection();

    // Set up periodic checking
    const interval = setInterval(checkConnection, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [tenant?.id, gameId]);

  const startMonitoring = async (sessionId: string) => {
    if (!tenant?.id || !gameId) {
      toast.error('Missing game or tenant information');
      return;
    }

    try {
      // This would typically be called by the desktop app
      const { error } = await supabase.functions.invoke('start-game-monitoring', {
        body: {
          scrim_id: gameId,
          desktop_session_id: sessionId,
          detected_players: [], // Desktop app would provide this
          game_start_time: new Date().toISOString(),
          game_mode: 'CLASSIC'
        }
      });

      if (error) {
        console.error('Error starting monitoring:', error);
        toast.error('Failed to start monitoring');
        return;
      }

      toast.success('Game monitoring started');
      setConnectionInfo(prev => ({
        ...prev,
        sessionId,
        status: 'monitoring',
        isConnected: true
      }));
    } catch (error) {
      console.error('Error starting monitoring:', error);
      toast.error('Failed to start monitoring');
    }
  };

  const stopMonitoring = async () => {
    if (!connectionInfo.sessionId) {
      toast.error('No active monitoring session');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('end-game-monitoring', {
        body: {
          desktop_session_id: connectionInfo.sessionId,
          game_result: 'completed', // Would be determined by desktop app
          game_duration_seconds: 0, // Would come from desktop app
          final_stats: {} // Would come from desktop app
        }
      });

      if (error) {
        console.error('Error stopping monitoring:', error);
        toast.error('Failed to stop monitoring');
        return;
      }

      toast.success('Game monitoring stopped');
      setConnectionInfo(prev => ({
        ...prev,
        status: 'idle',
        isConnected: false
      }));
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      toast.error('Failed to stop monitoring');
    }
  };

  return {
    connectionInfo,
    startMonitoring,
    stopMonitoring
  };
};
