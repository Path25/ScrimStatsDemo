import assert from "node:assert/strict";
import test from "node:test";

import { normalizeRank, rankChartSeries, rankMovement, recentForm, thirtyDayNet } from "../src/lib/soloq.ts";
import type { SoloQDailySnapshot, SoloQRecentMatch } from "../src/types/soloq.ts";

function snapshot(date: string, tier: string, division: string, lp: number): SoloQDailySnapshot {
  return { id: date, tenant_id: "tenant", player_id: "player", snapshot_date: date, queue_type: "RANKED_SOLO_5x5", tier, division, league_points: lp, wins: 0, losses: 0, captured_at: `${date}T05:15:00Z` };
}

function match(overrides: Partial<SoloQRecentMatch>): SoloQRecentMatch {
  return { id: "match", tenant_id: "tenant", player_id: "player", match_id: "EUW1_1", played_at: new Date().toISOString(), game_duration_seconds: 1800, queue_id: 420, game_version: "16.1.1", champion_id: 1, champion_name: "Annie", team_position: "MIDDLE", win: true, kills: 6, deaths: 2, assists: 8, cs: 210, gold_earned: 12000, damage_to_champions: 22000, vision_score: 20, items: [], match_context: { participants: [], teams: [] }, synced_at: new Date().toISOString(), ...overrides };
}

test("normalizes divisions and promotions without discontinuities", () => {
  assert.equal(normalizeRank("GOLD", "IV", 0), 1200);
  assert.equal(normalizeRank("GOLD", "I", 80), 1580);
  assert.equal(normalizeRank("PLATINUM", "IV", 10), 1610);
  assert.equal(normalizeRank("DIAMOND", "I", 99), 2799);
});

test("apex tiers share one LP coordinate and unknown tiers are excluded", () => {
  assert.equal(normalizeRank("MASTER", "I", 120), 2920);
  assert.equal(normalizeRank("GRANDMASTER", "I", 120), 2920);
  assert.equal(normalizeRank("CHALLENGER", "I", 120), 2920);
  assert.equal(normalizeRank("UNRANKED", "", 0), null);
});

test("daily movement prefers yesterday and labels a dated fallback gap", () => {
  const exact = rankMovement([snapshot("2026-07-26", "GOLD", "I", 10), snapshot("2026-07-25", "GOLD", "II", 80)], "2026-07-26");
  assert.equal(exact.change, 30);
  assert.equal(exact.label, "Daily change");
  const fallback = rankMovement([snapshot("2026-07-26", "PLATINUM", "IV", 20), snapshot("2026-07-22", "GOLD", "I", 70)], "2026-07-26");
  assert.equal(fallback.change, 50);
  assert.equal(fallback.label, "Since last snapshot");
  assert.equal(fallback.comparisonDate, "2026-07-22");
});

test("chart preserves only factual dates and 30-day net supports demotions", () => {
  const values = [snapshot("2026-07-20", "PLATINUM", "IV", 5), snapshot("2026-07-26", "GOLD", "I", 90)];
  assert.deepEqual(rankChartSeries(values).map((entry) => entry.snapshot_date), ["2026-07-20", "2026-07-26"]);
  assert.equal(thirtyDayNet(values), -15);
});

test("recent form calculates W-L, KDA, CS per minute, and seven-day games", () => {
  const form = recentForm([match({ id: "one" }), match({ id: "two", win: false, kills: 2, deaths: 4, assists: 6, cs: 150 })]);
  assert.deepEqual([form.wins, form.losses, form.gamesLastSevenDays], [1, 1, 2]);
  assert.equal(form.averageKda, 4.5);
  assert.equal(form.csPerMinute, 6);
});
