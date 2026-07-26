import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

export function useParticipantReconciliation(enabled = true) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const queryKey = ["participant-reconciliation", tenant?.id];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("scrim_participants")
        .select(
          "id, summoner_name, riot_id, riot_tag_line, champion_name, role, created_at, identity_status",
        )
        .eq("tenant_id", tenant.id)
        .in("identity_status", ["unresolved", "ambiguous"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(tenant?.id) && enabled,
  });

  const reconcile = useMutation({
    mutationFn: async ({
      participantId,
      playerId,
      ignore = false,
    }: {
      participantId: string;
      playerId?: string;
      ignore?: boolean;
    }) => {
      if (!participantId || (!ignore && !playerId)) {
        throw new Error("Choose a roster player or mark the participant as an opponent.");
      }
      const { error } = await supabase.rpc("reconcile_scrim_participant", {
        p_participant_id: participantId,
        p_player_id: playerId || null,
        p_ignore: ignore,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["scrimParticipants"] });
      void queryClient.invalidateQueries({ queryKey: ["overview-briefing"] });
      toast.success(variables.ignore ? "Participant marked as opponent" : "Roster identity linked");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Identity could not be reconciled");
    },
  });

  return {
    ...query,
    unresolvedParticipants: query.data || [],
    reconcileParticipant: reconcile.mutateAsync,
    isReconciling: reconcile.isPending,
  };
}
