import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';
import { collectorEntitled } from '@/lib/collector-entitlement';
import { workspaceLogoBucket, workspaceLogoPathFromSettings } from '@/lib/workspace-logo';

type Tenant = Database['public']['Tables']['tenants']['Row'];

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  primaryColor: string;
  subscriptionTier: 'free' | 'pro' | 'elite';
  subscriptionStatus: string;
  subscriptionPeriodEnd?: string | null;
  subscriptionPastDueStartedAt?: string | null;
  collectorEntitled: boolean;
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

  const lifecycle = rawTenant as Tenant & { subscription_period_end?: string | null; subscription_past_due_started_at?: string | null };
  return {
    id: rawTenant.id,
    slug: rawTenant.slug,
    name: rawTenant.name,
    logo: typeof settings.logo_url === 'string' ? settings.logo_url : undefined,
    primaryColor: typeof settings.primary_color === 'string' ? settings.primary_color : '#18b8a6',
    subscriptionTier: rawTenant.subscription_tier as TenantConfig['subscriptionTier'],
    subscriptionStatus: rawTenant.subscription_status || 'inactive',
    subscriptionPeriodEnd: lifecycle.subscription_period_end,
    subscriptionPastDueStartedAt: lifecycle.subscription_past_due_started_at,
    collectorEntitled: collectorEntitled({ subscriptionTier: rawTenant.subscription_tier, subscriptionStatus: rawTenant.subscription_status || 'inactive', subscriptionPeriodEnd: lifecycle.subscription_period_end, subscriptionPastDueStartedAt: lifecycle.subscription_past_due_started_at }),
    isActive: ['active', 'trial'].includes(rawTenant.subscription_status || ''),
    userRole: row.role,
    settings,
  };
}

async function withSignedWorkspaceLogo(config: TenantConfig) {
  const logoPath = workspaceLogoPathFromSettings(config.settings);
  if (!logoPath) return config;

  const { data, error } = await supabase.storage
    .from(workspaceLogoBucket)
    .createSignedUrl(logoPath, 60 * 60);

  return !error && data?.signedUrl ? { ...config, logo: data.signedUrl } : config;
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
      .select('tenant_id, role, tenants (id, slug, name, settings, subscription_tier, subscription_status, subscription_period_end, subscription_past_due_started_at, created_at, updated_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (tenantError) {
      setMemberships([]);
      setError('We could not load your team access. Please try again.');
      setIsLoading(false);
      return;
    }

    const membershipConfigs = (data || [])
      .map((membership) => toTenantConfig(membership as unknown as { role: string; tenants: Tenant | Tenant[] | null }))
      .filter((membership): membership is TenantConfig => membership !== null);
    const nextMemberships = await Promise.all(membershipConfigs.map(withSignedWorkspaceLogo));
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

  useEffect(() => {
    if (!user) return;
    const refreshTimer = window.setInterval(() => void loadUserTenants(), 45 * 60 * 1000);
    return () => window.clearInterval(refreshTimer);
  }, [loadUserTenants, user]);

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
