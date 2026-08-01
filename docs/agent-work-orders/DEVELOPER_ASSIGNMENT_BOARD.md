# Developer Assignment Board

This board is a dispatch aid, not a replacement for its linked work order. Before starting, recheck the work order, its approval record, validation requirements, and collision risk.

## Ready for Development

| Work order | Lane | Size / risk | Dependencies | Collision risk / dispatch note |
|---|---|---|---|---|

## Ready for QA

| Work order | Owner | Deployment evidence | QA dependency |
|---|---|---|---|

## In Progress

| Work order | Lane | Active scope | Collision risk |
|---|---|---|---|
| [WO-2026-026](proposed/WO-2026-026-new-workspace-activation-follow-up.md) | PM | Manual-first activation procedure and Message Ledger drafted; no send authorised. | Do not modify email, Auth, invitation, notification-worker, billing, or provisioning flows. |

## QA blocked — Theo or PM input required

| Work order | Owner | Current blocker | Required routing |
|---|---|---|---|
| [WO-2026-016](proposed/WO-2026-016-champion-visual-asset-reliability.md) | Theo, then Core Features Developer | The approved duplicate repair and staging-only no-data fixture are locally validated but not deployed. Scouting remains out of scope for this pass because no avatar-bearing record is available. | Theo must approve staging deployment of the revised candidate. QA then opens `/draft?avatar-qa=1`, verifies 173 unique normalized tiles and CA03/CA04 desktop/mobile evidence, then reruns current/special-name Draft and SoloQ. |
| [WO-2026-028](proposed/WO-2026-028-isolated-pro-purchase-and-entitlement-verification.md) | QA and Release Auditor | The connected Stripe evidence is live-mode; no isolated payment route, cost cap, or cancellation boundary has been selected. | Theo must approve either a test-mode route or one capped live internal purchase/cancellation, then provide the isolated account/workspace and redacted event/log access. WO-002 is superseded; WO-009 Collector evidence does not close checkout verification. |
| [WO-2026-003](review/WO-2026-003-premium-copy-and-funnel-measurement.md) | QA | No approved isolated funnel journey has produced an event; the ledger and scorecard remain empty. | Theo must approve the minimal temporary non-customer schedule/completed-game workflow; PM must keep any browser scorecard exposure under WO-011. |

## Sequenced or blocked

| Work order | Lane | Why it is not ready | Collision risk |
|---|---|---|---|

| Work order | Proposed lane / owner | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-013](proposed/WO-2026-013-desktop-live-integration-direction.md) | Core Features Developer | WO-2026-009 is complete under Theo's accepted-risk decision; a desktop direction still needs selecting | Collector/native integration strategy; preserve the completed Collector entitlement boundary. |
| [WO-2026-025](proposed/WO-2026-025-discord-slash-command-scheduling.md) | Core Features Developer | Split inbound `/scrim` feature; wait for WO-2026-001 correction and QA handoff | Shared Discord helpers/UI/outbox/manifest; do not run concurrently with WO-2026-001. |

## Fast Lane

No Fast Lane work order is currently ready. WO-2026-019 is complete as an evidence handoff; its verified shared-component defect is assigned to Core under WO-2026-016.

## Backlog pending Theo implementation approval

| Work order | Lane | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-020](proposed/WO-2026-020-free-soloq-entitlement.md) | Core Features Developer | Changes plan entitlement and existing module state; Theo approval required | Avoid overlapping any new entitlement migration; preserve the completed Collector contract. |
| [WO-2026-023](proposed/WO-2026-023-owner-additional-workspaces.md) | Core Features Developer | Tenant/RPC/auth boundary needs Theo approval and reviewed design | Do not overlap with WO-2026-021, WO-2026-017, or tenant-membership/RPC migration work. |

## Vague or incomplete before assignment

- **WO-2026-012:** needs the agreed paid-buyer standard and Free-to-Pro thesis; it is PM discovery, not development.
- **WO-2026-014:** needs Theo and ProComps approval for any external contact; it is Marketing discovery, not development.
- **WO-2026-018:** needs its audit findings before copy/UX changes can be split into isolated Fast Lane work orders.
