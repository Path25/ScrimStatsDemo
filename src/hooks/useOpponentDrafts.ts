import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

export type OpponentDraft = Database['public']['Tables']['opponent_drafts']['Row'];
export type OpponentDraftInsert = Database['public']['Tables']['opponent_drafts']['Insert'];
export type OpponentDraftUpdate = Database['public']['Tables']['opponent_drafts']['Update'];

// High quality mock draft data
const MOCK_DRAFTS: OpponentDraft[] = [
    {
        id: 'mock-d1',
        opponent_team_id: 'mock-team-1',
        opponent_name: 'G2 Academy',
        match_date: new Date(Date.now() - 86400000).toISOString(),
        result: 'win',
        our_side: 'red',
        draft_data: {
            picks: {
                enemy_picks: ["Maokai", "Tristana", "Nautilus", "Kai'Sa", "Renekton"],
                our_picks: ["Sejuani", "Azir", "Rell", "Xayah", "Ornn"]
            },
            bans: {
                enemy_bans: ["Ashe", "Kalista", "Rumble"],
                our_bans: ["Sylas", "Bel'Veth", "LeBlanc"]
            }
        },
        created_by: 'demo',
        created_at: '',
        updated_at: '',
        game_duration: 32,
        notes: 'Classic G2 aggressive composition. We struggled to match their roam speed.',
        patch_version: '14.1',
        tournament_context: 'Scrim'
    },
    {
        id: 'mock-d2',
        opponent_team_id: 'mock-team-1',
        opponent_name: 'G2 Academy',
        match_date: new Date(Date.now() - 172800000).toISOString(),
        result: 'loss',
        our_side: 'blue',
        draft_data: {
            picks: {
                enemy_picks: ["Lee Sin", "Sylas", "Thresh", "Varus", "Jax"],
                our_picks: ["Vi", "Orianna", "Alistar", "Jinx", "Aatrox"]
            },
            bans: {
                enemy_bans: ["Maokai", "Azir", "K'Sante"],
                our_bans: ["Tristana", "Nidalee", "Renata Glasc"]
            }
        },
        created_by: 'demo',
        created_at: '',
        updated_at: '',
        game_duration: 28,
        notes: 'They successfully isolated our Top side early.',
        patch_version: '14.1',
        tournament_context: 'Scrim'
    },
    {
        id: 'mock-d3',
        opponent_team_id: 'mock-team-2',
        opponent_name: 'FNC TQ',
        match_date: new Date(Date.now() - 43200000).toISOString(),
        result: 'win',
        our_side: 'blue',
        draft_data: {
            picks: {
                enemy_picks: ["Sejuani", "Aphelios", "Lulu", "Azir", "K'Sante"],
                our_picks: ["Jarvan IV", "Zeri", "Nautilus", "Ahri", "Renekton"]
            },
            bans: {
                enemy_bans: ["Vi", "Rumble", "Lucian"],
                our_bans: ["Maokai", "Orianna", "Miliao"]
            }
        },
        created_by: 'demo',
        created_at: '',
        updated_at: '',
        game_duration: 35,
        notes: 'FNC TQ playing a standard front-to-back. We broke their formation mid-game.',
        patch_version: '14.1',
        tournament_context: 'Regional League'
    }
];

export function useOpponentDrafts(teamId?: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['opponent-drafts', teamId],
        queryFn: async () => {
            const { data: dbData, error: dbError } = await supabase
                .from('opponent_drafts')
                .select('*')
                .order('match_date', { ascending: false });

            if (dbError) throw dbError;

            // Filter by teamId if provided
            let resultData = dbData as OpponentDraft[];
            if (teamId && !teamId.startsWith('mock-')) {
                resultData = resultData.filter(d => d.opponent_team_id === teamId);
            }

            // If teamId is a mock team, return specific mock drafts
            if (teamId && teamId.startsWith('mock-')) {
                return MOCK_DRAFTS.filter(d => d.opponent_team_id === teamId);
            }

            // Combine DB data with mock data if DB is empty or for overall analytics
            if (!dbData || dbData.length === 0) {
                return teamId ? MOCK_DRAFTS.filter(d => d.opponent_team_id === teamId) : MOCK_DRAFTS;
            }

            return resultData;
        },
    });

    const createDraft = useMutation({
        mutationFn: async (draftData: Omit<OpponentDraftInsert, 'created_by'>) => {
            if (!user?.id) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('opponent_drafts')
                .insert({
                    ...draftData,
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-drafts'] });
            toast.success('Draft recorded');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to record draft');
        },
    });

    const updateDraft = useMutation({
        mutationFn: async ({ id, ...updates }: OpponentDraftUpdate & { id: string }) => {
            if (id.startsWith('mock-')) {
                toast.info("Demo Mode: Simulated draft update.");
                return updates as OpponentDraft;
            }

            const { data, error } = await supabase
                .from('opponent_drafts')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-drafts'] });
            toast.success('Draft updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update draft');
        },
    });

    const deleteDraft = useMutation({
        mutationFn: async (id: string) => {
            if (id.startsWith('mock-')) {
                toast.info("Demo Mode: Simulated draft deletion.");
                return;
            }

            const { error } = await supabase
                .from('opponent_drafts')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-drafts'] });
            toast.success('Draft deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete draft');
        },
    });

    return {
        data: data || [],
        isLoading,
        error,
        createDraft: createDraft.mutateAsync,
        updateDraft: updateDraft.mutateAsync,
        deleteDraft: deleteDraft.mutateAsync,
    };
}
