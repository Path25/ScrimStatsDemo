
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Tenant = Database['public']['Tables']['tenants']['Row'];
type TenantUser = Database['public']['Tables']['tenant_users']['Row'];

interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  primaryColor: string;
  subscriptionTier: 'free' | 'pro' | 'elite';
  subscriptionStatus: string;
  isActive: boolean;
  userRole?: string;
  settings?: Record<string, any>;
  grid_api_key?: string;
  grid_team_id?: string;
  grid_integration_enabled?: boolean;
}

interface TenantContextType {
  tenant: TenantConfig | null;
  isLoading: boolean;
  error: string | null;
  hasNoTenant: boolean; // New flag to indicate user has no tenant but is authenticated
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNoTenant, setHasNoTenant] = useState(false);

  const loadUserTenant = async () => {
    if (!user) {
      setTenant(null);
      setHasNoTenant(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Loading tenant for user:', user.email);
      
      // First, find which tenant(s) this user belongs to
      const { data: tenantUsers, error: tenantUserError } = await supabase
        .from('tenant_users')
        .select(`
          tenant_id,
          role,
          tenants (
            id,
            slug,
            name,
            settings,
            subscription_tier,
            subscription_status,
            grid_api_key,
            grid_team_id,
            grid_integration_enabled,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (tenantUserError) {
        console.error('Tenant user error:', tenantUserError);
        setError('Failed to load user tenant information');
        setHasNoTenant(false);
        return;
      }

      if (!tenantUsers || !tenantUsers.tenants) {
        console.log('No tenant found for user - they may need to accept an invitation');
        setTenant(null);
        setHasNoTenant(true); // User is authenticated but has no tenant
        setError(null);
        return;
      }

      const tenantData = tenantUsers.tenants as Tenant;
      console.log('Loaded tenant:', tenantData.name, 'with role:', tenantUsers.role);

      // Check if tenant is active (including trial status)
      const isActive = tenantData.subscription_status === 'active' || tenantData.subscription_status === 'trial';

      // Safely parse settings JSON and include created_at
      const settings = (tenantData.settings as Record<string, any>) || {};
      settings.created_at = tenantData.created_at;

      // Convert to TenantConfig format
      const tenantConfig: TenantConfig = {
        id: tenantData.id,
        slug: tenantData.slug,
        name: tenantData.name,
        logo: settings.logo_url as string || undefined,
        primaryColor: settings.primary_color as string || '#00f5ff',
        subscriptionTier: tenantData.subscription_tier as 'free' | 'pro' | 'elite',
        subscriptionStatus: tenantData.subscription_status || 'inactive',
        isActive,
        userRole: tenantUsers.role,
        settings: settings,
        grid_api_key: tenantData.grid_api_key || undefined,
        grid_team_id: tenantData.grid_team_id || undefined,
        grid_integration_enabled: tenantData.grid_integration_enabled || false
      };

      setTenant(tenantConfig);
      setHasNoTenant(false);
      setError(null);
    } catch (err) {
      console.error('Error loading tenant:', err);
      setError('Failed to load tenant configuration');
      setHasNoTenant(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTenant = async () => {
    await loadUserTenant();
  };

  useEffect(() => {
    // Only load tenant when auth is not loading and we have a stable auth state
    if (!authLoading) {
      loadUserTenant();
    }
  }, [user, authLoading]);

  return (
    <TenantContext.Provider value={{ tenant, isLoading: isLoading || authLoading, error, hasNoTenant, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
