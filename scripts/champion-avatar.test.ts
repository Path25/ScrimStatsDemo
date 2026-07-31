import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { championFallbackInitials, championFallbackLabel, isMissingChampionIdentity, resolveChampionImageUrl } from "../src/lib/champion-avatar.ts";

const catalogue = [
  { id: "Ambessa", name: "Ambessa", imageUrl: "https://cdn.example/Ambessa.png" },
  { id: "Nunu", name: "Nunu & Willump", imageUrl: "https://cdn.example/Nunu.png" },
  { id: "KSante", name: "K'Sante", imageUrl: "https://cdn.example/KSante.png" },
];

test("ChampionAvatar resolves current and special catalogue identities without a fixed patch", () => {
  assert.equal(resolveChampionImageUrl("Ambessa", catalogue), "https://cdn.example/Ambessa.png");
  assert.equal(resolveChampionImageUrl("Nunu & Willump", catalogue), "https://cdn.example/Nunu.png");
  assert.equal(resolveChampionImageUrl("Ksante", catalogue), "https://cdn.example/KSante.png");
});

test("ChampionAvatar keeps missing and unknown identities in intentional fallback states", () => {
  assert.equal(isMissingChampionIdentity("None"), true);
  assert.equal(resolveChampionImageUrl("Unknown Champion", catalogue), null);
  assert.equal(championFallbackInitials("K'Sante"), "KS");
  assert.equal(championFallbackLabel("Unknown Champion"), "Unknown Champion icon unavailable");
});

test("ChampionAvatar source uses the cached current catalogue and one failure fallback", () => {
  const component = readFileSync(new URL("../src/components/scrims/ChampionAvatar.tsx", import.meta.url), "utf8");
  const hook = readFileSync(new URL("../src/hooks/useChampionCatalog.ts", import.meta.url), "utf8");
  assert.match(component, /useChampionCatalog/);
  assert.match(component, /onError=\{\(\) => setFailedImageUrl\(imageUrl\)\}/);
  assert.doesNotMatch(component, /14\.1\.1|13\.24\.1|raw\.communitydragon|console\.(?:warn|error)/);
  assert.match(hook, /imageUrl/);
  assert.match(hook, /staleTime: 24 \* 60 \* 60 \* 1000/);
});
