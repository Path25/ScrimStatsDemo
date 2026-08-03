export type PracticeDevelopmentProjection = "staff-v1" | "team-v1";
export type PracticeDevelopmentObjectiveStatus = "planned" | "evidenced" | "completed" | "blocked";
export type PracticeDevelopmentEvidenceState = "linked" | "reviewed" | "unavailable";
export type PracticeDevelopmentEvidenceSource = "scrim_game" | "block_review" | "declared_unavailable";
export type PracticeDevelopmentAvailability = "available" | "unavailable";
export type PracticeDevelopmentActionStatus = "assigned" | "acknowledged" | "in_progress" | "ready_for_review" | "complete" | "dismissed" | "unavailable";

export interface PracticeDevelopmentEvidence {
  id: string;
  availability: PracticeDevelopmentAvailability;
  linkedAt?: string;
  reviewedAt?: string;
  sourceId?: string;
  sourceLabel: string;
  sourceMatchKey?: string;
  sourceRecordedAt?: string;
  sourceType: PracticeDevelopmentEvidenceSource;
  staffNote?: string;
  state: PracticeDevelopmentEvidenceState;
  teamSummary?: string;
}

export interface PracticeDevelopmentAction {
  availability: PracticeDevelopmentAvailability;
  category?: string;
  checkpointLabel?: string;
  checkpointScrimId?: string;
  dueAt?: string;
  id?: string;
  ownerLabel?: string;
  scopeLabel?: string;
  status: PracticeDevelopmentActionStatus;
  title?: string;
}

export interface PracticeDevelopmentNextSession {
  id?: string;
  label?: string;
  status: "pending" | "scheduled" | "reviewed" | "unavailable";
}

export interface PracticeDevelopmentObjective {
  archivedAt?: string;
  availability: PracticeDevelopmentAvailability;
  createdAt?: string;
  evidenceStandard: string;
  id: string;
  isArchived: boolean;
  staffNote?: string;
  status: PracticeDevelopmentObjectiveStatus;
  teamStatusSummary?: string;
  title: string;
  updatedAt?: string;
  version: number;
}

export interface PracticeDevelopmentLoop {
  action: PracticeDevelopmentAction | null;
  contractVersion: "practice-development-v1";
  evidence: PracticeDevelopmentEvidence[];
  nextSession: PracticeDevelopmentNextSession | null;
  objective: PracticeDevelopmentObjective | null;
  planning: {
    canCreate: boolean;
    unavailableReason?: string;
  };
  projection: PracticeDevelopmentProjection;
  scrimId: string;
}

export interface PracticeDevelopmentActionBreadcrumb {
  actionId: string;
  availability: PracticeDevelopmentAvailability;
  isArchived: boolean;
  objectiveStatus: PracticeDevelopmentObjectiveStatus;
  objectiveTitle: string;
  scrimId: string;
}

export interface CreatePracticeDevelopmentObjectiveInput {
  evidenceStandard: string;
  staffNote?: string;
  title: string;
}

export interface UpdatePracticeDevelopmentObjectiveInput extends CreatePracticeDevelopmentObjectiveInput {
  expectedVersion: number;
  objectiveId: string;
}

export interface ReviewPracticeDevelopmentEvidenceInput {
  evidenceId: string;
  expectedVersion: number;
  staffNote?: string;
  teamSummary: string;
}

export interface TransitionPracticeDevelopmentObjectiveInput {
  expectedVersion: number;
  nextStatus: PracticeDevelopmentObjectiveStatus;
  objectiveId: string;
  staffNote?: string;
  teamStatusSummary?: string;
}
