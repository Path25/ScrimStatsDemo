# Agent work orders

This directory is the shared, repository-visible queue for work proposed by product, project-management, development, and review agents. One work order is one outcome; move the same file through the folders rather than copying it.

## Lifecycle

1. `proposed/` - problem is understood, but work has not been approved for implementation.
2. `ready/` - Theo has approved the work for a Feature Developer. The work order's autonomy class still controls implementation and release boundaries.
3. `in-progress/` - one named agent or developer owns active implementation. Record material decisions and validation evidence in the work order.
4. `review/` - implementation is complete and awaiting the release audit, required approval, or release verification.
5. `done/` - every acceptance criterion has traceable evidence, the release-audit verdict is recorded, and any required Theo approval has been recorded. State the highest evidence level achieved.

Use filenames in the form `WO-YYYY-NNN-short-slug.md`. Reserve every ID through [WORK_ORDER_INDEX.md](WORK_ORDER_INDEX.md) before creating a work order; never reuse or silently renumber an existing ID. Do not move a work order to `done/` because code exists or local tests pass alone. Keep production, billing, entitlement, security, customer-communication, and deployment approval requirements explicit.

Create every new work order from [TEMPLATE.md](TEMPLATE.md). Update the same file with links to PRs, commits, test output, screenshots, hosted checks, role handoffs, release-audit evidence, and approval decisions as it advances. A `READY` verdict is not permission to release; it records that the evidence supports the required approver's release decision.
