import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const modules = read("src/types/workspaceModules.ts");
const capabilities = read("src/lib/workspace-capabilities.ts");
const hook = read("src/hooks/useOpponentPreparation.ts");
const breadcrumbs = read("src/hooks/useOpponentPreparationBreadcrumbs.ts");
const panel = read("src/components/scouting/OpponentPreparationPanel.tsx");
const scouting = read("src/pages/ScoutingTeamReport.tsx");
const draft = read("src/pages/Draft.tsx");
const actions = read("src/pages/CoachingActions.tsx");
const scrim = read("src/components/scrims/ScrimBlockView.tsx");

test("the browser gate stays fail-closed and staff-only", () => {
  assert.match(modules, /opponent_preparation: \{ key: "opponent_preparation", state: "planned", enabled: false \}/);
  assert.equal((capabilities.match(/manageOpponentPreparation: true/g) || []).length, 2);
  assert.equal((capabilities.match(/viewOpponentPreparation: true/g) || []).length, 2);
  assert.match(capabilities, /if \(role === "member" \|\| role === "viewer"\) \{\s*return practiceDevelopmentReadOnly/);
  assert.match(hook, /hasOpponentPreparationModuleAccess/);
  assert.match(hook, /tenant\?\.subscriptionTier/);
  assert.match(hook, /tenant\?\.collectorEntitled/);
  assert.match(hook, /activeRole, module\.state, module\.enabled/);
});

test("the primary surface distinguishes provenance, missing evidence, lifecycle and retry states", () => {
  assert.match(panel, /Staff judgement remains distinct from dated tenant-owned evidence/);
  assert.match(panel, /Evidence is insufficient/);
  assert.match(panel, /Review not recorded/);
  assert.match(panel, /Linked fixture is unavailable/);
  assert.match(panel, /Opponent preparation could not be loaded/);
  assert.match(panel, /Linked-record choices could not be loaded/);
  assert.match(panel, /Approved revisions are immutable/);
  assert.doesNotMatch(panel, /leaguepedia|external provider|public url|scrap(?:e|ing)/i);
});

test("opponent preparation is integrated at the accepted primary and breadcrumb surfaces", () => {
  assert.match(scouting, /<OpponentPreparationPanel/);
  assert.match(draft, /useOpponentPreparationBreadcrumbs\("preparation_brief"/);
  assert.match(draft, /useOpponentPreparationBreadcrumbs\("draft_playbook"/);
  assert.match(actions, /useOpponentPreparationBreadcrumbs\("action"/);
  assert.match(scrim, /useOpponentPreparationBreadcrumbs\("scrim"/);
  assert.match(breadcrumbs, /ids\.length <= 100/);
  assert.match(breadcrumbs, /activeRole, module\.state, module\.enabled, ids/);
});

test("new workflow records remain RPC-only in the browser", () => {
  assert.match(hook, /callOpponentPreparationRpc\("get_opponent_preparation_playbook"/);
  assert.doesNotMatch(hook, /\.from\("opponent_preparation_/);
  assert.doesNotMatch(breadcrumbs, /\.from\("opponent_preparation_/);
});
