# WO-2026-034 - Build the Elite weekly performance command centre

- **ID reservation:** [WO-2026-034 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Backlog
- **Assigned owner:** Core Features Developer
- **Size:** M
- **Risk:** High
- **Priority:** Medium
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** Overview, analytics summaries, schedule/availability risk, practice objectives, completed-game coverage, coaching actions, scouting readiness, role capabilities, and tenant-scoped summary queries.
- **Dependencies:** Implemented and hosted-verified WO-2026-033 evidence model; reviewed summary-query/RLS design; Theo approval.
- **Collision risk:** Do not run alongside a broad Overview/analytics refactor or use it to duplicate source-of-truth data from its underlying workflows.

## Problem and user impact

Staff need one weekly answer to: what is scheduled, what is at risk, what evidence is missing, what review is outstanding, and what action comes next. A dashboard without the underlying objective/evidence/follow-up loop would be a superficial stat surface.

## Scope

- Provide an Elite staff summary of schedule/availability risk, objective status, completed-game coverage, open/overdue actions, upcoming opponent preparation, and review queue.
- Each card links to its source workflow and explicitly marks unavailable or insufficient evidence.
- Keep tactical data tenant-scoped and preserve role-appropriate read-only access.

## Explicit non-goals

- No fabricated trends, cross-team benchmarking, organisation roll-ups, generic AI summaries, or new data collection.

## Acceptance criteria

- Eligible staff see a concise weekly brief whose values reconcile to source records and link back to them.
- Empty, partial, stale, and unavailable data states are distinct and truthful.
- Free/Pro and ineligible roles are denied below the browser layer; tenant B cannot retrieve tenant A's summary.

## Relevant files, workflows, or data areas

- Overview briefing, analytics RPCs, availability, scrims, games, coaching actions, scouting, role capabilities, and WO-2026-033.

## Risks

- **Permissions / Supabase RLS:** High. Summary queries can leak sensitive operational data unless tenant/role enforced server-side.
- **Billing / entitlement:** High. Elite summary access needs consistent server and browser enforcement.
- **Email / customer communication:** Not applicable.
- **Production / data:** New summary queries/materialisation need approval and accuracy review.

## Required validation

- Source-to-summary reconciliation, contracts, lint/typecheck/build, RLS/grant/function/Advisor review.
- Hosted Elite/non-Elite/role/tenant browser and direct-query matrix with representative and empty data.

## QA scenario / reproducible test steps

1. Use isolated Elite tenant A with representative objective/action/schedule records plus Free/Pro and tenant B controls.
2. Compare each summary card to its source record and open its link.
3. Exercise empty/partial/stale states and direct unauthorised requests.
4. Record only aggregate/fixture evidence and truthful unavailable states.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Keep it a summary of proven workflows. | WO-032/033 |
| Developer â€“ Fast Lane | Not applicable | Shared data and entitlement work. | N/A |
| Core Features Developer | Involved | Implement scoped summary/data access. | Commit/PR |
| QA and Release Auditor | Involved | Validate reconciliation and access matrix. | QA evidence |
| Technical Reporting Analyst | Involved | Review definitions and unavailable states. | Metric map |
| Lead Marketer and Growth | Not applicable | No public claims in scope. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Reconciled staff summary | Source/browser evidence | Hosted | Outstanding |
| Honest incomplete states | QA evidence | Browser | Outstanding |
| Tenant/role/plan safety | Hosted direct/browser matrix | Hosted | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Depends on the underlying development loop and a reviewed summary-access design.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| WO-033 completion | Core / QA | Hosted evidence | Open |
| Implementation approval | Theo | Written approval | Open |
| Hosted validation | QA | Evidence pack | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Pending | — | Shared data/access change. |
| Release | Yes | Pending | — | Separate after QA. |

## Decision and approval record

- 2026-08-02 - Proposed as the summary surface for WO-033, not an independent dashboard project.

## Implementation and review evidence

- Existing Overview/analytics surfaces cannot yet represent the proposed objective-to-follow-up programme.
- **Highest evidence achieved:** Proposed.
