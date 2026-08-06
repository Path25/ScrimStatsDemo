import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Discord dispatch retries are target-scoped and provider-deduplicated", () => {
  const dispatch = read("supabase/functions/discord-dispatch/index.ts");
  const delivery = read("supabase/functions/_shared/discord-delivery.ts");

  assert.match(delivery, /export async function discordDeliveryNonce\(eventId: string, channelId: string\)/);
  assert.match(delivery, /crypto\.subtle\.digest\("SHA-256", input\)/);
  assert.match(dispatch, /discordDeliveryNonce\(event\.id, subscription\.channel_id\)/);
  assert.match(dispatch, /\.eq\("delivery_target_id", subscription\.channel_id\)/);
  assert.match(dispatch, /\.eq\("outcome", "delivered"\)/);
  assert.match(dispatch, /if \(deliveredAttempt\) continue/);
  assert.match(dispatch, /delivery_target_id: subscription\.channel_id/g);
  assert.match(dispatch, /nonce,/);
  assert.match(dispatch, /enforce_nonce: true/);
  assert.match(dispatch, /deliveredEvidenceError\.code !== "23505"/);
  assert.match(dispatch, /failed = true/);
});

test("Discord production controls apply inactive and remain operator-only", () => {
  const migration = read("supabase/migrations/20260804143000_discord_production_delivery_controls.sql");

  assert.match(migration, /add column if not exists delivery_target_id text/);
  assert.match(migration, /integration_delivery_attempts_delivered_target_key/);
  assert.match(migration, /where outcome = 'delivered' and delivery_target_id is not null/);
  assert.match(migration, /security\.disable_discord_production_worker_schedule\(\)/);
  assert.match(migration, /security\.configure_discord_production_worker_schedule\(\)/);
  assert.match(migration, /cron\.alter_job\(job_id := v_dispatch_job_id, active := false\)/);
  assert.match(migration, /select security\.disable_discord_production_worker_schedule\(\)/);
  assert.match(migration, /set search_path = ''/g);
  assert.match(migration, /from public, anon, authenticated, service_role/g);
  assert.match(migration, /discord_dispatch_secret/);
  assert.doesNotMatch(migration, /create_secret|update_secret/);
});

test("Discord worker reactivation verifies the actual pg_cron state", () => {
  const migration = read("supabase/migrations/20260806141005_wo040_discord_worker_reactivation.sql");

  assert.match(migration, /create or replace function security\.configure_discord_production_worker_schedule\(\)/);
  assert.match(migration, /security definer\s+set search_path = ''/);
  assert.match(migration, /cron\.alter_job\(job_id := v_reminder_job_id, active := true\)/);
  assert.match(migration, /cron\.alter_job\(job_id := v_dispatch_job_id, active := true\)/);
  assert.match(migration, /where jobid = v_reminder_job_id\s+and jobname = 'scrimstats-discord-reminders'/);
  assert.match(migration, /where jobid = v_dispatch_job_id\s+and jobname = 'scrimstats-discord-dispatch'/);
  assert.match(migration, /v_reminder_active is distinct from true or v_dispatch_active is distinct from true/);
  assert.match(migration, /'dispatch_active', v_dispatch_active/);
  assert.match(migration, /'reminder_active', v_reminder_active/);
  assert.match(migration, /'active', v_dispatch_active and v_reminder_active/);
  assert.match(migration, /from public, anon, authenticated, service_role/);
  assert.match(migration, /where name = 'project_url'/);
  assert.match(migration, /where name = 'publishable_key'/);
  assert.match(migration, /where name = 'discord_dispatch_secret'/);
  assert.doesNotMatch(migration, /create_secret|update_secret|update\s+cron\.job/i);
  assert.doesNotMatch(migration, /disable_discord_production_worker_schedule/);
  assert.doesNotMatch(migration, /raise\s+(?:notice|log|info|debug)/i);
});

test("Discord production candidate remains outside the customer release boundary", () => {
  const manifest = read("docs/launch/EDGE_FUNCTION_MANIFEST.md");
  const boundary = read("docs/launch/RELEASE_BOUNDARY.md");
  const support = read("docs/operations/DISCORD_DELIVERY_SUPPORT.md");

  assert.match(manifest, /## Test-only Discord delivery functions/);
  assert.match(manifest, /candidate `e268298` remain hosted.*Discord workers remain inactive/);
  assert.match(manifest, /re-enabling workers.*retain their recorded separate approval gates/);
  assert.match(boundary, /Interactive Discord delivery until WO-2026-040/);
  assert.match(boundary, /source-only production candidate is not customer availability/);
  assert.match(support, /security\.configure_discord_production_worker_schedule\(\)/);
  assert.match(support, /security\.disable_discord_production_worker_schedule\(\)/);
  assert.match(support, /provider-receipt evidence.*not rendered-message evidence/);
  assert.match(support, /Do not describe it as generally available or production-ready/);
});
