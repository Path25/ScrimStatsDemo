# Developer Assignment Board

This board is a dispatch aid, not a replacement for its linked work order. Before starting, recheck the work order, its approval record, validation requirements, and collision risk.

## Ready for Development

| Work order | Lane | Size / risk | Dependencies | Collision risk / dispatch note |
|---|---|---|---|---|
| [WO-2026-030](ready/WO-2026-030-workspace-switcher-menu-surface.md) | Developer – Fast Lane | S / Low | Controlled account with memberships in two workspaces for browser QA | `DashboardLayout` only; do not alter `TenantContext`, membership queries, workspace creation, or RLS. |

## Ready for QA

| Work order | Owner | Deployment evidence | QA dependency |
|---|---|---|---|
| [WO-2026-025](proposed/WO-2026-025-discord-slash-command-scheduling.md) | QA and Release Auditor | Commit `2d5072a`; migration `20260802173000`; deployed `discord-config` v6, `discord-roles` v1, and `discord-interactions` v1. | Separate Theo approval for private-server endpoint URL, `DISCORD_PUBLIC_KEY`, command registration, and isolated invocation. Audit signature, role, tenant, replay, overlap, and outbox matrix. |

## In Progress

| Work order | Lane | Active scope | Collision risk |
|---|---|---|---|
| [WO-2026-012](proposed/WO-2026-012-paid-buyer-standard-and-conversion-thesis.md) | PM | Define and evidence the Pro buyer's recurring value loop before hard-launch claims or packaging changes. | Do not change prices, plan claims, entitlements, or public copy; coordinate with WO-003, WO-028, and WO-031. |
| [WO-2026-026](proposed/WO-2026-026-new-workspace-activation-follow-up.md) | PM | Manual-first activation procedure and Message Ledger drafted; no send authorised. | Do not modify email, Auth, invitation, notification-worker, billing, or provisioning flows. |
| [WO-2026-023](proposed/WO-2026-023-owner-additional-workspaces.md) | Core Features Developer | Shared-project migration applied and function/grants inspected; frontend deployment and controlled role/tenant matrix pending. | Do not overlap with WO-2026-030 `DashboardLayout` work or tenant-membership/RPC migrations. |

## QA blocked — Theo or PM input required

| Work order | Owner | Current blocker | Required routing |
|---|---|---|---|
| [WO-2026-028](proposed/WO-2026-028-isolated-pro-purchase-and-entitlement-verification.md) | QA and Release Auditor | The connected Stripe evidence is live-mode; no isolated payment route, cost cap, or cancellation boundary has been selected. | Theo must approve either a test-mode route or one capped live internal purchase/cancellation, then provide the isolated account/workspace and redacted event/log access. WO-002 is superseded; WO-009 Collector evidence does not close checkout verification. |
| [WO-2026-003](review/WO-2026-003-premium-copy-and-funnel-measurement.md) | QA | No approved isolated funnel journey has produced an event; the ledger and scorecard remain empty. | Theo must approve the minimal temporary non-customer schedule/completed-game workflow; PM must keep any browser scorecard exposure under WO-011. |

## Sequenced or blocked

| Work order | Lane | Why it is not ready | Collision risk |
|---|---|---|---|

| Work order | Proposed lane / owner | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-013](proposed/WO-2026-013-desktop-live-integration-direction.md) | Core Features Developer | WO-2026-009 is complete under Theo's accepted-risk decision; a desktop direction still needs selecting | Collector/native integration strategy; preserve the completed Collector entitlement boundary. |

## Fast Lane

No Fast Lane work order is currently ready. WO-2026-019 is complete as an evidence handoff; its verified shared-component defect is assigned to Core under WO-2026-016.

## Backlog pending Theo implementation approval

| Work order | Lane | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-031](proposed/WO-2026-031-elite-purchase-and-value-boundary.md) | Core Features Developer | Theo must choose whether Elite is withheld from self-serve purchase until its differentiated outcome is verified, or approve a separately evidenced alternative Elite outcome. | Billing, checkout, plan copy, Discord module state, and Message Ledger; do not overlap with WO-2026-028 or WO-2026-025. |

## Vague or incomplete before assignment

- **WO-2026-014:** needs Theo and ProComps approval for any external contact; it is Marketing discovery, not development.
- **WO-2026-018:** needs its audit findings before copy/UX changes can be split into isolated Fast Lane work orders.
