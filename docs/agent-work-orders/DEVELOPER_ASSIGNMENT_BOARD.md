# Developer Assignment Board

This board is a dispatch aid, not a replacement for its linked work order. Before starting, recheck the work order, its approval record, validation requirements, and collision risk.

## Ready for Development

| Work order | Lane | Size / risk | Dependencies | Collision risk / dispatch note |
|---|---|---|---|---|
| [WO-2026-019](proposed/WO-2026-019-champion-avatar-evidence-pack.md) | Developer – Fast Lane | S / Low | Local or isolated test data | Evidence/fixture-only work; must not edit `ChampionAvatar` or catalogue implementation. |

## Ready for QA

| Work order | Owner | Deployment evidence | QA dependency |
|---|---|---|---|
| [WO-2026-001](in-progress/WO-2026-001-elite-proposition.md) | QA and Release Auditor | Discord Functions v6/v6/v2/v6/v6 contain the server release-state guard | Direct planned/disabled denial, then approved isolated-provider workflow matrix. |
| [WO-2026-017](proposed/WO-2026-017-workspace-identity-customization.md) | QA and Release Auditor | Hosted private Storage migration plus local validation completed | Owner/admin/member/cross-tenant Storage matrix, invalid-file recovery, and desktop/mobile workspace identity checks. |

## Sequenced or blocked

| Work order | Proposed lane / owner | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-013](proposed/WO-2026-013-desktop-live-integration-direction.md) | Core Features Developer | WO-2026-009 is complete under Theo's accepted-risk decision; a desktop direction still needs selecting | Collector/native integration strategy; preserve the completed Collector entitlement boundary. |
| [WO-2026-016](proposed/WO-2026-016-champion-visual-asset-reliability.md) | Core Features Developer | Depends on WO-2026-019's accepted evidence/fixture handoff | Shared `ChampionAvatar` and catalogue path; Core owns remediation after Fast Lane completes. |

| [WO-2026-022](proposed/WO-2026-022-daily-stripe-mrr-snapshots.md) | Core Features Developer | Theo approved implementation; WO-2026-009 sequencing lock is lifted | Billing-adjacent migration, Stripe worker, Vault, and cron work; preserve Collector/billing evidence boundaries. |

## Fast Lane

WO-2026-019 is the sole eligible Fast Lane item. It is S, low-risk, and explicitly prohibited from editing the shared avatar/catalogue implementation. Its handoff unblocks the Core-owned WO-2026-016 fix.

## Backlog pending Theo implementation approval

| Work order | Lane | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-020](proposed/WO-2026-020-free-soloq-entitlement.md) | Core Features Developer | Changes plan entitlement and existing module state; Theo approval required | Avoid overlapping any new entitlement migration; preserve the completed Collector contract. |
| [WO-2026-023](proposed/WO-2026-023-owner-additional-workspaces.md) | Core Features Developer | Tenant/RPC/auth boundary needs Theo approval and reviewed design | Do not overlap with WO-2026-021, WO-2026-017, or tenant-membership/RPC migration work. |
| [WO-2026-024](proposed/WO-2026-024-player-read-only-intelligence-access.md) | Core Features Developer | High-risk role/RLS/RPC changes need Theo implementation approval | Do not overlap with Draft, Scouting, Analytics role/capability, or intelligence-policy work. |

## Vague or incomplete before assignment

- **WO-2026-005:** needs a current warning sample, affected database/version evidence, and a decision whether investigation is read-only or remediation is in scope.
- **WO-2026-012:** needs the agreed paid-buyer standard and Free-to-Pro thesis; it is PM discovery, not development.
- **WO-2026-014:** needs Theo and ProComps approval for any external contact; it is Marketing discovery, not development.
- **WO-2026-018:** needs its audit findings before copy/UX changes can be split into isolated Fast Lane work orders.
