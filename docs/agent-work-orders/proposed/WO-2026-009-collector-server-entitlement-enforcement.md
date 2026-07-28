# WO-2026-009 - Enforce Collector entitlement below the browser

- **Status:** Proposed
- **Owner:** Unassigned
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Problem and user impact

Game Capture is advertised as a Pro capability, but the current server path does not enforce a paid entitlement. A Free workspace manager can directly invoke Collector pairing, pair a device, and continue into device-token capture. This creates incorrect billing access and undermines the paid product contract.

The entitlement contract also disagrees: the browser route and billing copy offer Collector on Pro, while the database entitlement migration enables its module only for Elite.

## Why now

ScrimStats is soft-launching paid access. This is a confirmed release blocker under the no-incorrect-billing-access standard.

## Scope

Make Collector entitlement authoritative, coherent, and enforced below the browser for the complete lifecycle: pairing, device status, configuration, ingestion, and post-downgrade behaviour. Align the Pro/Elite contract across database, Edge Functions, browser states, billing copy, and tests.

## Explicit non-goals

- Changing published Stripe prices, plans, or customer-facing claims without Theo's explicit approval.
- Activating native Collector distribution, signing, or update delivery.
- Applying migrations, changing production billing, or mutating customer data without Theo's explicit approval.

## Acceptance criteria

- A Free workspace manager is denied Collector pairing, status/configuration, and ingestion with a customer-safe server response.
- An entitled Pro or Elite workspace manager can complete the supported Collector path.
- Existing device tokens stop receiving paid capture access after an entitlement downgrade or cancellation, according to the approved grace-period policy.
- Browser gates, workspace module records, BillingPanel, Settings, Integrations, checkout/webhook behaviour, and Edge Functions all represent Collector as Pro and Discord as Elite.
- Contract tests cover Free denial, Pro allow, Elite allow, direct Edge Function invocation, and downgrade/revocation.
- Hosted verification proves the same outcomes with dedicated test workspaces; no customer data is used.

## Relevant files, workflows, or data areas

- `src/App.tsx`, `src/lib/plan-entitlements.ts`, `src/components/billing/PlanGate.tsx`
- `src/components/billing/BillingPanel.tsx`, `src/pages/Settings.tsx`, `src/pages/Integrations.tsx`
- `supabase/migrations/20260726193000_workspace_billing_and_plan_entitlements.sql`
- `supabase/functions/collector-pairing/`, `collector-status/`, `collector-ingest/`, and `_shared/collector.ts`
- `supabase/functions/create-checkout/`, `stripe-webhook/`, `customer-portal/`
- `scripts/billing-invitations-contract.test.mjs`, Collector contract tests, and authenticated E2E coverage

## Risks

- **Permissions / Supabase RLS:** Device tokens and service-role operations can bypass browser controls; tenant and entitlement checks must be enforced on every server path.
- **Billing / entitlement:** Pro/Elite and active/trial/past-due/cancelled semantics must match Stripe and the approved grace policy.
- **Email / customer communication:** Billing and upgrade messaging must not claim access before server entitlement is active.
- **Production / data:** Migration and entitlement changes can interrupt existing Collector devices; use dedicated test workspaces first.

## Required validation

- Targeted entitlement, Collector, webhook, and downgrade contract tests.
- ESLint with zero warnings, TypeScript, production build, and bundle budget.
- Authenticated owner/admin/member/viewer browser checks, including direct Function calls where the browser gate would otherwise conceal a bypass.
- Supabase migration, RLS, grants, function/security-advisor review, and deployed Edge Function verification.
- Stripe test-mode lifecycle rehearsal and hosted test-workspace validation.

## Decision and approval record

- 2026-07-28 - Proposed from independent QA HOLD audit. Theo approval is required before implementation because this changes billing and entitlement behaviour.

## Implementation and review evidence

- 2026-07-28 - Audit evidence: `collector-pairing` checks only authenticated manager membership and `desktop_manual` capture profile. `collector-ingest` checks device credentials and the same profile. Neither server path checks a paid plan or `tenant_feature_access`.
- 2026-07-28 - Audit evidence: the existing entitlement migration sets `collector` true only when `subscription_tier = 'elite'`, while the active browser route requires only Pro.
- **Highest evidence achieved:** Proposed; implementation and hosted validation have not begun.
