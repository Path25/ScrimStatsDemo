# WO-2026-033 Phase 1 design - Elite practice-development loop

- **Design status:** Proposed implementation contract for Theo review
- **Prepared:** 2026-08-03
- **Evidence level:** Source-inspected design; no schema, application, fixture, hosted, or release change
- **Source work order:** [WO-2026-033](proposed/WO-2026-033-elite-practice-development-loop.md)
- **Required next approval:** Exact Phase 2 migration and implementation scope

## 1. Phase 1 outcome and boundary

### Outcome

Define the smallest credible Elite practice-development loop before any migration is written:

1. staff record one observable objective before a scheduled scrim block;
2. staff link and review permitted factual practice evidence after the block;
3. staff assign one accountable coaching action with an owner and due date;
4. staff close the loop only after reviewing evidence and the action outcome; and
5. the product shows the next-session follow-up state without inferring improvement.

The implementation should extend the existing Scrim Block and Coaching Actions workflows. It should not introduce a new navigation area or a parallel action system.

### Users

- **Owner and Admin:** create, edit during the planning window, attach and review evidence, assign the follow-up, block, complete, reopen, and archive.
- **Member and Viewer:** read the approved team-facing objective, evidence status, follow-up status, and team-facing summaries. They receive no WO-033 mutation controls or direct table access.
- **Free and Pro workspaces:** retain their existing routes and workflows. They do not receive the panel, preview, data, or mutation access.

### Acceptance contract

- Every row and source reference is tenant-scoped below the browser.
- Every write requires an authenticated Owner or Admin in the same Elite workspace with the live module enabled.
- Member and Viewer reads use a deliberately shaped projection; staff-only notes, raw identifiers, and internal review detail are not returned.
- The loop distinguishes `planned`, `evidenced`, `completed`, `blocked`, and `unavailable` honestly.
- A result, rank, rating, or linked record never automatically means that an objective was achieved or that a player improved.
- Free and Pro plan behavior remains unchanged and direct WO-033 RPC attempts are denied.

### Risks addressed in this design

- sensitive development notes leaking through shared tenant reads;
- browser-only Elite or role gates being treated as authorization;
- cross-tenant scrim, game, review, player, or action IDs being linked;
- permissive module defaults exposing an unfinished feature;
- rewriting an objective after results are known;
- an unavailable or deleted source being presented as evidence;
- duplicating the existing Coaching Actions lifecycle;
- a migration silently activating all existing Elite workspaces.

### Non-goals

- No migration file or hosted migration application in Phase 1.
- No frontend or function implementation in Phase 1.
- No Overview work; that belongs to WO-2026-034.
- No new route, navigation item, notification/reminder/email behavior, Discord automation, provider, upload, or VOD store.
- No raw `coach_feedback`, provider payload, wellness, surveillance, automated assessment, or performance score in the new projection.
- No Free or Pro navigation, packaging, billing, checkout, or entitlement change.
- No public claim that the Elite loop exists, is live, or proves improvement.

## 2. Architecture baseline and decisions

### Existing foundations to reuse

- `scrims` and `scrim_games` are the canonical scheduled-block and recorded-game sources.
- Scrim Block already hosts block review, game evidence, and the existing `ActionCycleRail`.
- `coaching_actions` already supports player, unit, and team scope; an assignee; due date; practice checkpoints; participant check-in; staff review; and lifecycle events.
- Existing action writes use tenant-validating RPCs. Direct authenticated Coaching Action insert/update/delete access has already been removed.
- Workspace roles are `owner`, `admin`, `member`, and `viewer`. Owner/Admin are staff; Member/Viewer share a read-only baseline.
- `tenant_feature_access` is the established per-tenant module-state table.

### Decisions

1. **One primary objective per scrim block.** WO-033 implements one focused loop, not a general goals platform. Multiple simultaneous block objectives require a later approved scope.
2. **Team-facing objective.** The objective is visible to every authorised member of the entitled workspace. Individual/private development records are outside this work order.
3. **Existing Coaching Action remains canonical.** A narrow link joins the objective to one existing action; WO-033 does not duplicate action status, assignees, due dates, checkpoints, or participant check-ins.
4. **New private fields do not live on `coaching_actions`.** Existing tenant members can currently read complete action rows. Any WO-033 staff-only assessment is stored only in the new locked tables and returned only in the staff projection.
5. **Permitted evidence is bounded.** Phase 2 may link a saved scrim game or the completed block review. It will not expose raw coach-feedback records, provider payloads, capture reconciliation detail, external URLs, or uploads.
6. **Source records are resolved at read time.** A source identifier is validated transactionally when linked. If the source is later absent or no longer readable, the projection reports `unavailable`; the stored link is not silently converted into proof.
7. **Embedded workflow.** The primary UI is a panel in Scrim Block. Game context receives a small evidence-link affordance and Coaching Actions receives a linked-objective breadcrumb. No new route or Overview card is introduced.
8. **Fail closed.** The new module is absent from permissive fallback behavior. Loading errors, missing module rows, non-live state, disabled state, plan downgrade, and lost membership all deny new reads and writes.

## 3. Customer and evidence semantics

### Statements the product may make

- “Planned” means staff recorded the objective before the block started.
- “Evidence linked” means staff linked and reviewed at least one permitted factual source.
- “Completed” means staff closed the operational loop after reviewing permitted evidence and a completed linked action.
- “Blocked” means staff could not continue the loop and recorded a team-safe reason.
- “Unavailable” means the required source, next session, module, or authorised view is not currently available.

### Statements the product must not make

- A win, loss, rating, rank change, KDA, or single-game result proves improvement.
- A linked game by itself demonstrates the objective.
- An action being assigned or checked in means it was completed.
- A missing source means nothing happened.
- A completed operational loop proves durable player or team development.

### Team-facing and staff-only text

Every free-text write is explicitly classified:

- **Team-facing:** objective title, observable evidence standard, evidence summary, blocked/unavailable summary, completion summary, and action fields already intended for the team.
- **Staff-only:** internal rationale, assessment note, recovery detail, and audit note.

The UI labels team-facing fields before submission. Server functions accept these fields separately; one generic note field must not be reused for both audiences.

## 4. Lifecycle and state model

### Persisted objective states

| State | Meaning | Entry rule | Exit rule |
|---|---|---|---|
| `planned` | An objective and observable standard were recorded before the block. | Owner/Admin creates it before `scrims.starts_at`. | Link and review evidence, block it, or archive it. |
| `evidenced` | At least one permitted source was linked and reviewed by staff. This is not an improvement claim. | At least one evidence record is `reviewed`. | Complete, block, or reopen for additional evidence. |
| `completed` | Staff closed the operational loop. | At least one reviewed evidence record, one linked coaching action in `complete`, and a non-empty team-facing completion summary. | Owner/Admin may reopen with an audited reason. |
| `blocked` | The loop cannot currently continue. | Owner/Admin supplies a team-facing reason; an internal reason is optional. | Owner/Admin may reopen with an audited reason. |

`unavailable` is a derived display state, not a persisted claim about the objective. It is returned when the source block, linked evidence source, linked action, next-session block, membership, or module cannot be resolved. Persisted history remains unchanged.

### Planning integrity

- Creation is rejected at or after the source block start time.
- Objective title and observable evidence standard are editable only before the block starts and before any evidence is linked.
- The server supplies all actor IDs and timestamps; browser values are ignored.
- The first evidence link freezes the planning fields even if the block start time is later.
- A missed planning window renders a truthful “Objective unavailable for this block” state. Retrospective objectives are not silently presented as pre-practice planning.

### Evidence states

| State | Meaning | Effect on objective |
|---|---|---|
| `linked` | A valid same-block game or completed block review was selected. | No automatic objective transition. |
| `reviewed` | Staff added a team-facing factual summary and explicitly reviewed the source. | The objective may transition to `evidenced`. |
| `unavailable` | No qualifying source exists, or a previously linked source can no longer be resolved. | Cannot satisfy evidence or completion requirements. |

### Follow-up states

The panel derives follow-up state from the linked `coaching_actions` row instead of duplicating it:

- `assigned`, `acknowledged`, `in_progress`, `ready_for_review`, `complete`, or `dismissed` mirror the canonical action status;
- `scheduled` means a same-tenant checkpoint/follow-up scrim resolves;
- `reviewed` means the next-session block review has been completed;
- `pending` means the action remains open and no next session is yet linked; and
- `unavailable` means the action or checkpoint no longer resolves, or no next session was recorded when the action closed.

Member/Viewer use of the existing Coaching Actions check-in flow does not mutate the WO-033 objective or evidence state. Only a staff review may complete the action, and only a separate staff transition may complete the objective.

### Allowed transitions

```text
no objective -> planned
planned -> evidenced | blocked
evidenced -> completed | blocked
blocked -> planned | evidenced
completed -> evidenced
any retained state -> archived
archived -> prior state (staff restore with audit reason)
```

Reopening returns to `evidenced` when a reviewed, currently available source remains; otherwise it returns to `planned`. Every transition checks an expected version to prevent stale concurrent updates.

## 5. Proposed data model

This is a migration proposal only. No SQL is created or applied by Phase 1.

### `public.practice_development_objectives`

| Column | Contract |
|---|---|
| `id uuid` | Primary key; server-generated. |
| `tenant_id uuid` | Required tenant FK; immutable. |
| `scrim_id uuid` | Required source block identifier; composite FK with tenant to `scrims(id, tenant_id)`. |
| `title text` | Team-facing, trimmed, 1–160 characters. |
| `evidence_standard text` | Team-facing observable standard, trimmed, 1–1000 characters. |
| `status text` | `planned`, `evidenced`, `completed`, or `blocked`. |
| `team_status_summary text` | Team-facing blocked/completion summary; required by the relevant transition. |
| `staff_note text` | Optional staff-only assessment/recovery detail. |
| `version integer` | Starts at 1; incremented on every mutation for optimistic concurrency. |
| actor/timestamp columns | `created_by`, `updated_by`, `completed_by`, `created_at`, `updated_at`, `completed_at`, `archived_by`, `archived_at`; supplied by the server. |

Constraints and indexes:

- unique `(id, tenant_id)` for composite child references;
- composite `(scrim_id, tenant_id)` FK to `scrims(id, tenant_id)` with `ON DELETE RESTRICT`; the existing block archive/restore path preserves history;
- one non-archived objective per `(tenant_id, scrim_id)`;
- tenant/status/updated index for later authorised summary work;
- title/evidence/status/transition consistency checks;
- no hard-delete API; archive and restore are audited.

### `public.practice_development_evidence`

| Column | Contract |
|---|---|
| `id uuid` | Primary key; server-generated. |
| `tenant_id uuid` | Required; must match the parent objective. |
| `objective_id uuid` | Composite FK with tenant to the objective. |
| `source_type text` | `scrim_game`, `block_review`, or `declared_unavailable`. |
| `source_id uuid` | Logical source reference; required except for `declared_unavailable`. |
| `source_label text` | Immutable factual label captured at link time, such as “Game 2”; never a performance assertion. |
| `source_recorded_at timestamptz` | Source time captured at link time. |
| `state text` | `linked`, `reviewed`, or `unavailable`. |
| `team_summary text` | Required to mark reviewed; safe for all entitled workspace roles. |
| `staff_note text` | Optional staff-only assessment. |
| actor/timestamp columns | `linked_by`, `linked_at`, `reviewed_by`, `reviewed_at`, `archived_by`, `archived_at`. |

The game source link is deliberately resolved through a server function rather than exposed as a browser-writable FK. A database constraint trigger and every linking RPC validate source existence, same-block ownership, tenant, and source type at write time. This avoids destroying practice history or unexpectedly blocking the existing game-removal workflow. A missing game later produces `unavailable`; the immutable label/time remains provenance, not proof. The objective’s source block itself uses the stronger composite FK because ScrimStats already has a block archive/restore path.

Uniqueness prevents the same active source being linked twice to one objective. `declared_unavailable` requires a team-facing explanation and never transitions the objective to `evidenced`.

### `public.practice_development_action_links`

| Column | Contract |
|---|---|
| `id uuid` | Primary key; server-generated. |
| `tenant_id uuid` | Required; must match both records. |
| `objective_id uuid` | Composite FK with tenant to the objective. |
| `action_id uuid` | Same-tenant Coaching Action reference. |
| `created_by`, `created_at` | Server supplied. |
| `archived_by`, `archived_at` | Soft unlink with audit. |

Only one active action may be linked to an objective and an action may belong to only one active practice-development objective. Add a unique `(id, tenant_id)` index to `coaching_actions` and a composite action/tenant FK if the migration review confirms no conflicting hosted rows. Use `ON DELETE RESTRICT`; existing actions use archival lifecycle and should not erase objective history.

### `public.practice_development_events`

Append-only audit records contain tenant, objective, actor, event type, previous/next state, a team-facing summary when applicable, a separate staff-only note, version, and timestamp.

Event types are bounded to:

- `created`, `planning_updated`, `evidence_linked`, `evidence_reviewed`, `evidence_unavailable`;
- `action_linked`, `action_unlinked`;
- `blocked`, `completed`, `reopened`;
- `archived`, `restored`.

Authenticated clients receive no direct event-table access. Member/Viewer do not receive actor UUIDs, staff notes, or event history through the WO-033 projection.

## 6. Entitlement and module contract

### Server predicate

Every WO-033 read requires all four conditions:

```text
authenticated tenant member
AND tenant.subscription_tier = 'elite'
AND tenant_feature_access.module_key = 'practice_development'
AND release_state = 'live'
AND is_enabled = true
```

Every mutation additionally requires `owner` or `admin` from the authoritative tenant-membership table.

`PlanGate`, `RoleContext`, `isManager`, and hidden buttons are presentation controls only. They do not satisfy this predicate.

### Seed and activation behavior

- Add module key `practice_development` to the database and TypeScript module union.
- Existing and newly created tenants receive `release_state='planned'` and `is_enabled=false`.
- Do not merge this key into the current permissive enabled defaults.
- Do not auto-enable it from `subscription_tier='elite'` in the entitlement synchronizer.
- The new browser hook must treat missing rows, loading errors, query errors, planned/beta state, disabled state, and unknown roles as denied.
- An isolated local or hosted QA tenant may be set to `live/true` only after the relevant fixture/data approval.
- Enabling all Elite tenants is a separate release operation after QA and Theo approval.
- Existing Stripe status/grace semantics are unchanged.

### Browser behavior

- Free/Pro: render no panel, route, preview, badge, or upsell under WO-033.
- Elite but missing/planned/disabled/error: fail closed; if the workspace was explicitly selected for testing, show a concise unavailable/retry state without data.
- Elite/live/enabled Owner/Admin: safe read projection plus staff controls.
- Elite/live/enabled Member/Viewer: safe read-only projection.
- Downgrade, module disable, or lost membership: invalidate cached data and deny the next read/write immediately; stale UI cannot authorize a mutation.

## 7. Role and field-visibility contract

Member and Viewer intentionally share one Phase 2 projection. This follows the existing read-only capability baseline and avoids a new ambiguous hierarchy.

| Field or action | Owner | Admin | Member | Viewer |
|---|---|---|---|---|
| Objective title, evidence standard, source block, lifecycle state | Read/write | Read/write | Read | Read |
| Team-facing blocked/completion summary | Read/write | Read/write | Read | Read |
| Staff rationale, internal assessment, recovery detail | Read/write | Read/write | Hidden | Hidden |
| Evidence type, game/block label, date, availability | Link/review | Link/review | Read | Read |
| Team-facing evidence summary | Read/write | Read/write | Read | Read |
| Raw game/provider payload, reconciliation detail, coach-feedback body | Not returned by WO-033 | Not returned by WO-033 | Hidden | Hidden |
| Action title, category, scope label, display names, due date, status, checkpoint | Assign/read | Assign/read | Read | Read |
| Player check-in note and existing action review free text | Existing Action workflow only | Existing Action workflow only | Not returned by WO-033 | Not returned by WO-033 |
| Creator/reviewer UUIDs, emails, audit actors/events | Read UUIDs only where operationally necessary | Same | Hidden | Hidden |
| Create/edit/link/assign/block/complete/reopen/archive controls | Yes | Yes | No | No |

Non-staff projections use approved display names only; they never expose Auth UUIDs or email addresses. If a linked source is not permitted by the source workflow, WO-033 returns only `unavailable`, not a hidden record’s title or identifier.

Add explicit `viewPracticeDevelopment` and `managePracticeDevelopment` capabilities. Both default false for null/unknown roles. The manage capability is true only for Owner/Admin, while actual display still also requires the positive server/module result.

## 8. Database authorization, RLS, grants, and functions

Supabase requires RLS on exposed tables, and function privileges must be reviewed separately from table policies. The reviewed migration must follow the official [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Data API security guidance](https://supabase.com/docs/guides/database/hardening-data-api).

### Base tables

- Enable RLS on all four tables immediately in the creation migration.
- Revoke all table and sequence privileges from `public`, `anon`, and `authenticated`.
- Grant only the required maintenance access to `service_role`.
- Do not add a generic tenant-member `SELECT *` policy.
- Authenticated Data API table reads and every direct insert/update/delete remain default-denied. The shaped RPC is the only customer read boundary.
- No hard-delete RPC is exposed.

This combines privilege denial with RLS default denial. It avoids relying on React field hiding and avoids accidentally exposing future staff-only columns.

### Shared access helper

Add one stable helper that checks membership, exact Elite tier, `practice_development`, `live`, and enabled. It returns only a boolean and does not accept actor IDs from the caller. Mutation functions separately call the existing `user_has_tenant_role` helper for Owner/Admin.

### Read RPC

`get_practice_development_loop(p_tenant_id uuid, p_scrim_id uuid) returns jsonb`

- Reject unauthenticated, non-member, Free/Pro, missing-module, non-live, or disabled access with SQLSTATE `42501` and a generic unavailable message.
- Validate the requested scrim belongs to the same tenant before looking up an objective.
- Determine the caller’s authoritative role from tenant membership.
- Return a versioned JSON contract with one of two explicit projections: `staff-v1` or `team-v1`.
- Resolve source/action/checkpoint availability in the same query.
- Omit fields rather than returning staff-only keys with null values to non-staff.
- Return no raw provider payloads, URLs, coach-feedback bodies, auth emails, or user-editable authorization metadata.

Because the base tables have no authenticated grants, the getter is an exceptional `SECURITY DEFINER` boundary. It must use `SET search_path = ''`, fully qualified objects, explicit `auth.uid()`/membership/entitlement checks, a narrow return contract, and locked execute grants.

### Mutation RPCs

Use typed arguments where practical and a version parameter on updates:

- `create_practice_development_objective`
- `update_practice_development_objective`
- `link_practice_development_evidence`
- `review_practice_development_evidence`
- `record_practice_development_unavailable`
- `attach_practice_development_follow_up`
- `transition_practice_development_objective`
- `archive_practice_development_objective`
- `restore_practice_development_objective`

Every function must:

1. require `auth.uid()`;
2. derive the actor server-side;
3. assert the full entitlement predicate;
4. assert Owner/Admin role;
5. load the objective and related records inside the same transaction;
6. validate every supplied ID through joins back to the same tenant and, for evidence, the same source block;
7. enforce lifecycle invariants and expected version;
8. write an audit event in the same transaction; and
9. return only the new ID/state/version or the shaped read contract.

The panel opens the existing Coaching Action creation flow with the objective context prefilled. After the staff member explicitly creates the action, `attach_practice_development_follow_up` validates the returned action’s tenant, source scrim, staff owner, assignee/scope, due date, participants, checkpoints, and archive state before linking it. If linking fails, the valid action remains unlinked and the UI offers a safe retry; it is not deleted or silently attached. This avoids a second action-creation implementation and keeps existing notification behavior explicit rather than adding new WO-033 delivery automation.

Participant check-in continues through the existing action RPC. It may move the action toward staff review but cannot write an objective, review evidence, or transition/complete the loop.

Creating the Coaching Action may continue to invoke the product’s existing action-notification behavior. WO-033 adds no notification type, recipient, channel, reminder, or automatic action creation. Phase 2 must inspect and test that existing behavior before claiming the panel is side-effect free.

### Function hardening

For every new function:

- use a fixed empty search path and fully qualified names;
- revoke execute from `PUBLIC`, `anon`, and `authenticated` before granting only the intended signature to `authenticated`;
- never grant execution to an unauthenticated role;
- never accept tenant role, subscription tier, actor ID, completion actor, or audit timestamp as trusted payload data;
- do not read authorization from user-editable metadata;
- add comments describing the boundary; and
- include function owner, volatility, security mode, search path, and grants in contract tests and Advisor review.

## 9. UI implementation map

### Primary surface

Add `PracticeDevelopmentPanel` to `ScrimBlockView` after the block metrics and before generic notes.

The panel owns:

- pre-block objective create/edit;
- lifecycle and evidence availability;
- permitted game/block-review links;
- team-facing and staff-only review fields;
- accountable action creation/link;
- staff completion/block/reopen actions; and
- next-session follow-up state.

### Game context

At the existing game evidence section, show a compact objective/evidence chip:

- Owner/Admin may attach or review the current game when the server says it is eligible.
- Member/Viewer see only the permitted factual link and team-facing summary.
- `GameEvidenceDialog` is not turned into a second objective editor.

### Coaching Actions

Add only a linked-objective breadcrumb/status to the relevant action card and reuse the existing action rail and lifecycle. Do not create a second action editor or fork the action statuses.

### Explicit omissions

- no navigation item or new route;
- no Overview card or weekly roll-up;
- no use of `scrims.notes` as the objective store;
- no Free/Pro preview or billing prompt;
- no mock team fallback;
- no optimistic success message before the server transaction returns.

### Responsive and state quality

- Desktop target: current analyst-console density without expanding the block header beyond its established hierarchy.
- Mobile target: 390 × 844 with stacked summaries, no horizontal overflow, clear staff/read-only distinction, and destructive/archive actions behind confirmation.
- Required states: loading, no objective, planning window missed, planned, evidence missing, evidenced, action pending, completed, blocked, unavailable, permission denied, and retryable server error.

## 10. Proposed migration and implementation sequence

The exact migration must be reviewed and approved before it is created or applied.

1. Extend the `tenant_feature_access.module_key` constraint and TypeScript union with `practice_development`.
2. Seed all current and future tenants with `planned/false`; do not overwrite any later explicit row with an unconditional upsert.
3. Create the four additive tables, constraints, indexes, RLS state, revocations, and service-role grants.
4. Add the composite objective/block and objective/action references, the evidence consistency trigger, and the uniqueness needed for same-tenant links after duplicate/mismatch preflight queries.
5. Create and lock the entitlement helper, shaped read RPC, and staff mutation RPCs.
6. Add database comments and refresh the local PostgREST schema cache.
7. Regenerate Supabase TypeScript types from the migrated local database; never edit `src/integrations/supabase/types.ts` manually.
8. Add the fail-closed module query/gate and dedicated role capabilities.
9. Add the panel, game evidence chip, action breadcrumb, hooks, domain types, and accessible states.
10. Add database, contract, component, and browser tests before any hosted migration request.

No Edge Function is required. Database RPCs provide the transactional and authorization boundary.

## 11. Validation matrix

### Local database and contract matrix

| Case | Read expectation | Mutation expectation |
|---|---|---|
| Signed out | No data | Every RPC denied. |
| Free Owner/Admin/Member/Viewer | No WO-033 projection | Every WO-033 RPC denied. |
| Pro Owner/Admin/Member/Viewer | Existing Pro workflow only | Every WO-033 RPC denied. |
| Elite with missing module row | Denied/fail closed | Denied. |
| Elite with planned, beta, or disabled module | Denied/fail closed | Denied. |
| Elite/live/enabled Owner | Staff projection | Same-tenant workflow succeeds. |
| Elite/live/enabled Admin | Staff projection | Same-tenant workflow succeeds. |
| Elite/live/enabled Member | `team-v1` safe projection | Every WO-033 mutation denied. |
| Elite/live/enabled Viewer | `team-v1` safe projection | Every WO-033 mutation denied. |
| Tenant A actor targets Tenant B objective/scrim/game/action | No Tenant B data | Rejected; no rows/events changed. |
| Objective created after block start | Honest unavailable state | Creation rejected. |
| Objective edited after evidence/block start | Existing objective unchanged | Update rejected. |
| Missing or deleted evidence source | `unavailable`; historical label only | Cannot evidence or complete. |
| Completion without reviewed evidence | Existing state | Rejected. |
| Completion without complete linked action | Existing state | Rejected. |
| Concurrent stale transition | Latest committed state | Version conflict; no partial event. |
| Downgrade/module disable/membership removal | Cached view invalidated; next read denied | Next write denied immediately. |
| Member checks in linked action | Existing Action UI behavior | Objective/evidence state unchanged. |

### Required database inspection

- clean local reset and upgrade-path migration application;
- database tests for all roles, plans, module states, tenant switching, and invalid source IDs;
- RLS enabled on every new table;
- no authenticated table/sequence DML or broad select grants;
- no `PUBLIC`/`anon` function execute grants;
- expected `SECURITY DEFINER`, empty search path, fixed signatures, and explicit authorization;
- query indexes for tenant/objective/status/source/action lookups;
- duplicate and null preflight before constraints;
- Supabase database lint plus Security and Performance Advisor review.

### Application validation

- focused entitlement, capability, hook, projection, transition, and UI contracts;
- no Free/Pro route, navigation, billing copy, or plan behavior diff;
- ESLint with zero warnings;
- TypeScript no-emit check;
- production build and bundle budget;
- desktop and 390 × 844 mobile checks;
- A → B → A workspace switching with no stale objective data;
- Owner/Admin controls and Member/Viewer read-only field inspection;
- browser console/network review for denied or leaked requests.

### Hosted evidence after separate approval

1. Apply the reviewed migration to the explicitly approved environment.
2. Use only named non-customer fixtures: Elite tenant A plus Free, Pro, and tenant B controls.
3. Enable only the isolated Elite tenant A row to `live/true`.
4. Repeat the complete browser and direct RPC matrix.
5. Record deployment revision, migration version, timestamps, redacted identifiers, screenshots, server responses, and Advisor exports.
6. Disable the fixture module after QA unless Theo separately approves continued testing.

A local build proves compilation. A database test proves the tested local policy contract. An isolated hosted fixture proves only that named environment and revision. None of these alone proves customer availability or release readiness.

## 12. Recovery and rollout safety

- The schema proposal is additive and does not backfill objectives or infer records from existing scrims/actions.
- The initial module state is `planned/false`, so applying the schema alone must not expose the feature.
- The first operational rollback is to disable the isolated tenant module row and remove the frontend surface; retain objective/evidence/action-link/event history.
- Do not drop tables or delete historical records as a release rollback.
- Archive/restore is preferred over delete; every recovery mutation is audited.
- If an action is linked incorrectly, soft-unlink it with an event and link the corrected same-tenant action. Do not rewrite the old event.
- If evidence becomes unavailable, retain its factual source label/time and mark availability honestly; do not fabricate replacement proof.
- General Elite activation, billing copy, Message Ledger changes, marketing, and release remain separate founder decisions.

## 13. Acceptance-criteria traceability

| Work-order criterion | Phase 1 design response | Required Phase 2/QA proof |
|---|---|---|
| Staff create objective, link evidence, assign follow-up, record completion | Bounded state machine, three workflow tables plus events, transactional staff RPCs | Local and hosted happy-path record/browser evidence. |
| Explicit Member/Viewer permissions and server denial | `team-v1` projection; no base-table grants; staff-only RPC writes | Role and direct mutation matrix. |
| Planned/evidenced/completed/blocked/unavailable | Persisted states plus derived unavailability and honest semantics | UI screenshots and invalid-transition tests. |
| Tenant/RLS/function safety | Same-tenant ID validation, default-deny tables, locked functions, audit events | DB tests, grants inspection, lint, Security/Performance Advisors. |
| Free/Pro unchanged and denied | Exact Elite/live/enabled predicate; no Free/Pro UI/copy/navigation | Free/Pro regression and direct RPC-denial matrix. |

## 14. Approval gates

| Gate | Current state | What it authorises |
|---|---|---|
| Phase 1 design work | Approved by Theo | This document and work-order planning evidence only. |
| Phase 2 migration/source implementation | **Pending** | Create the reviewed local migration, RPCs, application code, and tests; no hosted mutation. |
| Hosted migration and fixture activation | **Pending** | Apply the named migration and enable only the approved non-customer tenant. |
| Frontend/backend deployment | **Pending** | Deploy the reviewed revision to the named environment. |
| General Elite activation and release | **Pending** | Make the feature customer-available after QA and separate founder approval. |
| Billing, checkout, price, public copy, outreach | **Not in WO-033** | Requires separate work order and approval. |

## Phase 1 recommendation

Approve this document as the implementation contract, then author the exact additive migration and local application slice under Phase 2. Do not combine source implementation approval with hosted migration, fixture activation, deployment, or release approval.
