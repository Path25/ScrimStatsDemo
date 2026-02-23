import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

export type OpponentTeam = Database['public']['Tables']['opponent_teams']['Row'];
export type OpponentTeamInsert = Database['public']['Tables']['opponent_teams']['Insert'];
export type OpponentTeamUpdate = Database['public']['Tables']['opponent_teams']['Update'];

// High quality mock data for demo fallback
const MOCK_TEAMS: OpponentTeam[] = [
    {
        id: 'mock-team-1',
        name: 'G2 Academy',
        strategic_notes: 'High priority on early drakes. Aggressive jungle invades at level 3. Caps Jr has high roam frequency early.',
        created_by: 'demo',
        tenant_id: 'demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        logo_url: null,
        description: 'Elite European academic roster with high mechanical ceiling.',
        fandom_links: null,
        region: 'EUW',
        social_links: null
    },
    {
        id: 'mock-team-2',
        name: 'FNC TQ',
        strategic_notes: 'Strong teamfighting coordination. Tends to play for late game soul win conditions. Focus on ADC protection.',
        created_by: 'demo',
        tenant_id: 'demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        logo_url: null,
        description: 'Consistent top-tier regional competitor known for macro discipline.',
        fandom_links: null,
        region: 'EUW',
        social_links: null
    },
    {
        id: 'mock-team-3',
        name: 'KCB Blue',
        strategic_notes: 'Focus on Top side map control. High priority on K\'Sante and Jax. Cabochard Jr is the primary focus of early ganks.',
        created_by: 'demo',
        tenant_id: 'demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        logo_url: null,
        description: 'The storied academy roster of Karmine Corp.',
        fandom_links: null,
        region: 'EUW',
        social_links: null
    },
    {
        id: 'mock-team-4',
        name: 'T1 Academy',
        strategic_notes: 'Perfect macro execution. Rarely drops waves. Extreme discipline in lane swaps and objective setups.',
        created_by: 'demo',
        tenant_id: 'demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        logo_url: null,
        description: 'South Korean powerhouse academy team with unparalleled fundamentals.',
        fandom_links: null,
        region: 'KR',
        social_links: null
    },
    {
        id: 'mock-team-5',
        name: 'Cloud9 Stratus',
        strategic_notes: 'Innovative draft strategies. Frequent use of off-meta mid-lane picks. Strong early-game synergy between Mid/Jungle.',
        created_by: 'demo',
        tenant_id: 'demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        logo_url: null,
        description: 'North American developmental roster focused on creative playstyles.',
        fandom_links: null,
        region: 'NA',
        social_links: null
    },
    {
        id: 'mock-team-6',
        name: 'Vitality.Bee',
        strategic_notes: 'Aggressive dive-oriented compositions. High comfort on Leona and Nautilus. Constant pressure on bot lane.',
        created_by: 'demo',
        tenant_id: 'demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        logo_url: null,
        description: 'French regional favorites with a focus on chaotic teamfights.',
        fandom_links: null,
        region: 'EUW',
        social_links: null
    }
];

export function useOpponentTeams() {
    const { tenant } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['opponent-teams', tenant?.id],
        queryFn: async () => {
            if (!tenant?.id) return MOCK_TEAMS;

            const { data, error } = await supabase
                .from('opponent_teams')
                .select('*')
                .eq('tenant_id', tenant.id)
                .order('name');

            if (error) throw error;

            // If database is empty, return mock data for demo purposes
            if (!data || data.length === 0) {
                return MOCK_TEAMS;
            }

            return data as OpponentTeam[];
        },
        enabled: true, // Always enabled so we can show mock data even without tenant
    });

    const createTeam = useMutation({
        mutationFn: async (teamData: Omit<OpponentTeamInsert, 'tenant_id' | 'created_by'>) => {
            if (!tenant?.id || !user?.id) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('opponent_teams')
                .insert({
                    ...teamData,
                    tenant_id: tenant.id,
                    created_by: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-teams'] });
            toast.success('Opponent team added successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add opponent team');
        },
    });

    const updateTeam = useMutation({
        mutationFn: async ({ id, ...updates }: OpponentTeamUpdate & { id: string }) => {
            // Check if it's a mock team - in demo we don't persist edits to mock data to DB
            if (id.startsWith('mock-')) {
                toast.info("Demo Mode: Simulated edit saved locally.");
                return updates as OpponentTeam;
            }

            const { data, error } = await supabase
                .from('opponent_teams')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-teams'] });
            toast.success('Opponent team updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update team');
        },
    });

    const deleteTeam = useMutation({
        mutationFn: async (id: string) => {
            if (id.startsWith('mock-')) {
                toast.info("Demo Mode: Simulated deletion.");
                return;
            }

            const { error } = await supabase
                .from('opponent_teams')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opponent-teams'] });
            toast.success('Opponent team deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete team');
        },
    });

    return {
        data: data || MOCK_TEAMS,
        isLoading,
        error,
        createTeam: createTeam.mutateAsync,
        updateTeam: updateTeam.mutateAsync,
        deleteTeam: deleteTeam.mutateAsync,
    };
}
