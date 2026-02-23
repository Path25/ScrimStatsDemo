
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export interface ActiveScrimInfo {
  id: string;
  opponent_name: string;
  scheduled_time: string;
  status: string;
  format: string | null;
  is_within_monitoring_window: boolean;
  minutes_to_start: number;
  hours_active: number | null;
  game_count: number;
  extended_end_time: string;
  monitoring_priority: number;
}

export interface ActiveScrimMonitoring {
  active_scrims: ActiveScrimInfo[];
  primary_scrim: ActiveScrimInfo | null;
  active_session: any;
  current_time: string;
  monitoring_summary: {
    total_scrims: number;
    has_primary_target: boolean;
    session_active: boolean;
  };
}

export const useActiveScrimMonitoring = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['activeScrimMonitoring', tenant?.id],
    queryFn: async (): Promise<ActiveScrimMonitoring | null> => {
      if (!user || !tenant?.id) return null;

      const { data, error } = await supabase.functions.invoke('get-active-scrims');

      if (error) {
        console.error('Error fetching active scrim monitoring:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user && !!tenant?.id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 20000, // Consider data stale after 20 seconds
  });
};
