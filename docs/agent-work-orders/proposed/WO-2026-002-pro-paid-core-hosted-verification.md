# WO-2026-002 - Verify the Pro paid core end to end

- **Status:** Proposed
- **Owner:** Unassigned
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

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

## Implementation and review evidence

- **Highest evidence achieved:** Proposed
