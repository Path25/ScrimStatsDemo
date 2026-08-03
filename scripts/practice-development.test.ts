import assert from "node:assert/strict";
import test from "node:test";

import {
  hasPracticeDevelopmentModuleAccess,
  parsePracticeDevelopmentActionBreadcrumbs,
  parsePracticeDevelopmentLoop,
  practicePlanningUnavailableLabel,
} from "../src/lib/practice-development.ts";
import { getWorkspaceCapabilities } from "../src/lib/workspace-capabilities.ts";

function response(overrides: Record<string, unknown> = {}) {
  return {
    contract_version: "practice-development-v1",
    projection: "team-v1",
    scrim_id: "scrim-a",
    planning: { can_create: false, unavailable_reason: "Planning window closed" },
    objective: {
      id: "objective-a",
      title: "Reset vision before the contest",
      evidence_standard: "Staff can observe both support and jungle resetting before setup.",
      status: "evidenced",
      team_status_summary: null,
      staff_note: "Do not return this to team roles",
      version: 3,
      availability: "available",
      evidence: [{
        id: "evidence-a",
        source_id: "game-a",
        source_type: "scrim_game",
        source_label: "Game 2",
        source_match_key: "context_game",
        state: "reviewed",
        team_summary: "The saved review records an early coordinated reset.",
        staff_note: "Internal assessment",
        availability: "available",
      }],
      action: {
        id: "action-a",
        owner_label: "Mid Player",
        title: "Call the reset before setup",
        status: "in_progress",
        availability: "available",
      },
      next_session: { status: "pending", label: null },
    },
    ...overrides,
  };
}

test("practice development access fails closed unless Elite is live and enabled", () => {
  assert.equal(hasPracticeDevelopmentModuleAccess({ subscriptionTier: "free", releaseState: "live", enabled: true }), false);
  assert.equal(hasPracticeDevelopmentModuleAccess({ subscriptionTier: "pro", releaseState: "live", enabled: true }), false);
  assert.equal(hasPracticeDevelopmentModuleAccess({ subscriptionTier: "elite", releaseState: "planned", enabled: true }), false);
  assert.equal(hasPracticeDevelopmentModuleAccess({ subscriptionTier: "elite", releaseState: "live", enabled: false }), false);
  assert.equal(hasPracticeDevelopmentModuleAccess({ subscriptionTier: "elite", releaseState: "live", enabled: true }), true);
});

test("cancelled practice blocks receive an honest planning explanation", () => {
  assert.equal(
    practicePlanningUnavailableLabel("practice_block_cancelled"),
    "This practice block is cancelled, so a new objective cannot be planned.",
  );
});

test("practice development capabilities are explicit and unknown roles fail closed", () => {
  assert.equal(getWorkspaceCapabilities("owner").managePracticeDevelopment, true);
  assert.equal(getWorkspaceCapabilities("admin").managePracticeDevelopment, true);
  assert.equal(getWorkspaceCapabilities("member").viewPracticeDevelopment, true);
  assert.equal(getWorkspaceCapabilities("member").managePracticeDevelopment, false);
  assert.equal(getWorkspaceCapabilities("viewer").viewPracticeDevelopment, true);
  assert.equal(getWorkspaceCapabilities("unexpected-role").viewPracticeDevelopment, false);
  assert.equal(getWorkspaceCapabilities(null).managePracticeDevelopment, false);
});

test("the shaped loop parser reads only the versioned objective contract", () => {
  const loop = parsePracticeDevelopmentLoop(response());
  assert.equal(loop.projection, "team-v1");
  assert.equal(loop.objective?.status, "evidenced");
  assert.equal(loop.evidence[0]?.sourceLabel, "Game 2");
  assert.equal(loop.evidence[0]?.sourceId, undefined);
  assert.equal(loop.evidence[0]?.sourceMatchKey, "context_game");
  assert.equal(loop.evidence[0]?.staffNote, undefined);
  assert.equal(loop.objective?.staffNote, undefined);
  assert.equal(loop.objective?.isArchived, false);
  assert.equal(loop.action?.id, "action-a");
  assert.equal(loop.nextSession?.status, "pending");
});

test("the action breadcrumb parser accepts only the safe shaped contract", () => {
  const breadcrumbs = parsePracticeDevelopmentActionBreadcrumbs([{
    action_id: "action-a",
    availability: "available",
    is_archived: false,
    objective_status: "evidenced",
    objective_title: "Reset vision before the contest",
    scrim_id: "scrim-a",
  }]);
  assert.deepEqual(breadcrumbs[0], {
    actionId: "action-a",
    availability: "available",
    isArchived: false,
    objectiveStatus: "evidenced",
    objectiveTitle: "Reset vision before the contest",
    scrimId: "scrim-a",
  });
  assert.throws(() => parsePracticeDevelopmentActionBreadcrumbs({}), /unsupported contract/);
  assert.throws(
    () => parsePracticeDevelopmentActionBreadcrumbs([{ action_id: "action-a", is_archived: false }]),
    /unsupported availability state/,
  );
});

test("archived objectives remain explicit and recoverable in the staff projection", () => {
  const archived = response({ projection: "staff-v1" });
  Object.assign(archived.objective as Record<string, unknown>, {
    archived_at: "2026-08-03T12:00:00Z",
    is_archived: true,
  });
  const loop = parsePracticeDevelopmentLoop(archived);
  assert.equal(loop.objective?.isArchived, true);
  assert.equal(loop.objective?.archivedAt, "2026-08-03T12:00:00Z");
  assert.equal(loop.objective?.staffNote, "Do not return this to team roles");
  assert.equal(loop.evidence[0]?.sourceId, "game-a");
});

test("team projection strips unavailable action and checkpoint provenance", () => {
  const unavailable = response();
  Object.assign((unavailable.objective as Record<string, unknown>).action as Record<string, unknown>, {
    availability: "unavailable",
    id: "hidden-action",
    owner_label: "Hidden owner",
    status: "unavailable",
    title: "Hidden title",
  });
  (unavailable.objective as Record<string, unknown>).next_session = {
    id: "hidden-checkpoint",
    label: "Hidden checkpoint",
    status: "unavailable",
  };
  const loop = parsePracticeDevelopmentLoop(unavailable);
  assert.equal(loop.action?.availability, "unavailable");
  assert.equal(loop.action?.id, undefined);
  assert.equal(loop.action?.title, undefined);
  assert.equal(loop.action?.ownerLabel, undefined);
  assert.equal(loop.nextSession?.id, undefined);
  assert.equal(loop.nextSession?.label, undefined);

  const unavailableEvidence = response();
  Object.assign(((unavailableEvidence.objective as Record<string, unknown>).evidence as Array<Record<string, unknown>>)[0], {
    availability: "unavailable",
    source_match_key: "scrim_game:2",
    state: "unavailable",
  });
  assert.equal(parsePracticeDevelopmentLoop(unavailableEvidence).evidence[0]?.sourceMatchKey, undefined);

  const staffUnavailable = response({ projection: "staff-v1" });
  (staffUnavailable.objective as Record<string, unknown>).action = {
    availability: "unavailable",
    status: "unavailable",
  };
  assert.throws(() => parsePracticeDevelopmentLoop(staffUnavailable), /action identifier/);
});

test("the shaped loop parser rejects unknown projections and lifecycle claims", () => {
  assert.throws(
    () => parsePracticeDevelopmentLoop(response({ projection: "browser-admin" })),
    /unsupported projection/,
  );
  const invalid = response();
  (invalid.objective as Record<string, unknown>).status = "improved";
  assert.throws(() => parsePracticeDevelopmentLoop(invalid), /unsupported objective state/);
  const unknownAvailability = response();
  (unknownAvailability.objective as Record<string, unknown>).availability = "assumed";
  assert.throws(() => parsePracticeDevelopmentLoop(unknownAvailability), /unsupported availability state/);
  const unknownAction = response();
  ((unknownAction.objective as Record<string, unknown>).action as Record<string, unknown>).status = "won";
  assert.throws(() => parsePracticeDevelopmentLoop(unknownAction), /unsupported action state/);
});
