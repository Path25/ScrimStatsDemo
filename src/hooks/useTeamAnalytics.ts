import { useQuery } from "@tanstack/react-query";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import type { TeamAnalyticsDataset } from "@/lib/analytics/team-analytics";

export function useTeamAnalytics(dateFrom: string, dateTo: string, enabled = true) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["team-analytics-v3", tenant?.id, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenant?.id) throw new Error("A workspace is required.");
      const { data, error } = await supabase.rpc("get_team_analytics_dataset", {
        p_tenant_id: tenant.id,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      });
      if (error) throw error;
      const dataset = data as unknown as TeamAnalyticsDataset;
      return {
        ...dataset,
        events: Array.isArray(dataset.events) ? dataset.events : [],
        drafts: Array.isArray(dataset.drafts) ? dataset.drafts : [],
        games: (dataset.games ?? []).map((game) => ({
          ...game,
          quality_flags: Array.isArray(game.quality_flags) ? game.quality_flags : [],
          roster_coverage: Number.isFinite(game.roster_coverage) ? game.roster_coverage : 0,
          score_eligible: game.score_eligible === true,
        })),
      };
    },
    enabled: Boolean(tenant?.id) && enabled,
  });
}
