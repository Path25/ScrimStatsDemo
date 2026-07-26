import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/20260725072313_operations_dashboard_foundation.sql", import.meta.url),
  "utf8",
);
const rosterMembershipMigration = readFileSync(
  new URL("../supabase/migrations/20260725082441_roster_membership_linking.sql", import.meta.url),
  "utf8",
);
const calendarHook = readFileSync(new URL("../src/hooks/useCalendarEvents.ts", import.meta.url), "utf8");
const rosterDialog = readFileSync(
  new URL("../src/components/players/AddPlayerDialog.tsx", import.meta.url),
  "utf8",
);
const participantHook = readFileSync(
  new URL("../src/hooks/useScrimParticipants.ts", import.meta.url),
  "utf8",
);
const reconciliationHook = readFileSync(
  new URL("../src/hooks/useParticipantReconciliation.ts", import.meta.url),
  "utf8",
);
const reliableScheduling = readFileSync(
  new URL("../supabase/migrations/20260725091442_reliable_scrim_block_creation.sql", import.meta.url),
  "utf8",
);
const rosterPage = readFileSync(new URL("../src/pages/Players.tsx", import.meta.url), "utf8");
const collectorPage = readFileSync(
  new URL("../src/pages/CollectorWorkspace.tsx", import.meta.url),
  "utf8",
);
const overview = readFileSync(new URL("../src/pages/Overview.tsx", import.meta.url), "utf8");
const overviewHook = readFileSync(
  new URL("../src/hooks/useOverviewBriefing.ts", import.meta.url),
  "utf8",
);

test("overview is a simple schedule and results briefing", () => {
  assert.match(overview, /title="Overview"/);
  assert.match(overview, /Next scrim block/);
  assert.match(overview, /Team agenda/);
  assert.match(overview, /Completed scrim blocks/);
  assert.match(overview, /Outcome not recorded/);
  assert.doesNotMatch(
    overview,
    /DesktopAppStatus|capture-ready|evidence health|roster matching|unresolved captures|opponent preparation/i,
  );
  assert.match(overviewHook, /\.eq\("tenant_id", tenant\.id\)/);
  assert.match(overviewHook, /\.order\("starts_at", \{ ascending: true \}\)/);
  assert.doesNotMatch(overviewHook, /scrim_participants|preparation_briefs|players/);
});

test("scrim scheduling uses canonical instants and permission-checked RPCs", () => {
  assert.match(migration, /add column if not exists starts_at timestamptz/);
  assert.match(migration, /add column if not exists ends_at timestamptz/);
  assert.match(migration, /create or replace function public\.create_scrim_block/);
  assert.match(migration, /public\.resolve_workspace_local_time/);
  assert.match(migration, /array\['owner', 'admin'\]::public\.tenant_role\[\]/);
  assert.match(calendarHook, /scrim\.starts_at/);
  assert.doesNotMatch(calendarHook, /`\$\{scrim\.match_date\}T\$\{time\}`/);
  assert.match(reliableScheduling, /create or replace function public\.schedule_scrim_block/);
  assert.match(reliableScheduling, /p_starts_at timestamptz/);
  assert.match(reliableScheduling, /Only team staff can schedule practice blocks/);
  assert.match(reliableScheduling, /notify pgrst, 'reload schema'/);
});

test("captured participant links cannot cross tenant boundaries", () => {
  assert.match(migration, /scrim_participants_player_tenant_fkey/);
  assert.match(migration, /foreign key \(player_id, tenant_id\)/);
  assert.match(migration, /references public\.players\(id, tenant_id\)/);
  assert.match(migration, /create or replace function public\.reconcile_scrim_participant/);
  assert.match(migration, /player\.tenant_id = v_tenant_id/);
  assert.match(participantHook, /tenant_id: tenant\.id/);
  assert.match(reconciliationHook, /reconcile_scrim_participant/);
  assert.doesNotMatch(rosterPage, /Unmatched captured identities/);
  assert.match(collectorPage, /Resolve captured participants/);
});

test("roster creation does not fabricate rank, LP or server values", () => {
  assert.doesNotMatch(rosterDialog, /rank:\s*"Unranked"/);
  assert.doesNotMatch(rosterDialog, /lp:\s*0/);
  assert.doesNotMatch(rosterDialog, /region:\s*"EUW"/);
  assert.match(rosterDialog, /riot_tag_line/);
  assert.match(rosterDialog, /main_champions/);
});

test("new privileged functions are not executable by anonymous users", () => {
  assert.match(migration, /revoke all on function public\.create_scrim_block[\s\S]+from public, anon/);
  assert.match(
    migration,
    /grant execute on function public\.create_scrim_block[\s\S]+to authenticated/,
  );
  assert.match(
    migration,
    /revoke all on function public\.reconcile_scrim_participant[\s\S]+from public, anon/,
  );
});

test("draft validity is enforced below the browser", () => {
  assert.match(migration, /create or replace function public\.enforce_draft_scenario_action/);
  assert.match(migration, /A champion cannot appear more than once in a draft scenario/);
  assert.match(migration, /A role can only be assigned once per side/);
  assert.match(migration, /A side cannot contain more than five picks/);
  assert.match(migration, /create or replace function public\.enforce_complete_draft_scenario/);
  assert.match(migration, /Published scenarios require five picks and five bans for each side/);
  assert.match(
    migration,
    /revoke all on function public\.enforce_complete_draft_scenario\(\) from public, anon, authenticated/,
  );
});

test("roster invitations preserve tenant consistency and link membership atomically", () => {
  assert.match(rosterMembershipMigration, /foreign key \(player_id, tenant_id\)/);
  assert.match(rosterMembershipMigration, /references public\.players\(id, tenant_id\)/);
  assert.match(rosterMembershipMigration, /create or replace function public\.create_roster_invitation/);
  assert.match(rosterMembershipMigration, /player\.tenant_id = p_tenant_id/);
  assert.match(rosterMembershipMigration, /linked_user_id = auth\.uid\(\)/);
  assert.match(rosterMembershipMigration, /membership_state = 'linked'/);
  assert.match(
    rosterMembershipMigration,
    /revoke all on function public\.create_roster_invitation[\s\S]+from public, anon/,
  );
  assert.match(
    rosterMembershipMigration,
    /revoke all on function public\.sync_roster_membership_on_access_removal\(\)[\s\S]+from public, anon, authenticated/,
  );
});

test("revoked access and cancelled invitations reconcile roster state", () => {
  assert.match(
    rosterMembershipMigration,
    /create trigger sync_roster_membership_on_access_removal_trigger[\s\S]+after delete on public\.tenant_users/,
  );
  assert.match(rosterMembershipMigration, /membership_state = 'revoked'/);
  assert.match(
    rosterMembershipMigration,
    /create trigger sync_roster_membership_on_invitation_removal_trigger[\s\S]+after delete on public\.team_invitations/,
  );
  assert.match(rosterMembershipMigration, /membership_state = 'roster_only'/);
});
