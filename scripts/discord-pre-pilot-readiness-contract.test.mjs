import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Discord status health is owner-admin, tenant-scoped, bounded, and receipt-safe", () => {
  const config = read("supabase/functions/discord-config/index.ts");

  assert.match(config, /managerMembership\(userId, tenantId\)/);
  assert.match(config, /discordEntitled\(tenantId\)/);
  assert.match(config, /from\("integration_events"\)[\s\S]*?\.eq\("tenant_id", tenantId\)[\s\S]*?\.eq\("provider", "discord"\)/);
  assert.match(config, /from\("integration_delivery_attempts"\)[\s\S]*?\.eq\("tenant_id", tenantId\)[\s\S]*?\.eq\("event_id", latestEvent\.id\)/);
  assert.match(config, /\.order\("created_at", \{ ascending: false \}\)[\s\S]*?\.limit\(1\)/);
  assert.match(config, /\.order\("attempted_at", \{ ascending: false \}\)[\s\S]*?\.limit\(1\)/);
  assert.match(config, /release_state: "pilot_access"/);
  assert.match(config, /delivery_health:/);
  assert.doesNotMatch(config, /select\("provider_reference|last_error|error_message/);
  assert.doesNotMatch(config, /provider_reference:/);
});

test("Discord pilot UI distinguishes setup and delivery evidence without general-availability claims", () => {
  const page = read("src/pages/Integrations.tsx");
  const panel = read("src/components/integrations/DiscordScheduleIntegration.tsx");
  const hook = read("src/hooks/useDiscordIntegration.ts");

  assert.match(page, /availableLabel="Pilot access"/);
  assert.match(page, /className="text-\[var\(--workspace-awaiting\)\]"/);
  assert.match(hook, /DiscordDeliveryHealthState/);
  for (const state of ["setup_required", "connected", "configured", "queued", "retrying", "failed", "delivered", "disconnected"]) {
    assert.match(panel, new RegExp(`${state}:`));
  }
  assert.match(panel, /Pilot access/);
  assert.match(panel, /available only to named Elite pilot workspaces/);
  assert.match(panel, /provider receipt exists[\s\S]*does not confirm how Discord rendered it/);
  assert.doesNotMatch(panel, /Delivery active|selected prompts? active/);
});

test("Discord manifest and support handoff retain the general-release hold", () => {
  const manifest = read("docs/launch/EDGE_FUNCTION_MANIFEST.md");
  const support = read("docs/operations/DISCORD_DELIVERY_SUPPORT.md");
  const boundary = read("docs/launch/RELEASE_BOUNDARY.md");

  assert.match(manifest, /discord-qa-nonce` v1 \(deployed test-only control/);
  assert.doesNotMatch(manifest, /discord-qa-nonce` remains source-only and undeployed/);
  assert.match(support, /Approval and global-stop authority/);
  assert.match(support, /QA and Release Auditor/);
  assert.match(support, /Do not use `Available` or `Delivery active`/);
  assert.match(support, /Only named, consenting Elite pilot workspaces/);
  assert.match(boundary, /Broad or general Discord availability/);
});
