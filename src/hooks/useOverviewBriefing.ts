import { useQuery } from "@tanstack/react-query";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import {
  buildOverviewBriefing,
  type OverviewCalendarEvent,
  type OverviewGame,
  type OverviewScrim,
} from "@/lib/overview-briefing";

const scrimFields =
  "id, opponent_name, starts_at, ends_at, format, status, result, our_score, opponent_score, notes";

export function useOverviewBriefing() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["overview-briefing", tenant?.id],
    enabled: Boolean(tenant?.id),
    staleTime: 30_000,
    queryFn: async () => {
      if (!tenant?.id) return null;

      const now = new Date();
      const oldestRelevant = new Date(now.getTime() - 90 * 86_400_000).toISOString();
      const [futureResponse, historyResponse, eventsResponse] = await Promise.all([
        supabase
          .from("scrims")
          .select(scrimFields)
          .eq("tenant_id", tenant.id)
          .is("archived_at", null)
          .gte("starts_at", now.toISOString())
          .order("starts_at", { ascending: true })
          .limit(100),
        supabase
          .from("scrims")
          .select(scrimFields)
          .eq("tenant_id", tenant.id)
          .is("archived_at", null)
          .gte("starts_at", oldestRelevant)
          .lte("starts_at", now.toISOString())
          .order("starts_at", { ascending: false })
          .limit(100),
        supabase
          .from("calendar_events")
          .select("id, title, event_type, start_time, end_time, location, scrim_id")
          .eq("tenant_id", tenant.id)
          .gte("start_time", now.toISOString())
          .is("scrim_id", null)
          .order("start_time", { ascending: true })
          .limit(100),
      ]);

      if (futureResponse.error) throw futureResponse.error;
      if (historyResponse.error) throw historyResponse.error;
      if (eventsResponse.error) throw eventsResponse.error;

      const scrims = [
        ...((futureResponse.data || []) as OverviewScrim[]),
        ...((historyResponse.data || []) as OverviewScrim[]),
      ];
      const uniqueScrims = [...new Map(scrims.map((scrim) => [scrim.id, scrim])).values()];
      const historyIds = (historyResponse.data || []).map((scrim) => scrim.id);
      let games: OverviewGame[] = [];

      if (historyIds.length) {
        const gamesResponse = await supabase
          .from("scrim_games")
          .select("id, scrim_id, status, result")
          .in("scrim_id", historyIds);
        if (gamesResponse.error) throw gamesResponse.error;
        games = (gamesResponse.data || []) as OverviewGame[];
      }

      return buildOverviewBriefing({
        events: (eventsResponse.data || []) as OverviewCalendarEvent[],
        games,
        now,
        scrims: uniqueScrims,
      });
    },
  });
}
