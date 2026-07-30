# Agent work orders

This directory is the shared, repository-visible queue for work proposed by product, project-management, development, and review agents. One work order is one outcome; move the same file through the folders rather than copying it.

## Delivery status

Use one of these values in each work order: `Backlog`, `Ready for Development`, `In Progress`, `Ready for QA`, `Blocked`, or `Done`. The folder is an evidence/history location and may lag the operational status during a handoff.

- `Ready for Development` requires complete acceptance criteria and a reproducible QA scenario.
- `Ready for QA` requires the developer's validation evidence and reproducible QA steps.
- `Blocked` must name the exact missing approval, access, dependency, or decision.
- `Done` requires traceable evidence, a release-audit verdict, and every required Theo approval.

## Developer lanes

Use [DEVELOPER_ASSIGNMENT_BOARD.md](DEVELOPER_ASSIGNMENT_BOARD.md) before dispatching work. Developer – Fast Lane is limited to S, low-risk, isolated work. Core Features Developer owns all M/L, medium/high-risk, shared-component, integration, data-flow, Collector, auth, billing, Supabase, migration, security, and entitlement work. Do not dispatch overlapping work or shared-file refactors to both lanes at once.

Use filenames in the form `WO-YYYY-NNN-short-slug.md`. Reserve every ID through [WORK_ORDER_INDEX.md](WORK_ORDER_INDEX.md) before creating a work order; never reuse or silently renumber an existing ID. Do not move a work order to `done/` because code exists or local tests pass alone. Keep production, billing, entitlement, security, customer-communication, and deployment approval requirements explicit.

Create every new work order from [TEMPLATE.md](TEMPLATE.md). Update the same file with links to PRs, commits, test output, screenshots, hosted checks, role handoffs, release-audit evidence, and approval decisions as it advances. A `READY` verdict is not permission to release; it records that the evidence supports the required approver's release decision.
