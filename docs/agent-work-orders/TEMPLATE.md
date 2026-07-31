# WO-YYYY-NNN - [Short outcome]

- **ID reservation:** [Link to the matching `WORK_ORDER_INDEX.md` row]
- **Status:** Backlog | Ready for Development | In Progress | Ready for QA | Blocked | Done
- **Assigned owner:** Developer – Fast Lane | Core Features Developer | QA | Analyst | Marketing | PM | Theo
- **Size:** S | M | L
- **Risk:** Low | Medium | High
- **Priority:** Low | Medium | High
- **Autonomy class:** Safe to implement | Needs Theo's approval before implementation | Needs Theo's approval before release

## Delivery routing

- **Area / files likely affected:** [Paths, routes, shared components, database areas, or `None — research only`]
- **Dependencies:** [Work orders, approvals, access, decisions, or `None`]
- **Collision risk:** [Shared files/features that cannot be worked on concurrently, or `None identified`]

## Problem and user impact

[What is failing or missing, who experiences it, and the measurable or observable impact.]

## Why now

[Why this is the right next piece of work.]

## Scope

[The smallest complete outcome, including any required product, design, data, or operational work.]

## Explicit non-goals

- [Out of scope]

## Acceptance criteria

- [Observable customer or system outcome]
- [Required evidence level: local, browser, hosted, or production]

## Relevant files, workflows, or data areas

- [Paths, routes, Edge Functions, migrations, plans, or operational documents]

## Risks

- **Permissions / Supabase RLS:** [Risk or Not applicable]
- **Billing / entitlement:** [Risk or Not applicable]
- **Email / customer communication:** [Risk or Not applicable]
- **Production / data:** [Risk or Not applicable]

## Required validation

- [Targeted tests]
- [Lint, typecheck, build, and browser verification where relevant]
- [Hosted, role, RLS, Stripe, deployment, or security checks where relevant]

## QA scenario / reproducible test steps

1. [Precondition: account/role, plan, tenant, test data, or environment]
2. [Customer or system action]
3. [Expected result, including unavailable/error/denial state where relevant]
4. [Evidence QA must record]

## Role involvement and handoffs

Mark every role as `Involved` or `Not applicable`. A not-applicable decision needs a short reason; do not create artificial work merely to involve every role.

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | [Involved / Not applicable] | [Scope, priority, decisions, and approvals] | [Link or note] |
| Developer – Fast Lane | [Involved / Not applicable] | [Isolated S/low-risk implementation summary] | [Commit or PR] |
| Core Features Developer | [Involved / Not applicable] | [M/L, shared, integration, data, or security implementation summary] | [Commit or PR] |
| QA and Release Auditor | [Involved / Not applicable] | [Validation plan, evidence review, and verdict] | [Test output or review] |
| Technical Reporting Analyst | [Involved / Not applicable] | [Metric, data-source, or reporting impact] | [Query, definition, or N/A reason] |
| Lead Marketer and Growth | [Involved / Not applicable] | [Customer claim, funnel, or launch impact] | [Copy review, metric, or N/A reason] |

## Release audit

Complete this section before moving a work order to `done/`. A verdict is an evidence assessment, not authority to release.

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| [Criterion] | [Test, browser check, log, screenshot, or review] | [Local / Browser / Hosted / Production] | [Pass / Fail / Outstanding] |

### Final verdict

- **Verdict:** READY | CONDITIONAL | HOLD
- **Rationale:** [Concise evidence-based reason]

Use `READY` only when every acceptance criterion passes and no required validation is outstanding. Use `CONDITIONAL` only when the remaining limitation, allowed scope, owner, and expiry are explicitly approved. Use `HOLD` when a required check fails, is missing, or creates an unresolved customer, security, billing, or production risk.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| [Exact check, or `None`] | [Owner, or `N/A`] | [Evidence, or `N/A`] | [Open / Closed] |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | [Yes / No] | [Approved / Declined / N/A] | [YYYY-MM-DD] | [Scope and constraints] |
| Release | [Yes / No] | [Approved / Declined / Pending / N/A] | [YYYY-MM-DD] | [Environment and release boundary] |

## Decision and approval record

- [Date] - [Decision, approver, and boundary]

## Implementation and review evidence

- [Commit/PR, test output, screenshot, deployment, logs, or hosted verification]
- **Highest evidence achieved:** Proposed | Implemented | Locally tested | Browser verified | Hosted verified | Production-ready
