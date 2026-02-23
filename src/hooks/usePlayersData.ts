
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Player = Database['public']['Tables']['players']['Row'];
type PlayerInsert = Database['public']['Tables']['players']['Insert'];
type PlayerUpdate = Database['public']['Tables']['players']['Update'];

// High quality mock data for demo fallback
const MOCK_PLAYERS: Player[] = [
  {
    id: 'mock-player-1',
    summoner_name: 'Theory',
    role: 'mid',
    rank: 'Challenger',
    main_champions: ['Azir', 'Orianna', 'Sylas'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'demo',
    tenant_id: 'demo',
    avatar_url: null,
    discord_username: null,
    join_date: null,
    last_soloq_sync: null,
    lp: 0,
    puuid: null,
    region: 'EUW',
    riot_id: 'Theory',
    riot_tag_line: 'EUW',
    summoner_id: null,
    notes: 'Primary shotcaller.'
  },
  {
    id: 'mock-player-2',
    summoner_name: 'Vortex',
    role: 'jungle',
    rank: 'Grandmaster',
    main_champions: ['Lee Sin', 'Nidalee', 'Viego'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'demo',
    tenant_id: 'demo',
    avatar_url: null,
    discord_username: null,
    join_date: null,
    last_soloq_sync: null,
    lp: 0,
    puuid: null,
    region: 'EUW',
    riot_id: 'Vortex',
    riot_tag_line: 'EUW',
    summoner_id: null,
    notes: 'Strong early game pressure.'
  },
  {
    id: 'mock-player-3',
    summoner_name: 'Shield',
    role: 'top',
    rank: 'Master',
    main_champions: ['K\'Sante', 'Jax', 'Renekton'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'demo',
    tenant_id: 'demo',
    avatar_url: null,
    discord_username: null,
    join_date: null,
    last_soloq_sync: null,
    lp: 0,
    puuid: null,
    region: 'EUW',
    riot_id: 'Shield',
    riot_tag_line: 'EUW',
    summoner_id: null,
    notes: 'Consistent weakside player.'
  },
  {
    id: 'mock-player-4',
    summoner_name: 'Pulse',
    role: 'adc',
    rank: 'Challenger',
    main_champions: ['Kai\'Sa', 'Xayah', 'Ezreal'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'demo',
    tenant_id: 'demo',
    avatar_url: null,
    discord_username: null,
    join_date: null,
    last_soloq_sync: null,
    lp: 0,
    puuid: null,
    region: 'EUW',
    riot_id: 'Pulse',
    riot_tag_line: 'EUW',
    summoner_id: null,
    notes: 'Excellent teamfight positioning.'
  },
  {
    id: 'mock-player-5',
    summoner_name: 'Aura',
    role: 'support',
    rank: 'Grandmaster',
    main_champions: ['Rakan', 'Thresh', 'Nautilus'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'demo',
    tenant_id: 'demo',
    avatar_url: null,
    discord_username: null,
    join_date: null,
    last_soloq_sync: null,
    lp: 0,
    puuid: null,
    region: 'EUW',
    riot_id: 'Aura',
    riot_tag_line: 'EUW',
    summoner_id: null,
    notes: 'High vision control score.'
  }
];

export function usePlayersData() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery({
    queryKey: ['players', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return MOCK_PLAYERS;

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fallback for demo if DB is empty
      if (!data || data.length === 0) {
        return MOCK_PLAYERS;
      }

      return data as Player[];
    },
    enabled: true,
  });

  const createPlayerMutation = useMutation({
    mutationFn: async (playerData: Omit<PlayerInsert, 'tenant_id' | 'created_by'>) => {
      if (!tenant?.id) throw new Error('No tenant selected');

      const { data, error } = await supabase
        .from('players')
        .insert({
          ...playerData,
          tenant_id: tenant.id,
          created_by: tenant.id, // We'll use tenant.id for now since we don't have user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Player created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create player');
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async ({ id, ...updates }: PlayerUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Player updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update player');
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('players')
        .update({ is_active: false })
        .eq('id', playerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Player removed from roster');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove player');
    },
  });

  return {
    players: players || [],
    isLoading,
    createPlayer: createPlayerMutation.mutate,
    updatePlayer: updatePlayerMutation.mutate,
    deletePlayer: deletePlayerMutation.mutate,
    isCreating: createPlayerMutation.isPending,
    isUpdating: updatePlayerMutation.isPending,
    isDeleting: deletePlayerMutation.isPending,
  };
}
