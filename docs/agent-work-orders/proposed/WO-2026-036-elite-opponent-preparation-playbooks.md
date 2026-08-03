# WO-2026-036 - Build repeatable Elite opponent-preparation playbooks

- **ID reservation:** [WO-2026-036 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** In Progress
- **Assigned owner:** Core Features Developer
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
| Tenant-safe playbook lifecycle | Hosted browser/direct evidence | Hosted | Outstanding |
| Tenant-owned evidence/date/context provenance | Source-reference contract and QA evidence | Hosted | Outstanding |
| Role/plan/tenant enforcement | RLS/function/browser matrix | Hosted | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Phase 2B is implemented and the additive schema is hosted without tenant activation, but the frontend is not deployed and the authenticated role/plan/tenant matrix has not been audited. External intelligence remains deliberately out of scope.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Phase 1 design and tenant-safe boundary | Core / PM | Reviewed design and acceptance handoff | Complete (accepted 2026-08-03) |
| Implementation approval | Theo | Written approval | Complete (2026-08-03) |
| Phase 2B application projection and workflow | Core | Local implementation, contracts, build and responsive shell check | Complete locally (2026-08-03) |
| Hosted additive schema and generated client contract | Core | Migration record, catalog/ACL checks, empty-table proof, generated types, Advisor review | Complete (2026-08-03) |
| Hosted QA | QA | Evidence pack | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved for bounded Phase 1 | 2026-08-03 | Existing tenant-owned evidence and explicit staff judgement only; hosted migration and deployment remain separate. |
| Hosted migration and related validation | Yes | Approved | 2026-08-03 | Applied additively; no tenant activation, fixture, customer data, billing, deployment, or release action was performed. |
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

### Reproducible QA handoff after approved hosted migration and deployment

1. Use isolated Elite tenant A with `opponent_preparation = live/enabled`, Owner and Admin accounts, and existing same-opponent Scouting evidence, an immutable preparation brief or Draft playbook, a nonarchived Coaching Action, and Scrim Blocks. Keep Pro/Free, Member/Viewer, and tenant B controls.
2. In the opponent Scouting report, create a draft; verify optional fixture/context/patch remain “not recorded” unless entered. Link dated tenant-owned evidence and a canonical action, record explicit staff judgement, approve, create a new revision, and confirm the approved revision cannot be edited.
3. Exercise explicit insufficient evidence, unavailable/superseded evidence, option-load failure/retry, archive/restore, and a completed same-opponent Scrim review outcome. Confirm the UI never substitutes external or inferred claims.
4. Verify breadcrumbs from the linked Draft record, Coaching Action, fixture Scrim, and completed review Scrim return to the correct opponent report and disappear when the playbook is archived or the link is removed.
5. Verify Owner/Admin positive paths on desktop and mobile. Verify Elite Member/Viewer, all Free/Pro roles, disabled/non-live module, other tenant, unauthenticated, direct-table, cross-tenant-ID, stale-version, invalid-source, and oversized breadcrumb requests fail below the browser layer.
