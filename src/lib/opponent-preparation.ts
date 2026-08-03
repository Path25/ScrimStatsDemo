import type {
  OpponentPreparationAction,
  OpponentPreparationAvailability,
  OpponentPreparationBreadcrumb,
  OpponentPreparationContextType,
  OpponentPreparationEvidence,
  OpponentPreparationFixtureAvailability,
  OpponentPreparationPlaybook,
  OpponentPreparationProjection,
  OpponentPreparationRecordedState,
  OpponentPreparationReview,
  OpponentPreparationRevision,
  OpponentPreparationRevisionStatus,
  OpponentPreparationSourceType,
} from "@/types/opponentPreparation";

type UnknownRecord = Record<string, unknown>;

export interface OpponentPreparationModuleInput {
  enabled?: boolean;
  lifecycleEntitled?: boolean;
  releaseState?: string;
  role?: string | null;
  subscriptionTier?: string;
}

export function hasOpponentPreparationModuleAccess(input: OpponentPreparationModuleInput) {
  return input.subscriptionTier === "elite"
    && input.lifecycleEntitled === true
    && input.releaseState === "live"
    && input.enabled === true
    && (input.role === "owner" || input.role === "admin");
}

function record(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function requiredString(value: unknown, field: string) {
  const parsed = optionalString(value);
  if (!parsed) throw new Error(`Opponent preparation response is missing ${field}.`);
  return parsed;
}

function positiveInteger(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Opponent preparation response contains an invalid ${field}.`);
  }
  return parsed;
}

function oneOf<T extends string>(value: unknown, values: readonly T[], field: string): T {
  if (typeof value === "string" && values.includes(value as T)) return value as T;
  throw new Error(`Opponent preparation response contains an unsupported ${field}.`);
}

function sourceType(value: unknown): OpponentPreparationSourceType {
  return oneOf(value, ["scouting_evidence", "preparation_brief", "draft_playbook", "declared_insufficient"], "source type");
}

function evidenceAvailability(value: unknown): OpponentPreparationAvailability {
  return oneOf(value, ["available", "superseded", "unavailable", "insufficient"], "evidence availability");
}

function recordedState(value: unknown): OpponentPreparationRecordedState {
  return oneOf(value, ["recorded", "not_recorded"], "recorded state");
}

function fixtureAvailability(value: unknown): OpponentPreparationFixtureAvailability {
  return oneOf(value, ["available", "unavailable", "not_recorded"], "fixture availability");
}

function revisionStatus(value: unknown): OpponentPreparationRevisionStatus {
  return oneOf(value, ["draft", "approved"], "revision status");
}

function parseEvidence(value: unknown): OpponentPreparationEvidence {
  const source = record(value);
  if (!source) throw new Error("Opponent preparation response contains invalid evidence.");
  return {
    availability: evidenceAvailability(source.availability),
    id: requiredString(source.id, "the evidence link identifier"),
    insufficientReason: optionalString(source.insufficient_reason),
    linkedAt: optionalString(source.linked_at),
    sourceContext: optionalString(source.source_context),
    sourceId: optionalString(source.source_id),
    sourceLabel: requiredString(source.source_label, "the evidence label"),
    sourcePatchLabel: optionalString(source.source_patch_label),
    sourceRecordedAt: requiredString(source.source_recorded_at, "the evidence date"),
    sourceSummary: optionalString(source.source_summary),
    sourceType: sourceType(source.source_type),
    staffRelevanceNote: optionalString(source.staff_relevance_note),
  };
}

function parseAction(value: unknown): OpponentPreparationAction {
  const source = record(value);
  if (!source) throw new Error("Opponent preparation response contains an invalid action.");
  return {
    availability: oneOf(source.availability, ["available", "unavailable"], "action availability"),
    category: optionalString(source.category),
    dueAt: optionalString(source.due_at),
    id: optionalString(source.id),
    linkedAt: optionalString(source.linked_at),
    linkId: requiredString(source.link_id, "the action link identifier"),
    ownerLabel: optionalString(source.owner_label),
    status: requiredString(source.status, "the action state"),
    title: requiredString(source.title, "the action title"),
  };
}

function parseReview(value: unknown): OpponentPreparationReview | null {
  if (value === null || value === undefined) return null;
  const source = record(value);
  if (!source) throw new Error("Opponent preparation response contains an invalid review.");
  return {
    availability: oneOf(source.availability, ["available", "unavailable"], "review availability"),
    label: requiredString(source.label, "the review label"),
    linkId: requiredString(source.link_id, "the review link identifier"),
    linkedAt: optionalString(source.linked_at),
    scrimId: requiredString(source.scrim_id, "the review block identifier"),
    staffOutcomeSummary: requiredString(source.staff_outcome_summary, "the staff outcome summary"),
  };
}

function parseRevision(value: unknown): OpponentPreparationRevision {
  const source = record(value);
  if (!source) throw new Error("Opponent preparation response contains an invalid revision.");
  return {
    actions: Array.isArray(source.actions) ? source.actions.map(parseAction) : [],
    approvedAt: optionalString(source.approved_at),
    contextLabel: optionalString(source.context_label),
    contextState: recordedState(source.context_state),
    createdAt: optionalString(source.created_at),
    evidence: Array.isArray(source.evidence) ? source.evidence.map(parseEvidence) : [],
    fixtureAvailability: fixtureAvailability(source.fixture_availability),
    fixtureLabel: optionalString(source.fixture_label),
    fixtureScrimId: optionalString(source.fixture_scrim_id),
    id: requiredString(source.id, "the revision identifier"),
    patchLabel: optionalString(source.patch_label),
    patchState: recordedState(source.patch_state),
    review: parseReview(source.review),
    revisionNumber: positiveInteger(source.revision_number, "revision number"),
    staffJudgement: typeof source.staff_judgement === "string" ? source.staff_judgement : "",
    status: revisionStatus(source.status),
    title: requiredString(source.title, "the revision title"),
    updatedAt: optionalString(source.updated_at),
    version: positiveInteger(source.version, "revision version"),
  };
}

function parsePlaybook(value: unknown): OpponentPreparationPlaybook | null {
  if (value === null || value === undefined) return null;
  const source = record(value);
  if (!source || typeof source.is_archived !== "boolean") {
    throw new Error("Opponent preparation response contains an invalid playbook.");
  }
  return {
    archivedAt: optionalString(source.archived_at),
    createdAt: optionalString(source.created_at),
    id: requiredString(source.id, "the playbook identifier"),
    isArchived: source.is_archived,
    revisions: Array.isArray(source.revisions) ? source.revisions.map(parseRevision) : [],
    title: requiredString(source.title, "the playbook title"),
    updatedAt: optionalString(source.updated_at),
    version: positiveInteger(source.version, "playbook version"),
  };
}

export function parseOpponentPreparationProjection(value: unknown): OpponentPreparationProjection {
  const source = record(value);
  if (!source || source.contract_version !== "opponent-preparation-v1" || source.projection !== "staff-v1") {
    throw new Error("Opponent preparation response uses an unsupported contract.");
  }
  const opponent = record(source.opponent);
  if (!opponent) throw new Error("Opponent preparation response is missing the opponent context.");
  return {
    contractVersion: "opponent-preparation-v1",
    opponent: {
      id: requiredString(opponent.id, "the opponent identifier"),
      name: requiredString(opponent.name, "the opponent label"),
    },
    playbook: parsePlaybook(source.playbook),
    projection: "staff-v1",
  };
}

function contextType(value: unknown): OpponentPreparationContextType {
  return oneOf(value, ["action", "scrim", "preparation_brief", "draft_playbook"], "breadcrumb context");
}

export function parseOpponentPreparationBreadcrumbs(value: unknown): OpponentPreparationBreadcrumb[] {
  if (!Array.isArray(value)) {
    throw new Error("Opponent preparation breadcrumbs use an unsupported contract.");
  }
  return value.map((item) => {
    const source = record(item);
    if (!source) throw new Error("Opponent preparation breadcrumbs contain an invalid entry.");
    return {
      contextId: requiredString(source.context_id, "the breadcrumb context identifier"),
      contextType: contextType(source.context_type),
      opponentId: requiredString(source.opponent_id, "the breadcrumb opponent identifier"),
      opponentName: requiredString(source.opponent_name, "the breadcrumb opponent label"),
      playbookId: requiredString(source.playbook_id, "the breadcrumb playbook identifier"),
      revisionStatus: revisionStatus(source.revision_status),
      revisionTitle: requiredString(source.revision_title, "the breadcrumb revision title"),
    };
  });
}

export function opponentPreparationErrorMessage(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error && "message" in error && typeof error.message === "string"
      ? error.message
      : "";
  if (message.includes("changed; refresh")) return "This preparation changed in another session. Refresh and review the latest revision before trying again.";
  if (message.includes("unavailable")) return "Opponent preparation is not available for this workspace or record.";
  if (message.includes("duplicate") || message.includes("already exists")) return "An active preparation playbook already exists for this opponent.";
  return "The opponent-preparation request could not be completed. Refresh and try again.";
}
