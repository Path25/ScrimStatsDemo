import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, hook, editDialog, addDialog] = await Promise.all([
  readFile(new URL("../src/pages/Players.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/hooks/usePlayersData.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/players/EditPlayerDialog.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/players/AddPlayerDialog.tsx", import.meta.url), "utf8"),
]);

test("roster reads and direct writes remain tenant scoped", () => {
  assert.match(hook, /\.from\("players"\)[\s\S]*?\.eq\("tenant_id", tenant\.id\)/);
  assert.match(hook, /\.update\(updates\)[\s\S]*?\.eq\("id", id\)\.eq\("tenant_id", tenant\.id\)/);
  assert.match(hook, /rpc\("update_roster_player"/);
  assert.match(hook, /rpc\("set_roster_player_state"/);
});

test("roster mutations and actions are manager gated", () => {
  assert.match(page, /const \{ isManager \} = useRole\(\)/);
  assert.match(page, /isManager \? \(/);
  assert.match(page, /isManager && \(/);
});

test("editing supports clearing optional role and server fields", () => {
  assert.match(editDialog, /UNSET_ROSTER_VALUE/);
  assert.match(editDialog, /region === UNSET_ROSTER_VALUE \? "" : region/);
  assert.match(editDialog, /role === UNSET_ROSTER_VALUE \? "" : role/);
  assert.match(editDialog, /normalizeChampionPool\(form\.champions\)/);
});

test("roster has recoverable loading errors and no fabricated source label", () => {
  assert.match(page, /The roster could not be loaded/);
  assert.match(page, /Try again/);
  assert.doesNotMatch(page, /SourceBadge/);
});

test("add-player dialog supports controlled and uncontrolled use", () => {
  assert.match(addDialog, /controlledOpen \?\? internalOpen/);
  assert.match(addDialog, /onOpenChange\?\.\(nextOpen\)/);
  assert.match(addDialog, /normalizeRequiredName/);
});
