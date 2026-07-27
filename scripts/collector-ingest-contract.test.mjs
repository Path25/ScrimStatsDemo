import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../supabase/functions/collector-ingest/index.ts", import.meta.url), "utf8");
const shared = readFileSync(new URL("../supabase/functions/_shared/collector.ts", import.meta.url), "utf8");
const opponentMigration = readFileSync(new URL("../supabase/migrations/20260727093039_classify_captured_opponents.sql", import.meta.url), "utf8");
const v5Migration = readFileSync(new URL("../supabase/migrations/20260727144415_game_capture_v5_team_analytics.sql", import.meta.url), "utf8");
const goldenFixture = readFileSync(new URL("../collector/test/fixtures/custom-game-v5.fixture.json", import.meta.url), "utf8");

test("collector normalizes League positions and stores ARAM roles as null", () => {
  assert.match(source, /TOP: 'top'/);
  assert.match(source, /MIDDLE: 'mid'/);
  assert.match(source, /BOTTOM: 'adc'/);
  assert.match(source, /UTILITY: 'support'/);
  assert.match(source, /return roles\[value\.trim\(\)\.toUpperCase\(\)\] \?\? null/);
  assert.match(source, /role: competitiveRole\(player\.role\)/);
});

test("collector completion retries reuse the captured game and replace partial children", () => {
  assert.match(source, /eq\('external_game_id', snapshot\.local_game_id\)/);
  assert.match(source, /from\('scrim_participants'\)\.delete\(\)\.eq\('scrim_game_id', game\.id\)/);
  assert.match(source, /onConflict: 'scrim_game_id'/);
});

test("collector v4 compatibility preserves context and only advertises factual objective evidence", () => {
  assert.match(source, /game_context: sanitizeProviderValue\(snapshot\.game_context \?\? \{\}\)/);
  assert.match(source, /hasObjectiveEvidence\(snapshot\.objectives\)/);
  assert.doesNotMatch(source, /snapshot\.objectives && typeof snapshot\.objectives === 'object' \? 'objectives'/);
});

test("collector v4 is sanitized while v5 stores normalized analytics", () => {
  assert.match(source, /snapshot\.participants\.length < 1/);
  assert.match(source, /sanitizeProviderValue/);
  assert.match(source, /capture_features/);
  assert.doesNotMatch(source, /champion_select_data:\s*snapshot\.champion_select/);
  assert.doesNotMatch(source, /post_game_data:\s*snapshot\.post_game/);
  assert.match(source, /from\('scrim_game_events'\)/);
  assert.match(source, /advanced_stats: sanitizeProviderValue/);
  assert.match(source, /from\('game_drafts'\)/);
});

test("v5 migration scrubs credentials, repairs legacy evidence, and protects normalized events", () => {
  assert.match(v5Migration, /scrim_game_events/);
  assert.match(v5Migration, /enable row level security/);
  assert.match(v5Migration, /user_belongs_to_tenant/);
  assert.match(v5Migration, /revoke all on table public\.scrim_game_events/);
  assert.match(v5Migration, /jsonb_strip_nulls/);
  assert.match(v5Migration, /champion_select_data/);
  assert.match(v5Migration, /post_game_data/);
  assert.match(v5Migration, /when '427' then action/);
  assert.match(v5Migration, /jsonb_typeof\(participant\.items\) = 'array'/);
});

test("sanitized golden fixture contains normalized evidence and no Riot identifiers or credentials", () => {
  const fixture = JSON.parse(goldenFixture);
  assert.equal(fixture.schema_version, 5);
  assert.equal(fixture.capture_quality.classification, "nonstandard_custom");
  assert.deepEqual(fixture.draft.bans.map((ban) => ban.champion), ["Ivern", "Aphelios"]);
  assert.doesNotMatch(goldenFixture, /puuid|riot[_-]?id|jwt|token|password|credential|secret/i);
});

test("Game Capture hides past scheduled blocks while retaining blocks in progress", () => {
  assert.match(source, /eligibleCollectorScrims\(scrims \?\? \[\]\)/);
  assert.match(shared, /scrim\.status === 'in_progress'/);
  assert.match(shared, /now - 90 \* 60_000/);
  assert.match(shared, /relevantTime >= graceCutoff/);
});

test("captured opponents bypass roster reconciliation while unmatched teammates remain reviewable", () => {
  assert.match(source, /isOurTeam \? \(player\.identity_status \?\? 'unresolved'\) : 'ignored'/);
  assert.match(opponentMigration, /participant\.is_our_team = false/);
  assert.match(opponentMigration, /evidence\.provider = 'desktop_collector'/);
});
