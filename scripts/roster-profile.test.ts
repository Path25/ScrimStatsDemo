import assert from "node:assert/strict";
import test from "node:test";

import {
  championPoolFromJson,
  displayRiotIdentity,
  normalizeChampionPool,
  normalizeOptionalText,
  normalizeRequiredName,
} from "../src/lib/roster-profile.ts";

test("normalizes names and optional fields before roster mutations", () => {
  assert.equal(normalizeRequiredName("  Team   Player  "), "Team Player");
  assert.equal(normalizeOptionalText("   "), undefined);
  assert.equal(normalizeOptionalText("  EUW  "), "EUW");
});

test("deduplicates and limits champion pools", () => {
  const champions = normalizeChampionPool(
    "Gnar, gnar, K'Sante,  Renekton, Aatrox, Ornn, Jax, Camille, Rumble, Kennen, Sion, Poppy, Gragas, Malphite",
  );

  assert.deepEqual(champions.slice(0, 3), ["Gnar", "K'Sante", "Renekton"]);
  assert.equal(champions.length, 12);
});

test("safely reads champion pools from arbitrary JSON", () => {
  assert.deepEqual(championPoolFromJson({ champion: "Gnar" }), []);
  assert.deepEqual(championPoolFromJson(["Gnar", 4, null, " gnar ", "Ornn"]), ["Gnar", "Ornn"]);
});

test("formats Riot identities only when a game name exists", () => {
  assert.equal(displayRiotIdentity("Player", "EUW"), "Player#EUW");
  assert.equal(displayRiotIdentity("Player", null), "Player");
  assert.equal(displayRiotIdentity(null, "EUW"), null);
});
