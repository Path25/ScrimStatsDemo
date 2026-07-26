import assert from "node:assert/strict";
import test from "node:test";

import {
  championMetrics,
  compositionMetrics,
  duoMetrics,
  improvementWindows,
  matchupMetrics,
  type CompetitiveGameEvidence,
} from "../src/lib/analytics/competitive-analytics.ts";

function game(
  id: string,
  result: "win" | "loss",
  ours: Array<[string, "top" | "jungle" | "mid" | "adc" | "support"]>,
  theirs: Array<[string, "top" | "jungle" | "mid" | "adc" | "support"]>,
): CompetitiveGameEvidence {
  return {
    id,
    playedAt: `2026-07-${String(Number(id) + 1).padStart(2, "0")}T18:00:00Z`,
    result,
    source: "collector_v2",
    captureVersion: "2.0.0",
    taxonomyVersion: "1",
    participants: [
      ...ours.map(([champion, role]) => ({ champion, role, isOurTeam: true })),
      ...theirs.map(([champion, role]) => ({ champion, role, isOurTeam: false })),
    ],
  };
}

const fixtures = [
  game("1", "win", [["Ornn", "top"], ["Vi", "jungle"], ["Orianna", "mid"], ["Jinx", "adc"], ["Nautilus", "support"]], [["Renekton", "top"], ["Lee Sin", "jungle"], ["Ahri", "mid"], ["Kai'Sa", "adc"], ["Rakan", "support"]]),
  game("2", "loss", [["Ornn", "top"], ["Vi", "jungle"], ["Orianna", "mid"], ["Jinx", "adc"], ["Nautilus", "support"]], [["Gnar", "top"], ["Sejuani", "jungle"], ["Azir", "mid"], ["Zeri", "adc"], ["Rakan", "support"]]),
  game("3", "win", [["K'Sante", "top"], ["Vi", "jungle"], ["Orianna", "mid"], ["Aphelios", "adc"], ["Nautilus", "support"]], [["Renekton", "top"], ["Lee Sin", "jungle"], ["Ahri", "mid"], ["Kai'Sa", "adc"], ["Rakan", "support"]]),
];

test("champion and matchup metrics preserve raw samples", () => {
  const orianna = championMetrics(fixtures).find((metric) => metric.champion === "Orianna");
  assert.deepEqual({ games: orianna?.games, wins: orianna?.wins, losses: orianna?.losses }, { games: 3, wins: 2, losses: 1 });
  const matchup = matchupMetrics(fixtures).find(
    (metric) => metric.champion === "Orianna" && metric.opponentChampion === "Ahri",
  );
  assert.deepEqual({ games: matchup?.games, wins: matchup?.wins }, { games: 2, wins: 2 });
});

test("duos include role-pair combinations without hiding small samples", () => {
  const viOrianna = duoMetrics(fixtures).find(
    (metric) => metric.firstChampion === "Vi" && metric.secondChampion === "Orianna",
  );
  assert.equal(viOrianna?.games, 3);
  assert.equal(viOrianna?.smallSample, false);
});

test("composition identities explain contributing champion traits", () => {
  const metrics = compositionMetrics(fixtures, {
    ornn: ["engage", "front_to_back"],
    vi: ["engage", "dive"],
    orianna: ["front_to_back", "protect_carry"],
    jinx: ["front_to_back", "scaling"],
    nautilus: ["engage", "pick"],
    "k'sante": ["front_to_back", "protect_carry"],
    aphelios: ["front_to_back", "scaling"],
  });
  const engage = metrics.find((metric) => metric.identity === "engage");
  assert.equal(engage?.games, 3);
  assert.deepEqual(engage?.traitContributions.map((item) => item.champion).sort(), ["Nautilus", "Ornn", "Vi"]);
});

test("improvement callouts require two comparable ten-game windows", () => {
  assert.equal(improvementWindows(fixtures).available, false);
  const twenty = Array.from({ length: 20 }, (_, index) => ({
    ...fixtures[index % fixtures.length],
    id: String(index + 10),
    playedAt: `2026-06-${String(index + 1).padStart(2, "0")}T18:00:00Z`,
  }));
  assert.equal(improvementWindows(twenty).available, true);
});
