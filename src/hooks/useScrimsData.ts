import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext'; // Fix import path to match usePlayersData
import { toast } from 'sonner';

type Scrim = {
    id: string;
    tenant_id: string;
    opponent_name: string;
    match_date: string;
    scheduled_time: string | null;
    format: string | null;
    status: string;
    result: string | null;
    notes: string | null;
    created_at: string;
};

type ScrimInsert = Omit<Scrim, 'id' | 'created_at' | 'tenant_id'>;
type ScrimUpdate = Partial<ScrimInsert>;

export function useScrimsData() {
    const { tenant } = useTenant();
    const queryClient = useQueryClient();

    // We rely on useOptimizedScrimsData for fetching list, this hook provides mutations.
    // But we can also export a basic list fetch if needed.

    const createScrimMutation = useMutation({
        mutationFn: async (scrimData: ScrimInsert) => {
            if (!tenant?.id) throw new Error('No tenant selected');

            const { data, error } = await supabase
                .from('scrims')
                .insert({
                    ...scrimData,
                    tenant_id: tenant.id,
                    created_by: tenant.id, // using tenant id as user id fallback or if tenant_users triggers handle it
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrims-optimized'] });
            toast.success('Scrim scheduled successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to schedule scrim');
        },
    });

    const updateScrimMutation = useMutation({
        mutationFn: async ({ id, ...updates }: ScrimUpdate & { id: string }) => {
            const { data, error } = await supabase
                .from('scrims')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrims-optimized'] });
            toast.success('Scrim updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update scrim');
        },
    });

    const deleteScrimMutation = useMutation({
        mutationFn: async (scrimId: string) => {
            const { error } = await supabase
                .from('scrims')
                .delete()
                .eq('id', scrimId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrims-optimized'] });
            toast.success('Scrim deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete scrim');
        },
    });

    return {
        createScrim: createScrimMutation.mutate,
        updateScrim: updateScrimMutation.mutate,
        deleteScrim: deleteScrimMutation.mutate,
        isCreating: createScrimMutation.isPending,
        isUpdating: updateScrimMutation.isPending,
        isDeleting: deleteScrimMutation.isPending,
    };
}
