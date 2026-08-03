import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useRole } from "@/contexts/RoleContext";
import { useTenant } from "@/contexts/TenantContext";
import { useWorkspaceModules } from "@/hooks/useWorkspaceModules";
import { hasOpponentPreparationModuleAccess, parseOpponentPreparationBreadcrumbs } from "@/lib/opponent-preparation";
import { callOpponentPreparationRpc } from "@/lib/opponent-preparation-rpc";
import type { OpponentPreparationBreadcrumb, OpponentPreparationContextType } from "@/types/opponentPreparation";

export function useOpponentPreparationBreadcrumbs(contextType: OpponentPreparationContextType, contextIds: string[]) {
  const { tenant } = useTenant();
  const { activeRole, canViewOpponentPreparation } = useRole();
  const moduleQuery = useWorkspaceModules();
  const module = moduleQuery.modules.opponent_preparation;
  const ids = useMemo(() => [...new Set(contextIds)].filter(Boolean).sort(), [contextIds]);
  const moduleAvailable = !moduleQuery.isLoading && !moduleQuery.isError && hasOpponentPreparationModuleAccess({
    enabled: module.enabled,
    lifecycleEntitled: tenant?.collectorEntitled,
    releaseState: module.state,
    role: activeRole,
    subscriptionTier: tenant?.subscriptionTier,
  });
  const query = useQuery({
    queryKey: ["opponent-preparation-breadcrumbs", tenant?.id, contextType, activeRole, module.state, module.enabled, ids],
    enabled: Boolean(tenant?.id && ids.length && ids.length <= 100 && canViewOpponentPreparation && moduleAvailable),
    queryFn: async () => parseOpponentPreparationBreadcrumbs(
      await callOpponentPreparationRpc("get_opponent_preparation_breadcrumbs", {
        p_context_ids: ids,
        p_context_type: contextType,
        p_tenant_id: tenant!.id,
      }),
    ),
  });

  return useMemo(() => {
    const breadcrumbs = new Map<string, OpponentPreparationBreadcrumb>();
    if (!moduleAvailable || query.error) return breadcrumbs;
    for (const breadcrumb of query.data || []) breadcrumbs.set(breadcrumb.contextId, breadcrumb);
    return breadcrumbs;
  }, [moduleAvailable, query.data, query.error]);
}
