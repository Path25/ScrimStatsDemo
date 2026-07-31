# Work order index

This is the authoritative ID registry for ScrimStats work orders. IDs are never reused, including cancelled, superseded, or completed work. The current reservation is `WO-2026-029`; the next available 2026 ID is `WO-2026-030`.

## Reservation protocol

1. Read this index and search `docs/agent-work-orders/` immediately before creating a work order.
2. Reserve the next numeric ID by adding its row to this index in the same change that creates the work-order file.
3. If another agent reserved the same ID first, retain their reservation and allocate the next unused ID before creating or renaming your file.
4. When a work order moves state, update its state and file link here. Do not assign a new ID.
5. Do not delete registry rows. Mark abandoned work `Cancelled` or `Superseded` and link the replacement where relevant.

## Registry

| ID | Title | State | Owner | Work order |
|---|---|---|---|---|
| WO-2026-001 | Define and deliver a credible Elite proposition | Done (Theo accepted remaining negative-path risk) | QA and Release Auditor | [WO-2026-001](in-progress/WO-2026-001-elite-proposition.md) |
| WO-2026-002 | Verify the Pro paid core end to end | Superseded | PM | [WO-2026-002](review/WO-2026-002-pro-paid-core-hosted-verification.md) |
| WO-2026-003 | Protect premium copy and establish funnel measurement | Blocked | QA | [WO-2026-003](review/WO-2026-003-premium-copy-and-funnel-measurement.md) |
| WO-2026-004 | Strengthen work orders with release audit and role handoffs | Done | Project Manager | [WO-2026-004](done/WO-2026-004-work-order-release-audit-and-handoffs.md) |
| WO-2026-005 | Verify and remediate recurring managed Postgres collation warnings | Done (conditional; Theo accepted platform-managed risk) | Analyst | [WO-2026-005](proposed/WO-2026-005-managed-postgres-collation-warning-investigation.md) |
| WO-2026-006 | Establish authoritative reporting connections and reliability telemetry | In Progress | PM | [WO-2026-006](in-progress/WO-2026-006-reporting-connections-and-reliability-telemetry.md) |
| WO-2026-007 | Fix the Scouting client error and restore release attribution | Done (conditional) | Feature Development agent | [WO-2026-007](done/WO-2026-007-fix-scouting-client-error-and-release-attribution.md) |
| WO-2026-008 | Reconcile paid workspace entitlements with Stripe subscriptions | Done | Analytics and Technical Reporting agent | [WO-2026-008](done/WO-2026-008-reconcile-paid-entitlements-with-stripe.md) |
| WO-2026-009 | Enforce Collector entitlement below the browser | Done (conditional; Theo risk acceptance) | Core Features Developer | [WO-2026-009](done/WO-2026-009-collector-server-entitlement-enforcement.md) |
| WO-2026-010 | Enforce append-only service-role access for funnel events | Done | QA | [WO-2026-010](review/WO-2026-010-funnel-service-role-append-only-grants.md) |
| WO-2026-011 | Build a secure founder funnel scorecard | Done (conditional; Theo risk acceptance) | QA and Release Auditor | [WO-2026-011](done/WO-2026-011-secure-founder-funnel-scorecard.md) |
| WO-2026-012 | Define the paid buyer standard and Free-to-Pro conversion thesis | Backlog | PM | [WO-2026-012](proposed/WO-2026-012-paid-buyer-standard-and-conversion-thesis.md) |
| WO-2026-013 | Select a safe desktop live-integration direction without Riot API access | Blocked | Core Features Developer | [WO-2026-013](proposed/WO-2026-013-desktop-live-integration-direction.md) |
| WO-2026-014 | Validate paid buyer problems and conversion proposition with target teams | Blocked | Marketing | [WO-2026-014](proposed/WO-2026-014-paid-buyer-validation-and-conversion-proposition.md) |
| WO-2026-015 | Make Pro analytics legible and outcome-led | Done | Core Features Developer | [WO-2026-015](proposed/WO-2026-015-pro-analytics-legibility-and-value.md) |
| WO-2026-016 | Restore reliable champion visual assets | Ready for QA | QA and Release Auditor | [WO-2026-016](proposed/WO-2026-016-champion-visual-asset-reliability.md) |
| WO-2026-017 | Add tenant-safe workspace identity customization | Done | Core Features Developer | [WO-2026-017](proposed/WO-2026-017-workspace-identity-customization.md) |
| WO-2026-018 | Audit and improve workspace language and journey coherence | Backlog | PM | [WO-2026-018](proposed/WO-2026-018-workspace-language-and-journey-coherence.md) |
| WO-2026-020 | Make Solo Queue tracker available on Free consistently | Backlog | Core Features Developer | [WO-2026-020](proposed/WO-2026-020-free-soloq-entitlement.md) |
| WO-2026-021 | Restore existing-account workspace creation and confirmation recovery | Done | QA | [WO-2026-021](proposed/WO-2026-021-existing-account-workspace-recovery.md) |
| WO-2026-022 | Record daily Stripe MRR snapshots for measured churn reporting | Done | QA and Release Auditor | [WO-2026-022](proposed/WO-2026-022-daily-stripe-mrr-snapshots.md) |
| WO-2026-023 | Let workspace owners create additional independent workspaces | Backlog | Core Features Developer | [WO-2026-023](proposed/WO-2026-023-owner-additional-workspaces.md) |
| WO-2026-024 | Give players reliable read-only intelligence access | Ready for QA | QA and Release Auditor | [WO-2026-024](proposed/WO-2026-024-player-read-only-intelligence-access.md) |
| WO-2026-025 | Add tenant-safe Discord `/scrim` practice-block creation | Backlog | Core Features Developer | [WO-2026-025](proposed/WO-2026-025-discord-slash-command-scheduling.md) |
| WO-2026-019 | Create champion-avatar reproduction evidence and regression fixtures | Done (conditional handoff to WO-016) | Developer – Fast Lane | [WO-2026-019](proposed/WO-2026-019-champion-avatar-evidence-pack.md) |
| WO-2026-026 | Define a safe new-workspace activation follow-up | In Progress | PM | [WO-2026-026](proposed/WO-2026-026-new-workspace-activation-follow-up.md) |
| WO-2026-027 | Diagnose OnceUponATeam owner Draft-load failure | Done | QA and Release Auditor | [WO-2026-027](proposed/WO-2026-027-onceuponateam-draft-load-investigation.md) |
| WO-2026-028 | Verify an isolated Pro purchase, entitlement, and billing-return journey | Blocked | QA and Release Auditor | [WO-2026-028](proposed/WO-2026-028-isolated-pro-purchase-and-entitlement-verification.md) |
| WO-2026-029 | Repair multi-workspace Draft RLS cardinality failure | Done | QA and Release Auditor | [WO-2026-029](proposed/WO-2026-029-repair-multi-workspace-draft-rls.md) |
