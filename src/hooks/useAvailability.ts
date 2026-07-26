import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { AvailabilityEntry, AvailabilityFormData, PLAYER_ROLES, type PlayerRole } from '@/types/availability';

export type AvailabilityRow = Database['public']['Tables']['player_availability']['Row'];
export type AvailabilityInsert = Database['public']['Tables']['player_availability']['Insert'];
export type AvailabilityUpdate = Database['public']['Tables']['player_availability']['Update'];
type AvailabilityPlayer = Pick<
    Database['public']['Tables']['players']['Row'],
    'id' | 'summoner_name' | 'role'
>;

function errorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    return fallback;
}

function playerRole(value: string | null): PlayerRole | undefined {
    return PLAYER_ROLES.includes(value as PlayerRole) ? value as PlayerRole : undefined;
}

export function useAvailability() {
    const { tenant } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: availability, isLoading, error, refetch } = useQuery({
        queryKey: ['player-availability', tenant?.id],
        queryFn: async () => {
            if (!tenant?.id) return [];

            const { data: availabilityRows, error: availabilityError } = await supabase
                .from('player_availability')
                .select('*')
                .eq('tenant_id', tenant.id)
                .order('start_time');

            if (availabilityError) throw availabilityError;

            const playerIds = [...new Set((availabilityRows || []).map((item) => item.player_id))];
            let rosterPlayers: AvailabilityPlayer[] = [];

            if (playerIds.length) {
                const { data: playerRows, error: playersError } = await supabase
                    .from('players')
                    .select('id, summoner_name, role')
                    .eq('tenant_id', tenant.id)
                    .in('id', playerIds);

                if (playersError) throw playersError;
                rosterPlayers = (playerRows || []) as AvailabilityPlayer[];
            }

            const playersById = new Map(rosterPlayers.map((player) => [player.id, player]));

            const dbData = (availabilityRows || []).map(item => {
                const player = playersById.get(item.player_id);
                return {
                    id: item.id,
                    playerId: item.player_id,
                    playerName: player?.summoner_name,
                    playerRole: playerRole(player?.role || null),
                    tenantId: item.tenant_id,
                    startTime: new Date(item.start_time),
                    endTime: new Date(item.end_time),
                    isAvailable: item.is_available,
                    recurrence_rule: item.recurrence_rule,
                    notes: item.notes,
                    createdBy: item.created_by,
                    createdAt: new Date(item.created_at),
                    updatedAt: new Date(item.updated_at)
                };
            }) as AvailabilityEntry[];

            return dbData;
        },
        enabled: Boolean(tenant?.id),
    });

    const saveAvailability = useMutation({
        mutationFn: async (formData: AvailabilityFormData) => {
            if (!tenant?.id || !user?.id) throw new Error('Not authenticated');

            const entry: AvailabilityInsert = {
                player_id: formData.playerId,
                tenant_id: tenant.id,
                start_time: formData.startTime.toISOString(),
                end_time: formData.endTime.toISOString(),
                is_available: formData.isAvailable,
                recurrence_rule: formData.recurrenceRule || null,
                notes: formData.notes?.trim() || null,
                created_by: user.id
            };

            const { data, error } = await supabase
                .from('player_availability')
                .insert(entry)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['player-availability'] });
            toast.success('Availability saved successfully');
        },
        onError: (error: unknown) => {
            toast.error(errorMessage(error, 'Failed to save availability'));
        },
    });

    const deleteAvailability = useMutation({
        mutationFn: async (id: string) => {
            if (!tenant?.id) throw new Error('No active team workspace');
            const { error } = await supabase
                .from('player_availability')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['player-availability'] });
            toast.success('Availability removed');
        },
        onError: (error: unknown) => {
            toast.error(errorMessage(error, 'Failed to remove availability'));
        },
    });

    return {
        availability: availability || [],
        isLoading,
        error: error ? errorMessage(error, 'Availability could not be loaded') : null,
        refetch,
        saveAvailability: saveAvailability.mutateAsync,
        deleteAvailability: deleteAvailability.mutateAsync,
        isDeleting: deleteAvailability.isPending,
        pendingAvailabilityId: deleteAvailability.variables || null,
    };
}
