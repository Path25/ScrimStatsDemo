import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const migrationPath = "supabase/migrations/20260805170753_wo040_discord_qa_dispatch_controls.sql";

test("Phase C dispatch control is private, operator-armed, and exact-event bound", () => {
  const migration = read(migrationPath);

  assert.match(migration, /create table security\.discord_qa_dispatch_runs/);
  assert.match(migration, /alter table security\.discord_qa_dispatch_runs enable row level security/);
  assert.match(migration, /revoke all on schema security from public, anon, authenticated, service_role/);
  assert.match(migration, /security\.arm_discord_qa_dispatch\(uuid, uuid, timestamptz\)/);
  assert.match(migration, /security\.disable_discord_qa_dispatch\(uuid\)/);
  assert.match(migration, /from public, anon, authenticated, service_role/g);
  assert.match(migration, /where event\.id = p_event_id\s+and event\.tenant_id = p_tenant_id\s+and event\.provider = 'discord'/);
  assert.match(migration, /expires_at <= armed_at \+ interval '15 minutes'/);
  assert.match(migration, /discord_qa_dispatch_runs_one_active_case_idx/);
  assert.match(migration, /discord_qa_dispatch_runs_event_fk_idx/);
  assert.doesNotMatch(migration, /bot_token|channel_id|provider_reference|request_body/);
});

test("Phase C claim RPC is one-use, service-only, and cannot broaden beyond its run", () => {
  const migration = read(migrationPath);

  assert.match(migration, /create or replace function public\.claim_discord_qa_dispatch_event\(p_run_id uuid\)/);
  assert.match(migration, /coalesce\(auth\.jwt\(\) ->> 'role', ''\) <> 'service_role'/);
  assert.match(migration, /where event\.id = v_run\.event_id\s+and event\.tenant_id = v_run\.tenant_id\s+and event\.provider = 'discord'/);
  assert.match(migration, /set state = 'claimed', claimed_at = clock_timestamp\(\)/);
  assert.match(migration, /where id = v_run\.id and state = 'armed'/);
  assert.match(migration, /grant execute on function public\.claim_discord_qa_dispatch_event\(uuid\) to service_role/);
  assert.match(migration, /complete_discord_qa_dispatch_run/);
  assert.doesNotMatch(migration, /claim_integration_events_for_provider/);
});

test("dispatcher selects exact-event QA claim without global fallback", () => {
  const dispatch = read("supabase/functions/discord-dispatch/index.ts");

  assert.match(dispatch, /Object\.keys\(record\)\.some\(\(key\) => key !== "qa_run_id"\)/);
  assert.match(dispatch, /typeof record\.qa_run_id !== "string" \|\| !UUID_PATTERN\.test\(record\.qa_run_id\)/);
  assert.match(dispatch, /qaRunId\s+\? await admin\.rpc\("claim_discord_qa_dispatch_event", \{ p_run_id: qaRunId \}\)\s+: await admin\.rpc\("claim_integration_events_for_provider"/s);
  assert.match(dispatch, /if \(qaRunId && events\?\.length !== 1\)/);
  assert.match(dispatch, /QA dispatch run is unavailable/);
  assert.match(dispatch, /complete_discord_qa_dispatch_run/);
  assert.match(dispatch, /qa_evidence: qaEvidence/);
});

test("normal dispatcher production claim remains unchanged when no QA run is supplied", () => {
  const dispatch = read("supabase/functions/discord-dispatch/index.ts");

  assert.match(dispatch, /claim_integration_events_for_provider/);
  assert.match(dispatch, /p_provider: "discord"/);
  assert.match(dispatch, /p_limit: 25/);
  assert.match(dispatch, /if \(!rawBody\.trim\(\)\) return \{ qaRunId: null/);
  assert.match(dispatch, /if \(!\("qa_run_id" in record\)\) return \{ qaRunId: null/);
});

test("delivery-evidence failure logs only a redacted correlation value", () => {
  const dispatch = read("supabase/functions/discord-dispatch/index.ts");
  const failureLog = dispatch.match(
    /console\.error\("Unable to record Discord delivery evidence", \{(?<payload>[\s\S]*?)\n\s*\}\);/,
  );

  assert.ok(failureLog?.groups?.payload, "delivery-evidence failure log payload must remain inspectable");
  assert.match(failureLog.groups.payload, /delivery_correlation: nonce/);
  assert.match(failureLog.groups.payload, /code: deliveredEvidenceError\.code/);
  assert.doesNotMatch(failureLog.groups.payload, /event_id|tenant_id|channel_id/);
});
