
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { InviteMemberDialog } from './InviteMemberDialog';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useTeamInvitations } from '@/hooks/useTeamInvitations';
import { useTenant } from '@/contexts/TenantContext';
import { Users, Mail, UserX, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type TenantRole = Database['public']['Enums']['tenant_role'];

const roleColors = {
  owner: 'bg-purple-500/20 text-purple-500',
  admin: 'bg-blue-500/20 text-blue-500',
  member: 'bg-green-500/20 text-green-500',
  viewer: 'bg-gray-500/20 text-gray-500',
};

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export function TeamAccessManager() {
  const { tenant } = useTenant();
  const { members, isLoading: membersLoading, updateMemberRole, removeMember } = useTeamMembers();
  const { invitations, isLoading: invitationsLoading, cancelInvitation } = useTeamInvitations();

  const canManageAccess = tenant?.userRole === 'owner' || tenant?.userRole === 'admin';

  if (!canManageAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Team Access</span>
          </CardTitle>
          <CardDescription>
            You don't have permission to manage team access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Members */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Team Members</span>
              </CardTitle>
              <CardDescription>
                Manage current team members and their roles
              </CardDescription>
            </div>
            <InviteMemberDialog />
          </div>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="text-center text-muted-foreground">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-center text-muted-foreground">No team members found</div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-500 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
                      {member.display_name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{member.display_name || member.email || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(member.created_at))} ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={roleColors[member.role as TenantRole]}>
                      {roleLabels[member.role as TenantRole]}
                    </Badge>
                    {tenant?.userRole === 'owner' && member.role !== 'owner' && (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(newRole: TenantRole) => 
                            updateMemberRole({ userId: member.user_id, role: newRole })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeMember(member.user_id)}
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Pending Invitations</span>
          </CardTitle>
          <CardDescription>
            Invitations waiting to be accepted
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <div className="text-center text-muted-foreground">Loading invitations...</div>
          ) : invitations.length === 0 ? (
            <div className="text-center text-muted-foreground">No pending invitations</div>
          ) : (
            <div className="space-y-3">
              {invitations
                .filter(inv => !inv.accepted_at && new Date(inv.expires_at) > new Date())
                .map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Expires {formatDistanceToNow(new Date(invitation.expires_at))} from now</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={roleColors[invitation.role as TenantRole]}>
                      {roleLabels[invitation.role as TenantRole]}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelInvitation(invitation.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
