
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { TeamRosterResponse } from '@/types/electronApi';

export const useTeamRoster = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['teamRoster', session?.user?.id],
    queryFn: async (): Promise<TeamRosterResponse> => {
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const { data, error } = await supabase.functions.invoke('team-roster', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Team roster fetch error:', error);
        throw error;
      }

      return data;
    },
    enabled: !!session?.access_token,
  });
};
