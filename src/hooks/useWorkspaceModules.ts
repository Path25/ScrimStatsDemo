import { useQuery } from "@tanstack/react-query";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import {
  defaultWorkspaceModules,
  type WorkspaceModuleAccess,
  type WorkspaceModuleKey,
} from "@/types/workspaceModules";

export function useWorkspaceModules() {
  const { tenant } = useTenant();

  const query = useQuery({
    queryKey: ["workspace-modules", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return defaultWorkspaceModules;

      const { data, error } = await supabase
        .from("tenant_feature_access")
        .select("module_key, release_state, is_enabled")
        .eq("tenant_id", tenant.id);

      if (error) {
        // The app remains navigable before the additive migration is applied.
        return defaultWorkspaceModules;
      }

      const modules = { ...defaultWorkspaceModules };
      for (const row of data || []) {
        const key = row.module_key as WorkspaceModuleKey;
        if (!(key in modules)) continue;
        modules[key] = {
          key,
          state: row.release_state as WorkspaceModuleAccess["state"],
          enabled: row.is_enabled,
        };
      }
      return modules;
    },
    enabled: Boolean(tenant?.id),
    staleTime: 60_000,
  });

  return {
    modules: query.data || defaultWorkspaceModules,
    isLoading: query.isLoading,
  };
}
