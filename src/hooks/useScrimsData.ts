import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext'; // Fix import path to match usePlayersData
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatInTimeZone } from 'date-fns-tz';

function errorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    if (error && typeof error === "object" && "message" in error) {
        const message = String((error as { message?: unknown }).message || "").trim();
        const details =
            "details" in error
                ? String((error as { details?: unknown }).details || "").trim()
                : "";
        return [message, details].filter(Boolean).join(" — ") || fallback;
    }
    return fallback;
}

type Scrim = {
    id: string;
    tenant_id: string;
    opponent_name: string;
    opponent_team_id: string | null;
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
export type ScheduleScrimInput = {
    opponent_name: string;
    opponent_team_id?: string | null;
    starts_at: string;
    timezone: string;
    duration_minutes: number;
    format: string;
    notes?: string | null;
};

export function useScrimsData() {
    const { tenant } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // We rely on useOptimizedScrimsData for fetching list, this hook provides mutations.
    // But we can also export a basic list fetch if needed.

    const createScrimMutation = useMutation({
        mutationFn: async (scrimData: ScrimInsert) => {
            if (!tenant?.id || !user?.id) throw new Error('No authenticated workspace selected');

            const { data, error } = await supabase
                .from('scrims')
                .insert({
                    ...scrimData,
                    tenant_id: tenant.id,
                    created_by: user.id,
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
        onError: (error: unknown) => {
            toast.error(errorMessage(error, 'Failed to schedule scrim'));
        },
    });

    const scheduleScrimMutation = useMutation({
        mutationFn: async (input: ScheduleScrimInput) => {
            if (!tenant?.id || !user?.id) throw new Error('No authenticated workspace selected');
            const primary = await supabase.rpc('schedule_scrim_block', {
                p_tenant_id: tenant.id,
                p_opponent_name: input.opponent_name,
                p_opponent_team_id: input.opponent_team_id || undefined,
                p_starts_at: input.starts_at,
                p_timezone: input.timezone,
                p_duration_minutes: input.duration_minutes,
                p_format: input.format,
                p_notes: input.notes || undefined,
            });
            if (!primary.error) return primary.data;

            if (primary.error.code !== "PGRST202") throw primary.error;

            const startsAt = new Date(input.starts_at);
            const fallback = await supabase.rpc('create_scrim_block', {
                p_tenant_id: tenant.id,
                p_opponent_name: input.opponent_name,
                p_opponent_team_id: input.opponent_team_id || undefined,
                p_local_date: formatInTimeZone(startsAt, input.timezone, "yyyy-MM-dd"),
                p_local_time: formatInTimeZone(startsAt, input.timezone, "HH:mm:ss"),
                p_timezone: input.timezone,
                p_duration_minutes: input.duration_minutes,
                p_format: input.format,
                p_notes: input.notes || undefined,
            });
            if (fallback.error) throw fallback.error;
            return fallback.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrims-optimized'] });
            queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
            toast.success('Practice block scheduled');
        },
        onError: (error: unknown) => {
            toast.error(errorMessage(error, 'Failed to schedule the practice block'));
        },
    });

    const updateScrimMutation = useMutation({
        mutationFn: async ({ id, ...updates }: ScrimUpdate & { id: string }) => {
            if (!tenant?.id) throw new Error('No authenticated workspace selected');
            const { data, error } = await supabase
                .from('scrims')
                .update(updates)
                .eq('id', id)
                .eq('tenant_id', tenant.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrims-optimized'] });
            queryClient.invalidateQueries({ queryKey: ['scrim-block'] });
            queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
            queryClient.invalidateQueries({ queryKey: ['overview-briefing'] });
            toast.success('Scrim updated successfully');
        },
        onError: (error: unknown) => {
            toast.error(errorMessage(error, 'Failed to update scrim'));
        },
    });

    const archiveScrimMutation = useMutation({
        mutationFn: async ({ scrimId, restore = false }: { scrimId: string; restore?: boolean }) => {
            if (!tenant?.id) throw new Error('No authenticated workspace selected');
            const { error } = await supabase.rpc('archive_scrim_block', { p_scrim_id: scrimId, p_restore: restore });
            if (error) throw error;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['scrims-optimized'] });
            queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
            queryClient.invalidateQueries({ queryKey: ['overview-briefing'] });
            toast.success(variables.restore ? 'Scrim restored.' : 'Scrim archived.');
        },
        onError: (error: unknown) => {
            toast.error(errorMessage(error, 'Scrim archive state could not be changed'));
        },
    });

    return {
        createScrim: createScrimMutation.mutate,
        scheduleScrim: scheduleScrimMutation.mutate,
        scheduleScrimAsync: scheduleScrimMutation.mutateAsync,
        updateScrim: updateScrimMutation.mutate,
        archiveScrim: (scrimId: string) => archiveScrimMutation.mutate({ scrimId }),
        restoreScrim: (scrimId: string) => archiveScrimMutation.mutate({ scrimId, restore: true }),
        deleteScrim: (scrimId: string) => archiveScrimMutation.mutate({ scrimId }),
        isCreating: createScrimMutation.isPending || scheduleScrimMutation.isPending,
        isUpdating: updateScrimMutation.isPending,
        isDeleting: archiveScrimMutation.isPending,
    };
}
