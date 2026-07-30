# WO-2026-015 - Make Pro analytics legible and outcome-led

- **ID reservation:** [WO-2026-015 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Ready for Development
- **Assigned owner:** Core Features Developer
- **Size:** M
- **Risk:** Medium
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing and QA scenario

- **Area / files likely affected:** `Analytics.tsx`, Team Analytics Workspace/panels, analytics filtering and empty/loading/unavailable states, Pro gate, analytics tests.
- **Dependencies:** A representative isolated Pro workspace or approved fixture with recorded games for browser validation.
- **Collision risk:** Analytics components and Pro gates; do not combine with WO-2026-018's broad workspace language changes or a separate analytics refactor.
- **QA scenario / test steps:** (1) Use Free and Pro isolated workspaces, with the Pro workspace containing representative recorded games. (2) Open Team Analytics at desktop, tablet, and mobile widths. (3) Establish the headline takeaway, progressively expose filters, select a drill-down, and test empty/loading/unavailable/error states. (4) Confirm Free sees no invented metrics and Pro values retain their evidence/sample context.

## Problem and user impact

Team Analytics is the core visible Pro upgrade, but the current Free gate only says “Unlock team analytics” and does not show the operational decision it unlocks. The authenticated analytics workspace contains ten simultaneous filters and dense evidence concepts before a coach can orient themselves. This makes the product harder to read and weakens the paid value proposition, especially for teams moving from spreadsheets.

## Why now

Pro conversion is the immediate commercial strategy. A feature that is technically rich but hard to understand cannot justify a paid upgrade. This work should precede any broad new analytics features.

## Scope

- Rework the analytics information hierarchy around three staff questions: “What changed?”, “Why did it change?”, and “Which games support that conclusion?”
- Keep factual/evidence boundaries, qualifying-game counts, drilldowns, and unavailable states; simplify first view through progressive disclosure rather than removing evidence.
- Move lower-frequency filters into an explicit advanced-filter area and rename ambiguous controls in end-user language (for example, data source and data completeness).
- Replace the Free-plan gate with an honest, non-fabricated capability preview that explains the Pro outcome and activation path without showing mock team metrics or claiming unavailable capture.
- Validate the empty-data path, populated-data path, responsive layouts, and Pro/Free entitlement boundary.

## Explicit non-goals

- Do not fabricate dashboard metrics, demo team data, conversion claims, AI insights, or causal performance claims.
- Do not add new data providers, alter Collector/GRID ingestion, change plan pricing, or broaden analytics entitlements.
- Do not remove drilldown/evidence provenance to make the interface look simpler.

## Acceptance criteria

- A coach/manager can identify the current team trend, supporting evidence, and next review entry point without first configuring advanced filters.
- Free users see a truthful explanation of the Pro analytics outcome and what data activates it; Pro users retain data-rich analytics with provenance.
- No more than the essential high-frequency filters are shown initially; advanced filters remain accessible and accurately labelled.
- Empty, partial-evidence, error, and populated states are distinct and responsive.
- Browser tests prove Free gating, Pro access, and no mock-data fallback; tests/build/lint pass.

## Relevant files, workflows, or data areas

- `src/pages/Analytics.tsx`
- `src/components/analytics/TeamAnalyticsWorkspace.tsx`
- `src/components/analytics/CompetitiveAnalyticsPanels.tsx`
- `src/hooks/useTeamAnalytics.ts`, `src/lib/analytics/team-analytics.ts`
- `src/components/billing/PlanGate.tsx`, `src/components/billing/BillingPanel.tsx`

## Risks

- **Permissions / Supabase RLS:** Preserve tenant-scoped analytics queries and do not make a Pro preview a source of protected data.
- **Billing / entitlement:** Free preview must not imply analytics is accessible before Pro entitlement is active.
- **Email / customer communication:** No external copy or campaign is included.
- **Production / data:** No metric backfill, data mutation, provider activation, or deployment is authorised.

## Required validation

- Targeted analytics, entitlement, and copy-contract tests; TypeScript; zero-warning ESLint; production build and bundle budget.
- Authenticated Free and Pro browser checks with an isolated workspace; desktop and mobile visual review.
- Review query shape/RLS for any changed data request and verify no fabricated or cross-tenant output.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Confirm the upgrade outcome and prevent scope expansion into new analytics data. | WO-012 |
| Core Features Developer | Involved | Implement hierarchy, progressive disclosure, and truthful preview. | This work order |
| QA and Release Auditor | Involved | Test entitlement boundary, evidence states, responsiveness, and data provenance. | QA audit |
| Technical Reporting Analyst | Involved | Confirm labels, denominators, and evidence counts remain accurate. | Metrics Dictionary |
| Lead Marketer and Growth | Consulted | Review the upgrade proposition against supported paid-buyer value. | Message Ledger |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Outcome-led analytics hierarchy | Authenticated populated browser journey | Outstanding | Outstanding |
| Truthful Free preview | Free browser journey and copy review | Outstanding | Outstanding |
| Evidence/provenance preserved | Contract/query and browser drilldown checks | Outstanding | Outstanding |
| Responsive states | Desktop and mobile browser evidence | Outstanding | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Source and Free-gate inspection identify the usability gap; no redesign has been implemented or validated.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Approve product hierarchy | Theo / Project Manager | Theo implementation approval, 2026-07-30 | Closed |
| Implement and validate | Feature Developer / QA | Local and authenticated browser evidence | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Pending | — | No plan or data-provider change included. |
| Release | Yes | Pending | — | Requires authenticated Free/Pro evidence. |

**Current implementation record:** Approved by Theo on 2026-07-30. This supersedes the earlier pending implementation placeholder above; release remains pending.

## Decision and approval record

- 2026-07-29 - Founder requested review after identifying difficult-to-read Team Analytics and a need to strengthen Pro value.
- 2026-07-30 - Theo approved implementation. Assign to Core Features Developer; implementation may not change plans, providers, production data, or release state.

## Implementation and review evidence

- Authenticated Free staging browser inspection: Team Analytics gate is visually polished but generic; it does not show the data/decision outcome or activation path.
- Source inspection: the analytics workspace presents ten filter dimensions before the first analysis and retains useful qualifying-game/evidence logic that should be progressively disclosed, not removed.
- **Highest evidence achieved:** Browser verified for Free gate; source reviewed for Pro workspace.
