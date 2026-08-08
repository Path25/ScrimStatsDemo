import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Discord pilot cutover package preserves staged approval and evidence boundaries", () => {
  const checklist = read("docs/operations/DISCORD_PILOT_CUTOVER_CHECKLIST.md");

  assert.match(checklist, /Phase 1 source-only planning package/);
  assert.match(checklist, /named, consenting Elite workspaces only/);
  assert.match(checklist, /not general availability/);
  for (const stage of ["Stage 1 - source candidate", "Stage 2 - inert production deployment", "Stage 3 - provider\/configuration reconciliation", "Stage 4 - one-event non-customer production smoke", "Stage 5 - named Elite pilot admission"]) {
    assert.match(checklist, new RegExp(stage));
  }
  assert.match(checklist, /Each stage requires its own recorded approval/);
  assert.match(checklist, /security\.configure_discord_production_worker_schedule\(\)/);
  assert.match(checklist, /security\.disable_discord_production_worker_schedule\(\)/);
  assert.match(checklist, /Retain all resulting events, attempts, receipts and cron history/);
  assert.match(checklist, /A provider receipt proves the API delivery path only/);
});

test("Discord pilot cutover package names every reviewed authentication and configuration boundary", () => {
  const checklist = read("docs/operations/DISCORD_PILOT_CUTOVER_CHECKLIST.md");

  for (const fn of ["discord-install", "discord-channels", "discord-config", "discord-roles", "discord-interactions", "discord-schedule-reminders", "discord-dispatch", "discord-qa-nonce"]) {
    assert.match(checklist, new RegExp(`\\b${fn}\\b`));
  }
  for (const name of ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET", "DISCORD_BOT_TOKEN", "DISCORD_PUBLIC_KEY", "DISCORD_DISPATCH_SECRET", "SCRIMSTATS_APP_URL", "project_url", "publishable_key", "discord_dispatch_secret"]) {
    assert.match(checklist, new RegExp(`\\b${name}\\b`));
  }
  assert.match(checklist, /raw-body Ed25519 verification occurs before parsing or lookup/);
  assert.match(checklist, /OAuth callback[\s\S]*hashed, expiring, single-use/);
  assert.doesNotMatch(checklist, /DISCORD_(?:CLIENT_SECRET|BOT_TOKEN|PUBLIC_KEY|DISPATCH_SECRET)\s*=/);
});

test("Stage 1 applies the approved pilot copy while retaining the general-release hold", () => {
  const checklist = read("docs/operations/DISCORD_PILOT_CUTOVER_CHECKLIST.md");
  const page = read("src/pages/Integrations.tsx");
  const panel = read("src/components/integrations/DiscordScheduleIntegration.tsx");
  const config = read("supabase/functions/discord-config/index.ts");
  const hook = read("src/hooks/useDiscordIntegration.ts");
  const boundary = read("docs/launch/RELEASE_BOUNDARY.md");
  const support = read("docs/operations/DISCORD_DELIVERY_SUPPORT.md");
  const ledger = read("docs/operations/MESSAGE_LEDGER.md");

  assert.match(checklist, /Exact proposed source and copy diff/);
  assert.match(checklist, /approved this wording for the Stage 1 local source candidate/);
  assert.match(checklist, /Pilot access\. Discord delivery is available only to named Elite pilot workspaces\. This is not general availability\./);
  assert.match(page, /availableLabel="Pilot access"/);
  assert.match(page, /availableLabel="Pilot access"[\s\S]*className="text-\[var\(--workspace-awaiting\)\]"/);
  assert.match(panel, /Configured - pilot access/);
  assert.match(panel, /Pilot access\. Discord delivery is available only/);
  assert.match(panel, /The command remains unavailable for this schedule-delivery pilot unless separately approved/);
  assert.match(config, /release_state: "pilot_access"/);
  assert.match(hook, /release_state\?: "pilot_access"/);
  assert.match(boundary, /Approval-gated Discord schedule-delivery pilot access for individually named, consenting Elite workspaces/);
  assert.match(boundary, /Broad or general Discord availability/);
  assert.match(boundary, /Discord `\/scrim` command registration or pilot use unless separately approved/);
  assert.match(support, /Do not describe Discord as generally available, broadly available to Elite, or production-ready/);
  assert.match(ledger, /Your workspace has approved Discord pilot access for schedule prompts/);
  assert.match(ledger, /does not authorise a send, pilot admission, workspace enablement, or public claim/);
});
