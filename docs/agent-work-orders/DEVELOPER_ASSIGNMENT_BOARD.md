# Developer Assignment Board

This board is a dispatch aid, not a replacement for its linked work order. Before starting, recheck the work order, its approval record, validation requirements, and collision risk.

## Ready for Development

| Work order | Lane | Size / risk | Dependencies | Collision risk / dispatch note |
|---|---|---|---|---|
| [WO-2026-019](proposed/WO-2026-019-champion-avatar-evidence-pack.md) | Developer – Fast Lane | S / Low | Local or isolated test data | Evidence/fixture-only work; must not edit `ChampionAvatar` or catalogue implementation. |

## Ready for QA

| Work order | Owner | Deployment evidence | QA dependency |
|---|---|---|---|
| [WO-2026-010](review/WO-2026-010-funnel-service-role-append-only-grants.md) | QA and Release Auditor | Append-only service-role grant migration is applied; live grants/RLS/scorecard boundary verified | One approved non-customer source-trigger exercise, idempotency retry, and aggregate scorecard check shared with WO-003. |
| [WO-2026-001](in-progress/WO-2026-001-elite-proposition.md) | QA and Release Auditor | Embed suppression is active as Supabase Edge Function version 11; a Theo-approved isolated event has provider receipt; local contracts, lint, typecheck, build, and bundle budget pass | Capture the isolated Discord message: visible link, no preview card, one localised timestamp, no mojibake/mentions; retain `/scrim` with WO-2026-025. |
| [WO-2026-024](proposed/WO-2026-024-player-read-only-intelligence-access.md) | QA and Release Auditor | Production migrations applied; two non-customer Elite fixtures and hosted RLS read/isolation/mutation evidence recorded | Independently complete the desktop/mobile authenticated role matrix and direct API mutation checks; release remains HOLD pending Theo approval. |

## In Progress

| Work order | Lane | Active scope | Collision risk |
|---|---|---|---|

## QA blocked — Theo or PM input required

| Work order | Owner | Current blocker | Required routing |
|---|---|---|---|
| [WO-2026-002](review/WO-2026-002-pro-paid-core-hosted-verification.md) | QA | Its July handoff is obsolete relative to completed/accepted-risk WO-009 lifecycle work and has no current deployed test matrix. | PM must reconcile, narrow, split, or supersede the work order; Developer must provide a current deployed revision/test-account handoff if it remains active. |
| [WO-2026-003](review/WO-2026-003-premium-copy-and-funnel-measurement.md) | QA | No approved isolated funnel journey has produced an event; the ledger and scorecard remain empty. | Theo must approve the minimal temporary non-customer schedule/completed-game workflow; PM must keep any browser scorecard exposure under WO-011. |

## Sequenced or blocked

| Work order | Lane | Why it is not ready | Collision risk |
|---|---|---|---|

| Work order | Proposed lane / owner | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-013](proposed/WO-2026-013-desktop-live-integration-direction.md) | Core Features Developer | WO-2026-009 is complete under Theo's accepted-risk decision; a desktop direction still needs selecting | Collector/native integration strategy; preserve the completed Collector entitlement boundary. |
| [WO-2026-016](proposed/WO-2026-016-champion-visual-asset-reliability.md) | Core Features Developer | Depends on WO-2026-019's accepted evidence/fixture handoff | Shared `ChampionAvatar` and catalogue path; Core owns remediation after Fast Lane completes. |

| [WO-2026-022](proposed/WO-2026-022-daily-stripe-mrr-snapshots.md) | Core Features Developer | Theo approved implementation; WO-2026-009 sequencing lock is lifted | Billing-adjacent migration, Stripe worker, Vault, and cron work; preserve Collector/billing evidence boundaries. |
| [WO-2026-025](proposed/WO-2026-025-discord-slash-command-scheduling.md) | Core Features Developer | Split inbound `/scrim` feature; wait for WO-2026-001 correction and QA handoff | Shared Discord helpers/UI/outbox/manifest; do not run concurrently with WO-2026-001. |

## Fast Lane

WO-2026-019 is the sole eligible Fast Lane item. It is S, low-risk, and explicitly prohibited from editing the shared avatar/catalogue implementation. Its handoff unblocks the Core-owned WO-2026-016 fix.

## Backlog pending Theo implementation approval

| Work order | Lane | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-020](proposed/WO-2026-020-free-soloq-entitlement.md) | Core Features Developer | Changes plan entitlement and existing module state; Theo approval required | Avoid overlapping any new entitlement migration; preserve the completed Collector contract. |
| [WO-2026-023](proposed/WO-2026-023-owner-additional-workspaces.md) | Core Features Developer | Tenant/RPC/auth boundary needs Theo approval and reviewed design | Do not overlap with WO-2026-021, WO-2026-017, or tenant-membership/RPC migration work. |

## Vague or incomplete before assignment

- **WO-2026-005:** needs a current warning sample, affected database/version evidence, and a decision whether investigation is read-only or remediation is in scope.
- **WO-2026-012:** needs the agreed paid-buyer standard and Free-to-Pro thesis; it is PM discovery, not development.
- **WO-2026-014:** needs Theo and ProComps approval for any external contact; it is Marketing discovery, not development.
- **WO-2026-018:** needs its audit findings before copy/UX changes can be split into isolated Fast Lane work orders.
