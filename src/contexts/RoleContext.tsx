import { createContext, useContext, ReactNode, useMemo, useState } from 'react';
import { useTenant } from './TenantContext';
import { UserRole } from '@/types/auth';

interface RoleContextType {
    activeRole: UserRole | null;
    isOwner: boolean;
    isManager: boolean;
    isCoach: boolean;
    isPlayer: boolean;
    // Helper to check if user has at least this level of access
    hasAccess: (role: UserRole) => boolean;
    // For demo purposes: allow manual role switching
    setActiveRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_HIERARCHY: Record<UserRole, number> = {
    'owner': 4,
    'manager': 3,
    'coach': 2,
    'player': 1
};

export function RoleProvider({ children }: { children: ReactNode }) {
    const { tenant } = useTenant();
    const [manualRole, setManualRole] = useState<UserRole | null>(null);

    // transform string to UserRole safely, prioritizing manual override for demo
    const activeRole = manualRole || (tenant?.userRole as UserRole) || null;

    const value = useMemo(() => {
        const hierarchyLevel = activeRole ? ROLE_HIERARCHY[activeRole] : 0;

        return {
            activeRole,
            isOwner: activeRole === 'owner',
            isManager: activeRole === 'manager' || activeRole === 'owner',
            isCoach: activeRole === 'coach' || activeRole === 'manager' || activeRole === 'owner',
            isPlayer: true, // Everyone can be a player? Or strictly Role === player.
            hasAccess: (requiredRole: UserRole) => hierarchyLevel >= ROLE_HIERARCHY[requiredRole]
        };
    }, [activeRole]);

    // Derived flags for easy access
    const contextValue: RoleContextType = {
        ...value,
        isOwner: activeRole === 'owner',
        isManager: activeRole === 'manager' || activeRole === 'owner',
        isCoach: activeRole === 'coach' || activeRole === 'manager' || activeRole === 'owner',
        isPlayer: activeRole === 'player',
        setActiveRole: (role: UserRole) => setManualRole(role),
    };

    return (
        <RoleContext.Provider value={contextValue}>
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
