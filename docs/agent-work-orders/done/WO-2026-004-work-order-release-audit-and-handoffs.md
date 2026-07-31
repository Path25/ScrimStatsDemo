# WO-2026-004 - Strengthen work orders with release audit and role handoffs

- **Status:** Done
- **Owner:** Project Manager
- **Priority:** Medium
- **Autonomy class:** Needs Theo's approval before implementation

## Problem and user impact

The shared work-order template did not require final acceptance-criteria traceability, a release verdict, exact outstanding checks, or a release approval record. Future agents could mark work done with incomplete evidence or unclear ownership. It also did not make cross-functional handoffs visible.

## Why now

The work-order workflow is newly established and will be used by the Project Manager, Feature Developer, QA and Release Auditor, Technical Reporting Analyst, and Lead Marketer and Growth. Correcting the template now prevents inconsistent records from accumulating.

## Scope

Add a mandatory release-audit section to `TEMPLATE.md` and a role-involvement and handoff section. Require each role to be marked involved or not applicable with a short reason; do not require every role to perform work on every order.

## Explicit non-goals

- Adding release bureaucracy to low-risk documentation-only work.
- Allowing an agent to self-approve production release.
- Changing application code, deployment configuration, billing, data, or customer communications.

## Acceptance criteria

- The template maps each acceptance criterion to final evidence or an explicit outstanding check.
- The template requires a final verdict of `READY`, `CONDITIONAL`, or `HOLD` with a definition for each.
- The template records exact outstanding checks, their owner, and required evidence.
- The template records Theo's implementation and release approval separately when either is required.
- The template provides role handoffs for Project Manager, Feature Developer, QA and Release Auditor, Technical Reporting Analyst, and Lead Marketer and Growth, with an explicit not-applicable option.
- Existing work orders remain usable without retroactive rewriting.

## Relevant files, workflows, or data areas

- `docs/agent-work-orders/TEMPLATE.md`
- `docs/agent-work-orders/README.md`
- `docs/agent-work-orders/{proposed,ready,in-progress,review,done}/`

## Risks

- **Permissions / Supabase RLS:** Not applicable.
- **Billing / entitlement:** Not applicable.
- **Email / customer communication:** Not applicable.
- **Production / data:** A weak template could permit unsupported release claims; the change itself makes no production change.

## Required validation

- Review the template against all five agent roles using one product, one security, and one marketing work-order example.
- Confirm the lifecycle README does not conflict with the new verdict and approval rules.
- Confirm no existing work order is incorrectly represented as approved or production-ready.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Scope, approval boundary, and final workflow ownership | This work order |
| Feature Developer | Not applicable | Documentation-only governance update | No product implementation |
| QA and Release Auditor | Involved | Recommended release-audit fields | Auditor recommendation supplied by Theo |
| Technical Reporting Analyst | Involved | Confirmed evidence levels are distinguishable | Template traceability table |
| Lead Marketer and Growth | Involved | Confirmed public-claim impact can be recorded or marked N/A | Template role handoff table |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Traceability table added | `TEMPLATE.md` Release audit section | Local | Pass |
| Verdict and definitions added | `TEMPLATE.md` Final verdict section | Local | Pass |
| Outstanding checks recorded | `TEMPLATE.md` Outstanding checks table | Local | Pass |
| Separate Theo approvals recorded | `TEMPLATE.md` Theo approval record | Local | Pass |
| Five-role handoff supported | `TEMPLATE.md` Role involvement and handoffs table | Local | Pass |
| Existing orders preserved | WO-001 through WO-003 remain unchanged | Local | Pass |

### Final verdict

- **Verdict:** READY
- **Rationale:** All documentation acceptance criteria pass. This is a repository-only workflow change with no release or production action.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| None | N/A | N/A | Closed |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved | 2026-07-28 | Approved WO-2026-004 |
| Release | No | N/A | 2026-07-28 | Documentation-only workflow change |

## Decision and approval record

- 2026-07-28 - Theo approved implementation of WO-2026-004.

## Implementation and review evidence

- Updated `TEMPLATE.md` and `README.md`; verified all five role handoffs and release-audit fields are present.
- **Highest evidence achieved:** Locally tested
