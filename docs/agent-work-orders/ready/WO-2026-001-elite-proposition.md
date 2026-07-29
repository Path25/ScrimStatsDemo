# WO-2026-001 - Define and deliver a credible Elite proposition

- **Status:** Ready
- **Owner:** Feature Development agent
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Problem and user impact

Elite is priced above Pro, but its stated differentiator is Discord automation that is not yet a complete customer workflow. Teams have no dependable, present-day reason to upgrade.

## Why now

Elite subscriptions are part of the near-term commercial goal. Selling a placeholder benefit risks a weak first impression and avoidable support burden.

## Scope

Deliver one immediate Elite job-to-be-done: an installed team Discord server receives selected schedule-change and practice-reminder prompts that link members back to ScrimStats. The integration must not relay scouting, review, private player, credential, or authorization content.

First assess and complete the existing `discord-install`, `discord-channels`, `discord-schedule-reminders`, and `discord-dispatch` workflow; keep it honestly labelled as unavailable or early access until its complete support path is verified. Keep discovery of additional Elite features separate from implementation and create a new work order only once a concrete customer outcome is selected.

## Explicit non-goals

- Building a broad new Elite feature suite or speculative additional Elite features.
- Changing prices or publishing marketing without explicit approval.
- Enabling Discord production delivery before its end-to-end workflow is verified.

## Acceptance criteria

- Elite's approved immediate outcome is limited to selected Discord schedule-change and practice-reminder delivery with links back to ScrimStats; it is available only when its complete customer and support path is verified, otherwise it is honestly labelled unavailable or early access.
- Billing, gates, workspace module state, and customer copy make the same promise.
- The support and failure path is documented for the approved outcome.

## Relevant files, workflows, or data areas

- `src/components/billing/BillingPanel.tsx`
- `src/lib/plan-entitlements.ts`
- `src/components/billing/PlanGate.tsx`
- `src/pages/Integrations.tsx` and `src/pages/Settings.tsx`
- `supabase/functions/discord-*`, `supabase/migrations/20260726171000_quarantine_discord_preview.sql`
- `scripts/billing-invitations-contract.test.mjs`

## Risks

- **Permissions / Supabase RLS:** Discord installation and channel configuration must remain tenant- and role-scoped.
- **Billing / entitlement:** UI, database, webhook, and server enforcement can diverge.
- **Email / customer communication:** Paid-plan claims may become inaccurate.
- **Production / data:** Accidentally enabling an incomplete Discord path could affect customer workspaces.

## Required validation

- Relevant contract tests, lint, typecheck, and production build.
- Authenticated owner/admin checks for gates and integration controls.
- Hosted verification of the approved Elite workflow and its unavailable/failure state.

## Role handoffs

| Role | State | Handoff |
| --- | --- | --- |
| Project Manager | Involved | Keep the Elite promise limited to the approved Discord scheduling outcome; reject speculative feature additions until separately scoped. |
| Feature Developer | Assigned | Audit and complete the existing installation, channel-selection, reminder, and dispatch path without enabling production delivery. |
| QA & Release Auditor | Pending | Verify tenant/role isolation, OAuth-state handling, channel subscription controls, event deduplication, delivery failure states, and hosted evidence before release. |
| Technical Reporting Analyst | Consulted | Define only safe operational delivery/reliability evidence; do not treat a queued reminder as customer receipt. |
| Lead Marketer & Growth | Consulted | Prepare no public claim until QA confirms a complete customer/support path; collect additional Elite feature ideas separately. |

## Release audit

### Acceptance-criteria traceability

| Criterion | Evidence required | Status |
| --- | --- | --- |
| One concrete Elite outcome | Founder decision and coherent gated customer copy | Defined; implementation outstanding |
| Tenant-safe Discord workflow | Contract, role, OAuth-state, channel and dispatch review | Outstanding |
| Support and failure path | Authenticated browser plus hosted success/failure evidence | Outstanding |
| Honest paid-plan promise | Billing/gate/integration copy and entitlement reconciliation | Outstanding |

### Final verdict

**READY FOR DEVELOPMENT** — Theo selected Discord schedule-change and practice-reminder delivery as Elite's immediate outcome. The existing source is preview/quarantined and has no end-to-end hosted evidence, so it must not be marketed or presented as generally available.

### Exact outstanding checks

- Audit current Discord deployment/configuration inventory and identify every missing customer-support-path step.
- Implement and validate the bounded workflow without enabling production delivery.
- Obtain Theo's separate approval for any external-provider activation, secret/configuration change, production deployment, marketing claim, or release.

### Theo approval record

| Decision | Required | Status | Record |
| --- | --- | --- | --- |
| Implement bounded Discord workflow | Yes | Approved | 2026-07-29 — Theo retained Discord as Elite's differentiator and approved work on the integration. |
| External-provider activation/configuration | Yes | Pending | Discord credentials, OAuth configuration, or production activation remain unapproved. |
| Production release or customer claim | Yes | Pending | Requires hosted end-to-end verification and Theo's explicit release approval. |

## Decision and approval record

- 2026-07-28 - Proposed from founder review; no implementation approval recorded.
- 2026-07-29 - Theo confirmed Discord remains the Elite differentiator during soft launch and approved work to complete the Discord integration. Broader Elite features remain discovery-only until separately defined and approved.

## Implementation and review evidence

- Existing source contains an intentionally quarantined/preview Discord installation, channel, scheduled-reminder, and dispatch path. Current workspace and billing copy still label Discord as planned or released later; no end-to-end hosted workflow is evidenced.
- **Highest evidence achieved:** Implemented source / proposed customer workflow. It is not browser, hosted, or production verified.
