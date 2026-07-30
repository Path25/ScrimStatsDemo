# Developer Assignment Board

This board is a dispatch aid, not a replacement for its linked work order. Before starting, recheck the work order, its approval record, validation requirements, and collision risk.

## Ready for Development

| Work order | Lane | Size / risk | Dependencies | Collision risk / dispatch note |
|---|---|---|---|---|
| [WO-2026-015](proposed/WO-2026-015-pro-analytics-legibility-and-value.md) | Core Features Developer | M / Medium | Isolated Pro fixture or workspace for browser verification | Analytics components and Pro gate; do not combine with a broad analytics or workspace-copy refactor. |
| [WO-2026-017](proposed/WO-2026-017-workspace-identity-customization.md) | Core Features Developer | L / High | Reviewed Storage/RLS design and isolated two-tenant accounts | Tenant Settings, Storage, RLS, and layout identity; do not overlap with Settings or Storage-policy work. |
| [WO-2026-019](proposed/WO-2026-019-champion-avatar-evidence-pack.md) | Developer – Fast Lane | S / Low | Local or isolated test data | Evidence/fixture-only work; must not edit `ChampionAvatar` or catalogue implementation. |

## Ready for QA

| Work order | Owner | Deployment evidence | QA dependency |
|---|---|---|---|
| [WO-2026-001](in-progress/WO-2026-001-elite-proposition.md) | QA and Release Auditor | Discord Functions v6/v6/v2/v6/v6 contain the server release-state guard | Direct planned/disabled denial, then approved isolated-provider workflow matrix. |
| [WO-2026-021](proposed/WO-2026-021-existing-account-workspace-recovery.md) | QA | Local tests, lint, typecheck, production build, and signed-out responsive browser check passed | Approved controlled-account matrix: fresh, confirmed/no-tenant, unconfirmed, and recovery; record Auth logs and mailbox results separately. |

## Sequenced or blocked

| Work order | Proposed lane / owner | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-013](proposed/WO-2026-013-desktop-live-integration-direction.md) | Core Features Developer | Depends on WO-2026-009 and a selected direction | Collector/native integration strategy; do not overlap with WO-2026-009. |
| [WO-2026-016](proposed/WO-2026-016-champion-visual-asset-reliability.md) | Core Features Developer | Depends on WO-2026-019's accepted evidence/fixture handoff | Shared `ChampionAvatar` and catalogue path; Core owns remediation after Fast Lane completes. |

## Fast Lane

WO-2026-019 is the sole eligible Fast Lane item. It is S, low-risk, and explicitly prohibited from editing the shared avatar/catalogue implementation. Its handoff unblocks the Core-owned WO-2026-016 fix.

## Backlog pending Theo implementation approval

| Work order | Lane | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-020](proposed/WO-2026-020-free-soloq-entitlement.md) | Core Features Developer | Changes plan entitlement and existing module state; Theo approval required | Do not overlap with WO-2026-009 or another entitlement migration. |

## Vague or incomplete before assignment

- **WO-2026-005:** needs a current warning sample, affected database/version evidence, and a decision whether investigation is read-only or remediation is in scope.
- **WO-2026-012:** needs the agreed paid-buyer standard and Free-to-Pro thesis; it is PM discovery, not development.
- **WO-2026-014:** needs Theo and ProComps approval for any external contact; it is Marketing discovery, not development.
- **WO-2026-018:** needs its audit findings before copy/UX changes can be split into isolated Fast Lane work orders.
