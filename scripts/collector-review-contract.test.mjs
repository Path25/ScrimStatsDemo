import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("collector game JSON is normalized before review components receive it", () => {
  const hook = read("src/hooks/useScrimGames.ts");
  const types = read("src/types/scrimGame.ts");
  assert.match(hook, /map\(\(game\) => transformScrimGameFromDB/);
  assert.match(types, /source\.itemID/);
  assert.match(types, /summonerSpellOne/);
  assert.match(types, /objectives: gameObjectives\(dbGame\.objectives\)/);
});

test("game selection avoids a nested lazy chunk boundary", () => {
  const review = read("src/components/scrims/ScrimBlockView.tsx");
  const entry = read("src/main.tsx");
  assert.doesNotMatch(review, /lazy\(\(\) =>/);
  assert.match(entry, /vite:preloadError/);
});
