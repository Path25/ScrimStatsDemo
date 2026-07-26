import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260725191053_leaguepedia_draft_history.sql");
const revision = read("supabase/migrations/20260725191928_leaguepedia_brief_revision_links.sql");
const edge = read("supabase/functions/leaguepedia-draft-import/index.ts");
const config = read("supabase/config.toml");

test("Leaguepedia import uses a bounded structured API query", () => {
  assert.match(edge, /action:\s*"cargoquery"/);
  assert.match(edge, /const MAX_GAMES = 30/);
  assert.match(edge, /PicksAndBansS7=PB,MatchSchedule=MS,Tournaments=T/);
  assert.doesNotMatch(edge, /DOMParser|querySelector|innerHTML|cheerio/i);
});

test("imported records retain provider identity and attribution metadata", () => {
  for (const field of [
    "provider_game_id", "source_url", "source_revision", "fetched_at", "patch", "raw_source",
  ]) assert.match(migration, new RegExp(field));
  assert.match(edge, /CC BY-SA 3\.0/);
  assert.match(edge, /providerPageUrl/);
});

test("provider refresh is database-cooldown protected", () => {
  assert.match(migration, /claim_leaguepedia_draft_sync/);
  assert.match(migration, /for update/);
  assert.match(migration, /leaguepedia_sync_locked_until/);
  assert.match(migration, /p_cooldown_minutes/);
  assert.match(edge, /p_cooldown_minutes:\s*30/);
});

test("external draft evidence is tenant consistent and server owned", () => {
  assert.match(migration, /foreign key \(opponent_team_id, tenant_id\)/);
  assert.match(migration, /foreign key \(external_draft_game_id, tenant_id\)/);
  assert.match(migration, /revoke all on table public\.opponent_external_draft_games from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.opponent_external_draft_games to service_role/);
  assert.doesNotMatch(migration, /for (insert|update|delete) to authenticated/i);
});

test("brief linkage is staff checked and publication is immutable", () => {
  assert.match(migration, /set_preparation_brief_external_drafts/);
  assert.match(migration, /Every imported draft must belong to the same tenant and opponent/);
  assert.match(migration, /'external_drafts', external_draft_snapshot/);
  assert.match(revision, /insert into public\.preparation_brief_external_drafts/);
});

test("edge function requires Supabase JWT verification", () => {
  assert.match(config, /\[functions\.leaguepedia-draft-import\][\s\S]*?verify_jwt = true/);
  assert.match(edge, /authenticatedUser\(req\)/);
  assert.match(edge, /managerMembership\(user\.id, team\.tenant_id\)/);
});
