# WO-2026-033 practice development recovery runbook

## Purpose and authority

This runbook covers containment and recovery for the Elite practice development loop. It is anchored to source checkpoint `ac71123f86212437780d46647f39535abb1b0b31` (`Checkpoint WO-033 Phase 1 design`). That commit contains the approved Phase 1 design and predates the Phase 2 migration and application slice.

This document is a prepared recovery procedure, not permission to perform a recovery. It does not authorise a hosted migration, hosted data change, module activation or deactivation, deployment, database restore, customer-data export, billing change, notification change, or destructive operation. Those actions require Theo's explicit approval naming the environment, tenant or project, operator, time window, and recovery scope.

Follow the general incident procedure in `docs/operations/INCIDENT_RECOVERY.md`. Capture a support or incident reference before any mutation and preserve historical evidence.

## Recovery principles

1. Contain the smallest affected surface first.
2. Keep objective, evidence, action-link, and event history intact.
3. Keep each linked Coaching Action in the canonical action workflow.
4. Do not use a source rollback as proof that a hosted schema or hosted data was rolled back.
5. Do not use a feature disable as proof that cached data has disappeared from an already-open browser.
6. Prefer a forward, reviewed recovery over rewriting Git or Supabase migration history.
7. Treat cross-tenant exposure, unauthorized mutation, or data loss as a security incident and stop ordinary release work.

## Recovery levels

| Level | Purpose | Data treatment | Required authority |
|---|---|---|---|
| A. Source comparison | Establish what changed after Phase 1 | Read-only | None beyond repository access |
| B. Runtime feature disable | Deny new WO-033 reads and writes for one named tenant | Preserve every WO-033 and Coaching Action record | Explicit approval for the named hosted environment and tenant |
| C. Source/interface rollback | Remove the Phase 2 source surface from a recovery revision | Preserve database state; no implied deploy | Source approval; deployment requires separate approval |
| D. Local structural restore | Rebuild a disposable local database from the checkpoint source | Destroys only the confirmed disposable local database | Explicit local destructive-operation approval |
| E. Hosted structural or data recovery | Restore, reverse, drop, delete, or replay hosted data/schema | Potentially destructive and customer-affecting | New reviewed recovery plan plus explicit hosted approval |

Do not escalate from one level to the next merely because it is available. Use the least invasive level that contains the incident.

## 1. Triage and evidence capture

Before changing state, record:

- environment, Supabase project reference, deployed revision, migration version, and UTC time;
- named tenant, actor role, affected scrim/objective/action identifiers, and whether any second tenant is implicated;
- observed browser route, request/RPC name, response status and SQLSTATE, and correlation/support reference;
- row counts for the tenant's objective, evidence, action-link, and event records;
- the current `practice_development` module row: `tenant_id`, `release_state`, `is_enabled`, `updated_at`, and `updated_by`;
- linked Coaching Action IDs and their current status, without copying private notes into the incident report;
- recent workspace notifications and delivery attempts associated with those action IDs; and
- current Security/Performance Advisor evidence if the incident concerns grants, functions, RLS, or query health.

Classify the incident before choosing a recovery:

- **Authorization or tenant isolation:** disable the named test tenant immediately after approval, preserve logs and rows, and investigate direct RPC behavior. If more than one tenant may be affected, request a separately reviewed all-tenant containment change.
- **Incorrect UI or projection:** disable the named tenant after approval, then prepare a source/interface rollback. Do not alter records to make the UI appear correct.
- **Bad objective/evidence/action link:** keep the feature disabled while a forward audited correction is reviewed. Never rewrite an event or hard-delete history.
- **Migration or database integrity:** stop. Verify backup/PITR and a scoped export before considering any hosted structural action.
- **Notification side effect:** preserve the notification and delivery ledgers, stop status mutations, and investigate the canonical Coaching Action trigger separately.

## 2. Source checkpoint and rollback preparation

### Read-only comparison

Use the checkpoint only as the Phase 1 source baseline:

```powershell
git show --stat ac71123
git status --short
git diff --name-status ac71123..HEAD
git log --oneline --decorate ac71123..HEAD
```

Also inventory untracked files because the commit range does not include them. Save the command output in the recovery evidence pack.

The repository may contain unrelated dirty work. Never run `git reset --hard`, a repository-wide restore/checkout, `git clean`, a force push, or a history rewrite. Do not delete or rename historical migration files.

### Safest source-only recovery workspace

For an uncommitted or mixed working tree, create a separate worktree or clean clone at `ac71123` and build the recovery revision there. This leaves the active checkout and its unrelated changes intact. Confirm the new worktree resolves exactly to the checkpoint before using it.

For already committed Phase 2 work, identify the exact WO-033 commits and review their file list. Revert only those commits, newest first, on a dedicated recovery branch. Do not revert a commit range that also contains unrelated work. The checkpoint commit itself normally remains because it is the approved design and evidence anchor.

A successful source revert means only that the recovery revision no longer contains the Phase 2 source slice. It does not:

- undo an applied hosted migration;
- delete or modify hosted records;
- disable a hosted module row;
- remove a currently deployed frontend; or
- prove a browser, RPC, notification, or tenant-isolation outcome.

Validate the recovery revision locally before asking to deploy it. Deployment remains a separate approval.

## 3. Safe feature disable that preserves records

The first operational rollback is to set only the named tenant's `practice_development` row to disabled. Keep `release_state` and all practice-development records unchanged so the state can be investigated and recovered. The server boundary must deny access unless the workspace is Elite **and** the module row is `live/true`.

The executable review template is `supabase/recovery/wo-2026-033-disable-preserve-data.sql`. It is not a migration, requires a named tenant, active platform operator and incident reference, and defaults to `ROLLBACK` unless `wo033_apply=true` is explicitly supplied. Its presence does not authorise a hosted run.

Do not use the browser as the authority for this change. Use a reviewed server/operator path under an explicitly approved change window. The operator must preflight the exact tenant and require exactly one target row. If the row is absent or more than one tenant is in scope, stop instead of broadening the update.

The following is a review template only. The placeholder must be replaced with the one approved tenant UUID, and the final transaction must remain `ROLLBACK` until the preflight, row count, audit path, and approval are confirmed:

```sql
begin;

select tenant_id, module_key, release_state, is_enabled, updated_at, updated_by
from public.tenant_feature_access
where tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
  and module_key = 'practice_development'
for update;

update public.tenant_feature_access
set is_enabled = false,
    updated_at = clock_timestamp(),
    updated_by = null
where tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
  and module_key = 'practice_development'
returning tenant_id, module_key, release_state, is_enabled, updated_at, updated_by;

-- Use the established service-only operator path to append the incident reference,
-- operator identity, reason, before/after state, and target tenant to the immutable
-- operator audit ledger in the same approved change. Do not improvise a browser grant.

rollback;
```

For an approved live change, replace the placeholder with the approved tenant, review that exactly one returned row now has `is_enabled = false`, write the immutable operator audit event, and only then use `COMMIT`. If any check differs, use `ROLLBACK`.

### Records that must remain untouched

- `practice_development_objectives`
- `practice_development_evidence`
- `practice_development_action_links`
- `practice_development_events`
- linked `coaching_actions`, participants, checkpoints, check-ins, reviews, and action events
- workspace notification and notification-delivery history

Do not mark an objective or Coaching Action complete, blocked, dismissed, or archived merely to hide the feature. Do not unlink an action or evidence item as part of feature disable.

### Cache and authorization verification

After an approved disable:

1. Record the committed module-row result and audit-event identifier.
2. Refresh or invalidate the named tenant's WO-033 client query state.
3. Confirm a new direct getter request fails closed with no projection.
4. Confirm every WO-033 mutation RPC fails without changing row or event counts.
5. Switch tenant A to tenant B and back; confirm no stale objective is displayed.
6. Confirm the existing Coaching Action remains available only through its normal authorization boundary.
7. Confirm Free and Pro behavior is unchanged.

An already-open browser may temporarily retain rendered data in memory. The server denial on the next read or write is the containment boundary; UI cache clearing is defense in depth.

## 4. Notification and action side effects

WO-033 must not add a notification type, reminder, recipient, channel, or automatic action creation. The existing `coaching_action_notification_trigger` runs after a Coaching Action is inserted or its `status` changes. It may create an in-app notification and an email-delivery record for the assignee.

Therefore:

- changing only `tenant_feature_access.is_enabled` must not invoke the Coaching Action trigger;
- linking or unlinking an existing action must not change its status as an incidental side effect;
- creating an action from the WO-033 panel may legitimately invoke the existing assignment notification;
- changing an action status during recovery may invoke the existing status notification and is outside a simple feature disable;
- disabling WO-033 does not cancel, delete, or retry notifications already queued by the canonical action workflow; and
- notification or delivery correction requires a separately reviewed, idempotent recovery using the tracked records.

Capture notification row counts and delivery statuses before and after recovery verification. Do not send test email to a customer identity.

## 5. Local-only destructive structural restore

Use structural restore only on a confirmed disposable local Supabase instance. It destroys local data and is not part of routine feature containment.

Prerequisites:

1. Explicitly approve the destructive local reset.
2. Work from the separate checkpoint recovery worktree at `ac71123` so the Phase 2 migration is not present in that source tree.
3. Record `git rev-parse HEAD`, `git status --short`, and the local Supabase status.
4. Confirm every database/API URL resolves to loopback (`127.0.0.1` or `localhost`).
5. Confirm no `--linked`, project reference, hosted database URL, or hosted password is supplied.
6. Export any local-only fixture evidence that must be retained.

Only after those checks, use a reviewed Supabase CLI version through the available package runner (or the same reviewed generic `supabase` CLI already installed in the operator environment). This repository does not provide a local `node_modules/.bin/supabase` binary. Pin the CLI version in the recovery evidence instead of silently accepting a newer release:

```powershell
pnpm dlx supabase@<reviewed-cli-version> db reset
```

This recreates the disposable local database from migrations present in the checkpoint worktree. Never add `--linked`. A local reset is not evidence that a hosted migration can be reversed safely.

Afterward, run the pre-Phase-2 test/build baseline and confirm WO-033 tables, functions, and module key are absent while the existing Coaching Action workflow still passes. Record the command output as local-only evidence.

### Isolated minimal-schema validation

The repository migration chain assumes an earlier remote schema. For a fresh disposable Supabase Postgres container, `scripts/local-only/wo033-minimal-baseline.sql` provides only the pre-WO-033 objects needed by the migration and SQL lifecycle test. It is outside migration and test discovery, refuses a database where `public.tenants` already exists, requires Supabase Auth (`auth.users` and `auth.uid()`), and requires the exact checkpoint plus local-only acknowledgement.

After independently confirming the container name is disposable and local, the reproducible order is:

```powershell
Get-Content -Raw scripts/local-only/wo033-minimal-baseline.sql |
  docker exec -i <confirmed-disposable-container> psql -U postgres -d postgres -X `
    -v wo033_environment=local-supabase-disposable `
    -v wo033_ack=BUILD_WO033_MINIMAL_BASELINE `
    -v wo033_checkpoint=ac71123f86212437780d46647f39535abb1b0b31 `
    -v wo033_apply=true

Get-Content -Raw supabase/migrations/20260803120727_elite_practice_development_loop.sql |
  docker exec -i <confirmed-disposable-container> psql -U postgres -d postgres -X -v ON_ERROR_STOP=1

Get-Content -Raw supabase/tests/wo033_practice_development.test.sql |
  docker exec -i <confirmed-disposable-container> psql -U postgres -d postgres -X -v ON_ERROR_STOP=1
```

The SQL test owns its synthetic users, tenants, scrims, games, actions and role changes inside one transaction and ends with `ROLLBACK`. A clean pgTAP result is local database evidence only; it does not verify a hosted migration, hosted Auth configuration, browser journey, Advisor output or release readiness.

### Optional targeted local-only teardown rehearsal

If a full local reset cannot exercise the required recovery case, the only permitted targeted structural-restore artifact is a clearly marked SQL script under `scripts/local-only/`, for example `scripts/local-only/wo033-structural-restore.sql`. It must remain outside `supabase/migrations/` so it cannot be discovered or applied as migration history.

That script must:

- start with a prominent `LOCAL ONLY - DESTRUCTIVE - NEVER LINK OR RUN HOSTED` banner;
- state the checkpoint and Phase 2 migration versions it expects;
- require the operator to verify loopback database/API URLs before invocation;
- abort unless an explicit local-rehearsal guard supplied by the wrapper is present;
- affect only WO-033 functions, tables, constraints, and the local module row;
- preserve or export any local fixture evidence named in the rehearsal plan;
- omit all hosted credentials, project references, and `--linked` flags; and
- be invoked only from the isolated recovery worktree with its command/output attached to local evidence.

The local-only script is a disposable rehearsal aid, not a forward/down migration and not a hosted recovery option. Do not copy it into `supabase/migrations/`, deploy it, or cite its success as proof of hosted reversibility.

Run the structural script once with `wo033_apply=false` and retain the rollback output. Only after that dry run succeeds on the confirmed disposable container may the explicitly approved local rehearsal use `wo033_apply=true`. Both invocations require `wo033_environment=local-supabase-disposable`, `wo033_ack=I_UNDERSTAND_THIS_DELETES_WO033_LOCAL_DATA`, and the full Phase 1 checkpoint hash.

Do not create a down migration, delete a migration file, or repair hosted migration history merely to make a local reset or teardown rehearsal pass.

## 6. Hosted backup and export prerequisite

No hosted structural or data recovery may begin until the current environment's recovery capability is verified live. The repository records backup/PITR status as an operational input, not as proof that a usable restore point currently exists.

The recovery owner must attach:

- current Supabase backup/PITR status and retention window for the exact project;
- the latest successful backup time and a restore point before the suspect change;
- an approved restoration destination and a rehearsal result, preferably an isolated recovery project;
- a scoped, encrypted logical export of the four WO-033 tables for the affected tenant;
- the affected tenant's module row and the IDs/statuses of linked Coaching Actions;
- row counts and integrity checks for objective -> evidence -> action link -> event relationships;
- export time, schema/migration version, operator, checksum, storage location, access list, and deletion/retention date; and
- a redacted evidence manifest that contains no private coaching notes or raw provider payloads.

Do not place database passwords, service-role keys, customer notes, email addresses, or raw game/provider payloads in the recovery document, issue, terminal transcript, or Git repository.

If backup/PITR coverage or the scoped export cannot be verified, the hosted structural recovery is blocked. Keep the module disabled and continue read-only diagnosis.

## 7. Hosted structural recovery is exceptional

Dropping WO-033 tables/functions, deleting rows, restoring a backup, replaying data, changing migration history, or applying a reversal migration is not an ordinary release rollback. It requires a new reviewed plan that states:

- exact project, tenant, schema objects, rows, and migration versions;
- why feature disable plus source rollback is insufficient;
- data-loss and cross-tenant risks;
- reviewed forward SQL and its transaction/locking behavior;
- verified backup, export, and isolated restore rehearsal;
- maintenance window, operator, observers, and stop conditions;
- post-change role/plan/tenant matrix and Advisor review; and
- recovery from a failed recovery.

The default hosted posture is to retain the additive schema and historical records with the module disabled. A future forward migration can repair the implementation without erasing provenance.

## 8. Forbidden actions without new explicit approval

Do not perform any of the following under this runbook alone:

- apply, revert, repair, or squash a hosted Supabase migration;
- run `db reset --linked`, a hosted `DROP`, `TRUNCATE`, broad `DELETE`, or backup restore;
- delete objectives, evidence, action links, events, Coaching Actions, notifications, or deliveries;
- enable or disable more than the one named tenant module row;
- change a tenant's subscription tier, Stripe data, billing, checkout, or plan copy;
- grant browser access to service-only tables or broaden RLS/function execution;
- deploy, promote, or roll back a frontend/backend revision;
- contact customers, send test notifications, or publish an incident/release claim;
- use customer identities or data as recovery fixtures;
- rewrite Git history, force push, delete migration provenance, or discard unrelated dirty work; or
- expose secrets or private coaching content in logs or evidence packs.

## 9. Post-recovery acceptance matrix

| Check | Expected result | Evidence level |
|---|---|---|
| Named tenant module row | Exactly one row is disabled; release state and timestamps are recorded | Hosted database only after approval |
| WO-033 getter after disable | Generic denial/no projection | Direct authenticated RPC |
| WO-033 mutation RPCs after disable | Denied; no objective/evidence/link/event count change | Direct authenticated RPC plus counts |
| Member/Viewer | No staff-only fields or mutation path | Projection and direct RPC |
| Free/Pro | No WO-033 surface; server denies access | Browser plus direct RPC |
| Tenant B control | No row or behavior change | Direct RPC and browser switch |
| Linked Coaching Action | Preserved and still governed by existing action authorization | Existing action journey |
| Notifications/deliveries | No new rows from module disable; existing queued rows preserved | Ledger comparison |
| Source recovery revision | Diff contains only reviewed WO-033 rollback files | Git evidence |
| Local structural restore | Checkpoint baseline passes on loopback-only database | Local only |
| Advisors | New security/performance findings classified, not hidden | Dated hosted export after approval |

Keep evidence labels exact: source inspected, locally tested, browser verified, hosted verified, or production-ready. A source revert, local reset, or passing contract test does not prove hosted recovery.

## 10. Re-enable conditions

Do not re-enable the module until:

1. the root cause and affected revision are recorded;
2. the repair passes the full plan/role/tenant/direct-RPC matrix locally;
3. notification behavior is unchanged or separately approved;
4. the recovery evidence shows no lost or cross-tenant records;
5. Security and Performance Advisor findings are classified for the approved hosted environment;
6. the repaired source is deployed under separate approval; and
7. Theo explicitly approves `live/true` for the one named non-customer tenant.

General Elite activation, customer availability, billing, public copy, and release remain separate decisions.
