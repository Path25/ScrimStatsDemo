import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const app = read("src/App.tsx");
const shell = read("src/components/layout/DashboardLayout.tsx");
const analytics = read("src/pages/Analytics.tsx");
const analyticsWorkspace = read("src/components/analytics/TeamAnalyticsWorkspace.tsx");
const scouting = read("src/pages/Scouting.tsx");
const report = read("src/pages/ScoutingTeamReport.tsx");
const draft = read("src/pages/Draft.tsx");
const championPicker = read("src/components/preparation/ChampionPicker.tsx");
const championCatalog = read("src/hooks/useChampionCatalog.ts");
const integrations = read("src/pages/Integrations.tsx");
const moduleModel = read("src/types/workspaceModules.ts");
const migration = read(
  "supabase/migrations/20260724170000_competitive_platform_foundation.sql",
);
const lockdown = read(
  "supabase/migrations/20260724173000_legacy_privileged_api_lockdown.sql",
);
const enabledByDefault = read(
  "supabase/migrations/20260724180000_enable_competitive_modules_by_default.sql",
);
const workflows = read(
  "supabase/migrations/20260724190000_competitive_workflow_rpcs.sql",
);
const workflowCompletion = read(
  "supabase/migrations/20260724201000_competitive_workflow_completion.sql",
);
const evidenceLifecycle = read(
  "supabase/migrations/20260725083647_scouting_evidence_lifecycle.sql",
);
const discord = read("supabase/functions/discord-dispatch/index.ts");
const discordInstall = read("supabase/functions/discord-install/index.ts");
const discordReminders = read("supabase/functions/discord-schedule-reminders/index.ts");
const edgeAuth = read("supabase/functions/_shared/collector.ts");
const supabaseConfig = read("supabase/config.toml");

test("the complete product map is routed and honestly labelled", () => {
  for (const route of ["/analytics", "/scouting", "/draft", "/preparation", "/integrations"]) {
    assert.ok(app.includes(`path="${route}"`));
  }
  assert.match(shell, /Team analytics/);
  assert.match(shell, /Scouting/);
  assert.match(shell, /title: "Draft", href: "\/draft"/);
  assert.match(shell, /ModuleStateBadge/);
  assert.match(moduleModel, /analytics: \{ key: "analytics", state: "beta", enabled: true \}/);
  assert.match(moduleModel, /scouting: \{ key: "scouting", state: "beta", enabled: true \}/);
  assert.match(
    moduleModel,
    /draft_preparation: \{ key: "draft_preparation", state: "planned", enabled: true \}/,
  );
  assert.match(moduleModel, /discord: \{ key: "discord", state: "planned", enabled: true \}/);
  assert.match(enabledByDefault, /alter column is_enabled set default true/);
  assert.match(enabledByDefault, /do update set\s+is_enabled = true/);
  assert.match(enabledByDefault, /create trigger seed_tenant_feature_access/);
});

test("active competitive routes do not contain fabricated intelligence", () => {
  for (const source of [analytics, scouting, report, draft]) {
    assert.doesNotMatch(source, /Math\.random|MOCK_|predicted_win_probability|synergy_score/i);
    assert.doesNotMatch(source, /public opponent database|shared opponent intelligence/i);
  }
  assert.match(analyticsWorkspace, /Empty metrics remain visible/i);
  assert.match(draft, /Prompts never place an action or claim a win probability/i);
  assert.match(report, /server-side Solo Queue\s+tracking/);
  assert.match(report, /OpponentSoloQDialog/);
  assert.match(report, /LeaguepediaDraftHistory/);
  assert.doesNotMatch(report, /fetch\(|axios|RIOT_API_KEY/);
});

test("Draft uses the current Data Dragon champion catalogue with a manual fallback", () => {
  assert.match(draft, /ChampionPicker/);
  assert.match(championCatalog, /api\/versions\.json/);
  assert.match(championCatalog, /data\/en_US\/champion\.json/);
  assert.match(championCatalog, /staleTime: 24 \* 60 \* 60 \* 1000/);
  assert.match(championPicker, /Champion catalogue unavailable/);
  assert.doesNotMatch(championCatalog, /RIOT_API_KEY|VITE_/);
});

test("competitive data stays tenant-scoped with explicit staff and published policies", () => {
  assert.match(migration, /create table if not exists public\.tenant_feature_access/);
  assert.match(migration, /foreign key \(opponent_team_id, tenant_id\)/);
  assert.match(migration, /foreign key \(evidence_id, tenant_id\)/);
  assert.match(migration, /user_has_any_tenant_role/);
  assert.match(migration, /members read published or staff read draft briefs/i);
  assert.match(migration, /staff update draft preparation briefs/i);
  assert.doesNotMatch(migration, /create policy[\s\S]{0,120}for all/i);
  assert.match(lockdown, /'create_tenant_with_owner'/);
  assert.match(lockdown, /revoke all on function public\.accept_team_invitation\(text\) from public, anon/);
  assert.match(lockdown, /drop policy if exists "Allow public insert"/);
});

test("analytics are computed by an authorized database function with provenance counts", () => {
  assert.match(migration, /get_team_performance_summary/);
  assert.match(migration, /recorded_games/);
  assert.match(migration, /collector_games/);
  assert.match(migration, /manual_games/);
  assert.match(migration, /excluded_games/);
  assert.match(migration, /security invoker/);
  assert.match(workflows, /get_team_performance_summary_filtered/);
  assert.match(workflows, /p_opponent_id uuid default null/);
  assert.match(workflows, /p_side text default null/);
  assert.match(workflows, /p_format text default null/);
  assert.match(workflows, /public\.user_belongs_to_tenant\(p_tenant_id\)/);
  assert.match(analyticsWorkspace, /All opponents/);
  assert.match(analyticsWorkspace, /Both sides/);
  assert.match(analyticsWorkspace, /All formats/);
});

test("Discord delivery is private, deduplicated, and only queues subscribed events", () => {
  assert.match(migration, /unique \(tenant_id, dedupe_key\)/);
  assert.match(migration, /subscription\.event_type = event_name/);
  assert.match(migration, /feature\.module_key = 'discord'/);
  assert.match(discord, /allowed_mentions:\s*\{\s*parse:\s*\[\]/);
  assert.match(discord, /DISCORD_DISPATCH_SECRET/);
  assert.match(discord, /claim_integration_events/);
  assert.match(workflows, /for update skip locked/);
  assert.match(workflows, /claimed_at < now\(\) - interval '15 minutes'/);
  assert.match(workflows, /to service_role/);
  assert.doesNotMatch(discord, /scouting|preparation_brief|review content/i);
  assert.doesNotMatch(supabaseConfig, /\[functions\.(?:draft-intelligence|game-analytics|champion-pool-analysis)\]/);
  assert.match(supabaseConfig, /\[functions\.create-checkout\]\s+verify_jwt = true/);
  assert.match(supabaseConfig, /\[functions\.stripe-webhook\]\s+verify_jwt = false/);
});

test("planned integrations remain an honest roadmap preview", () => {
  assert.match(integrations, /modules\.discord\.state === "live"/);
  assert.match(integrations, /Roadmap preview/);
  assert.match(integrations, /controlled delivery testing/);
});

test("competitive publication and evidence mutations are transactional staff workflows", () => {
  assert.match(workflows, /create or replace function public\.publish_preparation_brief/);
  assert.match(workflows, /for update/);
  assert.match(workflows, /update public\.draft_scenarios[\s\S]+update public\.preparation_briefs/);
  assert.match(workflows, /create_preparation_brief_revision/);
  assert.match(workflows, /set_preparation_brief_evidence/);
  assert.match(workflows, /create_scouting_tendency/);
  assert.match(workflowCompletion, /create or replace function public\.create_preparation_brief/);
  assert.match(workflowCompletion, /All selected evidence must belong to this opponent and workspace/);
  assert.match(workflows, /Owner or admin access is required/);
});

test("scouting corrections preserve an auditable tenant-scoped evidence chain", () => {
  assert.match(evidenceLifecycle, /lifecycle_state in \('active', 'superseded'\)/);
  assert.match(evidenceLifecycle, /foreign key \(superseded_by_evidence_id, tenant_id\)/);
  assert.match(evidenceLifecycle, /create or replace function public\.supersede_scouting_evidence/);
  assert.match(evidenceLifecycle, /evidence\.tenant_id = p_tenant_id/);
  assert.match(evidenceLifecycle, /for update/);
  assert.match(evidenceLifecycle, /lifecycle_state = 'superseded'/);
  assert.match(
    evidenceLifecycle,
    /revoke all on function public\.supersede_scouting_evidence[\s\S]+from public, anon/,
  );
  assert.match(report, /Superseded evidence/);
  assert.match(report, /Revision note/);
});

test("Discord installation uses expiring state and reminder delivery remains server-owned", () => {
  assert.match(workflows, /create table if not exists public\.discord_oauth_states/);
  assert.match(workflows, /revoke all on table public\.discord_oauth_states from public, anon, authenticated/);
  assert.match(discordInstall, /state_hash: await sha256\(state\)/);
  assert.match(discordInstall, /expires_at/);
  assert.match(discordInstall, /allowed_mentions|discord_installations/);
  assert.match(discordReminders, /DISCORD_DISPATCH_SECRET/);
  assert.match(discordReminders, /dedupe_key/);
  assert.match(edgeAuth, /\['owner', 'admin'\]/);
  assert.doesNotMatch(edgeAuth, /\['owner', 'manager', 'coach'\]/);
});
