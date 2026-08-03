import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const migration = read("supabase/migrations/20260803120727_elite_practice_development_loop.sql");
const capabilities = read("src/lib/workspace-capabilities.ts");
const hook = read("src/hooks/usePracticeDevelopment.ts");
const breadcrumbHook = read("src/hooks/usePracticeDevelopmentBreadcrumbs.ts");
const coachingActionsHook = read("src/hooks/useCoachingActions.ts");
const gameChip = read("src/components/practice-development/PracticeDevelopmentGameEvidenceChip.tsx");
const actionBreadcrumb = read("src/components/practice-development/PracticeDevelopmentActionBreadcrumb.tsx");
const parser = read("src/lib/practice-development.ts");
const panel = read("src/components/practice-development/PracticeDevelopmentPanel.tsx");
const roleContext = read("src/contexts/RoleContext.tsx");
const moduleTypes = read("src/types/workspaceModules.ts");
const recovery = read("docs/operations/WO-2026-033_PRACTICE_DEVELOPMENT_RECOVERY.md");
const disableRecovery = read("supabase/recovery/wo-2026-033-disable-preserve-data.sql");
const structuralRecovery = read("scripts/local-only/wo033-structural-restore.sql");
const minimalBaseline = read("scripts/local-only/wo033-minimal-baseline.sql");

const practiceTables = [
  "practice_development_objectives",
  "practice_development_evidence",
  "practice_development_action_links",
  "practice_development_events",
];

const publicRpcs = [
  "get_practice_development_loop",
  "get_practice_development_action_breadcrumbs",
  "create_practice_development_objective",
  "update_practice_development_objective",
  "link_practice_development_evidence",
  "review_practice_development_evidence",
  "record_practice_development_unavailable",
  "attach_practice_development_follow_up",
  "detach_practice_development_follow_up",
  "transition_practice_development_objective",
  "archive_practice_development_objective",
  "restore_practice_development_objective",
];

const versionedRpcs = publicRpcs.filter((name) => ![
  "get_practice_development_loop",
  "get_practice_development_action_breadcrumbs",
  "create_practice_development_objective",
].includes(name));

function functionSection(name) {
  const start = migration.indexOf(`create or replace function public.${name}`);
  assert.notEqual(start, -1, `missing public.${name}`);
  const next = migration.indexOf("\ncreate or replace function public.", start + 1);
  const grants = migration.indexOf("\n-- PostgreSQL grants new functions", start + 1);
  const candidates = [next, grants, migration.length].filter((value) => value > start);
  return migration.slice(start, Math.min(...candidates));
}

test("practice development defaults fail closed without resetting an explicit QA activation", () => {
  assert.match(migration, /'collector', 'discord', 'practice_development'/);
  assert.match(
    migration,
    /new\.id, 'practice_development', 'planned', false, now\(\)[\s\S]*?on conflict \(tenant_id, module_key\) do nothing/,
  );
  assert.match(
    migration,
    /select tenant\.id, 'practice_development', 'planned', false, now\(\)[\s\S]*?on conflict \(tenant_id, module_key\) do nothing/,
  );
  assert.doesNotMatch(
    migration,
    /'practice_development'[\s\S]{0,300}on conflict \(tenant_id, module_key\) do update set[\s\S]{0,160}is_enabled = excluded\.is_enabled/,
  );
  assert.match(
    moduleTypes,
    /practice_development: \{ key: "practice_development", state: "planned", enabled: false \}/,
  );
  assert.match(
    parser,
    /input\.subscriptionTier === "elite" && input\.releaseState === "live" && input\.enabled === true/,
  );
  assert.match(
    hook,
    /!moduleQuery\.isLoading && !moduleQuery\.isError && hasPracticeDevelopmentModuleAccess/,
  );
  assert.match(hook, /enabled: Boolean\(tenant\?\.id && scrimId && moduleAvailable && expectedProjection !== "none"\)/);
  assert.match(hook, /loop: moduleAvailable && !query\.error && query\.data\?\.projection === expectedProjection \? query\.data : null/);
});

test("the server entitlement helper requires membership plus exact Elite live enabled access", () => {
  assert.match(migration, /create or replace function public\.has_practice_development_access/);
  assert.match(migration, /security definer[\s\S]*?set search_path = ''/);
  assert.match(migration, /membership\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /tenant\.subscription_tier::text = 'elite'/);
  assert.match(migration, /access\.module_key = 'practice_development'/);
  assert.match(migration, /access\.release_state = 'live'/);
  assert.match(migration, /access\.is_enabled is true/);
  assert.match(
    migration,
    /revoke all on function public\.has_practice_development_access\(uuid\)[\s\S]*?from public, anon, authenticated/,
  );
  assert.match(
    migration,
    /grant execute on function public\.has_practice_development_access\(uuid\)[\s\S]*?to authenticated/,
  );
});

test("practice base tables are RLS-enabled and unavailable directly to browser roles", () => {
  for (const table of practiceTables) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(
    migration,
    /revoke all on table[\s\S]*?public\.practice_development_objectives,[\s\S]*?public\.practice_development_evidence,[\s\S]*?public\.practice_development_action_links,[\s\S]*?public\.practice_development_events[\s\S]*?from public, anon, authenticated/,
  );
  assert.doesNotMatch(
    migration,
    /grant\s+(?:all|select|insert|update|delete)[^;]*on table\s+public\.practice_development_(?:objectives|evidence|action_links|events)[^;]*to\s+(?:anon|authenticated)/i,
  );
  assert.match(
    migration,
    /revoke all on table public\.practice_development_events from service_role;[\s\S]*?grant select, insert on table public\.practice_development_events[\s\S]*?to service_role/,
  );
  assert.doesNotMatch(
    migration,
    /create policy[\s\S]{0,240}on public\.practice_development_(?:objectives|evidence|action_links|events)/i,
  );
  assert.equal(
    [...migration.matchAll(/tenant_id uuid not null references public\.tenants\(id\) on delete restrict/g)].length,
    4,
    "every WO-033 tenant FK should preserve history by restricting tenant deletion",
  );
});

test("every public RPC has a fixed search path, locked grants, and server authorization", () => {
  for (const name of publicRpcs) {
    const section = functionSection(name);
    assert.match(section, /security definer/);
    assert.match(section, /set search_path = ''/);
    assert.doesNotMatch(section, /set search_path = public/);
    assert.match(
      migration,
      new RegExp(`revoke all on function public\\.${name}\\([^;]*?\\)\\s+from public, anon, authenticated;`),
    );
    assert.match(
      migration,
      new RegExp(`grant execute on function public\\.${name}\\([^;]*?\\)\\s+to authenticated;`),
    );
  }

  for (const name of publicRpcs.filter((value) => ![
    "get_practice_development_loop",
    "get_practice_development_action_breadcrumbs",
  ].includes(value))) {
    assert.match(functionSection(name), /security\.require_practice_development_staff/);
  }

  assert.match(
    functionSection("get_practice_development_action_breadcrumbs"),
    /public\.has_practice_development_access\(p_tenant_id\)/,
  );

  assert.doesNotMatch(
    migration,
    /grant execute on function public\.(?:get|create|update|link|review|record|attach|detach|transition|archive|restore)_practice_development[^;]*to (?:public|anon|service_role)/,
  );
});

test("every versioned mutation rejects a null expected version", () => {
  for (const name of versionedRpcs) {
    assert.match(
      functionSection(name),
      /if p_expected_version is null\s+or v_objective\.version <> p_expected_version/,
      `${name} must reject NULL instead of allowing SQL three-valued logic to bypass concurrency`,
    );
  }
});

test("evidence provenance is immutable and lifecycle transitions require current proof", () => {
  assert.match(migration, /create or replace function security\.prevent_practice_development_evidence_relink/);
  assert.match(
    migration,
    /new\.source_label is distinct from old\.source_label[\s\S]*?new\.source_recorded_at is distinct from old\.source_recorded_at[\s\S]*?Practice evidence provenance is immutable/,
  );
  assert.match(
    migration,
    /before update of tenant_id, objective_id, source_type, source_id,[\s\S]*?source_label, source_recorded_at/,
  );

  const review = functionSection("review_practice_development_evidence");
  assert.match(review, /security\.practice_development_source_available/);
  assert.match(review, /set status = 'evidenced'/);

  const unavailable = functionSection("record_practice_development_unavailable");
  assert.match(unavailable, /'declared_unavailable'/);
  assert.doesNotMatch(unavailable, /set status = 'evidenced'/);

  const transition = functionSection("transition_practice_development_objective");
  assert.match(transition, /evidence\.state = 'reviewed'/);
  assert.match(transition, /security\.practice_development_source_available/);
  assert.match(transition, /action\.status = 'complete'/);
  assert.match(transition, /Current reviewed evidence is required before completion/);
  assert.match(transition, /A completed linked Coaching Action is required before completion/);
  assert.match(transition, /owner_membership\.role = any/);

  for (const name of [
    "create_practice_development_objective",
    "update_practice_development_objective",
    "link_practice_development_evidence",
    "record_practice_development_unavailable",
    "attach_practice_development_follow_up",
    "transition_practice_development_objective",
    "restore_practice_development_objective",
  ]) {
    assert.match(
      functionSection(name),
      /status is (?:not )?distinct from 'cancelled'/,
      `${name} must account for a cancelled source block`,
    );
  }

  const attach = functionSection("attach_practice_development_follow_up");
  assert.match(attach, /action\.tenant_id = v_objective\.tenant_id/);
  assert.match(attach, /v_action\.scrim_id is distinct from v_objective\.scrim_id/);
  assert.match(attach, /v_action\.due_at is null/);
  assert.match(attach, /owner_membership\.role = any/);
  assert.match(attach, /count\(distinct participant_id\)/);
  assert.match(attach, /checkpoint\.starts_at > v_source_scrim\.starts_at/);
  assert.doesNotMatch(attach, /insert into public\.coaching_actions/);
});

test("team-v1 is omission-based and contains no staff-only or raw-source keys", () => {
  const getter = functionSection("get_practice_development_loop");
  assert.match(getter, /v_projection := case when v_is_staff then 'staff-v1' else 'team-v1' end/);
  assert.match(
    getter,
    /when v_is_staff then jsonb_build_object\(\s*'source_id', evidence\.source_id,\s*'staff_note', evidence\.staff_note\s*\)\s*else '\{\}'::jsonb/,
  );
  assert.match(
    getter,
    /if v_is_staff then\s+v_objective_json := v_objective_json\s+\|\| jsonb_build_object\('staff_note', v_objective\.staff_note\)/,
  );
  assert.match(getter, /evidence\.source_id = p_context_game_id[\s\S]*?jsonb_build_object\(\s*'source_match_key', 'context_game'\s*\)/);
  assert.match(getter, /when evidence\.source_type = 'block_review'[\s\S]*?then jsonb_build_object\('source_match_key', 'block_review'\)/);
  assert.match(getter, /practice_block_cancelled/);
  assert.match(getter, /v_checkpoint\.status is distinct from 'cancelled'/);
  assert.match(getter, /order by checkpoint\.starts_at, checkpoint\.id/);
  assert.match(getter, /v_has_declared_checkpoints then 'unavailable'/);
  assert.match(gameChip, /usePracticeDevelopment\(scrimId, gameId\)/);
  assert.match(gameChip, /item\.sourceMatchKey === "context_game"/);
  assert.doesNotMatch(gameChip, /item\.sourceId === gameId/);
  assert.match(parser, /sourceAvailability === "available" \? stringValue\(source\.source_match_key\) : undefined/);
  assert.doesNotMatch(
    getter,
    /coach_feedback|coaching_notes|external_game_data|raw_provider|raw_payload|recipient_email|profile\.email|auth\.users|practice_development_events/,
  );
});

test("action breadcrumbs are bounded, tenant-scoped, and safe for members", () => {
  const breadcrumbs = functionSection("get_practice_development_action_breadcrumbs");
  assert.match(breadcrumbs, /cardinality\(coalesce\(p_action_ids, '\{\}'::uuid\[\]\)\) > 200/);
  assert.match(breadcrumbs, /public\.has_practice_development_access\(p_tenant_id\)/);
  assert.match(breadcrumbs, /action\.tenant_id = p_tenant_id/);
  assert.match(breadcrumbs, /link\.tenant_id = action\.tenant_id/);
  assert.match(breadcrumbs, /action\.archived_at is null/);
  assert.match(breadcrumbs, /link\.archived_at is null/);
  assert.match(breadcrumbs, /'objective_title', objective\.title/);
  assert.match(breadcrumbs, /left join public\.scrims source_scrim/);
  assert.match(breadcrumbs, /source_scrim\.id is not null[\s\S]*?source_scrim\.archived_at is null/);
  assert.match(breadcrumbHook, /callPracticeDevelopmentRpc\("get_practice_development_action_breadcrumbs"/);
  assert.match(breadcrumbHook, /p_action_ids: chunk/);
  assert.match(breadcrumbHook, /index \+= 200/);
  assert.match(breadcrumbHook, /normalizedActionIds\.slice\(index, index \+ 200\)/);
  assert.doesNotMatch(actionBreadcrumb, /usePracticeDevelopment/);
  assert.doesNotMatch(
    breadcrumbs,
    /staff_note|source_id|practice_development_events|auth\.users|recipient_email/,
  );
});

test("browser code uses shaped RPCs and gates staff controls on the server projection", () => {
  assert.doesNotMatch(hook, /\.from\("practice_development_/);
  assert.match(hook, /callPracticeDevelopmentRpc\("get_practice_development_loop"/);
  assert.match(parser, /source\.contract_version !== "practice-development-v1"/);
  assert.match(parser, /value === "staff-v1" \|\| value === "team-v1"/);
  assert.match(hook, /queryKey = \["practice-development", tenant\?\.id, scrimId, activeRole, expectedProjection, contextGameId\]/);
  assert.match(hook, /invalidateQueries\(\{\s*queryKey: \["practice-development", tenant\?\.id, scrimId\]/);
  assert.match(hook, /parsed\.projection !== expectedProjection/);
  assert.match(hook, /loop: moduleAvailable && !query\.error/);
  assert.match(panel, /const isStaffProjection = loop\?\.projection === "staff-v1"/);
  assert.match(panel, /canManagePracticeDevelopment && isStaffProjection/);
  assert.match(panel, /canManage && objective\.staffNote/);
  assert.match(panel, /canManage && item\.staffNote/);
  assert.match(roleContext, /queryClient\.removeQueries\(\{[\s\S]*?queryKey: \['practice-development', previous\.tenantId\][\s\S]*?query\.queryKey\[3\] === previous\.role/);
  assert.match(capabilities, /if \(role === "member" \|\| role === "viewer"\)[\s\S]*?practiceDevelopmentReadOnly/);
  assert.match(capabilities, /practiceDevelopmentReadOnly[\s\S]*?viewPracticeDevelopment: true/);
  assert.match(capabilities, /managePracticeDevelopment: false/);
});

test("WO-033 adds no notification automation and reuses explicit Coaching Action creation", () => {
  assert.doesNotMatch(
    migration,
    /queue_workspace_notification|workspace_notifications|notification_deliveries|notification_reminders|notification_trigger/i,
  );
  assert.match(panel, /<CoachingActionDialog/);
  assert.match(panel, /onCreated=\{attachCreatedAction\}/);
  assert.match(hook, /callPracticeDevelopmentRpc\("attach_practice_development_follow_up"/);
  assert.doesNotMatch(hook, /create_coaching_action/);
  assert.match(panel, /canAssignFollowUp && !pendingAction/);
  assert.match(panel, /sessionStorage\.setItem\(pendingActionStorageKey, JSON\.stringify\(action\)\)/);
  assert.match(panel, /Open existing action/);
  assert.match(coachingActionsHook, /invalidateQueries\(\{ queryKey: \["practice-development", tenant\?\.id\] \}\)/);
  assert.match(coachingActionsHook, /invalidateQueries\(\{ queryKey: \["practice-development-breadcrumbs", tenant\?\.id\] \}\)/);
});

test("recovery stays anchored, record-preserving, and local-only for destructive rehearsal", () => {
  assert.match(recovery, /ac71123f86212437780d46647f39535abb1b0b31/);
  assert.match(recovery, /Keep objective, evidence, action-link, and event history intact/);
  assert.match(recovery, /pnpm dlx supabase@<reviewed-cli-version> db reset/);
  assert.match(recovery, /scripts\/local-only\/wo033-structural-restore\.sql/);
  assert.match(recovery, /scripts\/local-only\/wo033-minimal-baseline\.sql/);
  assert.match(recovery, /LOCAL ONLY - DESTRUCTIVE - NEVER LINK OR RUN HOSTED/);
  assert.match(recovery, /Never add `--linked`/);
  assert.match(disableRecovery, /defaults to ROLLBACK/i);
  assert.match(disableRecovery, /where access\.tenant_id = v_tenant_id[\s\S]*?module_key = 'practice_development'/);
  assert.match(disableRecovery, /records_preserved', true/);
  assert.match(disableRecovery, /current_setting\('wo033\.tenant_id'\)::uuid/);
  assert.match(structuralRecovery, /LOCAL ONLY - DESTRUCTIVE - NEVER LINK OR RUN AGAINST A HOSTED PROJECT/);
  assert.match(structuralRecovery, /ac71123f86212437780d46647f39535abb1b0b31/);
  assert.match(structuralRecovery, /drop function public\.get_practice_development_loop\(uuid, uuid, uuid\)/);
  assert.match(structuralRecovery, /drop function public\.get_practice_development_action_breadcrumbs\(uuid, uuid\[\]\)/);
  assert.doesNotMatch(structuralRecovery, /drop[^;]*cascade/i);
  assert.match(minimalBaseline, /LOCAL TEST ONLY - NEVER LINK OR RUN AGAINST A HOSTED PROJECT/);
  assert.match(minimalBaseline, /to_regclass\('public\.tenants'\) is not null/);
  assert.match(minimalBaseline, /BUILD_WO033_MINIMAL_BASELINE/);
});
