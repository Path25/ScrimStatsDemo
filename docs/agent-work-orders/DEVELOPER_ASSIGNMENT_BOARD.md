# Developer Assignment Board

This board is a dispatch aid, not a replacement for its linked work order. Before starting, recheck the work order, its approval record, validation requirements, and collision risk.

## Ready for Development

| Work order | Lane | Size / risk | Dependencies | Collision risk / dispatch note |
|---|---|---|---|---|

## Ready for QA

| Work order | Owner | Validation evidence | QA dependency |
|---|---|---|---|
| [WO-2026-040](proposed/WO-2026-040-discord-production-readiness-controlled-release.md) | Core Features Developer / QA and Release Auditor | QA independently accepted corrected Phase D-B: commits `fe77294`/`fc0e8e8`, migration `20260806142907`, operator-only fixed-search-path routine, and rollback-only active-then-inactive proof. Current jobs 4/5 are inactive; HTTP queue 0, Discord events/attempts 11/13, controls 0/0, and workers inactive. | **HOLD.** Theo must separately decide whether to approve Phase D-C's exact private workspace module disable/restore fixtures and bounded invocations. Customer/role/tenant/entitlement matrix, production configuration, smoke, pilot, support/rollback, and release remain unverified. |

## Recently closed conditionally

| Work order | Owner | Accepted evidence and residual risk |
|---|---|---|
| [WO-2026-025](proposed/WO-2026-025-discord-slash-command-scheduling.md) | QA and Release Auditor | Theo accepted a staging-only conditional closure after one hosted Discord-to-receipt-to-scrim-to-delivered-outbox path. Exact replay and guild/role/entitlement/module/overlap/tenant denial matrix remain unverified; reopen before any production or customer activation. |
| [WO-2026-038](ready/WO-2026-038-notification-popover-opaque-surface.md) | QA and Release Auditor | Forced-refresh staging verification served the recorded candidate and passed opaque desktop/390x844 surface, desktop Escape, console, and workspace-selector checks. Notification read-state activation was intentionally not mutated; malformed separator remains separate. This is not production approval. |
| [WO-2026-037](proposed/WO-2026-037-membership-first-workspace-entry-and-creation.md) | QA and Release Auditor | Theo confirmed the relevant authenticated workspace-entry testing works and accepted the issue as resolved. QA's observed served-asset mismatch and missing role/no-membership/mobile matrix remain preserved residual evidence; this is not production approval. |
| [WO-2026-030](ready/WO-2026-030-workspace-switcher-menu-surface.md) | QA and Release Auditor | Theo accepted conditional closure after current staging desktop/mobile multi-workspace menu surface and A-to-B-to-A selection were hosted-verified. Current-candidate Escape dismissal and separate single-workspace control remain unverified; this is not production approval. |
| [WO-2026-033](proposed/WO-2026-033-elite-practice-development-loop.md) | QA and Release Auditor | Theo accepted conditional closure after fail-closed migration, plan/role/tenant evidence, and complete named-QA-fixture owner/member/viewer browser workflow. Actual 390px evidence was accepted as residual risk. | Customer activation, production smoke/monitoring, and release remain separate approvals; keep all non-QA tenants planned/disabled. |
| [WO-2026-036](proposed/WO-2026-036-elite-opponent-preparation-playbooks.md) | QA and Release Auditor | Theo accepted conditional fixture-only closure after Owner/Admin, Member/Viewer, Free/Pro, disabled-tenant, mobile, and rollback-only direct authorization evidence. Completed review, breadcrumb, and unavailable/insufficient-state checks remain unverified. | Do not enable any non-QA tenant, make customer-facing Elite claims, or treat this as production approval. Reopen before activation. |

## In Progress

| Work order | Lane | Active scope | Collision risk |
|---|---|---|---|
| [WO-2026-006](in-progress/WO-2026-006-reporting-connections-and-reliability-telemetry.md) | PM | Produce a dated, reconciled baseline through Theo-approved least-privilege read-only access or aggregate/redacted exports. | No secrets, provider/account activation, billable telemetry, configuration, migration, deployment, or spend. |
| [WO-2026-012](proposed/WO-2026-012-paid-buyer-standard-and-conversion-thesis.md) | PM | Define and evidence the Pro buyer's recurring value loop before hard-launch claims or packaging changes. | Do not change prices, plan claims, entitlements, or public copy; coordinate with WO-003, WO-028, and WO-031. |
| [WO-2026-026](proposed/WO-2026-026-new-workspace-activation-follow-up.md) | PM | Manual-first activation procedure and Message Ledger drafted; no send authorised. | Do not modify email, Auth, invitation, notification-worker, billing, or provisioning flows. |
| [WO-2026-018](proposed/WO-2026-018-workspace-language-and-journey-coherence.md) | PM | Audit League-native team terminology, client-facing wording, and customer-visible mojibake; produce route-and-string-specific non-overlapping implementation orders. | Do not make broad copy changes. Route isolated S/Low corrections to Fast Lane only after audit; shared, entitlement, public-claim, or workflow work goes to Core or the relevant owner. |

## QA blocked — Theo or PM input required

| Work order | Owner | Current blocker | Required routing |
|---|---|---|---|
| [WO-2026-028](proposed/WO-2026-028-isolated-pro-purchase-and-entitlement-verification.md) | QA and Release Auditor | Theo authorised observation of naturally expiring internal subscriptions only; no new charge/cancellation is approved. | Observe an authorised, redacted cancellation-area state if available; isolated checkout, webhook-to-entitlement, and second-tenant comparator evidence still require their own safe route/account access. |
| [WO-2026-003](review/WO-2026-003-premium-copy-and-funnel-measurement.md) | QA | Theo chose natural activity rather than synthetic hosted test data; the ledger and scorecard remain empty. | Wait for an authorised, privacy-safe naturally occurring eligible journey; record aggregate/redacted evidence only. Keep browser scorecard work under WO-011. |
| [WO-2026-030](ready/WO-2026-030-workspace-switcher-menu-surface.md) | Developer – Fast Lane / QA | Local correction is complete; authenticated staging A/B behavior passes, but the deployed staging build still shows the pre-fix transparent surface. | Expose the local patch in staging, repeat desktop/mobile visual checks, and obtain single-workspace control-account evidence before QA closure. |

### QA update - 2026-08-03

WO-2026-030 current staging verification supersedes the earlier pre-fix deployment interpretation: desktop and 390x844 mobile now render an opaque, bordered, readable `z-index: 60` multi-workspace menu; controlled A-to-B-to-A selection completed without console warnings/errors. The work order remains blocked only on current-candidate Escape dismissal and separate single-workspace control evidence, unless Theo accepts those low-risk staging residual checks conditionally.

### WO-033 hosted-QA blocker - 2026-08-03 (historical; superseded)

WO-2026-033 is blocked: the active shared Supabase project has no separate development branch and Supabase branch creation is unavailable on the current plan. No hosted schema, data, module, deployment, or customer state changed. Theo must choose and explicitly approve either a new paid Supabase project (organisation, region, and recurring cost) or an organisation plan upgrade that enables branches; otherwise hosted QA remains blocked.

### WO-033 hosted-QA correction - 2026-08-03

Theo explicitly approved the active-project migration after confirming a SQL backup. The migration was applied, all existing tenants defaulted to `planned/disabled`, and only the named non-customer Elite fixture was enabled. Staging browser evidence now proves the matching owner UI revision; direct Free/Pro denial and rolled-back Owner lifecycle checks also pass. The work order remains In Progress pending member/viewer browser, actual-mobile-width, evidence/action completion, and a separate release decision.

## Sequenced or blocked

| Work order | Lane | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-039](proposed/WO-2026-039-champion-pool-workspace.md) | Core Features Developer | Founder-approved product definition; implementation approval and a non-overlapping WO-2026-036 Core handoff remain open. | Shared Draft/champion-pool/player-role/RLS/entitlement work. Do not start alongside WO-2026-036 or broaden into provider data, plan changes, or Draft redesign. |

| Work order | Proposed lane / owner | Why it is not ready | Collision risk |
|---|---|---|---|
| [WO-2026-013](proposed/WO-2026-013-desktop-live-integration-direction.md) | Core Features Developer | WO-2026-009 is complete under Theo's accepted-risk decision; a desktop direction still needs selecting | Collector/native integration strategy; preserve the completed Collector entitlement boundary. |

## Fast Lane

WO-2026-030 is blocked pending patched staging visual verification and the single-workspace control-account check. WO-2026-038 is handed to QA after local validation; its authenticated patched-candidate visual and keyboard matrix remains open. WO-2026-019 is complete as an evidence handoff; its verified shared-component defect is conditionally complete under WO-2026-016.

## Future Elite strategy â€” not ready for dispatch

Current-status note (2026-08-03): WO-032 is complete as an internal founder decision record; WO-033 is conditionally complete on its named QA fixture; WO-035 is complete internal research and parked; WO-036 Phase 1 is ready for Core development. Their stale rows below are retained as historical sequencing context only; the work orders and index are authoritative.

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
