import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { AvailabilityEntry, AvailabilityFormData } from '@/types/availability';

export type AvailabilityRow = Database['public']['Tables']['player_availability']['Row'];
export type AvailabilityInsert = Database['public']['Tables']['player_availability']['Insert'];
export type AvailabilityUpdate = Database['public']['Tables']['player_availability']['Update'];

// High quality mock data for demo fallback
const MOCK_AVAILABILITY: AvailabilityEntry[] = [
    {
        id: 'mock-avail-1',
        playerId: 'mock-player-1',
        playerName: 'Theory',
        playerRole: 'mid',
        tenantId: 'demo',
        startTime: new Date(new Date().setHours(14, 0, 0, 0)),
        endTime: new Date(new Date().setHours(20, 0, 0, 0)),
        isAvailable: true,
        recurrenceRule: 'daily',
        notes: 'Available every evening for practice.',
        createdBy: 'demo',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'mock-avail-2',
        playerId: 'mock-player-2',
        playerName: 'Vortex',
        playerRole: 'jungle',
        tenantId: 'demo',
        startTime: new Date(new Date().setHours(16, 0, 0, 0)),
        endTime: new Date(new Date().setHours(22, 0, 0, 0)),
        isAvailable: true,
        recurrenceRule: 'daily',
        notes: 'Late night preference.',
        createdBy: 'demo',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'mock-avail-3',
        playerId: 'mock-player-3',
        playerName: 'Shield',
        playerRole: 'top',
        tenantId: 'demo',
        startTime: new Date(new Date().setHours(15, 0, 0, 0)),
        endTime: new Date(new Date().setHours(21, 0, 0, 0)),
        isAvailable: true,
        recurrenceRule: 'daily',
        notes: null,
        createdBy: 'demo',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'mock-avail-4',
        playerId: 'mock-player-4',
        playerName: 'Pulse',
        playerRole: 'adc',
        tenantId: 'demo',
        startTime: new Date(new Date().setHours(15, 0, 0, 0)),
        endTime: new Date(new Date().setHours(21, 0, 0, 0)),
        isAvailable: true,
        recurrenceRule: 'daily',
        notes: null,
        createdBy: 'demo',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'mock-avail-5',
        playerId: 'mock-player-5',
        playerName: 'Aura',
        playerRole: 'support',
        tenantId: 'demo',
        startTime: new Date(new Date().setHours(15, 0, 0, 0)),
        endTime: new Date(new Date().setHours(21, 0, 0, 0)),
        isAvailable: true,
        recurrenceRule: 'daily',
        notes: null,
        createdBy: 'demo',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

export function useAvailability() {
    const { tenant } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: availability, isLoading, error } = useQuery({
        queryKey: ['player-availability', tenant?.id],
        queryFn: async () => {
            if (!tenant?.id) return MOCK_AVAILABILITY;

            const { data, error } = await supabase
                .from('player_availability')
                .select(`
                    *,
                    player:players(id, summoner_name, role)
                `)
                .eq('tenant_id', tenant.id)
                .order('start_time');

            if (error) throw error;

            const dbData = data.map(item => ({
                id: item.id,
                playerId: item.player_id,
                playerName: (item.player as any)?.summoner_name,
                playerRole: (item.player as any)?.role,
                tenantId: item.tenant_id,
                startTime: new Date(item.start_time),
                endTime: new Date(item.end_time),
                isAvailable: item.is_available,
                recurrence_rule: item.recurrence_rule,
                notes: item.notes,
                createdBy: item.created_by,
                createdAt: new Date(item.created_at),
                updatedAt: new Date(item.updated_at)
            })) as AvailabilityEntry[];

            // Fallback for demo if DB is empty
            if (dbData.length === 0) {
                return MOCK_AVAILABILITY;
            }

            return dbData;
        },
        enabled: true,
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
                notes: formData.notes || null,
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
        onError: (error: any) => {
            toast.error(error.message || 'Failed to save availability');
        },
    });

    const deleteAvailability = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('player_availability')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['player-availability'] });
            toast.success('Availability removed');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to remove availability');
        },
    });

    return {
        availability: availability || [],
        isLoading,
        error,
        saveAvailability: saveAvailability.mutateAsync,
        deleteAvailability: deleteAvailability.mutateAsync,
    };
}
