import { createContext, useContext, ReactNode, useMemo } from 'react';
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
    canManageIntegrations: boolean;
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
    const activeRole = (tenant?.userRole as UserRole) || null;

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
            canManageIntegrations: capabilities.manageIntegrations,
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
