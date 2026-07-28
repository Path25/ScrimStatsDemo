import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/20260728103000_premium_copy_and_funnel_instrumentation.sql", import.meta.url), "utf8");

test("funnel milestones are authoritative, idempotent, and privacy bounded", () => {
  for (const event of ["account_registered", "workspace_created", "first_scheduled_block", "first_recorded_game", "workspace_activated", "first_paid_upgrade"]) {
    assert.match(migration, new RegExp(`'${event}'`));
  }
  assert.match(migration, /after insert on auth\.users/);
  assert.match(migration, /after insert on public\.tenant_users/);
  assert.match(migration, /after insert on public\.scrims/);
  assert.match(migration, /after insert on public\.scrim_games/);
  assert.match(migration, /after update of subscription_tier, subscription_status on public\.tenants/);
  assert.match(migration, /new\.subscription_status = 'active'/);
  assert.match(migration, /on conflict do nothing/g);
  assert.match(migration, /revoke all on table public\.workspace_funnel_events from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.get_founder_funnel_scorecard\(timestamptz\) to service_role/);
  assert.match(migration, /Contains no email, IP, device, player, or gameplay payload/);
  assert.doesNotMatch(migration, /email\s+(text|varchar)|ip_address|user_agent|payload jsonb/i);
});
