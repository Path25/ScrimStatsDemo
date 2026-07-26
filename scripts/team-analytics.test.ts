import assert from "node:assert/strict";
import test from "node:test";

import {
  draftAnalytics,
  filterTeamAnalytics,
  improvementComparison,
  playerAnalytics,
  summarizeTeamAnalytics,
  type EvidenceProvider,
  type TeamAnalyticsDataset,
  type TeamAnalyticsGame,
} from "../src/lib/analytics/team-analytics.ts";

function game(index: number, provider: EvidenceProvider, complete = true): TeamAnalyticsGame {
  return {
    id: `game-${index}`,
    scrim_id: `block-${Math.floor(index / 3)}`,
    game_number: (index % 3) + 1,
    played_at: new Date(Date.UTC(2026, 6, 25 - index)).toISOString(),
    opponent_team_id: index % 2 ? "opponent-a" : null,
    opponent_name: index % 2 ? "Alpha" : "Beta",
    format: "BO3",
    result: index < 10 || index % 2 === 0 ? "win" : "loss",
    side: index % 2 ? "red" : "blue",
    duration_seconds: complete ? 1800 : null,
    our_team_kills: complete ? 15 + index : null,
    enemy_team_kills: complete ? 10 : null,
    our_team_gold: complete ? 60000 + index * 100 : null,
    enemy_team_gold: complete ? 58000 : null,
    performance_rating: complete ? 4 : null,
    early_game_rating: complete ? 3 : null,
    mid_game_rating: complete ? 4 : null,
    late_game_rating: complete ? 4 : null,
    provider,
    capabilities: complete
      ? ["result", "draft", "participant_stats", provider === "grid" ? "movement_detail" : "timeline"]
      : ["result"],
    payload_version: `${provider}-v1`,
    captured_at: new Date(Date.UTC(2026, 6, 25 - index)).toISOString(),
    patch: "26.14",
  };
}

const games = Array.from({ length: 20 }, (_, index) =>
  game(index, index < 7 ? "grid" : index < 14 ? "desktop_collector" : "manual", index !== 19),
);
const dataset: TeamAnalyticsDataset = {
  contract_version: "team-analytics-v2",
  date_from: "2026-07-01",
  date_to: "2026-07-30",
  capture_profile: "desktop_manual",
  games,
  participants: games.flatMap((item) => [
    {
      scrim_game_id: item.id,
      player_id: "player-one",
      summoner_name: "Player One",
      champion_name: "Ahri",
      role: "mid",
      is_our_team: true,
      kills: 5,
      deaths: 2,
      assists: 7,
      cs: 240,
      gold: 12000,
      damage_dealt: 20000,
      damage_taken: 10000,
      vision_score: 30,
    },
    {
      scrim_game_id: item.id,
      player_id: null,
      summoner_name: "Opponent Mid",
      champion_name: "Syndra",
      role: "mid",
      is_our_team: false,
      kills: 2,
      deaths: 5,
      assists: 3,
      cs: 220,
      gold: 11000,
      damage_dealt: 15000,
      damage_taken: 12000,
      vision_score: 20,
    },
  ]),
  filter_options: {
    opponents: [{ key: "opponent-a", name: "Alpha" }, { key: "name:beta", name: "Beta" }],
    formats: ["BO3"],
    patches: ["26.14"],
  },
};

test("mixed providers combine only through shared normalized facts", () => {
  const summary = summarizeTeamAnalytics(dataset);
  assert.equal(summary.games.length, 20);
  assert.equal(summary.resultGames.length, 20);
  assert.deepEqual(summary.providerCounts.map((row) => row.games), [7, 7, 6]);
  assert.equal(summary.averageDuration.samples, 19);
});

test("provider and capability filters do not double count games", () => {
  assert.equal(filterTeamAnalytics(dataset, { provider: "grid" }).games.length, 7);
  assert.equal(filterTeamAnalytics(dataset, { completeness: "core" }).games.length, 19);
  assert.equal(filterTeamAnalytics(dataset, { completeness: "advanced" }).games.length, 19);
});

test("improvement activates only with two exact ten-game windows", () => {
  const comparison = improvementComparison(dataset);
  assert.equal(comparison.available, true);
  if (comparison.available) {
    assert.equal(comparison.recent.length, 10);
    assert.equal(comparison.previous.length, 10);
    assert.equal(comparison.metrics[0].recent.value, 100);
    assert.equal(comparison.metrics[0].previous.value, 50);
  }
  assert.equal(improvementComparison({ ...dataset, games: games.slice(0, 19) }).available, false);
});

test("player per-minute metrics declare their own samples", () => {
  const [player] = playerAnalytics(dataset);
  assert.equal(player.games, 20);
  assert.equal(player.csPerMinute.samples, 19);
  assert.equal(player.csPerMinute.value?.toFixed(1), "8.0");
  assert.equal(player.kda.samples, 20);
});

test("draft metrics require factual same-role participants", () => {
  const draft = draftAnalytics(dataset);
  assert.equal(draft.champions[0].games, 20);
  assert.equal(draft.matchups[0].games, 20);
  assert.equal(draft.duos.length, 0);
});
