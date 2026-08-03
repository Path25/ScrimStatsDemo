import type {
  PracticeDevelopmentAction,
  PracticeDevelopmentActionBreadcrumb,
  PracticeDevelopmentActionStatus,
  PracticeDevelopmentAvailability,
  PracticeDevelopmentEvidence,
  PracticeDevelopmentEvidenceSource,
  PracticeDevelopmentEvidenceState,
  PracticeDevelopmentLoop,
  PracticeDevelopmentNextSession,
  PracticeDevelopmentObjective,
  PracticeDevelopmentObjectiveStatus,
  PracticeDevelopmentProjection,
} from "@/types/practiceDevelopment";

type UnknownRecord = Record<string, unknown>;

export interface PracticeDevelopmentModuleInput {
  enabled?: boolean;
  releaseState?: string;
  subscriptionTier?: string;
}

export function hasPracticeDevelopmentModuleAccess(input: PracticeDevelopmentModuleInput) {
  return input.subscriptionTier === "elite" && input.releaseState === "live" && input.enabled === true;
}

function record(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function requiredString(value: unknown, field: string) {
  const result = stringValue(value);
  if (!result) throw new Error(`Practice development response is missing ${field}.`);
  return result;
}

function availability(value: unknown): PracticeDevelopmentAvailability {
  if (value === "available" || value === "unavailable") return value;
  throw new Error("Practice development response contains an unsupported availability state.");
}

function actionStatus(value: unknown): PracticeDevelopmentActionStatus {
  if (value === "assigned" || value === "acknowledged" || value === "in_progress" || value === "ready_for_review" || value === "complete" || value === "dismissed" || value === "unavailable") return value;
  throw new Error("Practice development response contains an unsupported action state.");
}

function evidenceState(value: unknown): PracticeDevelopmentEvidenceState {
  if (value === "linked" || value === "reviewed" || value === "unavailable") return value;
  throw new Error("Practice development response contains an unsupported evidence state.");
}

function evidenceSource(value: unknown): PracticeDevelopmentEvidenceSource {
  if (value === "scrim_game" || value === "block_review" || value === "declared_unavailable") return value;
  throw new Error("Practice development response contains an unsupported evidence source.");
}

function objectiveStatus(value: unknown): PracticeDevelopmentObjectiveStatus {
  if (value === "planned" || value === "evidenced" || value === "completed" || value === "blocked") return value;
  throw new Error("Practice development response contains an unsupported objective state.");
}

function projection(value: unknown): PracticeDevelopmentProjection {
  if (value === "staff-v1" || value === "team-v1") return value;
  throw new Error("Practice development response contains an unsupported projection.");
}

function parseObjective(value: unknown, includeStaffFields: boolean): PracticeDevelopmentObjective | null {
  if (value === null || value === undefined) return null;
  const source = record(value);
  if (!source) throw new Error("Practice development response contains an invalid objective.");
  const version = Number(source.version);
  if (!Number.isInteger(version) || version < 1) throw new Error("Practice development response contains an invalid objective version.");
  return {
    archivedAt: stringValue(source.archived_at),
    availability: availability(source.availability),
    createdAt: stringValue(source.created_at),
    evidenceStandard: requiredString(source.evidence_standard, "the evidence standard"),
    id: requiredString(source.id, "the objective identifier"),
    isArchived: source.is_archived === true || typeof source.archived_at === "string",
    staffNote: includeStaffFields ? stringValue(source.staff_note) : undefined,
    status: objectiveStatus(source.status),
    teamStatusSummary: stringValue(source.team_status_summary),
    title: requiredString(source.title, "the objective title"),
    updatedAt: stringValue(source.updated_at),
    version,
  };
}

function parseEvidence(value: unknown, includeStaffFields: boolean): PracticeDevelopmentEvidence {
  const source = record(value);
  if (!source) throw new Error("Practice development response contains invalid evidence.");
  const sourceAvailability = availability(source.availability);
  return {
    availability: sourceAvailability,
    id: requiredString(source.id, "the evidence identifier"),
    linkedAt: stringValue(source.linked_at),
    reviewedAt: stringValue(source.reviewed_at),
    sourceId: includeStaffFields ? stringValue(source.source_id) : undefined,
    sourceLabel: requiredString(source.source_label, "the evidence label"),
    sourceMatchKey: sourceAvailability === "available" ? stringValue(source.source_match_key) : undefined,
    sourceRecordedAt: stringValue(source.source_recorded_at),
    sourceType: evidenceSource(source.source_type),
    staffNote: includeStaffFields ? stringValue(source.staff_note) : undefined,
    state: evidenceState(source.state),
    teamSummary: stringValue(source.team_summary),
  };
}

function parseAction(value: unknown, includeStaffFields: boolean): PracticeDevelopmentAction | null {
  if (value === null || value === undefined) return null;
  const source = record(value);
  if (!source) throw new Error("Practice development response contains an invalid action.");
  const actionAvailability = availability(source.availability);
  const status = actionStatus(source.status);
  if (actionAvailability === "unavailable" && !includeStaffFields) {
    return { availability: "unavailable", status };
  }
  return {
    availability: actionAvailability,
    category: stringValue(source.category),
    checkpointLabel: stringValue(source.checkpoint_label),
    checkpointScrimId: stringValue(source.checkpoint_scrim_id),
    dueAt: stringValue(source.due_at),
    id: requiredString(source.id, "the action identifier"),
    ownerLabel: requiredString(source.owner_label, "the action owner label"),
    scopeLabel: stringValue(source.scope_label),
    status,
    title: requiredString(source.title, "the action title"),
  };
}

function parseNextSession(value: unknown, includeStaffFields: boolean): PracticeDevelopmentNextSession | null {
  if (value === null || value === undefined) return null;
  const source = record(value);
  if (!source) throw new Error("Practice development response contains an invalid next session.");
  const status = source.status;
  if (status !== "pending" && status !== "scheduled" && status !== "reviewed" && status !== "unavailable") {
    throw new Error("Practice development response contains an unsupported next-session state.");
  }
  return {
    id: status === "unavailable" && !includeStaffFields ? undefined : stringValue(source.id),
    label: status === "unavailable" && !includeStaffFields ? undefined : stringValue(source.label),
    status,
  };
}

export function parsePracticeDevelopmentLoop(value: unknown): PracticeDevelopmentLoop {
  const source = record(value);
  if (!source || source.contract_version !== "practice-development-v1") {
    throw new Error("Practice development response uses an unsupported contract.");
  }
  const planning = record(source.planning);
  if (!planning || typeof planning.can_create !== "boolean") {
    throw new Error("Practice development response contains an invalid planning state.");
  }
  const responseProjection = projection(source.projection);
  const includeStaffFields = responseProjection === "staff-v1";
  const objectiveSource = record(source.objective);
  const evidence = Array.isArray(objectiveSource?.evidence)
    ? objectiveSource.evidence.map((item) => parseEvidence(item, includeStaffFields))
    : [];
  return {
    action: parseAction(objectiveSource?.action, includeStaffFields),
    contractVersion: "practice-development-v1",
    evidence,
    nextSession: parseNextSession(objectiveSource?.next_session, includeStaffFields),
    objective: parseObjective(source.objective, includeStaffFields),
    planning: {
      canCreate: planning.can_create,
      unavailableReason: stringValue(planning.unavailable_reason),
    },
    projection: responseProjection,
    scrimId: requiredString(source.scrim_id, "the practice block identifier"),
  };
}

export function parsePracticeDevelopmentActionBreadcrumbs(value: unknown): PracticeDevelopmentActionBreadcrumb[] {
  if (!Array.isArray(value)) {
    throw new Error("Practice development breadcrumbs use an unsupported contract.");
  }
  return value.map((item) => {
    const source = record(item);
    if (!source || typeof source.is_archived !== "boolean") {
      throw new Error("Practice development breadcrumbs contain an invalid entry.");
    }
    return {
      actionId: requiredString(source.action_id, "the breadcrumb action identifier"),
      availability: availability(source.availability),
      isArchived: source.is_archived,
      objectiveStatus: objectiveStatus(source.objective_status),
      objectiveTitle: requiredString(source.objective_title, "the breadcrumb objective title"),
      scrimId: requiredString(source.scrim_id, "the breadcrumb practice block identifier"),
    };
  });
}

export function practiceDevelopmentStatusLabel(status: PracticeDevelopmentObjectiveStatus) {
  if (status === "evidenced") return "Evidence linked";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function practicePlanningUnavailableLabel(reason?: string) {
  if (reason === "practice_block_archived") return "This practice block is archived, so a new objective cannot be planned.";
  if (reason === "practice_block_cancelled") return "This practice block is cancelled, so a new objective cannot be planned.";
  if (reason === "planning_window_closed") return "The planning window has closed; an objective cannot be added retrospectively.";
  return "An objective cannot currently be planned for this block.";
}
