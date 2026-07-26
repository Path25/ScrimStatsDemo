import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Tenant = Database['public']['Tables']['tenants']['Row'];

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  primaryColor: string;
  subscriptionTier: 'free' | 'pro' | 'elite';
  subscriptionStatus: string;
  isActive: boolean;
  userRole: string;
  settings: Record<string, unknown>;
}

interface TenantContextType {
  tenant: TenantConfig | null;
  memberships: TenantConfig[];
  isLoading: boolean;
  error: string | null;
  hasNoTenant: boolean;
  requiresWorkspaceSelection: boolean;
  chooseTenant: (tenantId: string) => void;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);
const activeTenantStorageKey = 'scrimstats.active-tenant';

function toTenantConfig(row: { role: string; tenants: Tenant | Tenant[] | null }): TenantConfig | null {
  const rawTenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
  if (!rawTenant) return null;

  const settings = { ...((rawTenant.settings as Record<string, unknown>) || {}) };
  delete settings.riot_api_key;
  delete settings.grid_api_key;

  return {
    id: rawTenant.id,
    slug: rawTenant.slug,
    name: rawTenant.name,
    logo: typeof settings.logo_url === 'string' ? settings.logo_url : undefined,
    primaryColor: typeof settings.primary_color === 'string' ? settings.primary_color : '#18b8a6',
    subscriptionTier: rawTenant.subscription_tier as TenantConfig['subscriptionTier'],
    subscriptionStatus: rawTenant.subscription_status || 'inactive',
    isActive: ['active', 'trial'].includes(rawTenant.subscription_status || ''),
    userRole: row.role,
    settings,
  };
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [memberships, setMemberships] = useState<TenantConfig[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserTenants = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setActiveTenantId(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error: tenantError } = await supabase
      .from('tenant_users')
      .select('tenant_id, role, tenants (id, slug, name, settings, subscription_tier, subscription_status, created_at, updated_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (tenantError) {
      setMemberships([]);
      setError('We could not load your team access. Please try again.');
      setIsLoading(false);
      return;
    }

    const nextMemberships = (data || [])
      .map((membership) => toTenantConfig(membership as unknown as { role: string; tenants: Tenant | Tenant[] | null }))
      .filter((membership): membership is TenantConfig => membership !== null);
    const storedTenantId = window.localStorage.getItem(activeTenantStorageKey);
    const selectedTenantId = nextMemberships.some((membership) => membership.id === storedTenantId)
      ? storedTenantId
      : nextMemberships.length === 1
        ? nextMemberships[0].id
        : null;

    setMemberships(nextMemberships);
    setActiveTenantId(selectedTenantId);
    setError(null);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) void loadUserTenants();
  }, [authLoading, loadUserTenants]);

  const chooseTenant = useCallback((tenantId: string) => {
    if (!memberships.some((membership) => membership.id === tenantId)) return;
    window.localStorage.setItem(activeTenantStorageKey, tenantId);
    setActiveTenantId(tenantId);
  }, [memberships]);

  const tenant = useMemo(
    () => memberships.find((membership) => membership.id === activeTenantId) || null,
    [activeTenantId, memberships],
  );

  return (
    <TenantContext.Provider
      value={{
        tenant,
        memberships,
        isLoading: isLoading || authLoading,
        error,
        hasNoTenant: Boolean(user) && !isLoading && memberships.length === 0,
        requiresWorkspaceSelection: Boolean(user) && memberships.length > 1 && !tenant,
        chooseTenant,
        refreshTenant: loadUserTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) throw new Error('useTenant must be used within a TenantProvider');
  return context;
}
