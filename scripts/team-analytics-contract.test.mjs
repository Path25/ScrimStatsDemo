import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260726150000_capture_profiles_and_team_analytics.sql");
const page = read("src/pages/Analytics.tsx");
const workspace = read("src/components/analytics/TeamAnalyticsWorkspace.tsx");
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
  assert.match(migration, /contract_version', 'team-analytics-v2'/);
  assert.doesNotMatch(workspace, /external_game_data|grid_metadata|raw_game_data/);
  assert.match(workspace, /Improvement comparison/);
  assert.match(workspace, /Not available for this capture profile/);
  assert.match(workspace, /AnalyticsGameDrilldown/);
  assert.match(migration, /reconciliation\.status = 'pending'/);
  assert.match(migration, /reconciliation\.accepted_game_id <> game\.id/);
});

test("active page uses the v2 workspace and Scrim Review exposes evidence coverage", () => {
  assert.match(page, /useTeamAnalytics/);
  assert.match(page, /All history/);
  assert.match(page, /useState<Range>\("all"\)/);
  assert.doesNotMatch(page, /analytics\.data\.games\.length\s*\?/);
  assert.match(workspace, /Your analytics workspace is ready/);
  assert.match(workspace, /Empty metrics remain visible/);
  assert.doesNotMatch(workspace, /!filtered\.games\.length\s*\?\s*<WorkspaceState/);
  assert.doesNotMatch(page, /useTeamPerformanceSummary|useCompetitiveDraftAnalytics|Collector coverage/);
  assert.match(block, /GameEvidenceDialog/);
});
