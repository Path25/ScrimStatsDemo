# Developer Assignment Board

This board is a dispatch aid, not a replacement for its linked work order. Before starting, recheck the work order, its approval record, validation requirements, and collision risk.

## Ready for Development

| Work order | Lane | Size / risk | Dependencies | Collision risk / dispatch note |
|---|---|---|---|---|
| [WO-2026-035](proposed/WO-2026-035-league-knowledge-source-boundary.md) | Technical Reporting Analyst | M / High | Theo-approved internal research scope; primary-source terms/rights review | Source register only; do not activate providers, scrape, ingest, store VODs, spend, or publish. |

## Ready for QA

| Work order | Owner | Deployment evidence | QA dependency |
|---|---|---|---|
| [WO-2026-033](proposed/WO-2026-033-elite-practice-development-loop.md) | QA and Release Auditor | Phase 2 implementation `32b6ceb` with pre-change checkpoint `ac71123`: 228/228 repository tests, 47/47 disposable-database assertions, guarded structural recovery rehearsal, zero-warning lint, TypeScript, production build, and bundle budget. No hosted migration, activation, deployment, or browser evidence. | Audit migration/RLS/RPC/recovery evidence first. Any production-backed migration, type regeneration, module activation, deployment, or hosted role/browser matrix requires a new exact Theo approval. |
| [WO-2026-037](proposed/WO-2026-037-membership-first-workspace-entry-and-creation.md) | QA and Release Auditor | Staging contains application candidate `fcf54cb`; fail-closed current-user membership state, stale-request protection, retryable unavailable routes, and owner-eligible selector creation entry passed focused 16/16, repository 233/233, zero-warning lint, TypeScript, production build, and bundle budget. No SQL, RPC, hosted mutation, or authenticated-workflow claim. | Execute the controlled one/multi/no-membership plus member/admin/viewer-only role matrix, desktop/mobile selector checks, and A-B-A selection preservation; reconcile any application-code diff after `fcf54cb`. |
| [WO-2026-038](ready/WO-2026-038-notification-popover-opaque-surface.md) | QA and Release Auditor | Exact candidate `6d644ac` is deployed and Vercel `READY`; focused 6/6, repository 233/233, zero-warning lint, TypeScript, production build, and bundle budget pass. | Verify desktop and 390x844 notification surface, entry-or-empty behavior, Escape, console, and unchanged workspace selector against the recorded candidate. |

## Recently closed conditionally

| Work order | Owner | Accepted evidence and residual risk |
|---|---|---|
| [WO-2026-025](proposed/WO-2026-025-discord-slash-command-scheduling.md) | QA and Release Auditor | Theo accepted a staging-only conditional closure after one hosted Discord-to-receipt-to-scrim-to-delivered-outbox path. Exact replay and guild/role/entitlement/module/overlap/tenant denial matrix remain unverified; reopen before any production or customer activation. |

## In Progress

| Work order | Lane | Active scope | Collision risk |
|---|---|---|---|
| [WO-2026-036](proposed/WO-2026-036-elite-opponent-preparation-playbooks.md) | Core Features Developer | Hosted migration `20260803221912` is applied; all 115 tenant module rows remain planned/disabled, six forced-RLS base tables remain empty and unavailable to browser DML, unauthenticated identity checks fail closed, and hosted types are regenerated. Staging frontend deployment, an isolated module activation, authenticated role/plan/tenant workflow evidence, and QA audit remain open and separately approval-gated. | Dedicated `opponent_preparation` stream. Preserve Pro Scouting/Draft; no external sources/providers/links/embeds/scraping/VODs and no broad shared-workflow refactor. |
| [WO-2026-006](in-progress/WO-2026-006-reporting-connections-and-reliability-telemetry.md) | PM | Produce a dated, reconciled baseline through Theo-approved least-privilege read-only access or aggregate/redacted exports. | No secrets, provider/account activation, billable telemetry, configuration, migration, deployment, or spend. |
| [WO-2026-032](proposed/WO-2026-032-elite-improvement-programme-proposition.md) | PM | Define the internal Elite buyer, weekly job, outcome, evidence boundary, and sequence. | Do not dispatch WOs 033, 034, or 036 or alter pricing, billing, claims, outreach, providers, or release scope. |
| [WO-2026-012](proposed/WO-2026-012-paid-buyer-standard-and-conversion-thesis.md) | PM | Define and evidence the Pro buyer's recurring value loop before hard-launch claims or packaging changes. | Do not change prices, plan claims, entitlements, or public copy; coordinate with WO-003, WO-028, and WO-031. |
| [WO-2026-026](proposed/WO-2026-026-new-workspace-activation-follow-up.md) | PM | Manual-first activation procedure and Message Ledger drafted; no send authorised. | Do not modify email, Auth, invitation, notification-worker, billing, or provisioning flows. |

## QA blocked — Theo or PM input required

| Work order | Owner | Current blocker | Required routing |
|---|---|---|---|
| [WO-2026-028](proposed/WO-2026-028-isolated-pro-purchase-and-entitlement-verification.md) | QA and Release Auditor | Theo authorised observation of naturally expiring internal subscriptions only; no new charge/cancellation is approved. | Observe an authorised, redacted cancellation-area state if available; isolated checkout, webhook-to-entitlement, and second-tenant comparator evidence still require their own safe route/account access. |
| [WO-2026-003](review/WO-2026-003-premium-copy-and-funnel-measurement.md) | QA | Theo chose natural activity rather than synthetic hosted test data; the ledger and scorecard remain empty. | Wait for an authorised, privacy-safe naturally occurring eligible journey; record aggregate/redacted evidence only. Keep browser scorecard work under WO-011. |
| [WO-2026-030](ready/WO-2026-030-workspace-switcher-menu-surface.md) | Developer – Fast Lane / QA | Local correction is complete; authenticated staging A/B behavior passes, but the deployed staging build still shows the pre-fix transparent surface. | Expose the local patch in staging, repeat desktop/mobile visual checks, and obtain single-workspace control-account evidence before QA closure. |

## Sequenced or blocked

| Work order | Lane | Why it is not ready | Collision risk |
|---|---|---|---|

| Work order | Proposed lane / owner | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-013](proposed/WO-2026-013-desktop-live-integration-direction.md) | Core Features Developer | WO-2026-009 is complete under Theo's accepted-risk decision; a desktop direction still needs selecting | Collector/native integration strategy; preserve the completed Collector entitlement boundary. |

## Fast Lane

WO-2026-030 is blocked pending patched staging visual verification and the single-workspace control-account check. WO-2026-019 is complete as an evidence handoff; its verified shared-component defect is conditionally complete under WO-2026-016.

## Backlog pending Theo implementation approval

| Work order | Lane | Why it is not ready | Collision risk |
|---|---|---|---|

## Future Elite strategy â€” not ready for dispatch

Current-status note (2026-08-03): WO-032 remains active in the In Progress table, WO-033 is in Ready for QA, and WO-035 is ready in the Ready for Development table. Their stale rows below are retained as historical sequencing context only; the work orders and index are authoritative.

| Work order | Proposed owner | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-031](proposed/WO-2026-031-elite-purchase-and-value-boundary.md) | Core Features Developer | Parked by Theo until the future Elite sequence identifies a separately evidenced customer-available differentiated outcome. | Billing, checkout, plan copy, Discord module state, and Message Ledger; do not overlap with WO-2026-028 or WO-2026-025. |
| [WO-2026-032](proposed/WO-2026-032-elite-improvement-programme-proposition.md) | PM | Founder must approve the buyer, recurring job, success evidence, and sequencing before any Elite build. | Governs WO-033â€“036 and WO-031; do not turn hypotheses into plan claims. |
| [WO-2026-034](proposed/WO-2026-034-elite-weekly-performance-command-centre.md) | Core Features Developer | Depends on the implemented and verified WO-033 evidence model. | Shared Overview, analytics, scheduling, and action data; no parallel dashboard rewrite. |
| [WO-2026-035](proposed/WO-2026-035-league-knowledge-source-boundary.md) | Technical Reporting Analyst | Source rights, freshness, attribution, provider, and cost boundary must be approved before ingestion or customer claims. | Do not activate providers, scrape, store VODs, or publish summaries without approval. |
| [WO-2026-036](proposed/WO-2026-036-elite-opponent-preparation-playbooks.md) | Core Features Developer | Depends on WO-032, WO-033, and approved source boundary under WO-035. | Shared Scouting/Draft, provider data, playbook permissions, and tenant data. |

## Vague or incomplete before assignment

- **WO-2026-014:** needs Theo and ProComps approval for any external contact; it is Marketing discovery, not development.
- **WO-2026-018:** needs its audit findings before copy/UX changes can be split into isolated Fast Lane work orders.
