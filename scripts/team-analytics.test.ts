import assert from "node:assert/strict";
import test from "node:test";

import {
  draftAnalytics,
  filterTeamAnalytics,
  improvementComparison,
  measuredPerformanceIndex,
  playerAnalytics,
  summarizeTeamAnalytics,
  teamPatterns,
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
    game_classification: "standard_5v5",
    quality_flags: [],
    roster_coverage: 5,
    score_eligible: complete,
  };
}

const games = Array.from({ length: 20 }, (_, index) =>
  game(index, index < 7 ? "grid" : index < 14 ? "desktop_collector" : "manual", index !== 19),
);
const dataset: TeamAnalyticsDataset = {
  contract_version: "team-analytics-v3",
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
      advanced_stats: { wards_placed: 10, wards_killed: 3, control_wards_purchased: 2, damage_to_objectives: 4000, crowd_control_seconds: 20, time_dead_seconds: 80 },
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
      advanced_stats: { wards_placed: 7, wards_killed: 1, control_wards_purchased: 1, damage_to_objectives: 2500, crowd_control_seconds: 10, time_dead_seconds: 110 },
    },
  ]),
  events: games.flatMap((item) => [
    { scrim_game_id: item.id, event_id: `${item.id}-fb`, sequence: 1, occurred_seconds: 240, event_type: "FirstBlood", team: "our" as const, actor_name: "Player One", victim_name: "Opponent Mid", objective_type: null, map_object: null },
    { scrim_game_id: item.id, event_id: `${item.id}-kill`, sequence: 2, occurred_seconds: 420, event_type: "ChampionKill", team: "our" as const, actor_name: "Player One", victim_name: "Opponent Mid", objective_type: null, map_object: null },
    { scrim_game_id: item.id, event_id: `${item.id}-dragon`, sequence: 3, occurred_seconds: 600, event_type: "DragonKill", team: "our" as const, actor_name: "Player One", victim_name: null, objective_type: "Infernal", map_object: null },
    { scrim_game_id: item.id, event_id: `${item.id}-tower`, sequence: 4, occurred_seconds: 720, event_type: "TurretKilled", team: "enemy" as const, actor_name: "Opponent Mid", victim_name: null, objective_type: null, map_object: "Turret_TOrder_L1_P3_2254202041_0" },
    { scrim_game_id: item.id, event_id: `${item.id}-baron`, sequence: 5, occurred_seconds: 1500, event_type: "BaronKill", team: "enemy" as const, actor_name: "Opponent Mid", victim_name: null, objective_type: "Baron", map_object: null },
  ]),
  drafts: games.map((item) => ({ scrim_game_id: item.id, our_team_side: item.side, picks: [{ champion: "Ahri", champion_id: 103, order: 6, team: item.side! }], bans: [{ champion: "Ivern", champion_id: 427, order: 1, team: item.side! }], completed: true })),
  filter_options: {
    opponents: [{ key: "opponent-a", name: "Alpha" }, { key: "name:beta", name: "Beta" }],
    formats: ["BO3"],
    patches: ["26.14"],
    classifications: ["standard_5v5"],
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

test("pattern panels use only normalized event evidence and present readable objective names", () => {
  const patterns = teamPatterns(dataset);
  assert.equal(patterns.firstBlood.games, 20);
  assert.equal(patterns.firstBlood.wins, 15);
  assert.equal(patterns.pressure10.value, 1);
  assert.equal(patterns.objectiveSequences.length, 1);
  assert.match(patterns.objectiveSequences[0].label, /Our Infernal Dragon/);
  assert.match(patterns.objectiveSequences[0].label, /Enemy Top outer turret/);
  assert.doesNotMatch(patterns.objectiveSequences[0].label, /Turret_T/);
});

test("Measured Performance Index gates at ten prior eligible games and excludes non-standard games", () => {
  const nineBaseline = { ...dataset, games: games.slice(0, 10), participants: dataset.participants.filter((row) => games.slice(0, 10).some((item) => item.id === row.scrim_game_id)), events: dataset.events.filter((row) => games.slice(0, 10).some((item) => item.id === row.scrim_game_id)) };
  assert.equal(measuredPerformanceIndex(nineBaseline).available, false);
  const tenBaseline = { ...dataset, games: games.slice(0, 11), participants: dataset.participants.filter((row) => games.slice(0, 11).some((item) => item.id === row.scrim_game_id)), events: dataset.events.filter((row) => games.slice(0, 11).some((item) => item.id === row.scrim_game_id)) };
  assert.equal(measuredPerformanceIndex(tenBaseline).available, true);
  const nonstandardLatest = { ...game(99, "desktop_collector"), id: "nonstandard", played_at: "2026-07-30T12:00:00Z", game_classification: "nonstandard_custom" as const, score_eligible: false };
  const withNonstandard = { ...dataset, games: [...dataset.games, nonstandardLatest] };
  const score = measuredPerformanceIndex(withNonstandard);
  assert.equal(score.available, true);
  if (score.available) assert.notEqual(score.target.id, "nonstandard");

  const expandedGames = Array.from({ length: 32 }, (_, index) => ({ ...game(index, "desktop_collector"), id: `expanded-${index}`, played_at: new Date(Date.UTC(2026, 5, index + 1)).toISOString() }));
  const expanded = {
    ...dataset,
    games: expandedGames,
    participants: expandedGames.flatMap((item) => dataset.participants.filter((row) => row.scrim_game_id === "game-0").map((row) => ({ ...row, scrim_game_id: item.id }))),
    events: expandedGames.flatMap((item) => dataset.events.filter((row) => row.scrim_game_id === "game-0").map((row) => ({ ...row, scrim_game_id: item.id, event_id: `${item.id}-${row.sequence}` }))),
  };
  const expandedScore = measuredPerformanceIndex(expanded);
  assert.equal(expandedScore.available, true);
  if (expandedScore.available) assert.equal(expandedScore.baselineGames.length, 30);
});
