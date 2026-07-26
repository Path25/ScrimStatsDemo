import { useQuery } from "@tanstack/react-query";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

export interface PerformanceSplit {
  games: number;
  wins: number;
}

export interface TeamPerformanceSummary {
  date_from: string;
  date_to: string;
  blocks: number;
  recorded_games: number;
  excluded_games: number;
  wins: number;
  losses: number;
  collector_games: number;
  manual_games: number;
  blue: PerformanceSplit;
  red: PerformanceSplit;
  formats: Array<{ format: string; blocks: number }>;
  opponents: Array<{ opponent: string; blocks: number }>;
  participation: { players: number; recorded_slots: number };
  filters: {
    opponent_id: string | null;
    side: string | null;
    format: string | null;
  };
  filter_options: {
    opponents: Array<{ id: string; name: string }>;
    formats: string[];
  };
}

function emptySummary(dateFrom: string, dateTo: string): TeamPerformanceSummary {
  return {
    date_from: dateFrom,
    date_to: dateTo,
    blocks: 0,
    recorded_games: 0,
    excluded_games: 0,
    wins: 0,
    losses: 0,
    collector_games: 0,
    manual_games: 0,
    blue: { games: 0, wins: 0 },
    red: { games: 0, wins: 0 },
    formats: [],
    opponents: [],
    participation: { players: 0, recorded_slots: 0 },
    filters: { opponent_id: null, side: null, format: null },
    filter_options: { opponents: [], formats: [] },
  };
}

export interface TeamPerformanceFilters {
  opponentId?: string;
  side?: "blue" | "red";
  format?: string;
}

export function useTeamPerformanceSummary(
  dateFrom: string,
  dateTo: string,
  filters: TeamPerformanceFilters = {},
  enabled = true,
) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["team-performance-summary", tenant?.id, dateFrom, dateTo, filters],
    queryFn: async () => {
      if (!tenant?.id) return emptySummary(dateFrom, dateTo);
      const { data, error } = await supabase.rpc("get_team_performance_summary_filtered", {
        p_tenant_id: tenant.id,
        p_date_from: dateFrom,
        p_date_to: dateTo,
        p_opponent_id: filters.opponentId || undefined,
        p_side: filters.side || undefined,
        p_format: filters.format || undefined,
      });
      if (error) throw error;
      return (data || emptySummary(dateFrom, dateTo)) as unknown as TeamPerformanceSummary;
    },
    enabled: Boolean(tenant?.id) && enabled,
  });
}
