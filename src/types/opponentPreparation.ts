export type OpponentPreparationAvailability = "available" | "superseded" | "unavailable" | "insufficient";
export type OpponentPreparationRecordedState = "recorded" | "not_recorded";
export type OpponentPreparationFixtureAvailability = "available" | "unavailable" | "not_recorded";
export type OpponentPreparationRevisionStatus = "draft" | "approved";
export type OpponentPreparationSourceType = "scouting_evidence" | "preparation_brief" | "draft_playbook" | "declared_insufficient";
export type OpponentPreparationContextType = "action" | "scrim" | "preparation_brief" | "draft_playbook";

export interface OpponentPreparationEvidence {
  availability: OpponentPreparationAvailability;
  id: string;
  insufficientReason?: string;
  linkedAt?: string;
  sourceContext?: string;
  sourceId?: string;
  sourceLabel: string;
  sourcePatchLabel?: string;
  sourceRecordedAt: string;
  sourceSummary?: string;
  sourceType: OpponentPreparationSourceType;
  staffRelevanceNote?: string;
}

export interface OpponentPreparationAction {
  availability: "available" | "unavailable";
  category?: string;
  dueAt?: string;
  id?: string;
  linkedAt?: string;
  linkId: string;
  ownerLabel?: string;
  status: string;
  title: string;
}

export interface OpponentPreparationReview {
  availability: "available" | "unavailable";
  label: string;
  linkId: string;
  linkedAt?: string;
  scrimId: string;
  staffOutcomeSummary: string;
}

export interface OpponentPreparationRevision {
  actions: OpponentPreparationAction[];
  approvedAt?: string;
  contextLabel?: string;
  contextState: OpponentPreparationRecordedState;
  createdAt?: string;
  evidence: OpponentPreparationEvidence[];
  fixtureAvailability: OpponentPreparationFixtureAvailability;
  fixtureLabel?: string;
  fixtureScrimId?: string;
  id: string;
  patchLabel?: string;
  patchState: OpponentPreparationRecordedState;
  review: OpponentPreparationReview | null;
  revisionNumber: number;
  staffJudgement: string;
  status: OpponentPreparationRevisionStatus;
  title: string;
  updatedAt?: string;
  version: number;
}

export interface OpponentPreparationPlaybook {
  archivedAt?: string;
  createdAt?: string;
  id: string;
  isArchived: boolean;
  revisions: OpponentPreparationRevision[];
  title: string;
  updatedAt?: string;
  version: number;
}

export interface OpponentPreparationProjection {
  contractVersion: "opponent-preparation-v1";
  opponent: { id: string; name: string };
  playbook: OpponentPreparationPlaybook | null;
  projection: "staff-v1";
}

export interface OpponentPreparationEvidenceOption {
  id: string;
  label: string;
  recordedAt: string;
  sourceType: Exclude<OpponentPreparationSourceType, "declared_insufficient">;
}

export interface OpponentPreparationActionOption {
  id: string;
  label: string;
  status: string;
}

export interface OpponentPreparationScrimOption {
  id: string;
  label: string;
  reviewStatus: string;
  startsAt: string;
}

export interface OpponentPreparationOptions {
  actions: OpponentPreparationActionOption[];
  evidence: OpponentPreparationEvidenceOption[];
  scrims: OpponentPreparationScrimOption[];
}

export interface OpponentPreparationBreadcrumb {
  contextId: string;
  contextType: OpponentPreparationContextType;
  opponentId: string;
  opponentName: string;
  playbookId: string;
  revisionStatus: OpponentPreparationRevisionStatus;
  revisionTitle: string;
}

export interface OpponentPreparationDraftInput {
  contextLabel?: string;
  fixtureScrimId?: string;
  patchLabel?: string;
  staffJudgement: string;
  title: string;
}

export interface CreateOpponentPreparationInput extends OpponentPreparationDraftInput {
  playbookTitle: string;
}
