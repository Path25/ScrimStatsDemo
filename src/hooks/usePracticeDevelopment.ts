import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useRole } from "@/contexts/RoleContext";
import { useTenant } from "@/contexts/TenantContext";
import { useWorkspaceModules } from "@/hooks/useWorkspaceModules";
import { hasPracticeDevelopmentModuleAccess, parsePracticeDevelopmentLoop } from "@/lib/practice-development";
import { callPracticeDevelopmentRpc } from "@/lib/practice-development-rpc";
import type {
  CreatePracticeDevelopmentObjectiveInput,
  PracticeDevelopmentEvidenceSource,
  ReviewPracticeDevelopmentEvidenceInput,
  TransitionPracticeDevelopmentObjectiveInput,
  UpdatePracticeDevelopmentObjectiveInput,
} from "@/types/practiceDevelopment";

type PracticeDevelopmentCommand =
  | { kind: "create"; input: CreatePracticeDevelopmentObjectiveInput }
  | { kind: "update"; input: UpdatePracticeDevelopmentObjectiveInput }
  | { kind: "link-evidence"; objectiveId: string; expectedVersion: number; sourceId: string; sourceType: Exclude<PracticeDevelopmentEvidenceSource, "declared_unavailable"> }
  | { kind: "review-evidence"; input: ReviewPracticeDevelopmentEvidenceInput }
  | { kind: "record-unavailable"; objectiveId: string; expectedVersion: number; teamSummary: string; staffNote?: string }
  | { kind: "attach-action"; actionId: string; objectiveId: string; expectedVersion: number }
  | { kind: "transition"; input: TransitionPracticeDevelopmentObjectiveInput }
  | { kind: "archive"; objectiveId: string; expectedVersion: number; teamStatusSummary: string; staffNote?: string }
  | { kind: "restore"; objectiveId: string; expectedVersion: number; teamStatusSummary: string; staffNote?: string };

function commandMessage(kind: PracticeDevelopmentCommand["kind"]) {
  const messages: Record<PracticeDevelopmentCommand["kind"], string> = {
    archive: "Practice objective archived.",
    "attach-action": "Follow-up action linked.",
    create: "Practice objective planned.",
    "link-evidence": "Practice evidence linked.",
    "record-unavailable": "Evidence availability recorded.",
    restore: "Practice objective restored.",
    "review-evidence": "Practice evidence reviewed.",
    transition: "Practice objective updated.",
    update: "Practice objective updated.",
  };
  return messages[kind];
}

export function usePracticeDevelopment(scrimId?: string, contextGameId?: string) {
  const { tenant } = useTenant();
  const { activeRole, canManagePracticeDevelopment, canViewPracticeDevelopment } = useRole();
  const queryClient = useQueryClient();
  const moduleQuery = useWorkspaceModules();
  const module = moduleQuery.modules.practice_development;
  const moduleAvailable = !moduleQuery.isLoading && !moduleQuery.isError && hasPracticeDevelopmentModuleAccess({
    enabled: module.enabled,
    releaseState: module.state,
    subscriptionTier: tenant?.subscriptionTier,
  });
  const expectedProjection = canManagePracticeDevelopment
    ? "staff-v1"
    : canViewPracticeDevelopment
      ? "team-v1"
      : "none";
  const queryKey = ["practice-development", tenant?.id, scrimId, activeRole, expectedProjection, contextGameId] as const;

  const query = useQuery({
    queryKey,
    enabled: Boolean(tenant?.id && scrimId && moduleAvailable && expectedProjection !== "none"),
    queryFn: async () => {
      const data = await callPracticeDevelopmentRpc("get_practice_development_loop", {
        p_context_game_id: contextGameId || null,
        p_scrim_id: scrimId!,
        p_tenant_id: tenant!.id,
      });
      const parsed = parsePracticeDevelopmentLoop(data);
      if (parsed.projection !== expectedProjection) {
        throw new Error("Practice development access changed while this view was loading. Refresh the workspace to continue.");
      }
      return parsed;
    },
    gcTime: 0,
    retry: false,
    staleTime: 15_000,
  });

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: ["practice-development", tenant?.id, scrimId],
    });
  }

  const mutation = useMutation({
    mutationFn: async (command: PracticeDevelopmentCommand) => {
      if (!tenant?.id || !scrimId || !moduleAvailable) {
        throw new Error("Practice development is not available in this workspace.");
      }
      if (command.kind === "create") {
        return callPracticeDevelopmentRpc("create_practice_development_objective", {
          p_evidence_standard: command.input.evidenceStandard,
          p_scrim_id: scrimId,
          p_staff_note: command.input.staffNote || null,
          p_tenant_id: tenant.id,
          p_title: command.input.title,
        });
      }
      if (command.kind === "update") {
        return callPracticeDevelopmentRpc("update_practice_development_objective", {
          p_evidence_standard: command.input.evidenceStandard,
          p_expected_version: command.input.expectedVersion,
          p_objective_id: command.input.objectiveId,
          p_staff_note: command.input.staffNote || null,
          p_title: command.input.title,
        });
      }
      if (command.kind === "link-evidence") {
        return callPracticeDevelopmentRpc("link_practice_development_evidence", {
          p_expected_version: command.expectedVersion,
          p_objective_id: command.objectiveId,
          p_source_id: command.sourceId,
          p_source_type: command.sourceType,
        });
      }
      if (command.kind === "review-evidence") {
        return callPracticeDevelopmentRpc("review_practice_development_evidence", {
          p_evidence_id: command.input.evidenceId,
          p_expected_version: command.input.expectedVersion,
          p_staff_note: command.input.staffNote || null,
          p_team_summary: command.input.teamSummary,
        });
      }
      if (command.kind === "record-unavailable") {
        return callPracticeDevelopmentRpc("record_practice_development_unavailable", {
          p_expected_version: command.expectedVersion,
          p_objective_id: command.objectiveId,
          p_staff_note: command.staffNote || null,
          p_team_summary: command.teamSummary,
        });
      }
      if (command.kind === "attach-action") {
        return callPracticeDevelopmentRpc("attach_practice_development_follow_up", {
          p_action_id: command.actionId,
          p_expected_version: command.expectedVersion,
          p_objective_id: command.objectiveId,
        });
      }
      if (command.kind === "transition") {
        return callPracticeDevelopmentRpc("transition_practice_development_objective", {
          p_expected_version: command.input.expectedVersion,
          p_next_status: command.input.nextStatus,
          p_objective_id: command.input.objectiveId,
          p_staff_note: command.input.staffNote || null,
          p_team_status_summary: command.input.teamStatusSummary || null,
        });
      }
      return callPracticeDevelopmentRpc(
        command.kind === "archive"
          ? "archive_practice_development_objective"
          : "restore_practice_development_objective",
        {
          p_expected_version: command.expectedVersion,
          p_objective_id: command.objectiveId,
          p_staff_note: command.staffNote || null,
          p_team_status_summary: command.teamStatusSummary,
        },
      );
    },
    onSuccess: async (_data, command) => {
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ["practice-development-breadcrumbs", tenant?.id] });
      if (command.kind === "attach-action") {
        await queryClient.invalidateQueries({ queryKey: ["coaching-actions"] });
      }
      toast.success(commandMessage(command.kind));
    },
    onError: (error) => {
      void refresh();
      void queryClient.invalidateQueries({ queryKey: ["workspace-modules", tenant?.id] });
      toast.error(error instanceof Error ? error.message : "The practice-development request could not be completed.");
    },
  });

  return {
    archiveObjective: (input: Omit<Extract<PracticeDevelopmentCommand, { kind: "archive" }>, "kind">) => mutation.mutateAsync({ kind: "archive", ...input }),
    attachAction: (input: Omit<Extract<PracticeDevelopmentCommand, { kind: "attach-action" }>, "kind">) => mutation.mutateAsync({ kind: "attach-action", ...input }),
    createObjective: (input: CreatePracticeDevelopmentObjectiveInput) => mutation.mutateAsync({ kind: "create", input }),
    isLoading: moduleAvailable && query.isLoading,
    isModuleAvailable: moduleAvailable,
    isSaving: mutation.isPending,
    linkEvidence: (input: Omit<Extract<PracticeDevelopmentCommand, { kind: "link-evidence" }>, "kind">) => mutation.mutateAsync({ kind: "link-evidence", ...input }),
    loop: moduleAvailable && !query.error && query.data?.projection === expectedProjection ? query.data : null,
    queryError: moduleAvailable ? query.error : null,
    recordUnavailable: (input: Omit<Extract<PracticeDevelopmentCommand, { kind: "record-unavailable" }>, "kind">) => mutation.mutateAsync({ kind: "record-unavailable", ...input }),
    refresh,
    restoreObjective: (input: Omit<Extract<PracticeDevelopmentCommand, { kind: "restore" }>, "kind">) => mutation.mutateAsync({ kind: "restore", ...input }),
    retry: query.refetch,
    reviewEvidence: (input: ReviewPracticeDevelopmentEvidenceInput) => mutation.mutateAsync({ kind: "review-evidence", input }),
    transitionObjective: (input: TransitionPracticeDevelopmentObjectiveInput) => mutation.mutateAsync({ kind: "transition", input }),
    updateObjective: (input: UpdatePracticeDevelopmentObjectiveInput) => mutation.mutateAsync({ kind: "update", input }),
  };
}
