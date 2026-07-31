import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

export function useLeaguepediaDraftHistory(opponentTeamId?: string, enabled = true, canMutate = true) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const key = ["leaguepedia-draft-history", tenant?.id, opponentTeamId];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!tenant?.id || !opponentTeamId) return null;
      const [team, games, links] = await Promise.all([
        supabase
          .from("opponent_teams")
          .select("id,name,leaguepedia_name,leaguepedia_last_synced_at,leaguepedia_sync_error")
          .eq("tenant_id", tenant.id)
          .eq("id", opponentTeamId)
          .single(),
        supabase
          .from("opponent_external_draft_games")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("opponent_team_id", opponentTeamId)
          .order("played_at", { ascending: false })
          .limit(50),
        supabase
          .from("preparation_brief_external_drafts")
          .select("brief_id,external_draft_game_id,display_order")
          .eq("tenant_id", tenant.id)
          .order("display_order"),
      ]);
      const firstError = [team.error, games.error, links.error].find(Boolean);
      if (firstError) throw firstError;
      return { team: team.data, games: games.data || [], links: links.data || [] };
    },
    enabled: Boolean(tenant?.id && opponentTeamId && enabled),
  });

  const importHistory = useMutation({
    mutationFn: async (leaguepediaName: string) => {
      if (!canMutate) throw new Error("Your workspace role is read-only.");
      if (!opponentTeamId) throw new Error("Opponent context is required.");
      const { data, error } = await supabase.functions.invoke("leaguepedia-draft-import", {
        body: { opponentTeamId, leaguepediaName: leaguepediaName.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { cached?: boolean; imported?: number; retryAt?: string | null };
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: key });
      if (result.cached) {
        toast.info("Recent draft history is already cached for this opponent.");
      } else {
        toast.success(`${result.imported || 0} attributed draft records imported`);
      }
    },
  });

  const setBriefDrafts = useMutation({
    mutationFn: async ({ briefId, gameIds }: { briefId: string; gameIds: string[] }) => {
      if (!canMutate) throw new Error("Your workspace role is read-only.");
      const { error } = await supabase.rpc("set_preparation_brief_external_drafts", {
        p_brief_id: briefId,
        p_external_draft_ids: gameIds,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ["preparation-workspace", tenant?.id] });
      toast.success("Draft evidence attached to the match plan");
    },
  });

  return {
    ...query,
    importHistory: importHistory.mutateAsync,
    importing: importHistory.isPending,
    setBriefDrafts: setBriefDrafts.mutateAsync,
    savingSelection: setBriefDrafts.isPending,
  };
}
