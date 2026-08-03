import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

export type CoachingAction = Database["public"]["Tables"]["coaching_actions"]["Row"];
export type CoachingActionEvent = Database["public"]["Tables"]["coaching_action_events"]["Row"];
export type CoachingActionTemplate = Database["public"]["Tables"]["coaching_action_templates"]["Row"];
export type CoachingActionStatus = CoachingAction["status"];
export type ActionScope = "player" | "unit" | "team";
export type ActionCategory = "draft" | "laning" | "pathing" | "vision" | "objectives" | "teamfighting" | "communication" | "macro" | "preparation" | "review_discipline";
export type PlayerCheckIn = "practised" | "blocked" | "needs_clarification" | "ready_for_review";
export type ReviewOutcome = "demonstrated" | "partially_demonstrated" | "not_observed" | "no_longer_relevant";

export interface CreateCoachingActionInput {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  scopeType: ActionScope;
  unitLabel?: string;
  category: ActionCategory;
  participantPlayerIds: string[];
  assigneeUserId?: string;
  assigneePlayerId?: string;
  dueAt?: string;
  scrimId?: string;
  scrimGameId?: string;
  feedbackId?: string;
  checkpointScrimIds: string[];
  sourceType?: "manual" | "scrim" | "game" | "coach_feedback" | "draft_scenario" | "scouting_evidence" | "analytics";
  sourceTimestampSeconds?: number;
  sourceNote?: string;
  patternLabel?: string;
}

export interface SaveActionTemplateInput {
  title: string;
  successEvidence?: string;
  category: ActionCategory;
  scopeType: ActionScope;
  unitLabel?: string;
  suggestedDurationDays?: number;
  reviewPrompt?: string;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") return error.message;
  return fallback;
}

export function useCoachingActions(filters?: { scrimId?: string; scrimGameId?: string }) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["coaching-actions", tenant?.id, filters?.scrimId, filters?.scrimGameId],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      let request = supabase.from("coaching_actions").select("*").eq("tenant_id", tenant!.id).is("archived_at", null).order("due_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
      if (filters?.scrimId) request = request.or(`scrim_id.eq.${filters.scrimId},checkpoint_scrim_ids.cs.{${filters.scrimId}}`);
      if (filters?.scrimGameId) request = request.eq("scrim_game_id", filters.scrimGameId);
      const { data, error } = await request;
      if (error) throw error;
      return data || [];
    },
  });

  const eventsQuery = useQuery({
    queryKey: ["coaching-action-events", tenant?.id], enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("coaching_action_events").select("*").eq("tenant_id", tenant!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const templatesQuery = useQuery({
    queryKey: ["coaching-action-templates", tenant?.id], enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("coaching_action_templates").select("*").eq("tenant_id", tenant!.id).is("archived_at", null).order("title");
      if (error) throw error;
      return data || [];
    },
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["coaching-actions"] });
    void queryClient.invalidateQueries({ queryKey: ["coaching-action-events"] });
    void queryClient.invalidateQueries({ queryKey: ["coaching-action-templates"] });
    void queryClient.invalidateQueries({ queryKey: ["practice-development", tenant?.id] });
    void queryClient.invalidateQueries({ queryKey: ["practice-development-breadcrumbs", tenant?.id] });
  }

  const createMutation = useMutation({
    mutationFn: async (input: CreateCoachingActionInput) => {
      if (!tenant?.id || !user?.id) throw new Error("An active workspace is required.");
      const payload: Json = {
        tenant_id: tenant.id, title: input.title.trim(), description: input.description?.trim() || "", priority: input.priority,
        scope_type: input.scopeType, unit_label: input.unitLabel?.trim() || "", category: input.category,
        participant_player_ids: input.participantPlayerIds, assignee_user_id: input.assigneeUserId || "", assignee_player_id: input.assigneePlayerId || "",
        due_at: input.dueAt || "", scrim_id: input.scrimId || "", scrim_game_id: input.scrimGameId || "", feedback_id: input.feedbackId || "",
        checkpoint_scrim_ids: input.checkpointScrimIds, source_type: input.sourceType || (input.scrimGameId ? "game" : input.scrimId ? "scrim" : "manual"),
        source_timestamp_seconds: input.sourceTimestampSeconds ?? "", source_note: input.sourceNote?.trim() || "", pattern_label: input.patternLabel?.trim() || "",
      };
      const { data, error } = await supabase.rpc("create_coaching_action_cycle", { p_payload: payload });
      if (error) throw error;
      return data;
    }, onSuccess: () => { refresh(); toast.success("Action cycle assigned."); },
    onError: (error) => toast.error(errorMessage(error, "The action cycle could not be assigned.")),
  });

  const transitionMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: CoachingActionStatus; note?: string }) => {
      const { data, error } = await supabase.rpc("transition_coaching_action", { p_action_id: id, p_next_status: status, p_note: note || null });
      if (error) throw error;
      return data;
    }, onSuccess: () => { refresh(); toast.success("Action progress updated."); },
    onError: (error) => toast.error(errorMessage(error, "Action progress could not be updated.")),
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ id, checkIn, note }: { id: string; checkIn: PlayerCheckIn; note?: string }) => {
      const { data, error } = await supabase.rpc("check_in_coaching_action", { p_action_id: id, p_check_in: checkIn, p_note: note || null });
      if (error) throw error;
      return data;
    }, onSuccess: () => { refresh(); toast.success("Practice check-in recorded."); },
    onError: (error) => toast.error(errorMessage(error, "The check-in could not be recorded.")),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, outcome, observation, evidence, nextAction }: { id: string; outcome: ReviewOutcome; observation: string; evidence?: string; nextAction?: string }) => {
      const { data, error } = await supabase.rpc("review_coaching_action", { p_action_id: id, p_outcome: outcome, p_observation: observation, p_evidence: evidence || null, p_next_action: nextAction || null });
      if (error) throw error;
      return data;
    }, onSuccess: () => { refresh(); toast.success("Coach review recorded."); },
    onError: (error) => toast.error(errorMessage(error, "The review could not be recorded.")),
  });

  const templateMutation = useMutation({
    mutationFn: async (input: SaveActionTemplateInput) => {
      if (!tenant?.id) throw new Error("An active workspace is required.");
      const payload: Json = { tenant_id: tenant.id, title: input.title.trim(), success_evidence: input.successEvidence?.trim() || "", category: input.category, scope_type: input.scopeType, unit_label: input.unitLabel?.trim() || "", suggested_duration_days: input.suggestedDurationDays ?? "", review_prompt: input.reviewPrompt?.trim() || "" };
      const { data, error } = await supabase.rpc("save_coaching_action_template", { p_payload: payload });
      if (error) throw error;
      return data;
    }, onSuccess: () => { refresh(); toast.success("Action template saved."); },
    onError: (error) => toast.error(errorMessage(error, "The template could not be saved.")),
  });

  return {
    actions: query.data || [], events: eventsQuery.data || [], templates: templatesQuery.data || [],
    isLoading: query.isLoading || eventsQuery.isLoading || templatesQuery.isLoading,
    error: query.error || eventsQuery.error || templatesQuery.error,
    createAction: createMutation.mutateAsync, transitionAction: transitionMutation.mutateAsync,
    checkInAction: checkInMutation.mutateAsync, reviewAction: reviewMutation.mutateAsync,
    saveTemplate: templateMutation.mutateAsync,
    isSaving: createMutation.isPending || transitionMutation.isPending || checkInMutation.isPending || reviewMutation.isPending || templateMutation.isPending,
  };
}
