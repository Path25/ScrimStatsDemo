import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("Discord paths enforce released Elite access below the browser", () => {
  for (const path of [
    "supabase/functions/discord-install/index.ts",
    "supabase/functions/discord-channels/index.ts",
    "supabase/functions/discord-config/index.ts",
    "supabase/functions/discord-schedule-reminders/index.ts",
    "supabase/functions/discord-dispatch/index.ts",
  ]) {
    const source = read(path);
    assert.match(source, /discordEntitled/);
  }
  const shared = read("supabase/functions/_shared/collector.ts");
  assert.match(shared, /export async function discordEntitled/);
  assert.match(shared, /subscription_tier === 'elite'/);
  assert.match(shared, /module_key', 'discord'/);
  assert.match(shared, /release_state === 'live'/);
  assert.match(shared, /is_enabled === true/);
  const config = read("supabase/functions/discord-config/index.ts");
  assert.match(config, /schedule_created.*schedule_changed.*schedule_cancelled.*practice_reminder/);
  assert.doesNotMatch(config, /availability_reminder|collector_reminder/);
  assert.match(config, /events\.length === 0/);
  assert.match(config, /status: "revoked"/);
  assert.doesNotMatch(config, /status: "disconnected"|updated_at: new Date\(\)\.toISOString\(\) \}\)\.eq\("tenant_id"/);

  const install = read("supabase/functions/discord-install/index.ts");
  assert.match(install, /managerMembership\(oauthState\.user_id, oauthState\.tenant_id\)/);
  assert.match(install, /const approvedAppOrigins = new Set/);
  assert.match(install, /https:\/\/staging\.scrimstats\.gg/);
  assert.match(install, /return_url: returnUrl/);
  assert.match(install, /select\("id, tenant_id, user_id, return_url, expires_at, consumed_at"\)/);
  assert.match(install, /new URL\(`\/integrations\?discord=/);
  const redirectMigration = read("supabase/migrations/20260730181840_discord_oauth_return_url.sql");
  assert.match(redirectMigration, /add column if not exists return_url text not null/);
  assert.match(redirectMigration, /discord_oauth_states_return_url_check/);
  assert.match(redirectMigration, /https:\/\/staging\.scrimstats\.gg/);
});

test("Discord reminder scheduling stays within the approved Elite promise", () => {
  const scheduler = read("supabase/functions/discord-schedule-reminders/index.ts");
  assert.match(scheduler, /\.eq\("event_type", "practice_reminder"\)/);
  assert.doesNotMatch(scheduler, /availability_reminder|collector_reminder/);
  assert.match(scheduler, /tenants\.subscription_tier", "elite"/);
  assert.match(scheduler, /provider: "discord"/);
});

test("Discord dispatch stays within the selected Elite schedule scope", () => {
  const dispatch = read("supabase/functions/discord-dispatch/index.ts");
  const delivery = read("supabase/functions/_shared/discord-delivery.ts");
  const config = read("supabase/config.toml");
  assert.match(delivery, /schedule_created[\s\S]*schedule_changed[\s\S]*schedule_cancelled[\s\S]*practice_reminder/);
  assert.doesNotMatch(delivery, /availability_reminder|collector_reminder/);
  assert.match(dispatch, /discordEntitled\(event\.tenant_id\)/);
  assert.match(dispatch, /claim_integration_events_for_provider/);
  assert.match(config, /\[functions\.discord-install\]\s+verify_jwt = false/);
  assert.match(config, /\[functions\.discord-config\]\s+verify_jwt = true/);
  assert.match(config, /\[functions\.discord-schedule-reminders\]\s+verify_jwt = false/);
  assert.match(config, /\[functions\.discord-dispatch\]\s+verify_jwt = false/);
});

test("Discord claims only its provider-scoped outbox events", () => {
  const migration = read("supabase/migrations/20260729162640_discord_provider_scoped_outbox.sql");
  assert.match(migration, /add column if not exists provider text not null default 'discord'/);
  assert.match(migration, /create or replace function public\.claim_integration_events_for_provider/);
  assert.match(migration, /event\.provider = p_provider/);
  assert.match(migration, /for update skip locked/);
  assert.match(migration, /grant execute on function public\.claim_integration_events_for_provider\(text, integer\)\s+to service_role/);
});

test("Discord owner controls use server-enforced Functions and bounded prompt types", () => {
  const hook = read("src/hooks/useDiscordIntegration.ts");
  const panel = read("src/components/integrations/DiscordScheduleIntegration.tsx");
  const manifest = read("docs/launch/EDGE_FUNCTION_MANIFEST.md");
  assert.match(hook, /functions\.invoke<DiscordStatus>\("discord-config"/);
  assert.match(hook, /functions\.invoke<\{ authorize_url\?: string \}>\("discord-install"/);
  assert.match(hook, /"discord-channels"/);
  assert.match(hook, /action: "disconnect"/);
  assert.match(panel, /Connect Discord/);
  assert.match(panel, /Save schedule prompts/);
  assert.match(panel, /deliveryConfigured = subscriptions\.length > 0/);
  assert.match(panel, /Delivery active/);
  assert.match(panel, /Server connected — delivery not configured/);
  assert.doesNotMatch(panel, /installation \? "Connected" : "Setup required"/);
  assert.match(panel, /never relays scouting, review, player, or credential content/);
  assert.match(panel, /discordEventTypes/);
  assert.match(manifest, /## Test-only Discord delivery functions/);
  assert.doesNotMatch(manifest, /Roadmap-preview Discord delivery/);
  const support = read("docs/operations/DISCORD_DELIVERY_SUPPORT.md");
  assert.match(support, /Server connected .* delivery not configured/);
  assert.match(support, /Delivery active/);
});

test("Discord worker scheduling remains Vault-backed and operator-only", () => {
  const migration = read("supabase/migrations/20260730173144_discord_test_worker_schedule.sql");
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = ''/);
  assert.match(migration, /discord_dispatch_secret/);
  assert.match(migration, /scrimstats-discord-reminders/);
  assert.match(migration, /scrimstats-discord-dispatch/);
  assert.match(migration, /revoke all on function public\.configure_discord_test_worker_schedule\(\) from public, anon, authenticated/);
  assert.doesNotMatch(migration, /create_secret|update_secret/);
});
