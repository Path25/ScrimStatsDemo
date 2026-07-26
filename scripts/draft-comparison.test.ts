import assert from "node:assert/strict";
import test from "node:test";

import { compareOpponentDraft } from "../src/lib/draft-comparison.ts";

test("draft comparison reports observed overlap without inventing a score", () => {
  const comparison = compareOpponentDraft([
    { action_type: "pick", champion_name: "Orianna", team_side: "opponent" },
    { action_type: "pick", champion_name: "Sejuani", team_side: "opponent" },
    { action_type: "ban", champion_name: "Vi", team_side: "opponent" },
    { action_type: "pick", champion_name: "Renekton", team_side: "ours" },
  ], {
    blue_team: "Example Opponent",
    red_team: "Other Team",
    blue_picks: ["Orianna", "Maokai", "Jinx"],
    red_picks: ["Azir"],
    blue_bans: ["Vi", "Rell"],
    red_bans: ["Kalista"],
  }, "Example Opponent");

  assert.deepEqual(comparison?.picks.observedFromPlan, ["Orianna"]);
  assert.deepEqual(comparison?.picks.plannedNotObserved, ["Sejuani"]);
  assert.deepEqual(comparison?.picks.observedBeyondPlan, ["Maokai", "Jinx"]);
  assert.deepEqual(comparison?.bans.observedFromPlan, ["Vi"]);
  assert.equal("score" in (comparison || {}), false);
});

test("draft comparison refuses a mismatched imported opponent", () => {
  assert.equal(compareOpponentDraft([], {
    blue_team: "One",
    red_team: "Two",
    blue_picks: [], red_picks: [], blue_bans: [], red_bans: [],
  }, "Different Team"), null);
});
