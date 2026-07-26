import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { ResultSource } from "@/lib/scrim-review";

export type ScrimBlock = Database["public"]["Tables"]["scrims"]["Row"];

function message(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || fallback);
  }
  return fallback;
}

export function useScrimBlock(scrimId?: string) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["scrim-block", tenant?.id, scrimId],
    queryFn: async () => {
      if (!tenant?.id || !scrimId) return null;
      const { data, error } = await supabase
        .from("scrims")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("id", scrimId)
        .is("archived_at", null)
        .maybeSingle();
      if (error) throw error;
      return data as ScrimBlock | null;
    },
    enabled: Boolean(tenant?.id && scrimId),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["scrim-block", tenant?.id, scrimId] });
    queryClient.invalidateQueries({ queryKey: ["scrims-optimized"] });
    queryClient.invalidateQueries({ queryKey: ["overview-briefing"] });
  }

  const finalize = useMutation({
    mutationFn: async (input: {
      opponentScore: number | null;
      ourScore: number | null;
      overrideReason: string | null;
      resultSource: ResultSource;
    }) => {
      if (!scrimId) throw new Error("Practice block is unavailable");
      const { data, error } = await supabase.rpc("finalize_scrim_block_review", {
        p_scrim_id: scrimId,
        p_result_source: input.resultSource,
        p_our_score: input.ourScore,
        p_opponent_score: input.opponentScore,
        p_override_reason: input.overrideReason,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Block review completed");
    },
    onError: (error) => toast.error(message(error, "Could not complete the block review")),
  });

  const reopen = useMutation({
    mutationFn: async () => {
      if (!scrimId) throw new Error("Practice block is unavailable");
      const { data, error } = await supabase.rpc("reopen_scrim_block_review", {
        p_scrim_id: scrimId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Block review reopened");
    },
    onError: (error) => toast.error(message(error, "Could not reopen the block review")),
  });

  return {
    ...query,
    block: query.data,
    finalizeReview: finalize.mutateAsync,
    isFinalizing: finalize.isPending,
    isReopening: reopen.isPending,
    reopenReview: reopen.mutateAsync,
  };
}
