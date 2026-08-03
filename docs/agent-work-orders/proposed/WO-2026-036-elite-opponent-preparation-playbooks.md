# WO-2026-036 - Build repeatable Elite opponent-preparation playbooks

- **ID reservation:** [WO-2026-036 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Backlog
- **Assigned owner:** Core Features Developer
- **Size:** L
- **Risk:** High
- **Priority:** Medium
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** Scouting, Draft, opponent records, patch/source provenance, playbook data/RLS/RPCs, role capabilities, review links, tests, and operational docs.
- **Dependencies:** WO-2026-032 approved proposition, WO-2026-033 verified practice loop, WO-2026-035 approved source boundary, and Theo implementation approval.
- **Collision risk:** Shared Scouting/Draft/provider data and permissions. Do not overlap with source integration, champion catalogue, or broad scouting/draft refactors.

## Problem and user impact

Existing scouting and Draft capabilities can help analyse a match-up, but staff need a reusable, season-long way to turn trusted opponent evidence into a match-week preparation plan and record what was actually tested.

## Scope

- Add tenant-scoped, staff-approved opponent-preparation playbooks that connect permitted opponent evidence, patch context/provenance, draft priorities, assigned preparation actions, and post-match review links.
- Keep every pattern/source dated and attributable; distinguish unavailable, insufficient, and editorial staff judgement.
- Preserve Pro scouting/Draft analysis while reserving the repeatable playbook workflow for an approved future Elite boundary.

## Explicit non-goals

- No unapproved official/provider data ingestion, raw VOD hosting, automatic win/prediction claims, cross-tenant intelligence sharing, or organisation-wide playbook sharing.
- No expansion into a generic knowledge base.

## Acceptance criteria

- Authorised Elite staff can create, approve, revise, and archive a tenant-owned playbook linked only to permitted source evidence.
- A playbook shows patch/provenance date, staff judgement, open preparation actions, and linked review outcome without presenting unsupported tendencies as fact.
- Free/Pro/ineligible roles and other tenants cannot read or mutate playbooks below the browser layer.
- Hosted role/tenant/entitlement evidence and source-provenance checks pass.

## Relevant files, workflows, or data areas

- `src/pages/Scouting.tsx`, Draft surfaces, opponent/game evidence, coaching actions, role capabilities, tenant helpers, future source contract WO-2026-035.

## Risks

- **Permissions / Supabase RLS:** High. Playbooks are sensitive competitive intelligence; enforce membership, role, tenant predicates, and safe revision history.
- **Billing / entitlement:** High. Elite boundary must be server-side and agree with plan presentation.
- **Email / customer communication:** No automated recap/distribution is in scope.
- **Production / data:** High. New data model and any source integration require explicit approval, provenance, and recovery.

## Required validation

- Focused contracts; lint/typecheck/build; migration/RLS/grant/function/Advisor review.
- Isolated Elite/Pro/Free and owner/admin/member/viewer/two-tenant browser/direct mutation matrix.
- Source freshness/provenance verification under WO-2026-035.

## QA scenario / reproducible test steps

1. Prepare isolated Elite tenant A with permitted fixture evidence and Free/Pro/tenant B controls.
2. Create, approve, revise, and archive one playbook with a patch date and assigned preparation action.
3. Confirm permitted staff see linked evidence and explicit judgement; exercise role/plan/tenant denials directly and in the browser.
4. Verify a stale or missing source is visibly unavailable, not silently current.

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
| Source/patch provenance | Source contract and QA evidence | Hosted | Outstanding |
| Role/plan/tenant enforcement | RLS/function/browser matrix | Hosted | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Depends on future proposition, development loop, and approved intelligence-source boundary.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| WO-032, 033, and 035 dependencies | PM / Core / Analyst | Approved and verified inputs | Open |
| Implementation approval | Theo | Written approval | Open |
| Hosted QA | QA | Evidence pack | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Pending | — | Sensitive competitive-intelligence data and entitlement work. |
| Release | Yes | Pending | — | Separate after QA. |

## Decision and approval record

- 2026-08-02 - Proposed as a later Elite repeatability layer, not a replacement for Pro scouting/Draft.

## Implementation and review evidence

- Current Scouting/Draft provide a foundation but no verified repeatable, provenance-aware Elite playbook workflow.
- **Highest evidence achieved:** Proposed.
