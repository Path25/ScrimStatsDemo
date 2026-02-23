
import { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useTenantSettings() {
  const { tenant, refreshTenant } = useTenant();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const updateTenantSettings = async (updates: {
    name?: string;
    settings?: Record<string, any>;
    grid_api_key?: string;
    grid_team_id?: string;
    grid_integration_enabled?: boolean;
  }) => {
    if (!tenant) return;

    setIsLoading(true);
    try {
      // Merge existing settings with new settings
      const currentSettings = tenant.settings || {};
      const newSettings = updates.settings ? { ...currentSettings, ...updates.settings } : currentSettings;

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only include name if it's being updated
      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }

      // Only include settings if they're being updated
      if (updates.settings) {
        updateData.settings = newSettings;
      }

      // Add GRID-specific fields if they're being updated
      if (updates.grid_api_key !== undefined) {
        updateData.grid_api_key = updates.grid_api_key;
      }

      if (updates.grid_team_id !== undefined) {
        updateData.grid_team_id = updates.grid_team_id;
      }

      if (updates.grid_integration_enabled !== undefined) {
        updateData.grid_integration_enabled = updates.grid_integration_enabled;
      }

      const { error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', tenant.id);

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: "Your team settings have been saved successfully.",
      });

      // Refresh the tenant context to get updated data
      await refreshTenant();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    tenant,
    updateTenantSettings,
    isLoading,
    // Add aliases for backward compatibility
    updateSettings: updateTenantSettings,
    isUpdating: isLoading
  };
}
