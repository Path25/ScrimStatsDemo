import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260726150000_capture_profiles_and_team_analytics.sql");
const collectorV3Migration = read("supabase/migrations/20260726234404_collector_json_analytics_v3.sql");
const analyticsV3Migration = read("supabase/migrations/20260727144415_game_capture_v5_team_analytics.sql");
const analyticsEntitlementMigration = read("supabase/migrations/20260730105701_analytics_server_entitlement_enforcement.sql");
const gridDraftMigration = read("supabase/migrations/20260727152749_normalize_grid_drafts_for_analytics.sql");
const page = read("src/pages/Analytics.tsx");
const workspace = read("src/components/analytics/TeamAnalyticsWorkspace.tsx");
const analyticsPreview = read("src/components/analytics/AnalyticsPlanPreview.tsx");
const app = read("src/App.tsx");
const collector = read("supabase/functions/collector-ingest/index.ts");
const grid = read("supabase/functions/grid-auto-monitoring/index.ts");
const block = read("src/components/scrims/ScrimBlockView.tsx");

test("capture profile and evidence tables are tenant scoped and RLS protected", () => {
  for (const token of ["tenant_capture_settings", "scrim_game_evidence", "scrim_game_reconciliations"]) {
    assert.match(migration, new RegExp(`alter table public\\.${token} enable row level security`));
    assert.match(migration, new RegExp(`public\\.${token}`));
  }
  assert.match(migration, /user_belongs_to_tenant/);
  assert.match(migration, /user_has_tenant_role/);
  assert.match(migration, /revoke all[\s\S]+from public, anon, authenticated/);
});

test("one provider is enforced while manual evidence remains valid", () => {
  assert.match(migration, /desktop_manual/);
  assert.match(migration, /grid_manual/);
  assert.match(migration, /if new\.provider = 'manual'/);
  assert.match(collector, /capture_profile_inactive/);
  assert.match(grid, /tenant_capture_settings\.profile', 'grid_manual'/);
});

test("analytics exposes normalized facts rather than raw provider payloads", () => {
  assert.match(migration, /get_team_analytics_dataset/);
  assert.match(analyticsV3Migration, /contract_version', 'team-analytics-v3'/);
  assert.match(analyticsV3Migration, /scrim_game_events/);
  assert.match(analyticsV3Migration, /advanced_stats/);
  assert.doesNotMatch(workspace, /external_game_data|grid_metadata|raw_game_data/);
  assert.match(workspace, /Improvement comparison/);
  assert.match(workspace, /Not available for this capture profile/);
  assert.match(workspace, /AnalyticsGameDrilldown/);
  assert.match(migration, /reconciliation\.status = 'pending'/);
  assert.match(migration, /reconciliation\.accepted_game_id <> game\.id/);
});

test("analytics is server-enforced for entitled tenant members", () => {
  assert.match(analyticsEntitlementMigration, /create or replace function public\.assert_team_analytics_access/);
  assert.match(analyticsEntitlementMigration, /public\.user_belongs_to_tenant\(p_tenant_id\)/);
  assert.match(analyticsEntitlementMigration, /tenant\.subscription_tier in \('pro'::public\.subscription_tier, 'elite'::public\.subscription_tier\)/);
  assert.match(analyticsEntitlementMigration, /access\.module_key = 'analytics'/);
  assert.match(analyticsEntitlementMigration, /access\.is_enabled/);
  assert.match(analyticsEntitlementMigration, /Analytics access is unavailable for this workspace/);
  assert.match(analyticsEntitlementMigration, /with access_guard as materialized/);
  assert.match(analyticsEntitlementMigration, /cross join access_guard/);
  assert.match(analyticsEntitlementMigration, /security invoker/);
  assert.match(analyticsEntitlementMigration, /revoke all on function public\.get_team_analytics_dataset\(uuid, date, date\) from public, anon/);
  assert.match(analyticsEntitlementMigration, /grant execute on function public\.get_team_analytics_dataset\(uuid, date, date\) to authenticated/);
});

test("collector game mode and map context reach analytics without exposing the raw payload", () => {
  assert.match(collectorV3Migration, /game_context' ->> 'mode'/);
  assert.match(collectorV3Migration, /game_context' ->> 'map_name'/);
  assert.match(collectorV3Migration, /'game_modes'/);
  assert.match(workspace, /All game modes/);
  assert.doesNotMatch(workspace, /external_game_data|game_context/);
});

test("GRID examples use the canonical draft contract and spatial modules stay profile scoped", () => {
  assert.match(gridDraftMigration, /'grid'::public\.draft_mode/);
  assert.match(gridDraftMigration, /'picks', grid\.picks/);
  assert.match(gridDraftMigration, /'completed', jsonb_array_length\(grid\.picks\) = 10 and jsonb_array_length\(grid\.bans\) = 10/);
  assert.match(workspace, /dataset\.capture_profile !== "grid_manual"/);
  assert.doesNotMatch(workspace, /TemporalHeatmap/);
});

test("GRID monitoring writes tenant-safe normalized analytics without raw end-state payloads", () => {
  assert.match(grid, /scrims!inner\(tenant_id\)/);
  assert.match(grid, /\.eq\('scrims\.tenant_id', tenant\.id\)/);
  assert.match(grid, /tenant_id: tenantId/);
  assert.match(grid, /function createDraftForGame/);
  assert.match(grid, /advanced_stats:/);
  assert.match(grid, /payload_version: 'grid-normalized-v2'/);
  assert.match(grid, /position_samples: false/);
  assert.match(grid, /Unable to identify the team side/);
  assert.doesNotMatch(grid, /post_game_data\s*:/);
  assert.doesNotMatch(grid, /position_samples: true/);
});

test("GRID monitoring discovers and idempotently imports every Series State game", () => {
  assert.match(grid, /live-data-feed\/series-state\/graphql/);
  assert.match(grid, /games \{[\s\S]*sequenceNumber[\s\S]*teams \{ id won side \}/);
  assert.match(grid, /fetchSeriesStateGames/);
  assert.match(grid, /synchronizeSeriesGames/);
  assert.match(grid, /grid:\$\{series\.id\}:\$\{gameNumber\}/);
  assert.match(grid, /games\/\$\{gameNumber\}\/summary/);
  assert.match(grid, /games\/\$\{gameNumber\}\/details/);
  assert.match(grid, /provider_record_id: `\$\{seriesId\}:\$\{gameNumber\}`/);
  assert.match(grid, /String\(team\.id\) === String\(tenant\.grid_team_id\)/);
  assert.match(grid, /assignedScrimId && assignedScrimId !== scrim\.id/);
  assert.doesNotMatch(grid, /games\/1\/(?:summary|details)/);
});

test("active page uses the v3 workspace and Scrim Review exposes evidence coverage", () => {
  assert.match(page, /useTeamAnalytics/);
  assert.match(page, /All history/);
  assert.match(page, /useState<Range>\("all"\)/);
  assert.doesNotMatch(page, /analytics\.data\.games\.length\s*\?/);
  assert.match(workspace, /Analytics will appear after completed games/);
  assert.match(workspace, /Empty metrics remain visible/);
  assert.match(workspace, /Game type/);
  assert.match(workspace, /PerformanceIndexPanel/);
  assert.doesNotMatch(workspace, /TemporalHeatmap/);
  assert.doesNotMatch(workspace, /!filtered\.games\.length\s*\?\s*<WorkspaceState/);
  assert.doesNotMatch(page, /useTeamPerformanceSummary|useCompetitiveDraftAnalytics|Collector coverage/);
  assert.match(block, /GameEvidenceDialog/);
});

test("analytics leads with staff questions while retaining evidence and a truthful Pro preview", () => {
  assert.match(workspace, /What changed\?/);
  assert.match(workspace, /Why did it change\?/);
  assert.match(workspace, /Which games support it\?/);
  assert.match(workspace, /Advanced filters/);
  assert.match(workspace, /Data source/);
  assert.match(workspace, /Recorded detail/);
  assert.match(workspace, /AnalyticsGameDrilldown/);
  assert.match(analyticsPreview, /completed, qualifying game evidence/);
  assert.match(analyticsPreview, /No sample metrics are shown/);
  assert.doesNotMatch(analyticsPreview, /mock|example team|predicted/i);
  assert.match(app, /path="\/analytics" element={<PlanGate minimum="pro" feature="team analytics" preview={<AnalyticsPlanPreview/);
});
