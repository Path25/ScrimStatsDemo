
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeamScheduleScrim {
  id: string;
  opponent_name: string;
  scheduled_time: string;
  match_date: string;
  status: string;
  format: string;
  minutes_to_start: number;
  hours_since_start: number | null;
}

interface TeamScheduleResponse {
  scrims: TeamScheduleScrim[];
  current_time: string;
}

// High quality mock data for demo fallback
const MOCK_SCHEDULE: TeamScheduleResponse = {
  scrims: [
    {
      id: 'mock-scrim-1',
      opponent_name: 'G2 Academy',
      scheduled_time: '18:00',
      match_date: new Date().toISOString().split('T')[0],
      status: 'scheduled',
      format: 'Bo3',
      minutes_to_start: 30,
      hours_since_start: null
    },
    {
      id: 'mock-scrim-2',
      opponent_name: 'FNC TQ',
      scheduled_time: '20:00',
      match_date: new Date().toISOString().split('T')[0],
      status: 'scheduled',
      format: 'Bo3',
      minutes_to_start: 150,
      hours_since_start: null
    }
  ],
  current_time: new Date().toISOString()
};

export const useTeamSchedule = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['teamSchedule', session?.user?.id],
    queryFn: async (): Promise<TeamScheduleResponse> => {
      if (!session?.access_token) {
        return MOCK_SCHEDULE;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-team-schedule', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.warn('Team schedule fetch error, falling back to mock:', error);
          return MOCK_SCHEDULE;
        }

        return data;
      } catch (err) {
        return MOCK_SCHEDULE;
      }
    },
    enabled: true,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};
