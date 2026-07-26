import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import type {
  SoloQDailySnapshot,
  SoloQRecentMatch,
  SoloQSyncRun,
  SoloQSyncState,
  SoloQTrackedPlayer,
} from "@/types/soloq";

const SUPPORTED_REGIONS = [
  "br1", "la1", "la2", "na1", "eun1", "eune", "eune1", "euw1", "euw",
  "tr1", "ru", "jp1", "kr", "oc1", "oce", "ph2", "sg2", "th2", "tw2", "vn2",
];

function hasValidIdentity(player: SoloQTrackedPlayer) {
  const riotIdParts = player.riot_id?.split("#") ?? [];
  const name = riotIdParts[0]?.trim() || player.summoner_name.trim();
  const tag = riotIdParts[1]?.trim() || player.riot_tag_line?.replace(/^#/, "").trim();
  return Boolean(name && tag && player.region && SUPPORTED_REGIONS.includes(player.region.toLowerCase()));
}

export function useSoloQTracker(playerId: string) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const tenantId = tenant?.id;
  const selectedEnabled = Boolean(tenantId && playerId);

  const roster = useQuery({
    queryKey: ["soloq-roster", tenantId],
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const { data, error } = await supabase.from("players")
        .select("id, summoner_name, riot_id, riot_tag_line, region, puuid")
        .eq("tenant_id", tenantId!)
        .is("archived_at", null)
        .eq("is_active", true)
        .not("region", "is", null)
        .order("summoner_name");
      if (error) throw error;
      return (data as SoloQTrackedPlayer[]).filter(hasValidIdentity);
    },
  });

  const integration = useQuery({
    queryKey: ["soloq-integration", tenantId],
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const { data, error } = await supabase.from("tenant_riot_integrations")
        .select("status, last_success_at, last_error_code, last_error_message")
        .eq("tenant_id", tenantId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const snapshots = useQuery({
    queryKey: ["soloq-snapshots", tenantId, playerId],
    enabled: selectedEnabled,
    queryFn: async () => {
      const boundary = new Date();
      boundary.setUTCDate(boundary.getUTCDate() - 30);
      const { data, error } = await supabase.from("soloq_daily_snapshots")
        .select("*").eq("tenant_id", tenantId!).eq("player_id", playerId)
        .gte("snapshot_date", boundary.toISOString().slice(0, 10))
        .order("snapshot_date", { ascending: false });
      if (error) throw error;
      return data as SoloQDailySnapshot[];
    },
  });

  const matches = useQuery({
    queryKey: ["soloq-matches", tenantId, playerId],
    enabled: selectedEnabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("soloq_recent_matches")
        .select("*").eq("tenant_id", tenantId!).eq("player_id", playerId)
        .order("played_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data as unknown as SoloQRecentMatch[];
    },
  });

  const syncState = useQuery({
    queryKey: ["soloq-sync-state", tenantId, playerId],
    enabled: selectedEnabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("soloq_sync_state")
        .select("*").eq("tenant_id", tenantId!).eq("player_id", playerId).maybeSingle();
      if (error) throw error;
      return data as SoloQSyncState | null;
    },
  });

  const runProgress = useQuery({
    queryKey: ["soloq-run", tenantId],
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const { data, error } = await supabase.from("soloq_sync_runs")
        .select("*").eq("tenant_id", tenantId!)
        .order("scheduled_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data as SoloQSyncRun | null;
    },
    refetchInterval: (query) => {
      const status = (query.state.data as SoloQSyncRun | null)?.status;
      return status === "pending" || status === "running" ? 4_000 : false;
    },
  });

  const refresh = useMutation({
    mutationFn: async () => {
      if (!playerId) throw new Error("Choose a roster player first.");
      const { data, error } = await supabase.functions.invoke("soloq-sync-v2", {
        body: { mode: "manual", playerId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { queued: boolean; results?: Array<{ status: string }> };
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["soloq-snapshots", tenantId, playerId] }),
        queryClient.invalidateQueries({ queryKey: ["soloq-matches", tenantId, playerId] }),
        queryClient.invalidateQueries({ queryKey: ["soloq-sync-state", tenantId, playerId] }),
        queryClient.invalidateQueries({ queryKey: ["soloq-run", tenantId] }),
      ]);
      const state = result.results?.[0]?.status;
      toast.success(state === "ready" || state === "unranked"
        ? "Solo Queue history updated"
        : "Solo Queue refresh queued");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Solo Queue refresh failed"),
  });

  return {
    players: roster.data ?? [],
    snapshots: snapshots.data ?? [],
    matches: matches.data ?? [],
    syncState: syncState.data ?? null,
    integration: integration.data ?? null,
    run: runProgress.data ?? null,
    roster,
    snapshotsQuery: snapshots,
    matchesQuery: matches,
    syncStateQuery: syncState,
    integrationQuery: integration,
    runQuery: runProgress,
    refresh: refresh.mutateAsync,
    refreshing: refresh.isPending,
  };
}
