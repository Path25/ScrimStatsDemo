import assert from "node:assert/strict";
import test from "node:test";

import {
  blockScoreLabel,
  buildReviewChecklist,
  deriveBlockResult,
  formatGameDuration,
  recordedGameScore,
} from "../src/lib/scrim-review.ts";
import type { ScrimGame } from "../src/types/scrimGame.ts";

function game(overrides: Partial<ScrimGame> = {}): ScrimGame {
  return {
    bans: { enemy_bans: [], our_bans: [] },
    created_at: "2026-07-26T12:00:00Z",
    enemy_team_gold: 0,
    enemy_team_kills: 0,
    game_number: 1,
    id: "game-1",
    objectives: { barons: [], dragons: [], inhibitors: [], towers: [] },
    our_team_gold: 0,
    our_team_kills: 0,
    scrim_id: "scrim-1",
    status: "pending",
    updated_at: "2026-07-26T12:00:00Z",
    ...overrides,
  };
}

const openBlock = {
  opponent_score: null,
  our_score: null,
  result: null,
  result_source: "games" as const,
  review_status: "in_review" as const,
};

test("recorded score counts only explicit active game outcomes", () => {
  assert.deepEqual(
    recordedGameScore([
      game({ id: "win", result: "win" }),
      game({ id: "loss", game_number: 2, result: "loss" }),
      game({ id: "missing", game_number: 3 }),
      game({ id: "cancelled", game_number: 4, result: "win", status: "cancelled" }),
    ]),
    { wins: 1, losses: 1, recorded: 2 },
  );
});

test("block result handles wins, losses, and draws", () => {
  assert.equal(deriveBlockResult(2, 1), "win");
  assert.equal(deriveBlockResult(1, 2), "loss");
  assert.equal(deriveBlockResult(1, 1), "draw");
});

test("missing score and duration stay explicit rather than becoming zero", () => {
  assert.equal(blockScoreLabel(openBlock), "Outcome not recorded");
  assert.equal(formatGameDuration(null), "Not recorded");
  assert.equal(formatGameDuration(0), "0:00");
});

test("review checklist identifies incomplete outcome, side, and performance data", () => {
  const checks = buildReviewChecklist(
    [
      game({
        result: "win",
        side: "blue",
        performance_rating: 4,
        performance_summary: "Controlled objectives.",
      }),
      game({ id: "game-2", game_number: 2, result: "loss" }),
    ],
    openBlock,
  );
  assert.deepEqual(checks.map((check) => check.complete), [true, true, false, false, false]);
  assert.equal(checks.find((check) => check.label === "Sides saved")?.detail, "1/2");
});

test("completed block score is final while an open score remains recorded", () => {
  assert.equal(
    blockScoreLabel({ ...openBlock, our_score: 2, opponent_score: 1 }),
    "2–1 recorded",
  );
  assert.equal(
    blockScoreLabel({ ...openBlock, our_score: 2, opponent_score: 1, review_status: "complete" }),
    "2–1",
  );
});
