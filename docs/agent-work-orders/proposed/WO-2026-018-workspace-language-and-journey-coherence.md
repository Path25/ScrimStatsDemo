# WO-2026-018 - Audit and improve workspace language and journey coherence

- **ID reservation:** [WO-2026-018 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Backlog
- **Assigned owner:** PM
- **Size:** M
- **Risk:** Low
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing and QA scenario

- **Area / files likely affected:** Authenticated workspace journeys, Settings, Integrations, Overview, analytics gate, product-copy inventory, and follow-on work orders.
- **Dependencies:** PM audit findings and Theo approval for any resulting customer-facing copy/UX change; entitlement claims require supporting evidence.
- **Collision risk:** Do not make broad copy changes during WO-2026-001, WO-2026-009, or WO-2026-015; split isolated findings into separately assigned work orders.
- **QA scenario / test steps:** (1) Walk coach/manager and player journeys from first sign-in through schedule, practice, review, analytics, integrations, and settings. (2) Classify each confusing phrase/control as copy, UX, product-scope, entitlement, or security issue. (3) Verify suggested wording does not weaken permissions or plan truthfulness. (4) Produce a numbered, evidence-linked change backlog for Theo review.

## Problem and user impact

The workspace mixes end-user operational language with implementation/product language such as “ScrimStats account,” “workspace,” “capture profile,” and feature/module states. Some screens are technically honest but do not clearly tell a coach or manager what to do next. This makes the product feel less bespoke and can make features appear purposeless.

## Why now

Premium sales readiness depends on users understanding an immediate operational path without a guided call. This is also the low-risk way to improve first impressions before expanding features.

## Scope

- Audit the authenticated journey: first workspace, roster, availability, first block, game capture/import, review, analytics, scouting, Draft, Integrations, and Settings.
- Identify wording that should address the team user directly, explain the operational next step, or retain technical terminology because it affects safety/billing.
- Identify feature states that are confusing, redundant, contradictory, or inaccessible without purpose; propose keep, simplify, defer, or remove decisions backed by usage/evidence.
- Produce a ranked content/UX backlog. Any customer-facing text/code changes become separately approved Feature Developer work orders.

## Explicit non-goals

- Do not mass-rewrite copy, remove modules, change permissions, alter billing language, or publish marketing claims.
- Do not hide data limitations or turn honest unavailable states into vague reassurance.
- Do not use fabricated examples or generic SaaS language.

## Acceptance criteria

- A journey map identifies the first meaningful action and success state for coach/manager, player, and owner contexts.
- Every finding is classified as copy-only, UX/state, feature-purpose, entitlement/billing, or security-sensitive.
- The backlog is ranked by Pro conversion, frequency, trust risk, and implementation cost.
- No recommendation weakens evidence transparency, tenant safety, or paid-access truthfulness.

## Relevant files, workflows, or data areas

- `src/pages/Overview.tsx`, `Settings.tsx`, `Integrations.tsx`, `Analytics.tsx`, `CollectorWorkspace.tsx`
- `src/components/layout/DashboardLayout.tsx`, workspace state and header components
- Current work-order release audits, `docs/launch/RELEASE_BOUNDARY.md`, `docs/operations/PILOT_RUNBOOK.md`

## Risks

- **Permissions / Supabase RLS:** Copy must not imply a role can perform an action it is not authorised to perform.
- **Billing / entitlement:** Upgrade/gating language must match the authoritative server-side contract.
- **Email / customer communication:** In-workspace changes are customer-facing and require review before release; no outbound communication is in scope.
- **Production / data:** No data change; do not remove recovery/support detail that users need.

## Required validation

- Authenticated role-by-role journey review, starting with owner/manager and a Free/Pro comparison.
- Cross-check every paid or safety-related phrase against plan, RLS, and release evidence.
- Theo approves each grouped implementation package before code or customer-facing changes begin.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Own audit, prioritisation, and grouped work-order creation. | This work order |
| Feature Developer | Consulted | Estimate and identify implementation dependencies only. | Future WOs |
| QA and Release Auditor | Involved | Check role/entitlement truthfulness and visible state accuracy. | QA evidence |
| Technical Reporting Analyst | Consulted | Flag reporting/data terminology that must remain precise. | Metrics Dictionary |
| Lead Marketer and Growth | Involved | Review end-user language for premium clarity without turning it into public marketing. | Message Ledger |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Journey map | Authenticated journey review | Outstanding | Outstanding |
| Classified backlog | PM/QA/Marketing review | Outstanding | Outstanding |
| Safe implementation packages | Theo-approved follow-on WOs | Outstanding | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Founder identified the problem; no complete role/journey audit has been performed.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Audit core journeys | Project Manager / QA | Dated findings | Open |
| Prioritise conversion/trust backlog | Project Manager | Ranked decisions | Open |
| Approve implementation packages | Theo | Follow-on work orders | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Audit | Yes | Pending | — | Read-only review only. |
| Customer-facing implementation | Yes | Pending | — | Separate approval per package. |

## Decision and approval record

- 2026-07-29 - Founder requested review of product-facing wording, feature purpose, and overall workspace experience.

## Implementation and review evidence

- Authenticated staging overview uses honest empty states and clear scheduling calls to action, but source/browser review shows product terminology and generic upgrade language in key workspace surfaces.
- **Highest evidence achieved:** Browser verified for Free Overview and analytics gate; source reviewed for core workspace surfaces.
