import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import type { DraftWorkspaceDataset } from "@/lib/draft-workspace";

type RpcResult<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>;
type DraftRpcClient = { rpc: (name: string, args: Record<string, unknown>) => RpcResult<unknown> };
const draftClient = supabase as unknown as DraftRpcClient;

const emptyDraftWorkspace = (): DraftWorkspaceDataset => ({
  contract_version: "draft-workspace-v2",
  playbooks: [],
  plans: [],
  scenarios: [],
  actions: [],
  restrictions: [],
  opponents: [],
  fixtures: [],
  external_drafts: [],
  team_drafts: [],
  players: [],
  champion_pools: [],
  scouting_evidence: [],
  linked_player_id: null,
});

export function useDraftWorkspace(enabled = true) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const key = ["draft-workspace-v2", tenant?.id];

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(tenant?.id) && enabled,
    queryFn: async () => {
      if (!tenant?.id) return null;
      const { data, error } = await draftClient.rpc("get_draft_workspace", { p_tenant_id: tenant.id });
      if (error) throw new Error(error.message);
      return data ? data as DraftWorkspaceDataset : emptyDraftWorkspace();
    },
  });

  function useRpcMutation<TInput, TOutput = string>(
    name: string,
    args: (input: TInput) => Record<string, unknown>,
    success: string,
  ) {
    return useMutation({
      mutationFn: async (input: TInput) => {
        const { data, error } = await draftClient.rpc(name, args(input));
        if (error) throw new Error(error.message);
        return data as TOutput;
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: key });
        toast.success(success);
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : "Draft change could not be saved"),
    });
  }

  const createPlaybook = useRpcMutation<{ title: string; description: string; patch: string; side: string; identity: string }>(
    "create_draft_playbook",
    (input) => ({ p_tenant_id: tenant?.id, p_title: input.title, p_description: input.description, p_patch_label: input.patch || null, p_preferred_side: input.side, p_composition_identity: input.identity || null }),
    "Playbook created",
  );
  const createPlan = useRpcMutation<{ opponentId: string; title: string; fixtureId?: string; scheduledFor?: string; patch?: string; side: string; gameNumber: number; playbookId?: string }>(
    "create_draft_match_plan",
    (input) => ({ p_tenant_id: tenant?.id, p_opponent_team_id: input.opponentId, p_title: input.title, p_scrim_id: input.fixtureId || null, p_scheduled_for: input.scheduledFor || null, p_patch_label: input.patch || null, p_preferred_side: input.side, p_series_game_number: input.gameNumber, p_source_playbook_id: input.playbookId || null }),
    "Match plan created",
  );
  const createScenario = useRpcMutation<{ briefId?: string; playbookId?: string; name: string; side: string; rationale: string; parentId?: string; branchSequence?: number }, string>(
    "create_draft_scenario",
    (input) => ({ p_tenant_id: tenant?.id, p_brief_id: input.briefId || null, p_playbook_id: input.playbookId || null, p_name: input.name, p_side: input.side, p_rationale: input.rationale, p_parent_scenario_id: input.parentId || null, p_branch_sequence: input.branchSequence || null }),
    "Draft scenario created",
  );
  const saveAction = useRpcMutation<{ scenarioId: string; sequence: number; champion: string; role?: string; rationale: string }>(
    "save_draft_sequence_action",
    (input) => ({ p_tenant_id: tenant?.id, p_scenario_id: input.scenarioId, p_sequence: input.sequence, p_champion_name: input.champion, p_assigned_role: input.role || null, p_rationale: input.rationale }),
    "Draft action saved",
  );
  const setRestrictions = useRpcMutation<{ planId: string; champions: string[] }, void>(
    "set_draft_plan_restrictions",
    (input) => ({ p_brief_id: input.planId, p_champions: input.champions }),
    "Series restrictions updated",
  );
  const setStatus = useRpcMutation<{ kind: "match_plan" | "playbook"; id: string; status: "published" | "archived" | "draft" }>(
    "set_draft_item_status",
    (input) => ({ p_kind: input.kind, p_id: input.id, p_status: input.status }),
    "Draft status updated",
  );
  const updateItem = useRpcMutation<{ kind: "match_plan" | "playbook"; id: string; payload: Record<string, unknown> }>(
    "update_draft_item_details",
    (input) => ({ p_kind: input.kind, p_id: input.id, p_payload: input.payload }),
    "Draft details updated",
  );
  const reviseItem = useRpcMutation<{ kind: "match_plan" | "playbook"; id: string }, string>(
    "revise_draft_item",
    (input) => ({ p_kind: input.kind, p_id: input.id }),
    "New editable revision created",
  );
  const upsertChampionPool = useRpcMutation<{ playerId: string; champion: string; role: string; comfort: number; priority: number }>(
    "upsert_draft_champion_pool",
    (input) => ({ p_tenant_id: tenant?.id, p_player_id: input.playerId, p_champion_name: input.champion, p_role: input.role, p_comfort_level: input.comfort, p_priority: input.priority }),
    "Champion pool updated",
  );

  const deleteAction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("draft_scenario_actions").delete().eq("id", id).eq("tenant_id", tenant?.id || "");
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Draft action could not be removed"),
  });

  return {
    ...query,
    createPlaybook: createPlaybook.mutateAsync,
    createPlan: createPlan.mutateAsync,
    createScenario: createScenario.mutateAsync,
    saveAction: saveAction.mutateAsync,
    setRestrictions: setRestrictions.mutateAsync,
    setStatus: setStatus.mutateAsync,
    updateItem: updateItem.mutateAsync,
    reviseItem: reviseItem.mutateAsync,
    upsertChampionPool: upsertChampionPool.mutateAsync,
    deleteAction: deleteAction.mutateAsync,
    isSaving: createPlaybook.isPending || createPlan.isPending || createScenario.isPending || saveAction.isPending || setRestrictions.isPending || setStatus.isPending || updateItem.isPending || reviseItem.isPending || upsertChampionPool.isPending || deleteAction.isPending,
  };
}
