
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'scrim_scheduled' | 'scrim_starting' | 'game_completed' | 'player_joined' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

// LocalStorage keys for notification tracking
const STORAGE_KEYS = {
  NOTIFIED_SCRIMS: 'notified_scrims',
  LAST_CHECK_DATE: 'last_upcoming_check'
};

// Helper functions for localStorage
const getNotifiedScrims = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.NOTIFIED_SCRIMS);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const setNotifiedScrims = (scrims: Set<string>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFIED_SCRIMS, JSON.stringify([...scrims]));
  } catch {
    // Ignore localStorage errors
  }
};

const getLastCheckDate = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_CHECK_DATE);
  } catch {
    return null;
  }
};

const setLastCheckDate = (date: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_CHECK_DATE, date);
  } catch {
    // Ignore localStorage errors
  }
};

const shouldCheckUpcoming = (): boolean => {
  const lastCheck = getLastCheckDate();
  if (!lastCheck) return true;
  
  const lastCheckDate = new Date(lastCheck);
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));
  
  return lastCheckDate < sixHoursAgo;
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { tenant } = useTenant();

  useEffect(() => {
    if (!user || !tenant) return;

    // Set up real-time subscription for scrim updates
    const scrimChannel = supabase
      .channel('scrim-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scrims',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          const scrim = payload.new as any;
          addNotification({
            type: 'scrim_scheduled',
            title: 'New Scrim Scheduled',
            message: `Scrim against ${scrim.opponent_name} scheduled for ${new Date(scrim.match_date).toLocaleDateString()}`,
            data: { scrimId: scrim.id }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scrims',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          const scrim = payload.new as any;
          const oldScrim = payload.old as any;
          
          if (oldScrim.status !== 'completed' && scrim.status === 'completed') {
            addNotification({
              type: 'scrim_starting',
              title: 'Scrim Completed',
              message: `Scrim against ${scrim.opponent_name} has been completed`,
              data: { scrimId: scrim.id }
            });
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for game completions
    const gameChannel = supabase
      .channel('game-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scrim_games',
        },
        async (payload) => {
          const game = payload.new as any;
          const oldGame = payload.old as any;
          
          if (oldGame.status !== 'completed' && game.status === 'completed') {
            // Get scrim info
            const { data: scrim } = await supabase
              .from('scrims')
              .select('opponent_name, tenant_id')
              .eq('id', game.scrim_id)
              .single();
            
            if (scrim && scrim.tenant_id === tenant.id) {
              addNotification({
                type: 'game_completed',
                title: 'Game Completed',
                message: `Game ${game.game_number} vs ${scrim.opponent_name} completed: ${game.result?.toUpperCase() || 'Unknown'}`,
                data: { gameId: game.id, scrimId: game.scrim_id }
              });
            }
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for new players
    const playerChannel = supabase
      .channel('player-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          const player = payload.new as any;
          addNotification({
            type: 'player_joined',
            title: 'New Player Added',
            message: `${player.summoner_name} has been added to the roster`,
            data: { playerId: player.id }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scrimChannel);
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(playerChannel);
    };
  }, [user, tenant]);

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'created_at'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      read: false,
      created_at: new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only latest 50
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    toast(notification.title, {
      description: notification.message,
      action: notification.type === 'scrim_scheduled' || notification.type === 'game_completed' ? {
        label: 'View',
        onClick: () => {
          // Navigate to scrim/game view
          window.location.href = `/scrims`;
        }
      } : undefined
    });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Check for upcoming scrims with persistent tracking
  useEffect(() => {
    if (!tenant || !shouldCheckUpcoming()) return;

    const checkUpcomingScrim = async () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const { data: upcomingScrims } = await supabase
        .from('scrims')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('status', 'scheduled')
        .gte('match_date', tomorrow.toISOString())
        .lt('match_date', dayAfter.toISOString());

      const notifiedScrims = getNotifiedScrims();
      let hasNewNotifications = false;

      upcomingScrims?.forEach(scrim => {
        // Only notify if we haven't already notified about this scrim
        if (!notifiedScrims.has(scrim.id)) {
          notifiedScrims.add(scrim.id);
          hasNewNotifications = true;
          addNotification({
            type: 'scrim_starting',
            title: 'Upcoming Scrim',
            message: `Scrim against ${scrim.opponent_name} is scheduled for tomorrow`,
            data: { scrimId: scrim.id }
          });
        }
      });

      // Update localStorage with new notifications and last check time
      if (hasNewNotifications) {
        setNotifiedScrims(notifiedScrims);
      }
      setLastCheckDate(now.toISOString());
    };

    checkUpcomingScrim();
  }, [tenant]);

  // Clean up old notification tracking data daily
  useEffect(() => {
    const cleanupOldData = () => {
      try {
        const lastCheck = getLastCheckDate();
        if (lastCheck) {
          const lastCheckDate = new Date(lastCheck);
          const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
          
          if (lastCheckDate < oneDayAgo) {
            // Clear old notification tracking
            localStorage.removeItem(STORAGE_KEYS.NOTIFIED_SCRIMS);
            localStorage.removeItem(STORAGE_KEYS.LAST_CHECK_DATE);
          }
        }
      } catch {
        // Ignore errors
      }
    };

    cleanupOldData();
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addNotification
  };
};
