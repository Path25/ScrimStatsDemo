import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const app = read("src/App.tsx");
const shell = read("src/components/layout/DashboardLayout.tsx");
const page = read("src/pages/Draft.tsx");
const hook = read("src/hooks/useDraftWorkspace.ts");
const migration = read("supabase/migrations/20260726153000_draft_workspace_completion.sql");
const revisionMigration = read("supabase/migrations/20260726160000_draft_revisions_and_editing.sql");
const cloneMigration = read("supabase/migrations/20260726161000_draft_playbook_clone_branches.sql");
const splitMigration = read("supabase/migrations/20260726163000_draft_evidence_split_metadata.sql");
const multiWorkspaceRlsRepairMigration = read("supabase/migrations/20260731124310_repair_multi_workspace_draft_rls.sql");
const board = read("src/components/draft/DraftSequenceBoard.tsx");
const allMigrations = `${migration}\n${revisionMigration}\n${cloneMigration}\n${splitMigration}`;

test("Draft owns the active route and legacy preparation links redirect safely", () => {
  assert.match(app, /path="\/draft" element={<PlanGate minimum="pro"[^>]*><Draft/);
  assert.match(app, /path="\/preparation" element={<LegacyPreparationRedirect/);
  assert.match(app, /legacy\.get\("brief"\)/);
  assert.match(shell, /title: "Draft", href: "\/draft"/);
  assert.doesNotMatch(shell, /Draft preparation/);
});

test("the complete workspace remains visible without fabricated plans", () => {
  for (const label of ["Match plans", "Playbook", "Evidence", "Published"]) assert.match(page, new RegExp(label));
  assert.match(page, /All drafting surfaces are active/);
  assert.match(page, /Prompts never place an action or claim a win probability/);
  assert.doesNotMatch(page, /Math\.random|mock plan|sample recommendation/i);
});

test("the RPC client preserves its Supabase receiver and empty workspaces stay usable", () => {
  assert.match(hook, /draftClient\.rpc\("get_draft_workspace"/);
  assert.doesNotMatch(hook, /const\s+draftRpc\s*=\s*supabase\.rpc/);
  assert.match(hook, /emptyDraftWorkspace/);
  for (const collection of ["playbooks", "plans", "scenarios", "actions", "restrictions", "opponents", "fixtures", "external_drafts", "team_drafts", "players", "champion_pools", "scouting_evidence"]) {
    assert.match(hook, new RegExp(`${collection}: \\[\\]`));
  }
});

test("Draft writes use tenant-scoped transactional RPCs", () => {
  for (const name of ["get_draft_workspace", "create_draft_playbook", "create_draft_match_plan", "create_draft_scenario", "save_draft_sequence_action", "set_draft_plan_restrictions", "set_draft_item_status", "update_draft_item_details", "revise_draft_item", "upsert_draft_champion_pool"]) {
    assert.match(hook, new RegExp(name));
    assert.match(allMigrations, new RegExp(`function public\\.${name}`));
  }
  assert.match(migration, /security invoker/);
  assert.match(migration, /user_has_tenant_role/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /from public, anon, authenticated/);
  assert.match(migration, /grant execute[\s\S]+to authenticated/);
});

test("multi-workspace Draft reads use tenant membership without changing write policies", () => {
  assert.match(multiWorkspaceRlsRepairMigration, /drop policy if exists "Users can view drafts for their tenant games" on public\.game_drafts/i);
  assert.match(multiWorkspaceRlsRepairMigration, /create policy "Users can view drafts for their tenant games"\s+on public\.game_drafts\s+for select\s+to authenticated/i);
  assert.match(multiWorkspaceRlsRepairMigration, /game\.id = game_drafts\.scrim_game_id[\s\S]*public\.user_belongs_to_tenant\(scrim\.tenant_id\)/i);
  assert.doesNotMatch(multiWorkspaceRlsRepairMigration, /select\s+tenant_id\s+from\s+public\.tenant_users/i);
  assert.doesNotMatch(multiWorkspaceRlsRepairMigration, /for\s+(insert|update|delete|all)\b/i);
});

test("sequence, branches, restrictions, snapshots, and audit are server enforced", () => {
  assert.match(migration, /draft_sequence_slot/);
  assert.match(migration, /sequence_number < p_branch_sequence/);
  assert.match(migration, /unavailable for this series game/);
  assert.match(migration, /Complete every scenario before publishing/);
  assert.match(migration, /draft_audit_events/);
  assert.match(migration, /linked_player_id/);
});

test("published snapshots stay immutable and revisions clone the complete scenario tree", () => {
  assert.match(revisionMigration, /Create a new revision to change a published item/);
  assert.match(revisionMigration, /Only a draft revision can be edited/);
  assert.match(revisionMigration, /create or replace function public\.revise_draft_item/);
  assert.match(revisionMigration, /with recursive scenario_tree/);
  assert.match(revisionMigration, /parent_playbook_id/);
  assert.match(revisionMigration, /parent_brief_id/);
  assert.match(cloneMigration, /clone_draft_scenarios/);
  assert.match(page, /Create revision/);
});

test("structured playbook and canonical champion-pool controls are active", () => {
  for (const label of ["Execution goals", "Vulnerabilities", "Contingencies", "Canonical champion pools", "Comfort", "Priority"]) {
    assert.match(page, new RegExp(label));
  }
  assert.match(revisionMigration, /upsert_draft_champion_pool/);
  assert.match(revisionMigration, /comfort_level not between 1 and 10/);
});

test("champion-first drafting supports drag, drop, touch, and keyboard placement", () => {
  assert.match(board, /draggable=/);
  assert.match(board, /dataTransfer\.setData\("text\/plain"/);
  assert.match(board, /onDrop=/);
  assert.match(board, /select a champion and then choose any pick or ban slot/i);
  assert.match(board, /ChampionAvatar/);
  assert.match(page, /onPlaceChampion=/);
});

test("opponent evidence uses exact provider split metadata", () => {
  assert.match(splitMigration, /provider_tournament/);
  assert.match(splitMigration, /'tournament',d\.provider_tournament/);
  assert.match(page, /Filter evidence by split/);
  assert.match(page, /All imported splits/);
  assert.match(page, /game\.tournament === activeSplit/);
});
