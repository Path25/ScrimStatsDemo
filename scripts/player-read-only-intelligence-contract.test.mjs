import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260730211300_player_read_only_intelligence_access.sql");
const consolidationMigration = read("supabase/migrations/20260730211922_consolidate_player_intelligence_read_policies.sql");
const scouting = read("src/pages/Scouting.tsx");
const report = read("src/pages/ScoutingTeamReport.tsx");
const leaguepedia = read("src/components/scouting/LeaguepediaDraftHistory.tsx");
const leaguepediaHook = read("src/hooks/useLeaguepediaDraftHistory.ts");
const capabilities = read("src/lib/workspace-capabilities.ts");
const analytics = read("supabase/migrations/20260730105701_analytics_server_entitlement_enforcement.sql");

test("members and viewers receive tenant-scoped read-only intelligence access", () => {
  for (const policy of [
    "scouting_opponent_teams_member_read",
    "scouting_opponent_players_member_read",
    "scouting_evidence_member_read",
    "scouting_tendencies_member_read",
    "scouting_tendency_evidence_member_read",
    "draft_brief_evidence_member_read",
    "draft_playbooks_select",
    "draft_restrictions_select",
    "draft_scenarios_select",
    "draft_actions_select",
    "draft_preparation_briefs_member_read",
  ]) assert.match(migration, new RegExp(`create policy ${policy}`));
  assert.doesNotMatch(migration, /for (insert|update|delete) to authenticated/i);
  assert.match(migration, /user_belongs_to_tenant\(tenant_id\)/);
  for (const policy of [
    "Users can view opponent teams in their tenant",
    "Users can view opponent players from their tenant teams",
    "staff read scouting evidence",
    "staff read scouting tendencies",
    "staff read tendency evidence",
    "members read published brief evidence",
  ]) assert.match(consolidationMigration, new RegExp(`drop policy if exists "${policy}"`));
});

test("Scouting loads read-only views and keeps every mutation control staff-only", () => {
  assert.match(capabilities, /viewIntelligence: true/);
  assert.match(scouting, /const \{ canEditIntelligence, canViewIntelligence \} = useRole\(\)/);
  assert.match(report, /useScoutingWorkspace\(opponentId, modules\.scouting\.enabled && canViewIntelligence\)/);
  assert.match(scouting, /\{canEditIntelligence && <>/);
  assert.match(report, /canEditIntelligence \? \(/);
  assert.match(report, /\{canEditIntelligence && <Button[\s\S]*setPlayerActive\(\{ id: player\.id, isActive: true \}\)/);
  assert.match(report, /\{canEditIntelligence && \(\s*<Button[\s\S]*onClick=\{\(\) => reviseEvidence\(item\)\}/);
  assert.match(report, /<LeaguepediaDraftHistory[\s\S]*canEdit=\{canEditIntelligence\}/);
  assert.match(leaguepedia, /\{canEdit && \([\s\S]*Exact Leaguepedia team name[\s\S]*Import history/);
  assert.match(leaguepedia, /\{canEdit && \([\s\S]*Attach selected games to a draft brief[\s\S]*Save evidence selection/);
  assert.match(leaguepedia, /\{canEdit && \(\s*<Checkbox/);
  assert.match(leaguepediaHook, /useLeaguepediaDraftHistory\(opponentTeamId\?: string, enabled = true, canMutate = true\)/);
  assert.match(leaguepediaHook, /if \(!canMutate\) throw new Error\("Your workspace role is read-only\."\)/);
  assert.doesNotMatch(scouting, /\) : !canEditIntelligence \? \(/);
  assert.doesNotMatch(report, /if \(!canEditIntelligence\)/);
  assert.match(report, /same workspace intelligence in read-only form/);
});

test("analytics retains its independent server-side entitlement guard", () => {
  assert.match(analytics, /assert_team_analytics_access/);
  assert.match(analytics, /security invoker/);
  assert.match(analytics, /user_belongs_to_tenant\(p_tenant_id\)/);
});
