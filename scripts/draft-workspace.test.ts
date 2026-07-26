import assert from "node:assert/strict";
import test from "node:test";

import { DRAFT_SEQUENCE, draftEvidenceInsights, sequenceSlot, validateDraftScenario, type DraftActionRecord, type DraftWorkspaceDataset } from "../src/lib/draft-workspace.ts";

test("standard tournament sequence declares every pick and ban turn", () => {
  assert.equal(DRAFT_SEQUENCE.length, 20);
  assert.deepEqual(DRAFT_SEQUENCE.slice(0, 6).map((slot) => slot.actionType), Array(6).fill("ban"));
  assert.deepEqual(DRAFT_SEQUENCE.slice(6, 12).map((slot) => slot.colour), ["blue", "red", "red", "blue", "blue", "red"]);
  assert.deepEqual(DRAFT_SEQUENCE.slice(12, 16).map((slot) => slot.actionType), Array(4).fill("ban"));
  assert.deepEqual(DRAFT_SEQUENCE.slice(16).map((slot) => slot.colour), ["red", "blue", "blue", "red"]);
  assert.equal(sequenceSlot(8, "blue")?.teamSide, "opponent");
  assert.equal(sequenceSlot(20, "red")?.teamSide, "ours");
});

test("scenario validation reports exact completion and restriction failures", () => {
  const actions = DRAFT_SEQUENCE.slice(0, 2).map((slot, index): DraftActionRecord => ({
    id: String(index), scenario_id: "scenario", sequence_number: slot.sequence, phase: slot.phase,
    team_side: slot.colour === "blue" ? "ours" : "opponent", action_type: slot.actionType,
    champion_name: index ? "Vi" : "Ahri", assigned_role: null, rationale: "",
  }));
  const issues = validateDraftScenario(actions, "blue", ["Ahri"]);
  assert.ok(issues.includes("Ahri is unavailable for this series game."));
  assert.ok(issues.includes("18 draft actions remain."));
  assert.ok(issues.includes("5 team role assignments remain."));
});

test("evidence prompts expose samples without manufacturing recommendations", () => {
  const dataset = {
    external_drafts: [{ id: "g1", opponent_team_id: "opp", blue_team: "Opp", red_team: "Other", blue_picks: ["Ahri", "Vi"], red_picks: [], blue_bans: [], red_bans: [], patch: "26.14", played_at: "2026-07-01", source_url: "https://example.test" }],
    team_drafts: [], champion_pools: [], scouting_evidence: [],
  } as unknown as DraftWorkspaceDataset;
  const insights = draftEvidenceInsights(dataset, "opp");
  assert.equal(insights[0]?.samples, 1);
  assert.match(insights[0]?.detail || "", /Observed in 1 of 1/);
  assert.doesNotMatch(JSON.stringify(insights), /win probability|recommended pick|predicted/i);
});

test("evidence prompts are scoped to an exact provider split", () => {
  const dataset = {
    external_drafts: [
      { id: "spring", opponent_team_id: "opp", blue_picks: ["Ahri"], red_picks: [], blue_bans: [], red_bans: [], tournament: "LPLOL 2026 Spring" },
      { id: "playoffs", opponent_team_id: "opp", blue_picks: ["Vi"], red_picks: [], blue_bans: [], red_bans: [], tournament: "LPLOL 2026 Spring Playoffs" },
    ],
    team_drafts: [], champion_pools: [], scouting_evidence: [],
  } as unknown as DraftWorkspaceDataset;
  const insights = draftEvidenceInsights(dataset, "opp", "LPLOL 2026 Spring Playoffs");
  assert.equal(insights.length, 1);
  assert.match(insights[0]?.title || "", /Vi/);
  assert.equal(insights[0]?.dateLabel, "LPLOL 2026 Spring Playoffs");
  assert.doesNotMatch(JSON.stringify(insights), /Ahri/);
});
