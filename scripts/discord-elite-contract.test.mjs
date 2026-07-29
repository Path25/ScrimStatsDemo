import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("Discord browser paths enforce Elite below the browser", () => {
  for (const path of ["supabase/functions/discord-install/index.ts", "supabase/functions/discord-channels/index.ts", "supabase/functions/discord-config/index.ts"]) {
    const source = read(path);
    assert.match(source, /subscription_tier/);
    assert.match(source, /"elite"/);
    assert.match(source, /managerMembership/);
  }
  const config = read("supabase/functions/discord-config/index.ts");
  assert.match(config, /schedule_created.*schedule_changed.*schedule_cancelled.*practice_reminder/);
  assert.doesNotMatch(config, /availability_reminder|collector_reminder/);
  assert.match(config, /events\.length === 0/);
  assert.match(config, /status: "revoked"/);
  assert.doesNotMatch(config, /status: "disconnected"|updated_at: new Date\(\)\.toISOString\(\) \}\)\.eq\("tenant_id"/);

  const install = read("supabase/functions/discord-install/index.ts");
  assert.match(install, /managerMembership\(oauthState\.user_id, oauthState\.tenant_id\)/);
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
  const config = read("supabase/config.toml");
  assert.match(dispatch, /schedule_created.*schedule_changed.*schedule_cancelled.*practice_reminder/);
  assert.doesNotMatch(dispatch, /availability_reminder|collector_reminder/);
  assert.match(dispatch, /tenant\?\.subscription_tier !== "elite"/);
  assert.match(dispatch, /claim_integration_events_for_provider/);
  assert.match(config, /\[functions\.discord-install\]\s+verify_jwt = true/);
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
