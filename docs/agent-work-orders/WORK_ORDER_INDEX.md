# Work order index

This is the authoritative ID registry for ScrimStats work orders. IDs are never reused, including cancelled, superseded, or completed work. The current reservation is `WO-2026-011`; the next available 2026 ID is `WO-2026-012`.

## Reservation protocol

1. Read this index and search `docs/agent-work-orders/` immediately before creating a work order.
2. Reserve the next numeric ID by adding its row to this index in the same change that creates the work-order file.
3. If another agent reserved the same ID first, retain their reservation and allocate the next unused ID before creating or renaming your file.
4. When a work order moves state, update its state and file link here. Do not assign a new ID.
5. Do not delete registry rows. Mark abandoned work `Cancelled` or `Superseded` and link the replacement where relevant.

## Registry

| ID | Title | State | Owner | Work order |
|---|---|---|---|---|
| WO-2026-001 | Define and deliver a credible Elite proposition | Ready | Feature Development agent | [WO-2026-001](ready/WO-2026-001-elite-proposition.md) |
| WO-2026-002 | Verify the Pro paid core end to end | In progress (review) | Feature Development agent | [WO-2026-002](review/WO-2026-002-pro-paid-core-hosted-verification.md) |
| WO-2026-003 | Protect premium copy and establish funnel measurement | Review | QA and Release Auditor | [WO-2026-003](review/WO-2026-003-premium-copy-and-funnel-measurement.md) |
| WO-2026-004 | Strengthen work orders with release audit and role handoffs | Done | Project Manager | [WO-2026-004](done/WO-2026-004-work-order-release-audit-and-handoffs.md) |
| WO-2026-005 | Verify and remediate recurring managed Postgres collation warnings | Proposed | Unassigned | [WO-2026-005](proposed/WO-2026-005-managed-postgres-collation-warning-investigation.md) |
| WO-2026-006 | Establish authoritative reporting connections and reliability telemetry | In progress | Project Manager | [WO-2026-006](in-progress/WO-2026-006-reporting-connections-and-reliability-telemetry.md) |
| WO-2026-007 | Fix the Scouting client error and restore release attribution | Done (conditional) | Feature Development agent | [WO-2026-007](done/WO-2026-007-fix-scouting-client-error-and-release-attribution.md) |
| WO-2026-008 | Reconcile paid workspace entitlements with Stripe subscriptions | Done | Analytics and Technical Reporting agent | [WO-2026-008](done/WO-2026-008-reconcile-paid-entitlements-with-stripe.md) |
| WO-2026-009 | Enforce Collector entitlement below the browser | In progress | Feature Development agent | [WO-2026-009](in-progress/WO-2026-009-collector-server-entitlement-enforcement.md) |
| WO-2026-010 | Enforce append-only service-role access for funnel events | Review | QA and Release Auditor | [WO-2026-010](review/WO-2026-010-funnel-service-role-append-only-grants.md) |
| WO-2026-011 | Build a secure founder funnel scorecard | Ready | Feature Development agent | [WO-2026-011](ready/WO-2026-011-secure-founder-funnel-scorecard.md) |
