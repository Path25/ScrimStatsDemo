import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CoachingAction = Database["public"]["Tables"]["coaching_actions"]["Row"];
export type CoachingActionStatus = CoachingAction["status"];

export interface CreateCoachingActionInput {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  assigneeUserId?: string;
  assigneePlayerId?: string;
  dueAt?: string;
  scrimId?: string;
  scrimGameId?: string;
  feedbackId?: string;
  followUpScrimId?: string;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useCoachingActions(filters?: { scrimId?: string; scrimGameId?: string }) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["coaching-actions", tenant?.id, filters?.scrimId, filters?.scrimGameId],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      let request = supabase
        .from("coaching_actions")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .is("archived_at", null)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (filters?.scrimId) request = request.eq("scrim_id", filters.scrimId);
      if (filters?.scrimGameId) request = request.eq("scrim_game_id", filters.scrimGameId);
      const { data, error } = await request;
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateCoachingActionInput) => {
      if (!tenant?.id || !user?.id) throw new Error("An active workspace is required.");
      const { data, error } = await supabase.rpc("create_coaching_action", {
        p_tenant_id: tenant.id,
        p_title: input.title.trim(),
        p_description: input.description?.trim() || "",
        p_priority: input.priority,
        p_assignee_user_id: input.assigneeUserId || null,
        p_assignee_player_id: input.assigneePlayerId || null,
        p_due_at: input.dueAt || null,
        p_scrim_id: input.scrimId || null,
        p_scrim_game_id: input.scrimGameId || null,
        p_feedback_id: input.feedbackId || null,
        p_follow_up_scrim_id: input.followUpScrimId || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["coaching-actions"] });
      toast.success("Coaching action assigned.");
    },
    onError: (error) => toast.error(errorMessage(error, "The action could not be assigned.")),
  });

  const transitionMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: CoachingActionStatus; note?: string }) => {
      const { data, error } = await supabase.rpc("transition_coaching_action", {
        p_action_id: id,
        p_next_status: status,
        p_note: note || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["coaching-actions"] });
      toast.success("Action progress updated.");
    },
    onError: (error) => toast.error(errorMessage(error, "Action progress could not be updated.")),
  });

  return {
    actions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createAction: createMutation.mutateAsync,
    transitionAction: transitionMutation.mutateAsync,
    isSaving: createMutation.isPending || transitionMutation.isPending,
  };
}
