import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const foundation = read("supabase/migrations/20260725120129_soloq_tracking_v2.sql");
const completion = read("supabase/migrations/20260726131734_complete_soloq_tracker.sql");
const sync = read("supabase/functions/soloq-sync-v2/index.ts");
const legacy = read("supabase/functions/sync-soloq-data/index.ts");
const page = read("src/pages/SoloQTracker.tsx");
const hook = read("src/hooks/useSoloQTracker.ts");
const matchRow = read("src/components/soloq/SoloQMatchRow.tsx");

test("Solo Queue evidence and queue state stay tenant scoped and client read-only", () => {
  assert.match(foundation, /foreign key \(player_id, tenant_id\)/);
  assert.match(completion, /user_belongs_to_tenant\(tenant_id\)/);
  assert.match(completion, /revoke all on public\.soloq_sync_jobs from public, anon, authenticated/);
  assert.match(completion, /grant select on public\.soloq_sync_jobs to authenticated/);
  assert.match(completion, /grant select, insert, update, delete on public\.soloq_sync_jobs to service_role/);
  assert.match(completion, /unique \(run_id, player_id\)/);
  assert.match(foundation, /unique \(player_id, match_id\)/);
});

test("durable scheduling is timezone-aware, idempotent, paced, and lock-safe", () => {
  assert.match(completion, /time '05:15'/);
  assert.match(completion, /now\(\) at time zone workspace\.timezone/);
  assert.match(completion, /on conflict \(tenant_id, local_date\) where run_kind = 'daily' do nothing/);
  assert.match(completion, /for update skip locked/);
  assert.match(completion, /limit least\(greatest\(p_limit, 1\), 2\)/);
  assert.match(completion, /locked_at < now\(\) - interval '10 minutes'/);
  assert.match(completion, /soloq-coordinator.*'\*\/15 \* \* \* \*'/s);
  assert.match(completion, /soloq-worker.*'\* \* \* \* \*'/s);
  assert.match(sync, /if \(index > 0\) await sleep\(2_000\)/);
});

test("Riot sync uses workspace credentials, fetches only uncached details, and handles provider failures", () => {
  assert.match(sync, /get_tenant_riot_api_key/);
  assert.doesNotMatch(sync, /Deno\.env\.get\('RIOT_API_KEY'\)/);
  assert.match(sync, /const uncachedIds = matchIds\.filter/);
  assert.match(sync, /Retry-After/);
  assert.match(sync, /status === 401 \|\| status === 403/);
  assert.match(sync, /status === 429/);
  assert.match(sync, /status === 404/);
  assert.match(sync, /job\.attempts < 3/);
  assert.match(sync, /onConflict: 'player_id,match_id'/);
  assert.match(sync, /match_context: normalizedContext\(match\)/);
});

test("legacy API-key accepting endpoint is retired", () => {
  assert.match(legacy, /status: 410/);
  assert.doesNotMatch(legacy, /apiKey|serviceClient|player_soloq_stats/);
  assert.match(completion, /revoke all on table public\.player_soloq_stats from public, anon, authenticated/);
});

test("tracker exposes resilient queries, themed selection, progress, and expandable factual scoreboards", () => {
  assert.match(page, /SelectTrigger aria-label="Tracked roster player"/);
  assert.match(page, /30-day ranked progression/);
  assert.match(page, /Since last snapshot/);
  assert.match(page, /Workspace sync in progress/);
  assert.match(hook, /\["soloq-snapshots"/);
  assert.match(hook, /\["soloq-matches"/);
  assert.match(hook, /\["soloq-sync-state"/);
  assert.match(hook, /\["soloq-run"/);
  assert.match(matchRow, /CollapsibleTrigger/);
  assert.match(matchRow, /Blue.*side|label="Blue"/s);
  assert.match(matchRow, /label="Red"/);
  assert.match(matchRow, /Damage/);
  assert.match(matchRow, /objectives/);
  assert.doesNotMatch(page, /collector|Math\.random|mock|estimated win/i);
});
