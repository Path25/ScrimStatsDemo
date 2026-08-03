export interface WorkspaceAccessInput<TMembership extends { id: string }> {
  userId: string | null;
  resolvedUserId: string | null;
  authLoading: boolean;
  membershipLoading: boolean;
  memberships: TMembership[];
  activeTenantId: string | null;
  error: string | null;
}

export interface WorkspaceAccessState<TMembership extends { id: string }> {
  memberships: TMembership[];
  tenant: TMembership | null;
  isLoading: boolean;
  error: string | null;
  hasNoTenant: boolean;
  requiresWorkspaceSelection: boolean;
}

export function resolveWorkspaceAccess<TMembership extends { id: string }>({
  userId,
  resolvedUserId,
  authLoading,
  membershipLoading,
  memberships,
  activeTenantId,
  error,
}: WorkspaceAccessInput<TMembership>): WorkspaceAccessState<TMembership> {
  const belongsToCurrentUser = resolvedUserId === userId;
  const currentMemberships = belongsToCurrentUser ? memberships : [];
  const currentError = belongsToCurrentUser ? error : null;
  const isLoading = authLoading || membershipLoading || !belongsToCurrentUser;
  const tenant = currentMemberships.find((membership) => membership.id === activeTenantId) || null;

  return {
    memberships: currentMemberships,
    tenant,
    isLoading,
    error: currentError,
    hasNoTenant: Boolean(userId) && !isLoading && !currentError && currentMemberships.length === 0,
    requiresWorkspaceSelection:
      Boolean(userId) && !isLoading && !currentError && currentMemberships.length > 1 && !tenant,
  };
}
