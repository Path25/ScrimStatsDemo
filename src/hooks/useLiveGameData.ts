import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useEffect } from 'react';
import type { LiveGameData, LiveGameDataDB } from '@/types/scrimGame';
import { transformLiveDataFromDB } from '@/types/scrimGame';

export interface CreateLiveGameDataPayload {
  scrim_game_id: string;
  game_time_seconds: number;
  blue_team_kills?: number;
  red_team_kills?: number;
  blue_team_gold?: number;
  red_team_gold?: number;
  objectives_state?: any;
  participants_state?: any[];
  game_events?: any[];
  data_source?: 'manual' | 'grid' | 'desktop_app';
}

const MOCK_LIVE_DATA: LiveGameData[] = Array.from({ length: 25 }, (_, i) => ({
  id: `mock-live-${i}`,
  scrim_game_id: 'mock',
  game_time_seconds: i * 60,
  blue_team_kills: Math.floor(i * 0.6),
  red_team_kills: Math.floor(i * 0.3),
  blue_team_gold: 500 + i * 2000 + Math.floor(Math.random() * 500),
  red_team_gold: 500 + i * 1800 + Math.floor(Math.random() * 500),
  objectives_state: {},
  participants_state: [],
  game_events: i % 5 === 0 ? [{
    timestamp: i * 60,
    type: 'objective',
    participant: 'Team',
    details: { type: i % 10 === 0 ? 'dragon' : 'tower', team: 'blue' }
  }] : [],
  timestamp: new Date().toISOString(),
  data_source: 'manual'
}));

export const useLiveGameData = (gameId?: string, enableRealtime = false) => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: liveData = [], isLoading, error } = useQuery({
    queryKey: ['liveGameData', gameId, tenant?.id],
    queryFn: async () => {
      if (!gameId || gameId.startsWith('mock')) return MOCK_LIVE_DATA;

      try {
        const { data, error } = await supabase
          .from('live_game_data')
          .select('*')
          .eq('scrim_game_id', gameId)
          .order('game_time_seconds', { ascending: true });

        if (error || !data || data.length === 0) {
          return MOCK_LIVE_DATA;
        }

        // Transform the data from DB format to application format
        return (data as LiveGameDataDB[]).map(transformLiveDataFromDB);
      } catch (err) {
        return MOCK_LIVE_DATA;
      }
    },
    enabled: !!gameId,
    refetchInterval: enableRealtime ? 5000 : false, // Poll every 5 seconds when realtime is enabled
  });

  // Set up real-time subscription for live game data
  useEffect(() => {
    if (!enableRealtime || !gameId || !tenant?.id) return;

    const channel = supabase
      .channel('live-game-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_game_data',
          filter: `scrim_game_id=eq.${gameId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['liveGameData', gameId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_game_data',
          filter: `scrim_game_id=eq.${gameId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['liveGameData', gameId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, gameId, tenant?.id, queryClient]);

  const createLiveDataMutation = useMutation({
    mutationFn: async (liveGameData: CreateLiveGameDataPayload) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      const { data, error } = await supabase
        .from('live_game_data')
        .insert([liveGameData])
        .select()
        .single();

      if (error) {
        console.error('Error creating live game data:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveGameData'] });
    },
    onError: (error) => {
      console.error('Failed to create live game data:', error);
    },
  });

  // Get the latest live data entry
  const latestLiveData = liveData.length > 0 ? liveData[liveData.length - 1] : null;

  return {
    liveData,
    latestLiveData,
    isLoading,
    error,
    createLiveData: createLiveDataMutation.mutate,
    isCreating: createLiveDataMutation.isPending,
  };
};
