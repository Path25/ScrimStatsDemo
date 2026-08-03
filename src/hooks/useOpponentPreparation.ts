import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useRole } from "@/contexts/RoleContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import {
  hasOpponentPreparationModuleAccess,
  opponentPreparationErrorMessage,
  parseOpponentPreparationProjection,
} from "@/lib/opponent-preparation";
import { callOpponentPreparationRpc } from "@/lib/opponent-preparation-rpc";
import type {
  CreateOpponentPreparationInput,
  OpponentPreparationDraftInput,
  OpponentPreparationOptions,
  OpponentPreparationSourceType,
} from "@/types/opponentPreparation";
import type { WorkspaceModuleAccess } from "@/types/workspaceModules";

type OpponentPreparationCommand =
  | { kind: "create"; input: CreateOpponentPreparationInput }
  | { kind: "update"; revisionId: string; expectedVersion: number; input: OpponentPreparationDraftInput }
  | { kind: "link-evidence"; revisionId: string; expectedVersion: number; sourceType: OpponentPreparationSourceType; sourceId?: string; relevanceNote?: string; insufficientReason?: string }
  | { kind: "unlink-evidence"; linkId: string; expectedVersion: number }
  | { kind: "link-action"; revisionId: string; expectedVersion: number; actionId: string }
  | { kind: "unlink-action"; linkId: string; expectedVersion: number }
  | { kind: "approve"; revisionId: string; expectedVersion: number }
  | { kind: "revise"; playbookId: string; expectedVersion: number }
  | { kind: "link-review"; revisionId: string; scrimId: string; outcomeSummary: string }
  | { kind: "unlink-review"; linkId: string; reason: string }
  | { kind: "archive"; playbookId: string; expectedVersion: number; reason: string }
  | { kind: "restore"; playbookId: string; expectedVersion: number; reason: string };

function successMessage(kind: OpponentPreparationCommand["kind"]) {
  const messages: Record<OpponentPreparationCommand["kind"], string> = {
    approve: "Preparation revision approved",
    archive: "Preparation playbook archived",
    create: "Preparation playbook created",
    "link-action": "Preparation action linked",
    "link-evidence": "Preparation evidence linked",
    "link-review": "Completed review linked",
    restore: "Preparation playbook restored",
    revise: "New preparation revision created",
    "unlink-action": "Preparation action removed from the draft",
    "unlink-evidence": "Preparation evidence removed from the draft",
    "unlink-review": "Preparation review link removed",
    update: "Preparation draft saved",
  };
  return messages[kind];
}

async function loadOptions(tenantId: string, opponentId: string): Promise<OpponentPreparationOptions> {
  const [evidence, briefs, playbooks, actions, scrims] = await Promise.all([
    supabase
      .from("scouting_evidence")
      .select("id, title, observed_at")
      .eq("tenant_id", tenantId)
      .eq("opponent_team_id", opponentId)
      .eq("lifecycle_state", "active")
      .order("observed_at", { ascending: false })
      .limit(100),
    supabase
      .from("preparation_briefs")
      .select("id, title, published_at, updated_at")
      .eq("tenant_id", tenantId)
      .eq("opponent_team_id", opponentId)
      .in("status", ["published", "archived"])
      .not("snapshot", "is", null)
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("draft_playbooks")
      .select("id, title, published_at, updated_at")
      .eq("tenant_id", tenantId)
      .in("status", ["published", "archived"])
      .not("snapshot", "is", null)
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("coaching_actions")
      .select("id, title, status")
      .eq("tenant_id", tenantId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("scrims")
      .select("id, opponent_name, starts_at, review_status")
      .eq("tenant_id", tenantId)
      .eq("opponent_team_id", opponentId)
      .is("archived_at", null)
      .neq("status", "cancelled")
      .order("starts_at", { ascending: false })
      .limit(100),
  ]);
  const firstError = [evidence.error, briefs.error, playbooks.error, actions.error, scrims.error].find(Boolean);
  if (firstError) throw firstError;

  return {
    actions: (actions.data || []).map((action) => ({ id: action.id, label: action.title, status: action.status })),
    evidence: [
      ...(evidence.data || []).map((item) => ({ id: item.id, label: item.title, recordedAt: item.observed_at, sourceType: "scouting_evidence" as const })),
      ...(briefs.data || []).map((item) => ({ id: item.id, label: item.title, recordedAt: item.published_at || item.updated_at, sourceType: "preparation_brief" as const })),
      ...(playbooks.data || []).map((item) => ({ id: item.id, label: item.title, recordedAt: item.published_at || item.updated_at, sourceType: "draft_playbook" as const })),
    ],
    scrims: (scrims.data || []).map((scrim) => ({
      id: scrim.id,
      label: scrim.opponent_name,
      reviewStatus: scrim.review_status,
      startsAt: scrim.starts_at,
    })),
  };
}

export function useOpponentPreparation(opponentId: string | undefined, module: WorkspaceModuleAccess) {
  const { activeRole, canManageOpponentPreparation, canViewOpponentPreparation } = useRole();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const moduleAvailable = hasOpponentPreparationModuleAccess({
    enabled: module.enabled,
    lifecycleEntitled: tenant?.collectorEntitled,
    releaseState: module.state,
    role: activeRole,
    subscriptionTier: tenant?.subscriptionTier,
  });
  const key = ["opponent-preparation", tenant?.id, opponentId, activeRole, module.state, module.enabled];

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(tenant?.id && opponentId && canViewOpponentPreparation && moduleAvailable),
    queryFn: async () => parseOpponentPreparationProjection(
      await callOpponentPreparationRpc("get_opponent_preparation_playbook", {
        p_opponent_team_id: opponentId,
        p_tenant_id: tenant!.id,
      }),
    ),
  });

  const optionsQuery = useQuery({
    queryKey: [...key, "options"],
    enabled: Boolean(tenant?.id && opponentId && canManageOpponentPreparation && moduleAvailable),
    queryFn: () => loadOptions(tenant!.id, opponentId!),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["opponent-preparation", tenant?.id] });
    await queryClient.invalidateQueries({ queryKey: ["opponent-preparation-breadcrumbs", tenant?.id] });
  };

  const mutation = useMutation({
    mutationFn: async (command: OpponentPreparationCommand) => {
      if (!tenant?.id || !opponentId || !moduleAvailable || !canManageOpponentPreparation) {
        throw new Error("Opponent preparation is not available for this workspace.");
      }
      if (command.kind === "create") {
        return callOpponentPreparationRpc("create_opponent_preparation_playbook", {
          p_context_label: command.input.contextLabel || null,
          p_fixture_scrim_id: command.input.fixtureScrimId || null,
          p_opponent_team_id: opponentId,
          p_patch_label: command.input.patchLabel || null,
          p_revision_title: command.input.title,
          p_staff_judgement: command.input.staffJudgement,
          p_tenant_id: tenant.id,
          p_title: command.input.playbookTitle,
        });
      }
      if (command.kind === "update") {
        return callOpponentPreparationRpc("update_opponent_preparation_draft", {
          p_context_label: command.input.contextLabel || null,
          p_expected_version: command.expectedVersion,
          p_fixture_scrim_id: command.input.fixtureScrimId || null,
          p_patch_label: command.input.patchLabel || null,
          p_revision_id: command.revisionId,
          p_staff_judgement: command.input.staffJudgement,
          p_title: command.input.title,
        });
      }
      if (command.kind === "link-evidence") {
        return callOpponentPreparationRpc("link_opponent_preparation_evidence", {
          p_expected_version: command.expectedVersion,
          p_insufficient_reason: command.insufficientReason || null,
          p_revision_id: command.revisionId,
          p_source_id: command.sourceId || null,
          p_source_type: command.sourceType,
          p_staff_relevance_note: command.relevanceNote || null,
        });
      }
      if (command.kind === "unlink-evidence") {
        return callOpponentPreparationRpc("unlink_opponent_preparation_evidence", {
          p_link_id: command.linkId,
          p_expected_version: command.expectedVersion,
        });
      }
      if (command.kind === "link-action") {
        return callOpponentPreparationRpc("link_opponent_preparation_action", {
          p_action_id: command.actionId,
          p_expected_version: command.expectedVersion,
          p_revision_id: command.revisionId,
        });
      }
      if (command.kind === "unlink-action") {
        return callOpponentPreparationRpc("unlink_opponent_preparation_action", {
          p_link_id: command.linkId,
          p_expected_version: command.expectedVersion,
        });
      }
      if (command.kind === "approve") {
        return callOpponentPreparationRpc("approve_opponent_preparation_revision", {
          p_expected_version: command.expectedVersion,
          p_revision_id: command.revisionId,
        });
      }
      if (command.kind === "revise") {
        return callOpponentPreparationRpc("create_opponent_preparation_revision", {
          p_expected_version: command.expectedVersion,
          p_playbook_id: command.playbookId,
        });
      }
      if (command.kind === "link-review") {
        return callOpponentPreparationRpc("link_opponent_preparation_review", {
          p_revision_id: command.revisionId,
          p_scrim_id: command.scrimId,
          p_staff_outcome_summary: command.outcomeSummary,
        });
      }
      if (command.kind === "unlink-review") {
        return callOpponentPreparationRpc("unlink_opponent_preparation_review", {
          p_reason: command.reason,
          p_link_id: command.linkId,
        });
      }
      return callOpponentPreparationRpc(
        command.kind === "archive"
          ? "archive_opponent_preparation_playbook"
          : "restore_opponent_preparation_playbook",
        {
          p_expected_version: command.expectedVersion,
          p_playbook_id: command.playbookId,
          p_reason: command.reason,
        },
      );
    },
    onSuccess: async (_data, command) => {
      await refresh();
      toast.success(successMessage(command.kind));
    },
    onError: (error) => {
      void refresh();
      void queryClient.invalidateQueries({ queryKey: ["workspace-modules", tenant?.id] });
      toast.error(opponentPreparationErrorMessage(error));
    },
  });

  return {
    approveRevision: (revisionId: string, expectedVersion: number) => mutation.mutateAsync({ kind: "approve", revisionId, expectedVersion }),
    archivePlaybook: (playbookId: string, expectedVersion: number, reason: string) => mutation.mutateAsync({ kind: "archive", playbookId, expectedVersion, reason }),
    createPlaybook: (input: CreateOpponentPreparationInput) => mutation.mutateAsync({ kind: "create", input }),
    createRevision: (playbookId: string, expectedVersion: number) => mutation.mutateAsync({ kind: "revise", playbookId, expectedVersion }),
    isLoading: moduleAvailable && query.isLoading,
    isModuleAvailable: moduleAvailable,
    isSaving: mutation.isPending,
    linkAction: (revisionId: string, expectedVersion: number, actionId: string) => mutation.mutateAsync({ kind: "link-action", revisionId, expectedVersion, actionId }),
    linkEvidence: (input: Extract<OpponentPreparationCommand, { kind: "link-evidence" }>) => mutation.mutateAsync(input),
    linkReview: (revisionId: string, scrimId: string, outcomeSummary: string) => mutation.mutateAsync({ kind: "link-review", revisionId, scrimId, outcomeSummary }),
    options: moduleAvailable && !optionsQuery.error ? optionsQuery.data : undefined,
    optionsError: moduleAvailable ? optionsQuery.error : null,
    optionsLoading: moduleAvailable && optionsQuery.isLoading,
    projection: moduleAvailable && !query.error ? query.data : null,
    queryError: moduleAvailable ? query.error : null,
    refresh,
    restorePlaybook: (playbookId: string, expectedVersion: number, reason: string) => mutation.mutateAsync({ kind: "restore", playbookId, expectedVersion, reason }),
    retry: query.refetch,
    unlinkAction: (linkId: string, expectedVersion: number) => mutation.mutateAsync({ kind: "unlink-action", linkId, expectedVersion }),
    unlinkEvidence: (linkId: string, expectedVersion: number) => mutation.mutateAsync({ kind: "unlink-evidence", linkId, expectedVersion }),
    unlinkReview: (linkId: string, reason: string) => mutation.mutateAsync({ kind: "unlink-review", linkId, reason }),
    updateDraft: (revisionId: string, expectedVersion: number, input: OpponentPreparationDraftInput) => mutation.mutateAsync({ kind: "update", revisionId, expectedVersion, input }),
  };
}
