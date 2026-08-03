import { createContext, useContext, ReactNode, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTenant } from './TenantContext';
import { UserRole } from '@/types/auth';
import { getWorkspaceCapabilities } from '@/lib/workspace-capabilities';

interface RoleContextType {
    activeRole: UserRole | null;
    isOwner: boolean;
    isManager: boolean;
    isCoach: boolean;
    isPlayer: boolean;
    canManageTeam: boolean;
    canEditIntelligence: boolean;
    canViewIntelligence: boolean;
    canManageIntegrations: boolean;
    canManagePracticeDevelopment: boolean;
    canViewPracticeDevelopment: boolean;
    // Helper to check if user has at least this level of access
    hasAccess: (role: UserRole) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_HIERARCHY: Record<UserRole, number> = {
    'owner': 4,
    'admin': 3,
    'member': 2,
    'viewer': 1,
};

export function RoleProvider({ children }: { children: ReactNode }) {
    const { tenant } = useTenant();
    const queryClient = useQueryClient();
    const activeRole = (tenant?.userRole as UserRole) || null;
    const previousSecurityScope = useRef({ role: activeRole, tenantId: tenant?.id });

    useEffect(() => {
        const previous = previousSecurityScope.current;
        if (previous.tenantId && (previous.tenantId !== tenant?.id || previous.role !== activeRole)) {
            queryClient.removeQueries({
                queryKey: ['practice-development', previous.tenantId],
                predicate: (query) => query.queryKey[3] === previous.role,
            });
            queryClient.removeQueries({
                queryKey: ['practice-development-breadcrumbs', previous.tenantId],
                predicate: (query) => query.queryKey[2] === previous.role,
            });
        }
        previousSecurityScope.current = { role: activeRole, tenantId: tenant?.id };
    }, [activeRole, queryClient, tenant?.id]);

    const value = useMemo(() => {
        const hierarchyLevel = activeRole ? ROLE_HIERARCHY[activeRole] : 0;
        const capabilities = getWorkspaceCapabilities(activeRole);

        return {
            activeRole,
            isOwner: activeRole === 'owner',
            isManager: activeRole === 'admin' || activeRole === 'owner',
            isCoach: activeRole === 'admin' || activeRole === 'owner',
            isPlayer: activeRole === 'member' || activeRole === 'viewer',
            canManageTeam: capabilities.manageMemberships,
            canEditIntelligence: capabilities.manageIntelligence,
            canViewIntelligence: capabilities.viewIntelligence,
            canManageIntegrations: capabilities.manageIntegrations,
            canManagePracticeDevelopment: capabilities.managePracticeDevelopment,
            canViewPracticeDevelopment: capabilities.viewPracticeDevelopment,
            hasAccess: (requiredRole: UserRole) => hierarchyLevel >= ROLE_HIERARCHY[requiredRole]
        };
    }, [activeRole]);

    return (
        <RoleContext.Provider value={value}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
}
