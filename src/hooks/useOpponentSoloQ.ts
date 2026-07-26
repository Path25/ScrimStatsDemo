import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export function useOpponentSoloQ(opponentPlayerId: string | null, enabled = true) {
  const queryClient = useQueryClient();
  const queryKey = ["opponent-soloq", opponentPlayerId];
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!opponentPlayerId) return { snapshots: [], matches: [], state: null };
      const [snapshots, matches, state] = await Promise.all([
        supabase.from("opponent_soloq_daily_snapshots").select("*")
          .eq("opponent_player_id", opponentPlayerId)
          .order("snapshot_date", { ascending: false }).limit(30),
        supabase.from("opponent_soloq_recent_matches").select("*")
          .eq("opponent_player_id", opponentPlayerId)
          .order("played_at", { ascending: false }).limit(20),
        supabase.from("opponent_soloq_sync_state").select("*")
          .eq("opponent_player_id", opponentPlayerId).maybeSingle(),
      ]);
      const error = snapshots.error || matches.error || state.error;
      if (error) throw error;
      return {
        snapshots: snapshots.data || [],
        matches: matches.data || [],
        state: state.data,
      };
    },
    enabled: Boolean(opponentPlayerId) && enabled,
  });
  const refresh = useMutation({
    mutationFn: async () => {
      if (!opponentPlayerId) throw new Error("Choose an opponent player first.");
      const { data, error } = await supabase.functions.invoke("opponent-soloq-sync", {
        body: { opponentPlayerId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Opponent Solo Queue history refreshed");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Opponent refresh failed");
    },
  });
  return {
    ...query,
    refresh: refresh.mutateAsync,
    refreshing: refresh.isPending,
  };
}
