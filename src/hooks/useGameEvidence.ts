import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

export function useGameEvidence(gameId?: string) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const evidence = useQuery({
    queryKey: ["game-evidence", tenant?.id, gameId],
    queryFn: async () => {
      if (!tenant?.id || !gameId) return null;
      const { data, error } = await supabase
        .from("scrim_game_evidence")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("scrim_game_id", gameId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(tenant?.id && gameId),
  });
  const reconciliations = useQuery({
    queryKey: ["game-reconciliations", tenant?.id, gameId],
    queryFn: async () => {
      if (!tenant?.id || !gameId) return [];
      const { data, error } = await supabase
        .from("scrim_game_reconciliations")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("status", "pending")
        .or(`first_game_id.eq.${gameId},second_game_id.eq.${gameId}`);
      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(tenant?.id && gameId),
  });
  const resolve = useMutation({
    mutationFn: async (input: { id: string; action: "resolved" | "dismissed"; acceptedGameId?: string }) => {
      const { data, error } = await supabase.rpc("resolve_game_reconciliation", {
        p_reconciliation_id: input.id,
        p_action: input.action,
        p_accepted_game_id: input.acceptedGameId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-reconciliations", tenant?.id, gameId] });
      queryClient.invalidateQueries({ queryKey: ["team-analytics-v3", tenant?.id] });
      toast.success("Evidence conflict resolved");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Conflict could not be resolved"),
  });
  return {
    evidence: evidence.data,
    reconciliations: reconciliations.data || [],
    isLoading: evidence.isLoading || reconciliations.isLoading,
    resolve: resolve.mutateAsync,
    isResolving: resolve.isPending,
  };
}
