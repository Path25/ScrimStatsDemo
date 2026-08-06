# WO-2026-036 - Build repeatable Elite opponent-preparation playbooks

- **ID reservation:** [WO-2026-036 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Done
- **Assigned owner:** QA and Release Auditor
- **Size:** L
- **Risk:** High
- **Priority:** Medium
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** Scouting, Draft, opponent records, patch/source provenance, playbook data/RLS/RPCs, role capabilities, review links, tests, and operational docs.
- **Dependencies:** WO-2026-032 approved proposition, existing tenant-owned Scouting/Draft/manual opponent evidence, reviewed tenant-safe design, isolated Elite/Pro/Free role fixtures, and Theo implementation approval. WO-2026-035 remains parked: Phase 1 must not depend on an external source path.
- **Collision risk:** Shared Scouting/Draft/provider data and permissions. Do not overlap with source integration, champion catalogue, or broad scouting/draft refactors.

## Problem and user impact

Existing scouting and Draft capabilities can help analyse a match-up, but staff need a reusable, season-long way to turn trusted opponent evidence into a match-week preparation plan and record what was actually tested.

## Scope

- Add tenant-scoped, staff-approved opponent-preparation playbooks that connect only existing tenant-owned Scouting/Draft/manual opponent evidence, recorded patch context where it already exists, draft priorities, assigned preparation actions, and post-match review links.
- Let staff record explicit editorial judgement and missing/insufficient evidence. Keep each included record dated and attributable to its existing tenant-owned source; do not infer opponent tendencies from incomplete data.
- Preserve Pro scouting/Draft analysis while reserving the repeatable playbook workflow for an approved future Elite boundary.

## Explicit non-goals

- No official/provider data ingestion, external links/resources, raw VOD hosting, embedding, scraping, automatic win/prediction claims, cross-tenant intelligence sharing, or organisation-wide playbook sharing.
- No expansion into a generic knowledge base.

## Acceptance criteria

- Authorised Elite staff can create, approve, revise, and archive a tenant-owned playbook linked only to permitted existing workspace evidence or an explicit insufficient-evidence record.
- A playbook shows the recorded patch/context where available, source date, staff judgement, open preparation actions, and linked review outcome without presenting unsupported tendencies as fact.
- Free/Pro/ineligible roles and other tenants cannot read or mutate playbooks below the browser layer.
- Hosted role/tenant/entitlement evidence and source-provenance checks pass.

## Relevant files, workflows, or data areas

- `src/pages/Scouting.tsx`, Draft surfaces, opponent/game evidence, coaching actions, role capabilities, tenant helpers, future source contract WO-2026-035.
- Phase 1 design checkpoint: [`WO-2026-036-PHASE-1-DESIGN.md`](../WO-2026-036-PHASE-1-DESIGN.md).

## Risks

- **Permissions / Supabase RLS:** High. Playbooks are sensitive competitive intelligence; enforce membership, role, tenant predicates, and safe revision history.
- **Billing / entitlement:** High. Elite boundary must be server-side and agree with plan presentation.
- **Email / customer communication:** No automated recap/distribution is in scope.
- **Production / data:** High. New data model and any source integration require explicit approval, provenance, and recovery.

## Required validation

- Focused contracts; lint/typecheck/build; migration/RLS/grant/function/Advisor review.
- Isolated Elite/Pro/Free and owner/admin/member/viewer/two-tenant browser/direct mutation matrix.
- Verify local source reference, date/context, and missing/insufficient-evidence rendering. External-source freshness/provenance is not part of Phase 1 and remains governed by the parked WO-2026-035.

## QA scenario / reproducible test steps

1. Prepare isolated Elite tenant A with existing tenant-owned permitted fixture evidence and Free/Pro/tenant B controls.
2. Create, approve, revise, and archive one playbook with a patch date and assigned preparation action.
3. Confirm permitted staff see linked evidence and explicit judgement; exercise role/plan/tenant denials directly and in the browser.
4. Verify missing or insufficient tenant-owned evidence is visibly unavailable/insufficient, not silently presented as an external or current fact.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Preserve bounded match-week outcome. | WO-032 |
| Developer â€“ Fast Lane | Not applicable | L/high-risk shared data and intelligence work. | N/A |
| Core Features Developer | Involved | Implement playbook workflow and security boundary. | Commit/PR |
| QA and Release Auditor | Involved | Verify role/tenant/entitlement and provenance evidence. | QA pack |
| Technical Reporting Analyst | Involved | Validate source freshness/provenance model. | WO-035 |
| Lead Marketer and Growth | Consulted | Review future claims only. | Message Ledger |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Tenant-safe playbook lifecycle | Hosted Owner browser evidence in named non-customer Elite fixture | Hosted browser | Conditional pass: lifecycle exercised; completed-review link remains open |
| Tenant-owned evidence/date/context provenance | Source-reference contract and QA evidence | Hosted browser | Conditional pass: dated tenant-owned scouting evidence and explicit staff judgement rendered; unavailable/insufficient paths remain open |
| Role/plan/tenant enforcement | RLS/function/browser matrix | Hosted browser / local / QA-hosted rollback-only harness | Pass: browser role/plan/tenant controls are QA-verified; QA independently executed the exact rollback-only hosted harness without its fail-closed matrix exception and confirmed post-run fail-closed module invariants |

### Final verdict

- **Verdict:** CONDITIONAL
- **Rationale:** Theo accepted closure of the remaining fixture-only workflow evidence risk on 2026-08-04. QA independently verified the named-fixture Owner lifecycle, dated tenant-owned provenance display, Tenant B isolation, Elite Member/Viewer UI denial, Elite Admin positive controls, Free/Pro browser denial, 390x844 Owner presentation, and the exact rollback-only hosted authorization harness. Completed same-opponent review, cross-workflow breadcrumbs, and unavailable/insufficient evidence remain preserved as unverified residual risk. External intelligence remains deliberately out of scope. This does not approve customer activation, production deployment, or release.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Phase 1 design and tenant-safe boundary | Core / PM | Reviewed design and acceptance handoff | Complete (accepted 2026-08-03) |
| Implementation approval | Theo | Written approval | Complete (2026-08-03) |
| Phase 2B application projection and workflow | Core | Local implementation, contracts, build and responsive shell check | Complete locally (2026-08-03) |
| Hosted additive schema and generated client contract | Core | Migration record, catalog/ACL checks, empty-table proof, generated types, Advisor review | Complete (2026-08-03) |
| Hosted QA | QA and Release Auditor | Lifecycle, browser-role, responsive, provenance, direct authorization, and cross-workflow evidence pack | Done (conditional): Theo accepted completed-review, breadcrumb, and unavailable/insufficient-state residual risk for the named QA fixtures only |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved for bounded Phase 1 | 2026-08-03 | Existing tenant-owned evidence and explicit staff judgement only; hosted migration and deployment remain separate. |
| Hosted migration and related validation | Yes | Approved | 2026-08-03 | Applied additively; no tenant activation, fixture, customer data, billing, deployment, or release action was performed. |
| Staging deployment and isolated fixture activation | Yes | Approved | 2026-08-04 | Commit `52f9d62`; `WO-024 QA Tenant A` only. No customer activation or release approval. |
| Release | Yes | Pending | — | Separate after QA. |

## Decision and approval record

### Approval correction - 2026-08-03

The earlier `Implementation: Pending` table row predates Theo's Phase 1 approval and is superseded by the decision below. Implementation is approved only for the documented Elite-only staff workflow over existing tenant-owned evidence and explicit staff judgement. Migration application, deployment, billing/price changes, external sources/providers, customer claims, and release remain separately approval-gated.

- 2026-08-02 - Proposed as a later Elite repeatability layer, not a replacement for Pro scouting/Draft.
- 2026-08-03 - Theo approved Phase 1 implementation. The scope is narrowed to an Elite-only staff workflow over existing tenant-owned evidence and explicit staff judgement; WO-035 remains parked, so all external source/provider/resource capabilities are excluded.
- 2026-08-03 - Core completed the Phase 1 design checkpoint. It defines an Owner/Admin-only, exact Elite/live/enabled RPC boundary; immutable approved revisions; canonical Scouting/Draft/Coaching Action/Scrim review links; explicit insufficient and unavailable states; fail-closed module defaults; recovery; and the full role/plan/tenant/provenance QA matrix. No migration, hosted mutation, deployment, billing change, or customer activation occurred.
- 2026-08-03 - Theo reviewed and accepted the Phase 1 design and approved local migration/security-boundary implementation. Hosted migration application and deployment remain separately approval-gated.
- 2026-08-03 - Theo approved Phase 2B. Core implemented the staff projection, primary Scouting workflow, and bounded Draft/Coaching Action/Scrim breadcrumbs. No hosted migration, tenant activation, deployment, billing change, external source, or release occurred.
- 2026-08-03 - Theo approved the hosted migration and related hosted validation. Core applied the additive migration and regenerated hosted types. No tenant module was activated, no fixture or customer record was created, and deployment and release remain separate.
- 2026-08-04 - Theo approved the staging push/deployment and controlled isolated Elite QA activation. Core pushed `52f9d62`, deployed the exact Git candidate, and enabled `opponent_preparation` only for `WO-024 QA Tenant A`. Tenant B and every other tenant remain disabled controls; release remains separate.

## Implementation and review evidence

- Current Scouting/Draft provide the Phase 1 foundation but no verified repeatable Elite playbook workflow.
- Phase 1 design: [`WO-2026-036-PHASE-1-DESIGN.md`](../WO-2026-036-PHASE-1-DESIGN.md).
- Design review established that existing Pro Scouting and Draft remain unchanged; WO-036 adds only a staff-only Elite orchestration layer with locked base tables and server-shaped access.
- **Highest evidence achieved:** Phase 1 design accepted; local migration/security-boundary implementation is authorised and in progress. Hosted migration, deployment, and hosted evidence remain outstanding.
- **Highest evidence achieved:** Phase 2B is implemented and the additive schema/client contract is hosted and validated without activation. Deployment, authenticated enabled-module browser evidence, QA audit, and release approval remain outstanding.

### Phase 2A local database/security boundary - 2026-08-03

- Added the CLI-named additive migration `20260803204749_elite_opponent_preparation.sql`. It registers `opponent_preparation` fail-closed as `planned/false`, preserves downgrade shutdown, requires an exact currently-entitled Elite workspace plus `live/enabled` module state and Owner/Admin membership, and never activates an existing tenant.
- Added six private relations: five workflow-state tables plus append-only events. Browser roles have no direct table grants; all tables use forced RLS; authenticated access is limited to shaped, fixed-search-path RPCs with explicit grants and server-side authorization.
- Added immutable approved revisions, append-only audit history, optimistic version checks, composite tenant foreign keys, indexed references, canonical source/action/review validation, explicit insufficient/unavailable states, archive/restore provenance, and a closed tenant-owned source enum.
- Read-only hosted catalog inspection confirmed the referenced columns, review state, composite uniqueness, and source/action indexes on the shared Supabase project. No hosted DDL, data, module state, generated type, frontend deployment, provider, billing, or customer state changed.
- The repository's historical migration chain cannot currently reset from zero because older migrations rely on a remote-era baseline and include legacy filenames the current CLI skips. To validate this change without rewriting history, Core applied the exact migration to an isolated local Supabase stack with a temporary dependency-only baseline. Migration application passed; warning-level database lint returned no findings; and a rolled-back behavior matrix passed Elite Owner access, Member/Pro/cross-tenant denial, direct-table denial, create/link/approve/read/review behavior, explicit insufficient evidence, and revision/event immutability.
- Focused contract tests passed 5/5; the full repository passed 238/238 tests, ESLint with zero warnings, TypeScript, the production Vite build, and bundle budget.
- **Highest evidence achieved:** locally implemented and database-behavior verified. WO-036 remains **In Progress** because the application projection/UI, generated hosted types, authenticated browser matrix, hosted migration/Advisor evidence, deployment, and QA audit are not part of this checkpoint and remain outstanding.

### Phase 2B application projection and workflow - 2026-08-03

- Added the exact browser-side gate for a currently entitled Elite workspace, `live/enabled` `opponent_preparation` module, and Owner/Admin role. Unknown, loading, failed, Free, Pro, Member, and Viewer states fail closed; tenant/role/module changes invalidate preparation caches.
- Added a strict `opponent-preparation-v1` / `staff-v1` projection parser, a narrow RPC adapter pending hosted type regeneration, and tenant/opponent/role/module-safe React Query hooks. New playbook tables remain RPC-only in browser code; option lists read only existing canonical tenant-owned Scouting, immutable Draft, Coaching Action, and Scrim records.
- Added the primary staff surface to the opponent Scouting report: create/edit draft, dated evidence and explicit insufficiency, staff judgement, canonical preparation actions, approval blockers, immutable approved history, later completed-review outcomes, revision creation, and archive/restore. Unavailable/superseded sources and failed option loads are explicit and retryable; database-aligned input limits are enforced in the UI.
- Added a bounded shaped breadcrumb RPC and compact staff-only breadcrumbs from linked Draft preparation briefs/playbooks, Coaching Actions, and Scrim Blocks back to the opponent preparation report. The RPC accepts only four closed context types and at most 100 IDs.
- Focused security/UI contracts pass 10/10. Full repository validation passes ESLint with zero warnings, TypeScript, 243/243 tests, production Vite build, and bundle budget.
- Reapplied the exact final migration to a fresh isolated Supabase stack with a dependency-only baseline. Migration reset passed, warning-level database lint returned zero findings, and a disposable behavior fixture passed create/link/approve plus action/scrim breadcrumb projection, source-type separation, and fail-closed module disablement. The stack and fixtures were removed afterward.
- Local browser checks at 1280px and 390px reached the app with no horizontal overflow or console warnings, then correctly redirected to sign-in. This verifies only the local unauthenticated shell, not the new enabled staff surface.
- **Highest evidence achieved:** locally implemented, locally database-behavior verified, and compilation/build verified. WO-036 remains **In Progress** pending hosted migration approval/application, generated Supabase type regeneration, frontend deployment approval/deployment, authenticated Owner/Admin workflow and denial matrix, cross-tenant/direct mutation checks against the hosted candidate, Advisor review, and QA & Release Auditor verdict.

### Hosted migration, security, and generated-type evidence - 2026-08-03

- Theo approved the hosted migration and related validation. Supabase recorded the additive migration as `20260803221912 elite_opponent_preparation`; the repository source remains `20260803204749_elite_opponent_preparation.sql`.
- All 115 existing tenant module rows remain `planned/false`; zero tenants report the feature available. The six new base tables use forced RLS, grant neither anonymous nor authenticated browser DML, and contain zero rows. No fixture, tenant activation, billing change, or customer-data mutation occurred.
- The public RPC surface grants execution only to `authenticated`; helper functions grant neither browser role. All functions have a fixed empty search path, and an authenticated database role without an Auth identity returned `false` from the access predicate.
- Hosted Supabase types were regenerated and the browser RPC adapter now uses the generated `Database["public"]["Functions"]` contract without an unsafe cast.
- The hosted Security Advisor reports the six locked tables as RLS-without-policy and the authenticated shaped RPCs as executable `SECURITY DEFINER` functions. These findings are intentional for the locked-table/shaped-RPC design: browser tables have no DML grants, while every public RPC delegates to the exact Elite/live/enabled/Owner-or-Admin server guard. Performance Advisor reports new foreign-key and unused-index notices; the composite equality paths are indexed and unused-index notices are expected before activation. These findings must be re-audited if the access model or query paths change.
- **Highest evidence achieved:** hosted schema, catalog, ACL, empty-state, fail-closed identity, generated-client, and Advisor inspected. This is not an authenticated enabled-module workflow test, staging deployment, QA verdict, or release approval.

### Staging deployment, isolated activation, and Core hosted handoff - 2026-08-04

- Pushed the reviewed five-commit staging chain through `52f9d62d6a593e63e5f3cb399ff3ce2368a48d50` to `origin/codex/Staging`. Vercel deployment `dpl_2NMVKZBTD1t6PQRWTvU4Zi6WqCcf` built from that exact Git SHA, reached `READY`, and has both `staging.scrimstats.gg` and the `codex/Staging` branch alias with no alias error.
- Enabled `opponent_preparation = live/true` only for the established non-customer Elite fixture `WO-024 QA Tenant A`. The post-change invariant is 1 enabled row, 114 planned/disabled rows, and 0 unexpectedly changed other tenants. `WO-024 QA Tenant B` remains the disabled Elite control.
- Direct hosted authorization simulation passed: Tenant A Owner and Admin returned access; Tenant A Member and Viewer returned denial; an unrelated authenticated user returned denial. Rolled-back live-module simulations returned denial for dedicated Free and Pro owners, so the plan boundary was tested independently without persisting a Free/Pro activation.
- The authenticated staging Owner session renders the `Opponent preparation` panel and `Start preparation` action for the existing QA opponent after a forced reload. Console warning/error capture was empty. No playbook, revision, evidence, action, review, or event row was created; all six workflow tables remain empty.
- A requested 390px override did not take effect in the connected in-app browser: the page still reported a 1274px client width. This is explicitly **not** mobile evidence and remains for QA on a controllable 390px viewport.
- **Highest evidence achieved:** exact candidate deployed; isolated fixture activated; direct hosted plan/role/tenant predicate verified; authenticated Owner empty-state surface browser verified. This is not lifecycle completion, Member/Viewer browser proof, cross-workflow breadcrumb proof, mobile proof, QA acceptance, customer availability, or release approval.

### Reproducible QA handoff after approved hosted migration and deployment

1. Use isolated Elite tenant A with `opponent_preparation = live/enabled`, Owner and Admin accounts, and existing same-opponent Scouting evidence, an immutable preparation brief or Draft playbook, a nonarchived Coaching Action, and Scrim Blocks. Keep Pro/Free, Member/Viewer, and tenant B controls.
2. In the opponent Scouting report, create a draft; verify optional fixture/context/patch remain “not recorded” unless entered. Link dated tenant-owned evidence and a canonical action, record explicit staff judgement, approve, create a new revision, and confirm the approved revision cannot be edited.
3. Exercise explicit insufficient evidence, unavailable/superseded evidence, option-load failure/retry, archive/restore, and a completed same-opponent Scrim review outcome. Confirm the UI never substitutes external or inferred claims.
4. Verify breadcrumbs from the linked Draft record, Coaching Action, fixture Scrim, and completed review Scrim return to the correct opponent report and disappear when the playbook is archived or the link is removed.
5. Verify Owner/Admin positive paths on desktop and mobile. Verify Elite Member/Viewer, all Free/Pro roles, disabled/non-live module, other tenant, unauthenticated, direct-table, cross-tenant-ID, stale-version, invalid-source, and oversized breadcrumb requests fail below the browser layer.

### QA audit - 2026-08-04

- **Release verdict:** HOLD. This is isolated non-customer fixture evidence only; no customer availability or production release is approved.
- **What was verified:** Focused security/UI contracts passed 10/10 and `git diff --check` passed. After a staging refresh, authenticated Elite Tenant A Owner QA exercised a durable named QA playbook only: create draft, staff judgement, dated same-tenant Scouting evidence link, canonical Coaching Action link, approval, immutable approved history, new revision, archive, and restore. The UI rendered unrecorded fixture/context/patch truthfully and the browser console contained no warnings/errors. Switching to disabled Elite Tenant B with Tenant A's opponent URL returned the honest `Opponent report unavailable` state, without exposing Tenant A content; the session was returned to Tenant A.
- **Blocking:** Controlled authenticated browser/direct evidence is still absent for Elite Admin positive, Elite Member and Viewer denial, independently active Free and Pro denial, unauthenticated/direct-table denial, cross-tenant-ID mutation, stale-version, invalid-source/oversized breadcrumb requests, completed same-opponent review link, Draft/Action/Scrim breadcrumb paths, unavailable/insufficient evidence, and an actual 390px viewport. These are release-critical for sensitive competitive intelligence.
- **Important:** The approved QA playbook, two revisions, evidence/action links, and archive/restore events now persist only in `WO-024 QA Tenant A`; they are intentionally non-customer audit fixtures and must remain identified as such. No customer record or tenant B data was modified.
- **Required next action:** Theo must provide or switch to controlled Elite Admin, Member, and Viewer accounts plus isolated Free/Pro controls, and a controllable 390x844 browser viewport. QA will then complete the denial, provenance, breadcrumb, and responsive matrix without creating customer data. Do not enable `opponent_preparation` for any other tenant or treat this result as release approval.

### QA evidence supplement - 2026-08-04

- Theo switched to `fridayxiiiempire@gmail.com`. Settings showed that account as an **Elite Member** in `OnceUponATeam` and, separately, in `WO-024 QA Tenant A`; Tenant A's membership list also identifies distinct Admin, Owner, and Viewer QA accounts.
- In Tenant A, the Member could read the permitted non-customer opponent evidence but the Owner-created opponent-preparation playbook was not rendered in the opponent report. The browser console had no warnings/errors. This is hosted **browser-gate** evidence only; it does not replace direct RPC/RLS denial verification.
- `clash` is Elite Owner for this account, but was not used for playbook mutation or as customer evidence.

### QA evidence supplement - 2026-08-04 (Admin)

- `deniedclassics@gmail.com` was authenticated as **Elite Admin** in `WO-024 QA Tenant A`. In the existing named QA opponent report, the Admin could see the Owner-created playbook, draft edit/archive controls, draft approval, evidence/action link controls, and completed-review link control. Console warnings/errors were absent.
- This confirms an Admin positive browser path without mutating a playbook, evidence, action, or review. It does not replace independent direct-RPC/RLS mutation and stale-version checks.

### QA evidence supplement - 2026-08-04 (Viewer)

- `pathdigitaldesigns@gmail.com` was authenticated as **Elite Viewer** in `WO-024 QA Tenant A`. The Viewer could read permitted non-customer scouting evidence, but no opponent-preparation playbook or preparation mutation controls were rendered in the opponent report. Console warnings/errors were absent.
- This is hosted browser-gate evidence only; direct RPC/RLS denial verification remains required.

### QA evidence supplement - 2026-08-04 (Free)

- `pathdigitaldesigns@gmail.com` was authenticated as **Owner** of the Free `TestWorkspace`. Settings showed `Free · active` and the current-plan billing state.
- Both `/scouting` and a direct URL to the named QA Tenant A opponent report rendered the same honest `Unlock opponent scouting` Free upgrade gate. No opponent report or opponent-preparation data was exposed; console warnings/errors were absent.
- This is hosted browser-gate and cross-tenant non-disclosure evidence only. It does not replace direct RPC/RLS denial verification.

### QA evidence supplement - 2026-08-04 (Pro)

- `pathdigitaldesigns@gmail.com` was authenticated as **Owner** of the active Pro `WO-023 QA Additional 2026-08-02` workspace. Standard Pro Scouting was available.
- With Theo's earlier QA-fixture authorization, QA created one durable non-customer record only: `WO-036 QA Pro entitlement fixture` (`be3b65c9-2e68-4f9d-91ab-0631d8e83c71`). Its report rendered the ordinary Scouting/Draft controls but no opponent-preparation panel or playbook mutation controls. Console warnings/errors were absent.
- This is hosted browser-gate evidence that the Elite playbook is not exposed to an active Pro Owner. The QA fixture must remain identified as non-customer; direct RPC/RLS denial verification remains required.

### QA evidence supplement - 2026-08-04 (390x844)

- `pathtoyourdream@gmail.com` was authenticated as **Elite Owner** in `WO-024 QA Tenant A`. With a temporary exact **390x844** browser viewport, the existing opponent-preparation report rendered the card, title, staff-judgement explanation, edit/archive controls, draft Revision 2, approval control, and unrecorded fixture/context/patch labels within the visible mobile viewport. No clipping, overlap, horizontal overflow, or console warnings/errors were observed in the inspected initial mobile viewport.
- The viewport override was reset after verification. This is hosted responsive presentation evidence only; it does not prove cross-workflow navigation or server-side authorization.

### Core direct-authorization evidence handoff - 2026-08-04

- Theo approved the narrow Core return. Core added [`supabase/verification/wo036_opponent_preparation_hosted_authorization.sql`](../../../supabase/verification/wo036_opponent_preparation_hosted_authorization.sql), an independently reproducible, fixture-bounded hosted SQL harness. It resolves only `WO-024 QA Tenant A`, disabled `WO-024 QA Tenant B`, Free `TestWorkspace`, and Pro `WO-023 QA Additional 2026-08-02`; validates their required plans, roles, opponents, draft revision, and module states; uses transaction-scoped Auth claims and application roles; fails closed if any expected result differs; and always ends in `rollback` with no `commit` path.
- The final hosted run passed **16/16** checks: authenticated browser roles have no direct table privileges; anonymous execution is revoked; Elite Owner/Admin direct getters succeed; Elite Member/Viewer, disabled Elite Tenant B, Free Owner, Pro Owner, and an authenticated database role without an Auth identity are denied; a direct locked-table read is denied; a Tenant B opponent identifier cannot be used in a Tenant A mutation; stale version, unsupported evidence source, unsupported breadcrumb context, and 101-ID breadcrumb requests are rejected with their exact server errors.
- Free/Pro module state was simulated as `live/enabled` only inside the uncommitted transaction so plan enforcement was tested independently of the normal planned/disabled state. Post-run hosted invariants confirmed exactly **1** `opponent_preparation` row remains live/enabled and **114** remain planned/disabled; the named Free, Pro, and Tenant B controls remain planned/disabled, while only Tenant A remains live/enabled. No schema, user, tenant, playbook, fixture, customer record, or durable module state was created or changed.
- The first harness run safely rolled back and identified that two draft checks attempted to read locked revision metadata after role impersonation. Core corrected the harness to snapshot only the required draft metadata before impersonation rather than granting or bypassing base-table access. The authorization design and hosted schema were not changed.
- Validation passed: focused opponent-preparation contracts **11/11**, full repository **244/244**, ESLint with zero warnings, TypeScript, production Vite build, bundle budget, and scoped `git diff --check`. The broken global Windows npm shim was bypassed with the documented bundled Node runtime; this was an environment issue, not a source failure.
- **Core handoff:** the direct-RPC/RLS evidence blocker is complete and reproducible. Ownership remains with the QA and Release Auditor to execute the completed same-opponent Scrim review, Draft/Action/fixture-Scrim/review-Scrim breadcrumb paths, and unavailable/insufficient evidence states. This remains fixture-only HOLD evidence, not customer activation, production readiness, or release approval.

### QA re-review - 2026-08-04

- **Source review:** `supabase/verification/wo036_opponent_preparation_hosted_authorization.sql` is fixture-bounded, transaction-scoped, has no commit path, snapshots only draft metadata before impersonation, fails closed on missing fixtures or unexpected results, and rolls back its temporary Free/Pro module simulation and attempted mutation checks. It does not add schema, persist customer data, or expand base-table grants.
- **Local verification:** focused opponent-preparation contracts passed **11/11**. The added contract asserts rollback-only structure, named QA-fixture scope, claim/role impersonation, and the direct denial cases recorded in the handoff. `git diff --check` passed.
- **Evidence classification:** the reported hosted **16/16** result is credible **Core-hosted verification**, not independent QA-hosted verification: QA did not execute the script against the hosted project this audit. The result therefore remains conditional until Theo explicitly approves QA execution of this exact rollback-only script through an approved hosted SQL route.
- **Residual workflow blocker:** completed same-opponent review, Draft/Action/fixture-Scrim/review-Scrim breadcrumbs, and unavailable/insufficient evidence states are still not browser-verified. The release verdict remains HOLD.

### QA hosted direct-authorization execution - 2026-08-04

- Theo explicitly approved execution of the exact `supabase/verification/wo036_opponent_preparation_hosted_authorization.sql` harness against hosted project `tvcgjehreaayfazlhvps`. QA confirmed the source's rollback-only invariant before execution.
- The run completed without raising its fail-closed matrix exception. The harness itself raises if any of its 16 expected allow/deny checks fails, so this is independent QA-hosted execution of that recorded 16/16 matrix. The SQL response exposed only the final transaction-local claims-setting result, not the internal notice; no returned data was treated as instruction.
- A subsequent read-only post-run invariant query returned **1** `live/enabled` opponent-preparation row, **0** unexpected non-fixture enabled rows, and **114** `planned/disabled` rows. The rollback therefore preserved the named-fixture-only activation boundary.

### Conditional closure - 2026-08-04

- Theo explicitly accepted the remaining fixture-only evidence risk and authorised this work order to move to **Done**. Residual unverified checks are: a completed same-opponent Scrim review; Draft, Coaching Action, fixture-Scrim, and review-Scrim breadcrumbs; and unavailable/insufficient evidence states.
- This is not evidence of customer readiness, provider availability, production deployment, billing readiness, or a production release decision. Reopen WO-036 before enabling `opponent_preparation` for any non-QA tenant or making customer-facing Elite claims.
