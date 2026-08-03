import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { useRole } from "@/contexts/RoleContext";
import { useTenant } from "@/contexts/TenantContext";
import { useWorkspaceModules } from "@/hooks/useWorkspaceModules";
import { hasPracticeDevelopmentModuleAccess, parsePracticeDevelopmentActionBreadcrumbs } from "@/lib/practice-development";
import { callPracticeDevelopmentRpc } from "@/lib/practice-development-rpc";

export function usePracticeDevelopmentBreadcrumbs(actionIds: string[]) {
  const { tenant } = useTenant();
  const { activeRole, canViewPracticeDevelopment } = useRole();
  const moduleQuery = useWorkspaceModules();
  const module = moduleQuery.modules.practice_development;
  const moduleAvailable = !moduleQuery.isLoading && !moduleQuery.isError && hasPracticeDevelopmentModuleAccess({
    enabled: module.enabled,
    releaseState: module.state,
    subscriptionTier: tenant?.subscriptionTier,
  });
  const actionIdKey = [...new Set(actionIds)].sort().join(",");
  const normalizedActionIds = useMemo(
    () => actionIdKey ? actionIdKey.split(",") : [],
    [actionIdKey],
  );
  const actionIdChunks = useMemo(() => {
    const chunks: string[][] = [];
    for (let index = 0; index < normalizedActionIds.length; index += 200) {
      chunks.push(normalizedActionIds.slice(index, index + 200));
    }
    return chunks;
  }, [normalizedActionIds]);

  const queries = useQueries({
    queries: actionIdChunks.map((chunk) => ({
      queryKey: ["practice-development-breadcrumbs", tenant?.id, activeRole, chunk.join(",")],
      enabled: Boolean(tenant?.id && canViewPracticeDevelopment && moduleAvailable),
      queryFn: async () => parsePracticeDevelopmentActionBreadcrumbs(
        await callPracticeDevelopmentRpc("get_practice_development_action_breadcrumbs", {
          p_action_ids: chunk,
          p_tenant_id: tenant!.id,
        }),
      ),
      gcTime: 0,
      retry: false,
      staleTime: 15_000,
    })),
  });

  return useMemo(() => {
    const entries = moduleAvailable && !queries.some((query) => query.error)
      ? queries.flatMap((query) => query.data || [])
      : [];
    return new Map(entries.map((entry) => [entry.actionId, entry]));
  }, [moduleAvailable, queries]);
}
