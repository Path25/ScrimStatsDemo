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
- **Rationale:** Phase 1 is approved for development, but no implementation, migration, hosted QA, customer activation, or release evidence exists. External intelligence remains deliberately out of scope.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Phase 1 design and tenant-safe boundary | Core / PM | Reviewed design and acceptance handoff | Complete (accepted 2026-08-03) |
| Implementation approval | Theo | Written approval | Complete (2026-08-03) |
| Hosted QA | QA | Evidence pack | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved for bounded Phase 1 | 2026-08-03 | Existing tenant-owned evidence and explicit staff judgement only; hosted migration and deployment remain separate. |
| Release | Yes | Pending | — | Separate after QA. |

## Decision and approval record

### Approval correction - 2026-08-03

The earlier `Implementation: Pending` table row predates Theo's Phase 1 approval and is superseded by the decision below. Implementation is approved only for the documented Elite-only staff workflow over existing tenant-owned evidence and explicit staff judgement. Migration application, deployment, billing/price changes, external sources/providers, customer claims, and release remain separately approval-gated.

- 2026-08-02 - Proposed as a later Elite repeatability layer, not a replacement for Pro scouting/Draft.
- 2026-08-03 - Theo approved Phase 1 implementation. The scope is narrowed to an Elite-only staff workflow over existing tenant-owned evidence and explicit staff judgement; WO-035 remains parked, so all external source/provider/resource capabilities are excluded.
- 2026-08-03 - Core completed the Phase 1 design checkpoint. It defines an Owner/Admin-only, exact Elite/live/enabled RPC boundary; immutable approved revisions; canonical Scouting/Draft/Coaching Action/Scrim review links; explicit insufficient and unavailable states; fail-closed module defaults; recovery; and the full role/plan/tenant/provenance QA matrix. No migration, hosted mutation, deployment, billing change, or customer activation occurred.
- 2026-08-03 - Theo reviewed and accepted the Phase 1 design and approved local migration/security-boundary implementation. Hosted migration application and deployment remain separately approval-gated.

## Implementation and review evidence

- Current Scouting/Draft provide the Phase 1 foundation but no verified repeatable Elite playbook workflow.
- Phase 1 design: [`WO-2026-036-PHASE-1-DESIGN.md`](../WO-2026-036-PHASE-1-DESIGN.md).
- Design review established that existing Pro Scouting and Draft remain unchanged; WO-036 adds only a staff-only Elite orchestration layer with locked base tables and server-shaped access.
- **Highest evidence achieved:** Phase 1 design accepted; local migration/security-boundary implementation is authorised and in progress. Hosted migration, deployment, and hosted evidence remain outstanding.
