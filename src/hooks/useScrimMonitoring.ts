import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface ScrimMonitoringSession {
  id: string;
  scrim_id: string;
  data_source: 'grid' | 'desktop';
  session_status: 'active' | 'completed' | 'expired';
  started_at: string;
  last_activity_at?: string;
  expected_end_at?: string;
  external_match_id?: string;
  created_at: string;
  updated_at: string;
}

export const useScrimMonitoring = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: activeSessions = [], isLoading } = useQuery({
    queryKey: ['scrimMonitoringSessions', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from('scrim_monitoring_sessions')
        .select(`
          *,
          scrims!inner(
            id,
            opponent_name,
            match_date,
            scheduled_time,
            tenant_id
          )
        `)
        .eq('scrims.tenant_id', tenant.id)
        .eq('session_status', 'active')
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching monitoring sessions:', error);
        throw error;
      }

      return data as ScrimMonitoringSession[];
    },
    enabled: !!tenant?.id,
  });

  const { data: incompleteGames = [] } = useQuery({
    queryKey: ['incompleteGames', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from('scrim_games')
        .select(`
          *,
          scrims!inner(
            id,
            opponent_name,
            tenant_id
          )
        `)
        .eq('scrims.tenant_id', tenant.id)
        .in('status', ['in_progress', 'draft'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching incomplete games:', error);
        throw error;
      }

      // Filter for GRID games that are truly incomplete and need file-download data
      const gridGames = data.filter(game => {
        // Check if it has GRID metadata
        const gridMetadata = (game.external_game_data as any)?.grid_metadata;
        const hasGridMetadata = gridMetadata?.seriesId != null;
        
        if (!hasGridMetadata) {
          return false; // Not a GRID game
        }

        // Check if the game is truly incomplete (needs completion data from file-download endpoints)
        const gameData = game.external_game_data as any;
        const isCompleted = game.status === 'completed';
        const hasPostGameData = gameData?.post_game_data?.participants?.length > 0;
        const hasGameResult = gameData?.grid_metadata?.didWeWin !== undefined;
        const isPlaceholder = gridMetadata?.status === 'placeholder' || gridMetadata?.created_as_placeholder;
        
        // Game is incomplete if:
        // 1. It's still in draft/in_progress status, OR
        // 2. It's a placeholder waiting for data, OR  
        // 3. It's missing essential post-game data
        const isTrulyIncomplete = !isCompleted || isPlaceholder || !hasPostGameData || !hasGameResult;
        
        console.log(`Game ${game.id} analysis:`, {
          status: game.status,
          isCompleted,
          hasPostGameData,
          hasGameResult,
          isPlaceholder,
          isTrulyIncomplete,
          seriesId: gridMetadata?.seriesId
        });
        
        return isTrulyIncomplete;
      });

      console.log(`Found ${gridGames.length} truly incomplete GRID games out of ${data.length} total incomplete games`);
      
      return gridGames;
    },
    enabled: !!tenant?.id,
    refetchInterval: false, // Disable automatic refetching to prevent overload
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const startMonitoringMutation = useMutation({
    mutationFn: async ({
      scrimId,
      dataSource,
      externalMatchId,
    }: {
      scrimId: string;
      dataSource: 'grid' | 'desktop';
      externalMatchId?: string;
    }) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      const scrimData = await supabase
        .from('scrims')
        .select('scheduled_time')
        .eq('id', scrimId)
        .single();

      if (scrimData.error) throw scrimData.error;

      const scheduledTime = new Date(scrimData.data.scheduled_time || Date.now());
      const startTime = new Date(scheduledTime.getTime() - 15 * 60 * 1000);
      const endTime = new Date(scheduledTime.getTime() + 4 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('scrim_monitoring_sessions')
        .insert([
          {
            scrim_id: scrimId,
            data_source: dataSource,
            started_at: startTime.toISOString(),
            expected_end_at: endTime.toISOString(),
            external_match_id: externalMatchId,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error starting monitoring session:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrimMonitoringSessions'] });
      toast.success('Monitoring session started successfully!');
    },
    onError: (error) => {
      console.error('Failed to start monitoring session:', error);
      toast.error('Failed to start monitoring session. Please try again.');
    },
  });

  const stopMonitoringMutation = useMutation({
    mutationFn: async ({
      sessionId,
      status,
    }: {
      sessionId: string;
      status: 'completed' | 'expired';
    }) => {
      const { data, error } = await supabase
        .from('scrim_monitoring_sessions')
        .update({
          session_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error stopping monitoring session:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrimMonitoringSessions'] });
      toast.success('Monitoring session stopped successfully!');
    },
    onError: (error) => {
      console.error('Failed to stop monitoring session:', error);
      toast.error('Failed to stop monitoring session. Please try again.');
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from('scrim_monitoring_sessions')
        .update({
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating session activity:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrimMonitoringSessions'] });
    },
    onError: (error) => {
      console.error('Failed to update session activity:', error);
    },
  });

  // Manual refresh for incomplete games - only when user requests it
  const refreshIncompleteGames = React.useCallback(() => {
    console.log('🔄 Manual refresh of incomplete games...');
    queryClient.invalidateQueries({ queryKey: ['incompleteGames'] });
  }, [queryClient]);

  return {
    activeSessions,
    incompleteGames,
    isLoading,
    refreshIncompleteGames,
    startMonitoring: startMonitoringMutation.mutate,
    stopMonitoring: stopMonitoringMutation.mutate,
    updateActivity: updateActivityMutation.mutate,
    isStarting: startMonitoringMutation.isPending,
    isStopping: stopMonitoringMutation.isPending,
  };
};
