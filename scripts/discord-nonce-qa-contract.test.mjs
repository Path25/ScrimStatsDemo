import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migrationPath = "supabase/migrations/20260806095431_wo040_discord_nonce_qa_controls.sql";

test("Phase D nonce controls are private, one-use, and fresh-event bound", () => {
  const migration = read(migrationPath);

  assert.match(migration, /create table security\.discord_qa_nonce_runs/);
  assert.match(migration, /alter table security\.discord_qa_nonce_runs enable row level security/);
  assert.match(migration, /revoke all on table security\.discord_qa_nonce_runs from public, anon, authenticated, service_role/);
  assert.match(migration, /security\.arm_discord_qa_nonce_probe\(uuid, uuid, text, timestamptz\)/);
  assert.match(migration, /event\.attempt_count = 0/);
  assert.match(migration, /not exists \([\s\S]*?from public\.integration_delivery_attempts attempt/);
  assert.match(migration, /subscription\.channel_id = p_channel_id/);
  assert.match(migration, /tenant\.subscription_tier = 'elite'/);
  assert.match(migration, /feature\.release_state = 'live'/);
  assert.match(migration, /feature\.is_enabled is true/);
  assert.match(migration, /expires_at <= armed_at \+ interval '15 minutes'/);
  assert.doesNotMatch(migration, /bot_token|request_body|provider_reference text/);
});

test("Phase D nonce claims are service-only and mutually exclusive with exact dispatch", () => {
  const migration = read(migrationPath);

  assert.match(migration, /create or replace function public\.claim_discord_qa_nonce_probe\(p_run_id uuid\)/);
  assert.match(migration, /coalesce\(auth\.jwt\(\) ->> 'role', ''\) <> 'service_role'/);
  assert.match(migration, /set state = 'claimed', claimed_at = clock_timestamp\(\)/);
  assert.match(migration, /grant execute on function public\.claim_discord_qa_nonce_probe\(uuid\) to service_role/);
  assert.match(migration, /select 1 from security\.discord_qa_dispatch_runs where state in \('armed', 'claimed'\)/);
  assert.match(migration, /select 1 from security\.discord_qa_nonce_runs where state in \('armed', 'claimed'\)/);
  assert.match(migration, /pg_catalog\.hashtextextended\('discord_qa_dispatch', 0\)/g);
});

test("nonce probe makes at most two identical provider requests and records the first receipt", () => {
  const source = read("supabase/functions/discord-qa-nonce/index.ts");
  const secretCheck = source.indexOf('request.headers.get("x-discord-dispatch-secret")');
  const parse = source.indexOf("parseRequest(await request.text())");
  const postCalls = source.match(/await post\(\)/g) ?? [];

  assert.ok(secretCheck >= 0 && secretCheck < parse, "server secret must be checked before parsing");
  assert.equal(postCalls.length, 2);
  assert.match(source, /const providerBody = JSON\.stringify\(\{/);
  assert.match(source, /nonce,/);
  assert.match(source, /enforce_nonce: true/);
  assert.match(source, /provider_reference: firstReference/);
  assert.match(source, /secondReference === firstReference/);
  assert.match(source, /same_provider_reference: sameProviderReference/);
  assert.doesNotMatch(source, /provider_reference: secondReference/);
});

test("nonce probe requires explicit gateway JWT and dispatch-secret authentication", () => {
  const config = read("supabase/config.toml");
  const manifest = read("docs/launch/EDGE_FUNCTION_MANIFEST.md");
  const source = read("supabase/functions/discord-qa-nonce/index.ts");

  assert.match(config, /\[functions\.discord-qa-nonce\]\s+verify_jwt = true/);
  assert.match(manifest, /`discord-qa-nonce` \(source-only; explicit gateway JWT plus dispatch-secret authentication\)/);
  assert.match(source, /request\.headers\.get\("x-discord-dispatch-secret"\)/);
});

test("nonce completion stores bounded equality evidence without exposing provider identifiers", () => {
  const migration = read(migrationPath);
  const source = read("supabase/functions/discord-qa-nonce/index.ts");
  const resultLog = source.match(/console\.info\("Discord nonce QA result", \{(?<payload>[\s\S]*?)\n\s*\}\);/);
  const resultResponse = source.match(/return Response\.json\(\s*\{\s*outcome,(?<payload>[\s\S]*?)\n\s*\},\s*\n\s*\{ status: completionError/);

  assert.match(migration, /same_provider_reference boolean/);
  assert.match(migration, /delivery_evidence_recorded boolean/);
  assert.match(migration, /outcome in \('confirmed', 'provider_failed', 'mismatch', 'evidence_failed'\)/);
  assert.match(migration, /attempt\.provider_reference is not null/);
  assert.ok(resultLog?.groups?.payload);
  assert.doesNotMatch(resultLog.groups.payload, /tenant_id|event_id|channel_id|(?<!same_)provider_reference/);
  assert.ok(resultResponse?.groups?.payload);
  assert.doesNotMatch(resultResponse.groups.payload, /firstReference|secondReference|tenant_id|event_id|channel_id|(?<!same_)provider_reference/);
});

test("production dispatcher and nonce probe share exact message and nonce construction", () => {
  const shared = read("supabase/functions/_shared/discord-delivery.ts");
  const dispatch = read("supabase/functions/discord-dispatch/index.ts");
  const probe = read("supabase/functions/discord-qa-nonce/index.ts");

  assert.match(shared, /export function discordEventMessage/);
  assert.match(shared, /export async function discordDeliveryNonce/);
  assert.match(shared, /allowed_mentions: \{ parse: \[\] as string\[\] \}/);
  assert.match(shared, /flags: DISCORD_SUPPRESS_EMBEDS/);
  assert.match(dispatch, /discordEventMessage\(event, appUrl\)/);
  assert.match(dispatch, /discordDeliveryNonce\(event\.id, subscription\.channel_id\)/);
  assert.match(probe, /discordEventMessage\(typedEvent, appUrl\)/);
  assert.match(probe, /discordDeliveryNonce\(typedEvent\.id, claim\.channel_id\)/);
  assert.match(probe, /\.from\("discord_channel_subscriptions"\)/);
  assert.match(probe, /\.eq\("discord_installations\.status", "active"\)/);
  assert.match(probe, /\.from\("integration_delivery_attempts"\)[\s\S]*?\.eq\("event_id", claim\.event_id\)/);
  assert.match(probe, /\.eq\("attempt_count", 0\)/);
});

test("Phase D operational plan keeps hosted and provider actions separately gated", () => {
  const runbook = read("docs/operations/WO-2026-040_PHASE_D_QA.md");

  assert.match(runbook, /source-only candidate/);
  assert.match(runbook, /rollback-only transaction/);
  assert.match(runbook, /never commit an active cron state/i);
  assert.match(runbook, /maximum of two provider POSTs/);
  assert.match(runbook, /one or two visible private QA messages/);
  assert.match(runbook, /restore the exact original module row/i);
  assert.match(runbook, /Workers remain inactive/);
  assert.match(runbook, /separate Theo approval/);
});
