# WO-2026-033 - Build the Elite practice-development loop

- **ID reservation:** [WO-2026-033 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Ready for QA
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
