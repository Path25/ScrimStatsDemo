# WO-2026-033 - Build the Elite practice-development loop

- **ID reservation:** [WO-2026-033 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** In Progress
- **Assigned owner:** Core Features Developer
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
| Core Features Developer | Involved | Implement bounded workflow and server safety. | Commit/PR |
| QA and Release Auditor | Involved | Audit role, tenant, entitlement, and hosted workflow evidence. | QA verdict |
| Technical Reporting Analyst | Involved | Define honest evidence/completion semantics. | Data definition |
| Lead Marketer and Growth | Consulted | Validate future claim boundary only. | Message Ledger |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Connected objective-to-follow-up workflow | Browser and record evidence | Hosted | Outstanding |
| Role/tenant/entitlement protection | RLS/function/browser matrix | Hosted | Outstanding |
| Honest evidence states | QA screenshots and source review | Browser | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Future L/high-risk workflow; founder proposition and implementation approval are pending.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Approve proposition and implementation | Theo | Written founder decision | Complete (2026-08-03) |
| Phase 1 tenant/RLS design | Core | Reviewed design contract | Complete (2026-08-03) |
| Phase 2 migration/implementation | Core | Approved source migration, implementation commit, and local validation | Pending exact Phase 2 approval |
| Hosted role/tenant QA | QA | Evidence pack | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Pending | — | Data, entitlement, and customer workflow change. |
| Release | Yes | Pending | — | Separate after QA. |

## Decision and approval record

### Approval correction - 2026-08-03

The earlier `Implementation: Pending` table row predates Theo's subsequent approval and is superseded by the decision below: implementation is approved for the documented Elite-only, staff-controlled scope with authorised non-staff read-only visibility. Migration application, deployment, billing/price changes, public claims, and release remain separately approval-gated.

- 2026-08-02 - Proposed as the first durable future Elite system; no implementation approval.
- 2026-08-03 - Theo approved WO-033 as the first Elite build. It is Elite-only and staff-facing for control; other authorised workspace roles may view goals and permitted evidence/status read-only. This is the dedicated Core workstream before WOs 034 and 036. It does not approve migration application, deployment, billing/price changes, provider activation, customer-facing claims, or release.
- 2026-08-03 - Theo confirmed the intended boundary: do not overcomplicate Free or Pro. The visible workflow remains Elite-only, but Core may use a shared internal foundation if it is the safer, simpler implementation. Any customer-visible cross-tier access or plan-rule change requires a separate founder-approved work order.
- 2026-08-03 - Theo approved Phase 1. Core completed the source-inspected lifecycle, data, field-visibility, entitlement, RLS/RPC, UI, recovery, and validation design. This approval did not authorise a migration file, local application implementation, hosted mutation, deployment, activation, or release.

## Implementation and review evidence

- Existing ScrimStats workflows provide the starting records, but no connected improvement-programme system exists.
- [Phase 1 implementation contract](../WO-2026-033-PHASE-1-DESIGN.md) records the bounded design and exact approval gates. No schema or application source was changed under Phase 1.
- Phase 1 preserves the existing Coaching Action lifecycle, uses a separate safe read projection for WO-033, defaults the proposed module to `planned/false`, and requires exact Elite + `live` + enabled server enforcement.
- **Highest evidence achieved:** Source-inspected design; not implemented, locally tested, hosted verified, deployed, or release-ready.
