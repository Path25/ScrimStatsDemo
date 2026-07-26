import { useQuery } from "@tanstack/react-query";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

export type AnalyticsRole = "top" | "jungle" | "mid" | "adc" | "support";

export interface AnalyticsEvidenceRow {
  games: number;
  wins: number;
  losses: number;
  collector_games: number;
  manual_games: number;
  date_from: string | null;
  date_to: string | null;
}

export interface ChampionEvidenceRow extends AnalyticsEvidenceRow {
  champion: string;
  role: AnalyticsRole;
}

export interface BanEvidenceRow extends AnalyticsEvidenceRow {
  champion_key: string;
}

export interface MatchupEvidenceRow extends ChampionEvidenceRow {
  opponent_champion: string;
}

export interface DuoEvidenceRow extends AnalyticsEvidenceRow {
  first_role: AnalyticsRole;
  first_champion: string;
  second_role: AnalyticsRole;
  second_champion: string;
}

export interface PlayerEvidenceRow {
  player_id: string | null;
  player_name: string;
  games: number;
  wins: number;
  kills_samples: number;
  deaths_samples: number;
  assists_samples: number;
  cs_samples: number;
  gold_samples: number;
  damage_samples: number;
  vision_samples: number;
  total_kills: number | null;
  total_deaths: number | null;
  total_assists: number | null;
  total_cs: number | null;
  total_gold: number | null;
  total_damage: number | null;
  total_vision: number | null;
  date_from: string | null;
  date_to: string | null;
}

export interface CompetitiveDraftAnalytics {
  contract_version: "draft-analytics-v1";
  date_from: string;
  date_to: string;
  filters: {
    opponent_id: string | null;
    side: string | null;
    format: string | null;
  };
  coverage: {
    completed_games: number;
    qualifying_games: number;
    excluded_games: number;
    games_with_team_picks: number;
    games_with_role_matchups: number;
    games_with_bans: number;
    collector_games: number;
    manual_games: number;
  };
  champions: ChampionEvidenceRow[];
  bans: BanEvidenceRow[];
  matchups: MatchupEvidenceRow[];
  duos: DuoEvidenceRow[];
  players: PlayerEvidenceRow[];
}

export interface CompetitiveDraftFilters {
  opponentId?: string;
  side?: "blue" | "red";
  format?: string;
}

export function useCompetitiveDraftAnalytics(
  dateFrom: string,
  dateTo: string,
  filters: CompetitiveDraftFilters = {},
  enabled = true,
) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["competitive-draft-analytics", tenant?.id, dateFrom, dateTo, filters],
    queryFn: async () => {
      if (!tenant?.id) throw new Error("A workspace is required.");
      const { data, error } = await supabase.rpc("get_competitive_draft_analytics", {
        p_tenant_id: tenant.id,
        p_date_from: dateFrom,
        p_date_to: dateTo,
        p_opponent_id: filters.opponentId || undefined,
        p_side: filters.side || undefined,
        p_format: filters.format || undefined,
      });
      if (error) throw error;
      return data as unknown as CompetitiveDraftAnalytics;
    },
    enabled: Boolean(tenant?.id) && enabled,
  });
}
