# WO-2026-002 - Verify the Pro paid core end to end

- **Status:** Blocked
- **Assigned owner:** QA
- **Size:** L
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing and QA scenario

- **Area / files likely affected:** Paid-plan gates, BillingPanel, Settings, Integrations, Collector, checkout/webhook, and hosted release records.
- **Dependencies:** A current Core Features Developer handoff that reconciles obsolete evidence with WO-2026-009, plus reproducible isolated test accounts and lifecycle fixtures.
- **Collision risk:** Do not QA against a moving Collector/billing/entitlement change; coordinate the handoff with WO-2026-009.
- **QA scenario / test steps:** Blocked until the developer records deployed revision, migration state, test-account setup, exact plan/role matrix, and expected server/browser responses. QA then runs Free/Pro/Elite and cross-tenant checks through checkout state, gates, direct Collector paths, and billing copy, recording hosted evidence for each criterion.

## Problem and user impact

Pro's operational, capture, and data workflows are locally evidenced but not yet proven for a real subscribed team in the hosted environment. An unverified first paid journey risks loss of trust and revenue.

## Why now

ScrimStats intends to accept paying customers now, and Riot/GRID data ingestion is essential to the paid experience.

## Scope

Use a dedicated test workspace to verify self-service signup, Pro checkout, webhook entitlement, Riot/GRID connection, scheduling, capture or import, analytics/review, billing portal, cancellation, and failed-payment handling.

## Explicit non-goals

- Changing pricing, plans, or customer data.
- Testing against customer workspaces.
- Adding new data-provider features before the existing path is assessed.

## Acceptance criteria

- Each journey has dated hosted evidence from the tested release.
- Tenant and role access is correct at every paid boundary.
- Provider credentials remain server-side and failure states are customer-safe.
- Stripe status and ScrimStats entitlement state reconcile for the test workspace.
- The server rejects Collector pairing, status, configuration, and ingest access for a Free workspace, while allowing the approved Pro and Elite path.

## Relevant files, workflows, or data areas

- `supabase/functions/create-checkout/`, `stripe-webhook/`, `customer-portal/`
- `supabase/functions/riot-integration/`, `grid-api/`, `grid-auto-monitoring/`
- `collector/`, `collector-pairing/`, `collector-status/`, `collector-ingest/`
- `supabase/migrations/20260726193000_workspace_billing_and_plan_entitlements.sql`
- `e2e/dashboard.spec.ts`, `docs/operations/PILOT_RUNBOOK.md`

## Risks

- **Permissions / Supabase RLS:** Cross-tenant access or a role bypass in an authenticated flow.
- **Billing / entitlement:** Stripe webhooks, price mapping, cancellation, and paid access may diverge.
- **Email / customer communication:** Signup, invitation, and billing failure messaging can fail or mislead.
- **Production / data:** Requires isolated test credentials and may invoke real external providers or Stripe test-mode workflows.

## Required validation

- Authenticated owner/admin/member/viewer browser journeys against hosted ScrimStats.
- Hosted Edge Function, Auth, API, and Stripe-event log review.
- Supabase security/performance advisor review and RLS checks.
- Stripe lifecycle rehearsal with a dedicated test workspace; no customer data.

## Decision and approval record

- 2026-07-28 - Proposed from founder review; Theo approval is required before using hosted credentials or billing flows.
- 2026-07-28 - Independent QA audit returned HOLD. Theo approval is required before use of production access, Stripe workflows, external providers, or test-data creation.
- 2026-07-28 - Theo approved local implementation to align Collector to Pro and add server-side entitlement enforcement. Hosted credentials, Stripe, providers, test workspaces, deployment, and migration application remain unapproved.
- 2026-07-28 - Theo approved use of isolated non-customer hosted test workspaces, disposable role accounts, and Stripe test mode for this work order's verification. No live customer workspace, live charge, production migration, provider activation, secret/configuration change, or production release is approved.

## Implementation and review evidence

- 2026-07-28 - Implemented local Collector entitlement enforcement. `collector-pairing`, `collector-pair`, `collector-status`, and `collector-ingest` now reject Free workspaces server-side with `collector_plan_required`; Pro and Elite remain allowed. The check uses the persisted workspace subscription tier, not browser state or capture-profile defaults.
- 2026-07-28 - Added `supabase/migrations/20260728211332_collector_pro_entitlement_enforcement.sql`. It makes the persisted `collector` module available to Pro and Elite while preserving Discord as Elite-only. At the time of local implementation it had not been applied anywhere.
- 2026-07-28 - Added `scripts/collector-entitlement-contract.test.mjs` covering the shared entitlement check, all four protected function paths, and database contract alignment.
- 2026-07-28 - Local validation after the enforcement change: 166/166 source and contract tests passed; TypeScript passed; ESLint passed with zero warnings; production Vite build and bundle budget passed.
- 2026-07-28 - Local static validation passed: TypeScript, zero-warning ESLint, 162/162 source and contract tests, production Vite build, and bundle budget.
- 2026-07-28 - Built-artifact public Playwright validation passed: 33/33 desktop, tablet, and mobile journeys. These were signed-out public journeys only; 15 authenticated owner/admin/member/viewer/operator cases were skipped because credentials were not configured.
- 2026-07-28 - Audit found a server-side paid-access bypass in the Collector path. `collector-pairing` checks authenticated manager membership and capture profile but not plan or workspace entitlement; the profile falls back to `desktop_manual`. A Free manager can therefore pair a Collector by directly invoking the Edge Function. `collector-ingest` likewise checks device and capture profile, not paid entitlement.
- 2026-07-28 - Audit found the entitlement contract split: the browser gate and billing copy advertise Collector on Pro, while `20260726193000_workspace_billing_and_plan_entitlements.sql` marks the Collector module enabled only for Elite. The current Collector Edge Functions do not enforce that database entitlement.
- 2026-07-28 - Audit found a deployment-reconciliation risk: `docs/launch/EDGE_FUNCTION_MANIFEST.md` declares legacy `sync-subscription` retired, but retains its source directory and explicitly calls for reconciliation before the final release tag.
- 2026-07-28 - Authenticated staging check with an isolated non-customer workspace owner: Settings reported active Pro and listed Game Capture as a Pro workflow. The owner could open `/collector` and saw the supported Windows-app handoff rather than a Free-plan gate. No browser console warning or error was observed during these checks. No pairing code, device credential, billing action, provider connection, or test data was created.
- 2026-07-28 - Hosted release evidence: the approved migration applied successfully as `20260728211332_collector_pro_entitlement_enforcement` (the Supabase deployment timestamp). Aggregate verification confirmed Collector is disabled for 98 Free workspaces and enabled for 8 Pro and 2 Elite workspaces. No customer records were individually inspected.
- 2026-07-28 - Hosted release evidence: Collector entitlement enforcement is deployed in `collector-pairing` v5, `collector-pair` v3, `collector-status` v4, and `collector-ingest` v11. Hosted source inspection confirmed each active revision contains the entitlement check and `collector_plan_required` denial response. Direct role/plan invocation remains required.
- **Highest evidence achieved:** Browser verified for the isolated Pro-owner plan and route state. The new server entitlement enforcement remains only locally tested; Free denial, Elite allowance, direct Function calls, device-token revocation, and deployed migration/function verification remain required.

## QA release audit handoff

- **Verdict:** HOLD
- **Blocking:** The local Collector server-enforcement fix is not deployed; a Free-manager bypass remains possible on the currently hosted function revision until release verification succeeds.
- **Blocking:** The Pro-aligned Collector module migration is not applied; hosted database module state may still disagree with browser and billing copy.
- **Important:** Retired legacy billing deployment must be reconciled with source before release.
- **Unverified:** Production migration state, RLS policies, grants, deployed Edge Function inventory, Stripe lifecycle, and all authenticated role/tenant journeys.
- **Unverified:** Free denial and Pro/Elite allowance against deployed Collector functions; a fresh browser build alone cannot prove the server boundary.
- **Exact Theo approvals or inputs required:**
  - Explicit approval to use a dedicated non-customer test workspace and create controlled test data.
  - Production Supabase dashboard/MCP access for migration, RLS, function, log, and advisor verification; do not share service-role secrets in the work order.
  - Stripe test-mode access or approved signed webhook/log evidence for checkout, upgrade, cancellation, past-due, and portal checks.
  - Disposable hosted accounts for owner, admin, member, viewer, and platform operator across two isolated tenants.
  - Explicit approval before any production migration, billing/entitlement change, secret/configuration change, provider activation, or production-data mutation.
