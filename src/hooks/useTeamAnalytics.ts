import { useQuery } from "@tanstack/react-query";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import type { TeamAnalyticsDataset } from "@/lib/analytics/team-analytics";

export function useTeamAnalytics(dateFrom: string, dateTo: string, enabled = true) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["team-analytics-v2", tenant?.id, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenant?.id) throw new Error("A workspace is required.");
      const { data, error } = await supabase.rpc("get_team_analytics_dataset", {
        p_tenant_id: tenant.id,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      });
      if (error) throw error;
      return data as unknown as TeamAnalyticsDataset;
    },
    enabled: Boolean(tenant?.id) && enabled,
  });
}
