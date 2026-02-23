
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TenantRole = Database['public']['Enums']['tenant_role'];

interface TeamMemberWithProfile {
  id: string;
  user_id: string;
  tenant_id: string;
  role: TenantRole;
  created_at: string;
  display_name?: string;
  email?: string;
}

export function useTeamMembers() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      // First get the tenant users
      const { data: tenantUsers, error: tenantError } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (tenantError) {
        console.error('Error fetching tenant users:', tenantError);
        throw tenantError;
      }
      
      if (!tenantUsers || tenantUsers.length === 0) {
        return [];
      }

      // Then get the profiles for those users with display_name and email
      const userIds = tenantUsers.map(user => user.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      // Combine the data using display_name
      const profilesMap = new Map(profiles?.map(p => [p.id, { 
        display_name: p.display_name || p.email.split('@')[0],
        email: p.email
      }]) || []);
      
      const result = tenantUsers.map(member => {
        const profile = profilesMap.get(member.user_id);
        return {
          ...member,
          display_name: profile?.display_name || `User ${member.user_id.slice(0, 8)}...`,
          email: profile?.email || 'Unknown'
        };
      }) as TeamMemberWithProfile[];
      
      return result;
    },
    enabled: !!tenant?.id,
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: TenantRole }) => {
      if (!tenant?.id) throw new Error('No tenant selected');

      const { error } = await supabase
        .from('tenant_users')
        .update({ role })
        .eq('tenant_id', tenant.id)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Member role updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update member role');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!tenant?.id) throw new Error('No tenant selected');

      const { error } = await supabase
        .from('tenant_users')
        .delete()
        .eq('tenant_id', tenant.id)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Member removed from team');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove member');
    },
  });

  return {
    members: members || [],
    isLoading,
    updateMemberRole: updateMemberRoleMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    isUpdating: updateMemberRoleMutation.isPending,
    isRemoving: removeMemberMutation.isPending,
  };
}
