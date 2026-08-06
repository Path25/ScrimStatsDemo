# WO-2026-033 - Build the Elite practice-development loop

- **ID reservation:** [WO-2026-033 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Done
- **Assigned owner:** QA and Release Auditor
- **Size:** L
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** Scrim-block objectives, recorded-game/review evidence, coaching actions, role capabilities, tenant-scoped data model/RLS/RPCs, Overview/Review screens, tests, and operational docs.
- **Dependencies:** Theo-approved Elite proposition and implementation scope; reviewed data/RLS design; isolated role/tenant fixtures; separate release approval for any migration/deployment.
- **Collision risk:** Shared practice, review, coaching-action, and role-capability flows. Do not run beside a broad Overview, Scrims, or coaching-action refactor.

## Problem and user impact

Teams can schedule, record games, review, and create coaching actions, but the product does not yet make a pre-practice objective, evidence of practice, accountable action, and next-session follow-up one connected staff workflow.

## Scope

- Add one tenant-scoped practice-development loop: objective before a block; linked game/review evidence; accountable action owner and due date; staff review of completion/proof; and a next-session follow-up state.
- Staff roles control creation, editing, assignment, completion, and evidence review. Other authorised workspace roles may view goals and their permitted status/evidence read-only; the Core design must document the exact role and field-level visibility before migration review.
- The customer-visible development loop is Elite-only. Core may reuse a tenant-safe shared internal data foundation where that reduces duplication, but must not change Free or Pro customer workflows, remove existing access, introduce a new Free/Pro goal surface, or weaken server-side plan enforcement. Any later cross-tier exposure requires a separate work order and founder approval.
- Make missing evidence explicit; never infer improvement from result, rank, or a small sample.
- Establish the minimum Elite entitlement and server-side enforcement only after Theo approves the proposition and packaging boundary.

## Explicit non-goals

- No wellness/health data, player surveillance, automated performance claims, organisation hierarchy, provider activation, or Discord automation.
- No redesign of every existing review or coaching screen.
- No Free or Pro packaging, entitlement, navigation, or workflow change under this work order.

## Acceptance criteria

- An authorised staff member can create an objective, link permitted practice evidence, assign a follow-up, and record completion without crossing tenants.
- Player/member/viewer permissions are explicit; unauthorised direct mutation attempts fail below the browser layer.
- The workflow visibly distinguishes planned, evidenced, completed, blocked, and unavailable states.
- An isolated hosted role/tenant matrix and RLS/function review prove the boundary.
- Free and Pro role matrices retain their current visible workflow and are denied the new Elite development-loop mutations and screens below the browser layer.

## Relevant files, workflows, or data areas

- Scrims, Scrim Games, reviews, coaching actions, Overview, RoleContext, tenant helpers, migrations, RLS policies, and WO-2026-024.

## Risks

- **Permissions / Supabase RLS:** High. Objectives and development evidence are sensitive team data; require tenant predicates, role checks, and `USING`/`WITH CHECK` updates.
- **Billing / entitlement:** High. Elite gates must be server-enforced and match Billing/plan copy.
- **Email / customer communication:** No outbound notification or reminder is in scope.
- **Production / data:** High. New tenant-owned records/migrations need explicit approval and recovery paths.

## Required validation

- Focused contracts; zero-warning lint, TypeScript, build, migration/RLS/grant/function-security and Advisor review.
- Isolated owner/admin/member/viewer and second-tenant browser/direct-mutation matrix.
- Hosted workflow evidence from objective through linked record and follow-up, using non-customer data.

## QA scenario / reproducible test steps

1. Prepare isolated Elite tenant A with owner/admin/member/viewer and tenant B controls.
2. Create one objective, attach authorised game/review evidence, assign a due action, and record completion.
3. Attempt forbidden role and cross-tenant reads/writes directly and in the browser.
4. Confirm every state is truthful and no result or trend is presented as improvement without supporting evidence.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Preserve the approved Elite outcome. | WO-032 |
| Developer â€“ Fast Lane | Not applicable | Shared data, entitlement, and security work. | N/A |
| Core Features Developer | Complete for Phase 2 local implementation | Implement bounded workflow, server safety, tests, and recovery assets. | Phase 2 implementation commit and evidence below |
| QA and Release Auditor | Current owner | Audit the source/recovery evidence, then coordinate separately approved hosted migration and role/tenant/browser verification. | QA verdict |
| Technical Reporting Analyst | Involved | Define honest evidence/completion semantics. | Data definition |
| Lead Marketer and Growth | Consulted | Validate future claim boundary only. | Message Ledger |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Connected objective-to-follow-up workflow | Rollback-only pgTAP lifecycle plus application contracts | Local database/source | Pass locally; authenticated browser and hosted evidence outstanding |
| Role/tenant/entitlement protection | Function/RLS/grant contracts and two-tenant role matrix | Local database/source | Pass locally; hosted matrix and Advisor review outstanding |
| Honest evidence states | Lifecycle/parser/UI contracts covering cancellation, unavailable sources, action ownership, and checkpoints | Local database/source | Pass locally; desktop/mobile screenshots outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Phase 2 local implementation is complete, but no hosted migration, activation, authenticated browser matrix, Advisor review, deployment, or release approval has occurred.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Approve proposition and implementation | Theo | Written founder decision | Complete (2026-08-03) |
| Phase 1 tenant/RLS design | Core | Reviewed design contract | Complete (2026-08-03) |
| Phase 2 migration/implementation | Core | Approved source migration, implementation commit, local validation, and recovery rehearsal | Complete locally - 2026-08-03 |
| Source and recovery audit | QA and Release Auditor | Review this handoff, migration, pgTAP, grants/RLS, and rollback assets | Ready |
| Hosted migration/application | Core + Theo approval | Separately approved production-backed project scope and backup/PITR evidence | Not authorised |
| Hosted role/tenant/browser QA | QA and Release Auditor | Owner/Admin/Member/Viewer, Free/Pro/Elite, second tenant, desktop/mobile evidence | Open after an approved hosted path exists |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved for Phase 2 local source implementation | 2026-08-03 | Authorises the reviewed additive migration source, application slice, tests, and rollback preparation. It does not authorise hosted migration application, fixture activation, deployment, or release. |
| Release | Yes | Pending | — | Separate after QA. |

## Decision and approval record

### Approval correction - 2026-08-03

The earlier `Implementation: Pending` table row predates Theo's subsequent approval and is superseded by the decision below: implementation is approved for the documented Elite-only, staff-controlled scope with authorised non-staff read-only visibility. Migration application, deployment, billing/price changes, public claims, and release remain separately approval-gated.

- 2026-08-02 - Proposed as the first durable future Elite system; no implementation approval.
- 2026-08-03 - Theo approved WO-033 as the first Elite build. It is Elite-only and staff-facing for control; other authorised workspace roles may view goals and permitted evidence/status read-only. This is the dedicated Core workstream before WOs 034 and 036. It does not approve migration application, deployment, billing/price changes, provider activation, customer-facing claims, or release.
- 2026-08-03 - Theo confirmed the intended boundary: do not overcomplicate Free or Pro. The visible workflow remains Elite-only, but Core may use a shared internal foundation if it is the safer, simpler implementation. Any customer-visible cross-tier access or plan-rule change requires a separate founder-approved work order.
- 2026-08-03 - Theo approved Phase 1. Core completed the source-inspected lifecycle, data, field-visibility, entitlement, RLS/RPC, UI, recovery, and validation design. This approval did not authorise a migration file, local application implementation, hosted mutation, deployment, activation, or release.
- 2026-08-03 - Theo reviewed and accepted Phase 1, approved Phase 2 implementation, and requested an exact rollback point before migration work continued. Core created source checkpoint `ac71123f86212437780d46647f39535abb1b0b31` before any Phase 2 source/SQL change. Hosted migration application, deployment, tenant activation, and release remain separately approval-gated.

## Implementation and review evidence

- Existing ScrimStats workflows provide the starting records, but no connected improvement-programme system exists.
- [Phase 1 implementation contract](../WO-2026-033-PHASE-1-DESIGN.md) records the bounded design and exact approval gates. No schema or application source was changed under Phase 1.
- Phase 1 preserves the existing Coaching Action lifecycle, uses a separate safe read projection for WO-033, defaults the proposed module to `planned/false`, and requires exact Elite + `live` + enabled server enforcement.
- Phase 2 adds four private tenant-owned tables, explicit RPC-only customer access, fixed-search-path functions, locked grants, versioned mutations, immutable evidence provenance, safe staff/team projections, and an exact Elite + `live` + enabled server predicate. Existing and future tenants remain `planned/false`; downgrade disables without deleting history, and re-upgrade does not auto-activate.
- The application embeds the loop in Scrim Block, reuses the canonical Coaching Action workflow, gives Owner/Admin controls and Member/Viewer safe read-only fields, invalidates role/action/context caches fail-closed, and uses a bounded batch breadcrumb projection on the action ledger.
- Recovery is anchored to pre-Phase-2 commit `ac71123f86212437780d46647f39535abb1b0b31`. The record-preserving one-tenant disable defaults to rollback; the destructive structural restore is guarded and local-only outside migration discovery.
- Phase 2 implementation and local QA handoff commit: `32b6ceb3d1536d4e0f48955477fcc2ae918c22fa`.
- **Highest evidence achieved:** Implemented and locally tested in a disposable Supabase Postgres container; not authenticated-browser verified, hosted verified, deployed, activated, production-ready, or release-approved.

## Phase 2 QA handoff - 2026-08-03

### Implemented files and boundaries

- Migration: `supabase/migrations/20260803120727_elite_practice_development_loop.sql`.
- Database lifecycle test: `supabase/tests/wo033_practice_development.test.sql`.
- Safe disable: `supabase/recovery/wo-2026-033-disable-preserve-data.sql`.
- Local-only baseline and structural restore: `scripts/local-only/wo033-minimal-baseline.sql` and `scripts/local-only/wo033-structural-restore.sql`.
- Recovery procedure: `docs/operations/WO-2026-033_PRACTICE_DEVELOPMENT_RECOVERY.md`.
- Application slice: practice-development domain/parser/RPC hooks and components, plus bounded changes to Scrim Block, Coaching Actions, role capabilities, module state, and the canonical action dialog/cache refresh.
- `src/integrations/supabase/types.ts` was not edited. Regenerate it only after a separately approved database migration has been applied to the intended project.

### Validation evidence

- Full repository tests: **228/228 passed**.
- WO-033 static/domain contracts within that run: **19/19 passed**; the SQL/security static slice is **11/11**.
- Disposable Supabase Postgres migration and rollback-only pgTAP lifecycle: **47/47 passed**. Coverage includes planned/disabled defaults, explicit activation, Owner/Member projections, mutation denial, second-tenant denial, direct-table denial, exact game context, cancelled sources/checkpoints, duplicate participant denial, chronological next checkpoint, bounded breadcrumbs, current staff action ownership, completion, archive/restore denial, downgrade disablement, record preservation, and post-downgrade RPC denial.
- Structural recovery rehearsal: dry run rolled back and preserved the migrated objects; guarded local apply removed only WO-033 objects/module rows and restored the exact pre-WO module constraint and entitlement synchronizer; the final migration reapplied and the 47 assertions passed again.
- ESLint: zero warnings. TypeScript: passed. Vite production build: **3,358 modules transformed**. Bundle budgets: passed.
- Independent source review after remediation: no remaining actionable P0-P2 findings.
- Scoped and repository `git diff --check`: passed.

### Reproducible QA sequence

1. Review the migration and recovery assets against the Phase 1 visibility, lifecycle, entitlement, and non-goal contract.
2. Recreate a fresh disposable Supabase Postgres database, apply `scripts/local-only/wo033-minimal-baseline.sql` with its exact local-only guards, apply the WO-033 migration, and run `supabase/tests/wo033_practice_development.test.sql`; expect 47 passing assertions and `ROLLBACK`.
3. Rehearse `scripts/local-only/wo033-structural-restore.sql` first with its default rollback and then only in the disposable database with the exact apply acknowledgement; verify WO-033 objects/module rows are absent and the pre-WO synchronizer is restored.
4. Do not apply the hosted migration, enable a tenant module, deploy frontend/functions, regenerate database types, or claim customer availability without a new exact Theo approval naming the production-backed project and scope.
5. After that approval and application, regenerate Supabase types, run Security/Performance Advisors, and execute the isolated Owner/Admin/Member/Viewer plus Free/Pro/Elite and second-tenant browser/direct-RPC matrix on desktop and 390px mobile.

### Known unverified areas

- The repository's complete from-zero Supabase migration chain is independently incomplete for the current CLI because legacy hyphenated migration names are skipped and the later chain assumes an earlier base schema. WO-033 was therefore validated against a guarded minimal pre-WO fixture and current hosted metadata, not claimed as a full-chain reset pass.
- No hosted migration, data mutation, module activation, frontend deployment, authenticated browser check, Advisor review, or generated-type refresh was performed.
- The failed-link retry identifier is session-scoped in the browser and is always re-authorised by the attach RPC; no browser storage is an authorization control.

## Independent QA and release audit - 2026-08-03

### 1. Release verdict: HOLD

WO-033 is locally implemented and strongly source-tested, but it is not ready for hosted migration, activation, deployment, customer availability, or release. No defect requiring a source correction was found in this audit; the release hold is the required evidence and approval boundary for a high-risk tenant-data and entitlement change.

### 2. What was verified

- **Implementation / scope:** Phase 2 commit `32b6ceb3d1536d4e0f48955477fcc2ae918c22fa` is bounded to the designed practice-development loop, its recovery assets, and the existing Scrim/Coaching Action integration points. It does not add a Free/Pro navigation, upsell, billing, provider, Discord, or notification-automation surface.
- **Database authorization:** The four new tenant-owned tables enable RLS and revoke browser-role table access. Customer reads and mutations use fixed-empty-search-path `SECURITY DEFINER` RPCs with derived `auth.uid()`, tenant membership, exact Elite plus `live` plus enabled-module checks, Owner/Admin mutation enforcement, same-tenant source validation, version checks, and locked `authenticated` execution grants.
- **Tenant and data handling:** The shaped getter returns a distinct staff or team projection; the non-staff projection omits staff notes, raw source payloads, Auth identifiers, and recovery details. The migration defaults every tenant to `planned/false`, fails closed on downgrade, and does not auto-enable a later Elite upgrade.
- **Recovery:** The prepared disable path preserves records and is scoped to one approved tenant; structural restoration is guarded as disposable-local-only. The recovery runbook correctly distinguishes source recovery from hosted-schema/data recovery.
- **Independent local validation:** The full repository command using the bundled Node runtime passed **228/228** tests on 2026-08-03, including all 11 WO-033 static/security contracts. `git diff --check` passed.

### 3. Blocking issues

- **Blocking:** The repository cannot currently demonstrate a complete from-zero Supabase migration chain; the WO-033 database lifecycle was instead tested against a guarded minimal pre-WO fixture. This does not establish safe application to the real hosted upgrade path.
- **Blocking:** No hosted migration, generated-type refresh, module activation, deployment, authenticated browser journey, direct-RPC role/tenant/plan matrix, or Supabase Advisor export exists. These are required before any release or customer-availability claim.

### 4. Important risks

- **Important:** The migration replaces the shared plan-entitlement synchronizer. Its source diff preserves existing module behaviour and makes the new module additive/fail-closed, but that shared-trigger behaviour still needs hosted upgrade-path evidence.
- **Important:** A successful local migration and disposable pgTAP run do not prove existing production-backed schema compatibility, current grants, browser cache invalidation, or deployed client/server contract compatibility.

### 5. Unverified but required checks

- **Unverified:** Explicit Theo approval naming the hosted project and isolated fixture scope; backup/PITR confirmation; reviewed migration application; generated `supabase` types; Security and Performance Advisor exports; isolated Elite owner/admin/member/viewer, Free/Pro, second-tenant, direct-RPC, desktop/mobile, cache-invalidation, and recovery-disable matrix.

### 6. Suggested fixes or next validation steps

1. **Theo:** if hosted QA is desired, approve only a named non-customer environment/project, one isolated Elite fixture tenant, named Free/Pro/tenant-B controls, migration window, and rollback/PITR evidence. Do not approve general Elite activation, customer data, billing, or production release through this work order.
2. **Core / QA:** before applying anything hosted, reconcile the legacy migration-chain limitation against the intended project's actual migration history and perform a read-only preflight for constraints, grants, function signatures, and existing module rows. After an approved application, regenerate types, export Advisors, then run the full hosted matrix before revisiting this verdict.

## Hosted QA environment preflight - 2026-08-03

### 1. Release verdict: HOLD

Hosted QA is blocked before migration because the requested data-free Supabase branch cannot be created on the organisation's current plan. No hosted schema, data, fixture, module, deployment, or customer state changed.

### 2. What was verified

- The configured active project `tvcgjehreaayfazlhvps` is healthy and has the required pre-WO-033 schema dependencies, including the entitlement synchronizer, collector helper, past-due column, feature release state, and module constraint.
- Its migration history does not yet include WO-033.
- The sole available branch is the active main project; it is not an isolated QA branch.
- Supabase quoted a data-free branch cost of `$0.01344/hour`, but branch creation returned `PaymentRequiredException`: database branching is available only on Pro plan or above.

### 3. Blocking issues

- **Blocking:** No isolated hosted Supabase environment is available under the current plan. Applying this high-risk migration to the active shared project would exceed the approved non-customer QA boundary.

### 4. Important risks

- **Important:** The active project is named `ScrimStats.gg` and carries shared migration history. It must not be treated as disposable staging merely because the web URL is staging.

### 5. Unverified but required checks

- **Unverified:** Isolated branch/project availability, its recoverability/backup position, migration application, generated types, Advisor export, module activation, deployment, and the complete hosted matrix.

### 6. Suggested fixes or next validation steps

1. **Theo:** choose one explicit path: approve a new paid Supabase project in a named organisation/region and its recurring cost, upgrade the existing organisation to a plan supporting branches, or defer hosted QA and keep WO-033 blocked.
2. **QA:** after a safe environment exists, repeat the current schema preflight there before any migration. Do not use the active shared project as a substitute.

## Production migration and hosted QA audit - 2026-08-03

### 1. Release verdict: CONDITIONAL

The approved WO-033 migration is applied to the active `ScrimStats.gg` Supabase project and the matching application revision is browser-verified on staging. The result is conditionally acceptable for the named non-customer Elite QA fixture only. It is **not** production-ready or approved for general Elite/customer activation.

### 2. What was verified

- **Production migration:** Theo explicitly approved application to the active project after confirming an SQL backup. The `elite_practice_development_loop` migration was applied successfully and recorded by the management API as version `20260803141125`. The local source migration remains `20260803120727_elite_practice_development_loop.sql` (SHA-256 `CD98A098506A18F6B299A16EABE1ADADF8FA9A1E82AB7D4B0A08F7ACBC5B7318`); the differing management version is recorded provenance, not a claim of identical history naming.
- **Fail-closed default:** all 115 existing module rows were created `planned/disabled`; no general tenant was enabled. Only `WO-024 QA Tenant A` was deliberately enabled `live/true`. Elite `WO-024 QA Tenant B` remains the disabled control.
- **Database safety:** all four new tables have RLS enabled, browser table grants are absent, and no broad public/anonymous execution grants exist. The exposed `SECURITY DEFINER` RPCs use fixed search paths and authenticated execution is intentional because each RPC rechecks Auth, tenant membership, Elite tier, `live` state, enabled state, and role. The Security Advisor's new practice-development warnings are therefore expected `authenticated SECURITY DEFINER` notices, not a bypass.
- **Hosted authorization:** direct authenticated RPC simulation verified owner/admin `staff-v1`, member/viewer `team-v1`, member mutation denial (`42501`), viewer staff-note redaction, disabled-control denial, and a separate unrelated QA tenant's cross-tenant read denial.
- **Hosted UI/deployment:** the initial browser result correctly found the old bundle missing the panel. `codex/Staging` was then pushed from `711fe25` through `27b1b10`; authenticated staging now renders the owner panel, objective, staff-only context, truthful missing-evidence/action states, and lifecycle controls for the named QA fixture.
- **Build/type evidence:** Supabase TypeScript types were regenerated from the applied project; TypeScript and production Vite build passed. Independent local test evidence remains 228/228 passed.
- **Advisors:** Performance Advisor reports only improvement-level unindexed-FK/unused-new-index notices for the new tables. No newly identified Advisor error or security bypass was found.

### 3. Blocking issues

- **Blocking for general release:** no production/customer availability approval exists. Do not enable this module for a customer tenant, represent it as a live Elite entitlement, or treat the staging result as production release evidence.

### 4. Important risks

- **Important:** the approved migration was applied to the active shared project because no funded isolated branch was available. The module default prevented broad access, but the schema change is real production state and requires the documented recovery procedure if rollback is needed.
- **Important:** Owner/admin browser behaviour is verified; member/viewer browser journeys, responsive 390px layout, complete evidence-to-action-to-completion lifecycle, and cache-refresh/error paths are not yet browser-verified.
- **Important:** Free/Pro server and browser negative matrices were not performed against dedicated current fixtures. The explicit server predicate is present and an Elite-disabled control passed, but that is not a replacement for plan-matrix evidence.
- **Improvement:** review the Advisor's new foreign-key index notices before material volume; no current QA evidence indicates a customer-impacting performance failure.

### 5. Unverified but required checks

- **Unverified:** dedicated Free and Pro direct-RPC/browser denials; authenticated member/viewer browser sessions; mobile responsive UI; action assignment, reviewed evidence, completion, archive/restore and recovery-disable lifecycle; and staging error/cache-refresh behaviour.
- **Unverified:** an application deployment record or build log that independently attributes the staging bundle to `27b1b10`; the authenticated rendered result is strong hosted evidence but not a substitute for release observability.
- **Unverified:** production smoke test and an explicit Theo release decision. Neither follows from migration application or staging QA.

### 6. Suggested fixes or next validation steps

1. **QA / Theo:** retain `WO-024 QA Tenant A` as the sole enabled fixture and use its existing member/viewer accounts for the remaining browser and 390px checks. Provide a safe Free and Pro fixture/login only if plan-matrix closure is desired.
2. **Core:** assess the new Advisor index notices; no production schema alteration is authorised by this audit.
3. **Theo:** before any customer activation or production release, give a separate exact approval naming the target tenant(s), rollout scope, and required smoke/monitoring evidence. Otherwise leave all non-QA module rows `planned/disabled`.

## Hosted QA continuation - 2026-08-03

### 1. Release verdict: CONDITIONAL

The named QA fixture has stronger server-side plan and lifecycle evidence, but the work order remains conditional and In Progress: direct authorization is not a substitute for the remaining authenticated browser-role and actual-device-width checks.

### 2. What was verified

- **Plan denial:** a dedicated Free QA owner returned `false` from `has_practice_development_access`. That same non-customer fixture was then set to Pro for QA only; it remained `planned/disabled` and returned `false`. No checkout, Stripe, customer plan, or general entitlement changed.
- **Lifecycle:** an Owner-authenticated transaction successfully transitioned the QA objective `planned -> blocked`, archived it, then restored it (`version 4`). The transaction rolled back, so the existing fixture record was not changed by this exercise.
- **Responsive harness honesty:** the browser viewport override was requested at 390x844 but the live document retained a 1274px client width. It was reset immediately. This is recorded as an attempted check, not mobile verification.

### 3. Blocking issues

- **Blocking for release:** production/customer activation is still unapproved. The feature must remain limited to the named QA fixture.

### 4. Important risks

- **Important:** current owner browser evidence does not prove member/viewer presentation or mutation-control UX.
- **Important:** the available browser viewport mechanism did not produce an actual 390px document width, so responsive layout remains unverified rather than inferred.

### 5. Unverified but required checks

- **Unverified:** authenticated member and viewer browser sessions on the QA fixture, including absence of staff-only text and controls; an actual 390px device/browser viewport; and the complete linked-evidence/action/completion browser flow.

### 6. Suggested fixes or next validation steps

1. **Theo:** sign in to the existing WO-024 QA Tenant A viewer account in the in-app browser and tell QA when it is ready. Repeat with the member account if available. No new account or customer workspace is required.
2. **QA:** use an actual 390px browser/device surface once available, then complete the visible role and lifecycle checks.

## Viewer browser QA - 2026-08-03

### 1. Release verdict: CONDITIONAL

The viewer's authenticated staging journey now confirms the intended safe projection. The work order remains conditional because the member browser, actual-mobile-width, and full evidence/action completion checks are still outstanding.

### 2. What was verified

- The signed-in QA user is a **viewer** in `WO-024 QA Tenant A` and reaches the enabled QA scrim in staging.
- The Elite practice-development panel renders with the explicit **Read only** state.
- The viewer receives the objective, evidence standard, truthful missing-evidence/action states, and next-session state.
- The staff-only context/note is absent, and no Edit objective, Mark blocked, Archive, Add game, Edit block, Complete review, or other practice mutation control is rendered.

### 3. Blocking issues

- **Blocking for release:** customer activation and production release remain separately unapproved.

### 4. Important risks

- **Important:** this one hosted viewer journey does not prove the member browser projection or actual mobile responsiveness.

### 5. Unverified but required checks

- **Unverified:** authenticated member browser state; actual 390px device/browser layout; linked evidence, action assignment, completion, error, and cache-refresh paths.

### 6. Suggested fixes or next validation steps

1. **Theo:** sign in as the existing QA Tenant A member and reply `ready` if member-browser closure is desired.
2. **QA:** complete the remaining UI lifecycle and actual-device check before requesting any production activation decision.

## Member browser QA - 2026-08-03

### 1. Release verdict: CONDITIONAL

The member browser projection is verified and matches the safe read-only contract. The audit remains conditional pending actual-mobile-width and complete owner lifecycle UI evidence.

### 2. What was verified

- The signed-in QA user is a **member** in `WO-024 QA Tenant A` and reaches the enabled QA scrim in staging.
- The panel renders the explicit **Read only** state, the permitted objective/evidence/action status, and next-session state.
- Staff-only context/note and all objective, game-review, and practice lifecycle mutation controls are absent.

### 3. Blocking issues

- **Blocking for release:** customer activation and production release remain separately unapproved.

### 4. Important risks

- **Important:** mobile rendering and the complete linked-evidence/action/completion browser lifecycle are still unverified.

### 5. Unverified but required checks

- **Unverified:** actual 390px device/browser layout; Owner browser creation of evidence/action and completion; cache/error handling through that lifecycle.

### 6. Suggested fixes or next validation steps

1. **Theo:** sign back in as the existing QA Tenant A owner and reply `ready` to continue the owner UI lifecycle test.
2. **QA:** obtain actual 390px device/browser evidence before any release decision.

## Owner evidence workflow browser QA - 2026-08-03

### 1. Release verdict: CONDITIONAL

The owner browser workflow is verified through saved review, explicit evidence linking, and staff review. It remains conditional because follow-up creation/completion and actual-mobile-width evidence are not yet closed.

### 2. What was verified

- The owner added one explicitly labelled QA-only game review. The UI required a performance rating and team summary and retained missing result/side/stat fields as **Not recorded** rather than inventing data.
- The QA game was deliberately moved into a completed, past QA block so it became an eligible evidence source; the owner UI then exposed **Link game 1**.
- Linking succeeded, changed the state to **Linked for review**, and made clear that a linked source is not proof by itself.
- Owner staff review succeeded with a truthful observation and changed the objective to **Evidence linked** / **Reviewed**, without claiming improvement. The UI then unlocked **Assign follow-up** and kept **Complete** disabled until an accountable action is complete.
- The existing coaching-action assignment dialog opens with the objective/evidence prefill, applies the required due-date rule, and supports whole-team scope without a roster-player requirement.

### 3. Blocking issues

- **Blocking for release:** customer activation and production release remain separately unapproved.

### 4. Important risks

- **Important:** automated browser control could not populate the native `datetime-local` Due date field, so it cannot submit the follow-up dialog in this session. This is an automation limitation, not a recorded product failure.
- **Important:** actual 390px device/browser layout and final action-complete/objective-complete/cache-error paths remain unverified.

### 5. Unverified but required checks

- **Unverified:** browser follow-up submission, action completion, objective completion, and next-session checkpoint state; actual 390px device/browser layout; cache/error handling through that end-to-end path.

### 6. Suggested fixes or next validation steps

1. **Theo:** in the already-open non-customer QA dialog, enter a future **Review by** date/time and select **Assign action cycle**, then reply `ready`. This creates only the approved QA follow-up and lets QA finish the final browser lifecycle checks.
2. **QA:** afterwards verify the linked action, complete it only in the QA fixture, confirm objective completion/next-session state, and retain the evidence as conditional—not production-release—proof.

## Owner end-to-end browser lifecycle QA - 2026-08-03

### 1. Release verdict: CONDITIONAL

The full approved owner workflow is now browser-verified in staging for the named non-customer fixture. It remains conditional—not production-ready—because actual-mobile-width and formal release/monitoring evidence are not complete.

### 2. What was verified

- The owner created and saved the QA review, linked the completed QA game, reviewed the evidence, and the UI consistently distinguished linked evidence from reviewed evidence and neither from proof of improvement.
- The reviewed evidence unlocked the canonical coaching-action dialog; Theo entered the required future review date and submitted the QA-only whole-team action.
- In the canonical action ledger, the owner recorded **Practised**, moved the action to **Ready for review**, entered a factual staff observation, and recorded the outcome. The action became **complete**.
- Returning to the scrim refreshed the practice loop without a manual cache repair: the completed action enabled objective completion. The owner entered a factual completion summary and the objective changed to **Completed**.
- The next-session state truthfully reports **unavailable** because the fixture has no later checkpoint. The panel explicitly states that workflow completion does not prove lasting team or player improvement.

### 3. Blocking issues

- **Blocking for general release:** no customer activation or production release approval exists. All non-QA tenants must remain `planned/disabled`.

### 4. Important risks

- **Important:** actual 390px mobile/device layout remains unverified; the in-app viewport override did not yield a mobile document width.
- **Important:** no production observability/smoke window or customer-facing rollout evidence exists. The active shared-project migration is not itself a release approval.

### 5. Unverified but required checks

- **Unverified:** real 390px device/browser render; production smoke/observability under a separate release decision. Error-state recovery beyond the validated cache refresh has not been browser-exercised.

### 6. Suggested fixes or next validation steps

1. **Theo:** either supply an actual 390px device/browser check or explicitly accept that residual staging evidence risk for a conditional QA closure. Neither choice authorises customer activation.
2. **QA / Theo:** keep the durable records in `WO-024 QA Tenant A` as evidence. Before any customer rollout, require a separate named tenant rollout, production smoke/monitoring plan, and explicit release approval.

## Conditional QA closure - 2026-08-03

### 1. Release verdict: CONDITIONAL

Theo accepted the remaining actual-mobile-layout evidence risk. WO-033 is **Done (conditional)** for the approved non-customer staging QA scope. This is not a production deployment, customer activation, or general Elite availability decision.

### 2. What was verified

- Migration, RLS/grants/function checks, generated types, TypeScript/build, local tests, Security/Performance Advisor review, hosted plan/role/tenant checks, and the complete owner/member/viewer staging workflow are recorded above.
- The durable QA fixture proves the owner flow from objective through reviewed evidence, completed coaching action, and completed objective while preserving truthful unavailable/not-recorded states and field-level role protection.

### 3. Blocking issues

- **Blocking for production release:** no separate customer rollout, production smoke/monitoring evidence, or release approval exists.

### 4. Important risks

- **Important, accepted by Theo:** no actual 390px device/browser evidence was obtained. The in-app viewport override did not produce a mobile document width.

### 5. Unverified but required checks

- **Unverified before production/customer activation:** actual mobile render, named customer-tenant rollout, production smoke/observability, and an explicit release decision.

### 6. Suggested fixes or next validation steps

1. **Theo / release owner:** keep all non-QA `practice_development` rows `planned/disabled` until a separately approved rollout.
2. **QA:** reopen this work order only for a new defect, a new developer handoff, a Ready-for-QA item, or a separately approved production release candidate.
