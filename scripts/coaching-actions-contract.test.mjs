import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const page = read("src/pages/CoachingActions.tsx");
const hook = read("src/hooks/useCoachingActions.ts");
const dialog = read("src/components/actions/CoachingActionDialog.tsx");
const shell = read("src/components/layout/DashboardLayout.tsx");
const migration = read("supabase/migrations/20260727132348_coaching_actions_workflow_repair.sql");
const cycles = read("supabase/migrations/20260727135934_coaching_action_cycles.sql");
const overview = read("src/pages/Overview.tsx");
const review = read("src/components/scrims/ScrimBlockView.tsx");

test("coaching actions use tenant-authorized transactional RPCs", () => {
  assert.match(migration, /create or replace function public\.transition_coaching_action/);
  assert.match(migration, /security definer/g);
  assert.match(migration, /revoke insert, update, delete on public\.coaching_actions from authenticated/);
  assert.match(cycles, /create or replace function public\.create_coaching_action_cycle/);
  assert.match(cycles, /revoke all on function public\.create_coaching_action_cycle\(jsonb\) from public, anon/);
  assert.match(cycles, /grant execute on function public\.review_coaching_action[\s\S]+to authenticated/);
  assert.match(hook, /supabase\.rpc\("create_coaching_action_cycle"/);
  assert.match(hook, /supabase\.rpc\("transition_coaching_action"/);
});

test("action cycles keep scope, evidence, checkpoints, check-ins, and factual reviews together", () => {
  assert.match(cycles, /scope_type text not null default 'player'/);
  assert.match(cycles, /participant_player_ids uuid\[\]/);
  assert.match(cycles, /checkpoint_scrim_ids uuid\[\]/);
  assert.match(cycles, /create or replace function public\.check_in_coaching_action/);
  assert.match(cycles, /create or replace function public\.review_coaching_action/);
  assert.match(cycles, /Every participant must be an active player in this workspace/);
  assert.match(cycles, /Every checkpoint must belong to this workspace/);
  assert.match(page, /Practice check-in/);
  assert.match(page, /Coach-observed outcome/);
  assert.match(page, /Practice checkpoints/);
  assert.match(page, /Recurring patterns/);
  assert.match(page, /Activity history/);
  assert.match(dialog, /Save this definition as a reusable team template/);
  assert.doesNotMatch(dialog, /Evidence context|Game second|sourceTimestamp|sourceNote/);
  assert.match(dialog, /useOptimizedScrimsData/);
  assert.match(overview, /ActionCycleRail/);
  assert.match(review, /ActionCycleRail/);
  assert.doesNotMatch(page + dialog, /Ã¢|Ã‚|Â·|â€¦/);
});

test("workspace navigation is clean and groups preparation together", () => {
  assert.match(shell, /label: "Pre-game prep"/);
  assert.match(shell, /title: "Scouting"/);
  assert.match(shell, /title: "Draft"/);
  assert.doesNotMatch(shell, /ModuleStateBadge/);
});
