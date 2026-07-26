import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [app, page, blockView, blockHook, gamesHook, migration] = await Promise.all([
  readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/pages/Scrims.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/scrims/ScrimBlockView.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/hooks/useScrimBlock.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/hooks/useScrimGames.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20260726112047_scrim_review_completion.sql", import.meta.url), "utf8"),
]);

test("detail routes load current block metadata by tenant and id", () => {
  assert.doesNotMatch(app, /useSearchParams|searchParams\.get/);
  assert.match(app, /scrimId=\{scrimId \|\| ""\}/);
  assert.match(blockHook, /from\("scrims"\)[\s\S]*?eq\("tenant_id", tenant\.id\)[\s\S]*?eq\("id", scrimId\)/);
  assert.doesNotMatch(page, /new URLSearchParams|\?opponent=/);
});

test("list is a featured queue and filterable paginated history", () => {
  assert.match(page, /Next practice block/);
  assert.match(page, /Upcoming queue/);
  assert.match(page, /Scrim history/);
  assert.match(page, /Search opponent/);
  assert.match(page, /Filter by review progress/);
  assert.match(page, /Previous/);
  assert.match(page, /Next/);
  assert.doesNotMatch(page, /SourceBadge|DesktopAppStatus/);
});

test("review workspace removes collector diagnostics and preserves per-game provenance", () => {
  assert.doesNotMatch(blockView, /DesktopAppStatus|collector panel/i);
  assert.match(blockView, /<ReviewChecklist checks=\{checks\}/);
  assert.match(blockView, /<GameEvidenceDialog compact gameId=\{selectedGame\.id\}/);
  assert.match(blockView, /<GameOverviewTab game=\{selectedGame\} participants=\{participants\}/);
});

test("all active review mutations are staff gated", () => {
  assert.match(blockView, /const \{ canManageTeam \} = useRole\(\)/);
  assert.match(blockView, /canEdit=\{canManageTeam\}/);
  assert.match(blockView, /\{canManageTeam && \(/);
  assert.match(migration, /array\['owner','admin'\]::public\.tenant_role\[\]/);
  assert.match(migration, /using \(public\.user_has_tenant_role/);
  assert.match(migration, /with check \(public\.user_has_tenant_role/);
});

test("transactional RPCs own review saving, completion, and reopening", () => {
  assert.match(gamesHook, /rpc\('save_scrim_game_review'/);
  assert.match(blockHook, /rpc\("finalize_scrim_block_review"/);
  assert.match(blockHook, /rpc\("reopen_scrim_block_review"/);
  assert.match(migration, /Complete the required review fields/);
  assert.match(migration, /Explain why the final score differs/);
  assert.match(migration, /grant execute on function public\.save_scrim_game_review/);
});
