import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

export type OpponentPlaystyleTag = Database['public']['Tables']['opponent_playstyle_tags']['Row'];
export type OpponentPlaystyleTagInsert = Database['public']['Tables']['opponent_playstyle_tags']['Insert'];
export type OpponentPlaystyleTagUpdate = Database['public']['Tables']['opponent_playstyle_tags']['Update'];

// Mock tags for demo
const MOCK_TAGS: OpponentPlaystyleTag[] = [
    { id: 'mock-t1', opponent_team_id: 'mock-team-1', opponent_player_id: null, tag_name: 'Aggressive Early', tag_type: 'team', created_by: 'demo', created_at: '', updated_at: '', confidence_level: 90, notes: null },
    { id: 'mock-t2', opponent_team_id: 'mock-team-1', opponent_player_id: null, tag_name: 'Fast Pace', tag_type: 'team', created_by: 'demo', created_at: '', updated_at: '', confidence_level: 80, notes: null },
    { id: 'mock-t3', opponent_team_id: 'mock-team-2', opponent_player_id: null, tag_name: 'Scaling', tag_type: 'team', created_by: 'demo', created_at: '', updated_at: '', confidence_level: 85, notes: null },
    { id: 'mock-t4', opponent_team_id: 'mock-team-3', opponent_player_id: null, tag_name: 'Splid Push', tag_type: 'team', created_by: 'demo', created_at: '', updated_at: '', confidence_level: 75, notes: null },
];

export function useOpponentPlaystyleTags({ teamId, playerId }: { teamId?: string; playerId?: string }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['opponent-playstyle-tags', teamId, playerId],
        queryFn: async () => {
            // Return mock data for mock entities
            if ((teamId && teamId.startsWith('mock-')) || (playerId && playerId.startsWith('mock-'))) {
                if (playerId) return MOCK_TAGS.filter(t => t.opponent_player_id === playerId);
                return MOCK_TAGS.filter(t => t.opponent_team_id === teamId && t.opponent_player_id === null);
            }

            let query = supabase.from('opponent_playstyle_tags').select('*');

            if (playerId) {
                query = query.eq('opponent_player_id', playerId);
            } else if (teamId) {
                query = query.eq('opponent_team_id', teamId).is('opponent_player_id', null);
            } else {
                return [];
            }

            const { data: dbData, error: dbError } = await query;
            if (dbError) throw dbError;

            // If DB is empty for a real ID, we still show nothing unless it's the specific mock set
            return dbData as OpponentPlaystyleTag[];
        },
        enabled: !!teamId || !!playerId,
    });

    const createTag = useMutation({
        mutationFn: async (tagData: Omit<OpponentPlaystyleTagInsert, 'created_by'>) => {
            if (!user?.id) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('opponent_playstyle_tags')
                .insert({
                    ...tagData,
                    created_by: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-playstyle-tags', teamId, playerId] });
            toast.success('Tag added');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add tag');
        },
    });

    const updateTag = useMutation({
        mutationFn: async ({ id, ...updates }: OpponentPlaystyleTagUpdate & { id: string }) => {
            if (id.startsWith('mock-')) {
                toast.info("Demo Mode: Simulated tag update.");
                return updates as OpponentPlaystyleTag;
            }

            const { data, error } = await supabase
                .from('opponent_playstyle_tags')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-playstyle-tags', teamId, playerId] });
            toast.success('Tag updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update tag');
        },
    });

    const deleteTag = useMutation({
        mutationFn: async (id: string) => {
            if (id.startsWith('mock-')) {
                toast.info("Demo Mode: Simulated tag removal.");
                return;
            }

            const { error } = await supabase
                .from('opponent_playstyle_tags')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-playstyle-tags', teamId, playerId] });
            toast.success('Tag removed');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to remove tag');
        },
    });

    return {
        data: data || [],
        isLoading,
        error,
        createTag: createTag.mutateAsync,
        updateTag: updateTag.mutateAsync,
        deleteTag: deleteTag.mutateAsync,
    };
}
