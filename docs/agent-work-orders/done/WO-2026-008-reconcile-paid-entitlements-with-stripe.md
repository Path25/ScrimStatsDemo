# WO-2026-008 - Reconcile paid workspace entitlements with Stripe subscriptions

- **ID reservation:** [WO-2026-008 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Done
- **Owner:** Analytics and Technical Reporting agent
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Problem and user impact

The 2026-07-28 read-only reconciliation confirms a production contradiction between ScrimStats workspace entitlements and Stripe:

- Supabase has 10 workspaces recorded as active paid: 8 Pro and 2 Elite.
- Stripe has 2 active monthly subscriptions, both at USD 9.99 (Pro price), each scheduled to cancel at its current period end; current MRR is therefore USD 19.98.
- Of the 10 paid workspaces, 7 have no Stripe customer or subscription identifier, 2 point to non-active Stripe subscriptions, and 1 points to an active Stripe customer but has no matching active subscription ID.
- One of Stripe's two active subscriptions has no matching paid workspace identifier at all; neither is linked by subscription ID.
- The deployed `stripe_webhook_events` ledger has no records, so it cannot prove historical delivery or entitlement synchronisation.

This creates a material risk of paid access not matching commercial state, and means paid-workspace counts, paid conversion, and paid retention cannot be reported as commercial facts.

## Why now

MRR and paid retention are stated commercial priorities. Both active Stripe subscriptions are scheduled to end, so the current USD 19.98 MRR is at-risk and an unreconciled entitlement state could leave access or reporting incorrect when those periods end.

## Scope

- Preserve the completed, read-only tenant-to-Stripe reconciliation using redacted identifiers only.
- Classify each paid workspace and active Stripe subscription before any correction.
- Verify the source price map: the active Stripe price is the Pro monthly price; the local checkout and webhook source also defines the Elite monthly price, but no active Elite Stripe subscription exists.
- Determine why the hosted webhook ledger is empty and whether Stripe delivery is configured for the deployed webhook endpoint.
- Prepare a separate, approved remediation decision for each confirmed mismatch. Do not change customer data or replay events under this work order without Theo's approval.

## Explicit non-goals

- Changing customer plans, prices, subscriptions, access, invoices, webhook settings, or production tenant records.
- Treating Supabase plan labels as MRR.
- Exposing customer identities, email addresses, payment details, or Stripe secrets in reports.
- Creating a test workspace or exercising Stripe Checkout, portal, cancellation, or failed-payment flows without Theo's explicit approval.

## Acceptance criteria

- Every currently paid workspace is classified as an active Stripe match, historical/non-active match, approved internal/test grant, legacy exception, or unmatched.
- Every active Stripe subscription is mapped to a workspace or a documented exception.
- Reported MRR comes from active Stripe subscriptions, not Supabase entitlement labels.
- A hosted lifecycle rehearsal and correction plan are approved before any entitlement remediation.

## Relevant files, workflows, or data areas

- `public.tenants` subscription and Stripe identifier fields
- `public.stripe_webhook_events`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/customer-portal/index.ts`
- `supabase/migrations/20260726193000_workspace_billing_and_plan_entitlements.sql`
- `src/lib/plan-entitlements.ts`, `src/components/billing/BillingPanel.tsx`
- `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`

## Risks

- **Permissions / Supabase RLS:** Reconciliation output remains restricted and tenant-safe; normal reports use aggregates only.
- **Billing / entitlement:** High risk of paid access and customer revenue state diverging; both active subscriptions are cancellation-pending.
- **Email / customer communication:** Do not notify customers or send billing email until the state is confirmed.
- **Production / data:** Correcting entitlements, backfilling IDs, replaying webhooks, or configuring Stripe webhooks changes production state and requires Theo approval.

## Required validation

- Read-only reconciliation query with redacted identifiers. **Completed.**
- Stripe subscription review for every mismatch classification. **Completed for the currently returned subscription set.**
- Hosted Stripe lifecycle journey. **Passed by Theo's manual verification on 2026-07-28; this is accepted operator evidence for this work order.**
- Contract tests, lint, typecheck, production build, and authenticated owner/admin gate checks for any remediation implementation. **Not started; implementation is not approved.**

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Prioritise a no-change classification review and obtain Theo's approval before hosted test or remediation. | This work order |
| Feature Developer | Involved | Investigate hosted webhook configuration and implement an approved reconciliation/remediation path only. | Outstanding |
| QA and Release Auditor | Involved | Run the approved isolated hosted lifecycle and role-gate verification. | Outstanding |
| Technical Reporting Analyst | Involved | Maintain the redacted reconciliation and restrict commercial reporting to Stripe MRR. | Read-only evidence below |
| Lead Marketer and Growth | Not applicable | No customer claim or campaign work is authorised while paid counts are unreconciled. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Paid workspaces classified | 7 unmatched/no identifier; 2 historical/non-active subscription matches; 1 active-customer-only match. No corrective classification is asserted. | Production read-only | Pass |
| Active Stripe subscriptions classified | 2 active Pro subscriptions; 1 customer-only workspace link and 1 documented unlinked exception; 0 subscription-ID links. | Production read-only | Pass |
| MRR sourced from Stripe | 2 active USD 9.99 monthly subscriptions = USD 19.98 current MRR. | Production read-only | Pass |
| Hosted lifecycle and correction path verified | Theo manually verified the Stripe journey and accepted it as passed. No production correction was performed or approved by this evidence. | Hosted operator verification | Pass |

### Final verdict

- **Verdict:** READY
- **Rationale:** Theo manually verified and accepted the Stripe journey. The read-only reconciliation, source price mapping, live webhook endpoint, and all unmatched states are documented. This closes the investigation only; it does not assert that the unresolved tenant/Stripe divergence has been remediated.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Production entitlement remediation | Project Manager with Theo | A separately approved customer-by-customer correction plan, if business review requires correction. | Deferred; outside this closed investigation |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Investigation | Yes | Approved | 2026-07-28 | Read-only Stripe and Supabase reconciliation only. |
| Implementation | Yes | Approved, manual hosted journey accepted | 2026-07-28 | Theo confirmed the Stripe process journey works and requested this investigation close. No customer entitlement, subscription, price, webhook, or production-data correction was applied. |
| Release | Yes | N/A | 2026-07-28 | No release or production correction is in scope. |

## Decision and approval record

- 2026-07-28 - Theo assigned the work order to the Analytics and Technical Reporting agent for read-only reconciliation.
- 2026-07-28 - No corrective action, production-data change, secret/configuration change, customer communication, or lifecycle test is approved.
- 2026-07-28 - Theo approved isolated non-customer hosted test workspaces and Stripe test-mode lifecycle verification. Production correction, customer communication, live charges, webhook configuration changes, and production release remain unapproved.
- 2026-07-28 - Theo manually verified the Stripe process journey and directed that this investigation be marked passed and moved to done. Unmatched paid-workspace and subscription states remain documented; no correction was performed.

## Implementation and review evidence

- 2026-07-28 - Direct Stripe read: 9 subscriptions in the returned account set: 2 active, 6 canceled, and 1 incomplete-expired. The active subscriptions are both USD 9.99 monthly Pro subscriptions and both have cancellation pending at their current period end.
- 2026-07-28 - Direct Supabase read: 10 active paid workspaces; 8 Pro and 2 Elite. Reconciliation classifications are 7 with no Stripe identifier, 2 with non-active Stripe subscription matches, and 1 with an active-customer-only match. No active Stripe subscription matches a tenant by subscription ID.
- 2026-07-28 - Direct Supabase read: `stripe_webhook_events` contains no rows. The deployed `stripe-webhook` Edge Function is active, but the empty ledger is not proof of Stripe delivery or configuration.
- 2026-07-28 - Direct Stripe read: one enabled **live-mode** webhook endpoint targets the deployed `stripe-webhook` function and subscribes to Checkout completion plus subscription create, update, delete, pause, and resume events. The endpoint was created on 2026-07-26; its presence does not backfill the empty ledger or prove an event delivery.
- 2026-07-28 - Test execution blocker: the connected Stripe source is live-mode (all returned subscriptions and the webhook endpoint are marked live). No test-mode Stripe credentials/source are available through the current connection. Creating a test customer, checkout, or subscription here would create a live billing object and is out of the approved isolated-test scope.
- 2026-07-28 - Hosted operator verification: Theo manually confirmed the Stripe process journey works and accepted it as passed. The connector's lack of test-mode visibility is retained as a reporting limitation, not a failure of the accepted journey.
- 2026-07-28 - Source review: `create-checkout` and `stripe-webhook` use the same intended Pro and Elite price mapping. The active Stripe price matches the intended Pro monthly price. This source review does not prove a hosted lifecycle.
- **Highest evidence achieved:** Hosted verified (read-only production-source reconciliation plus Theo's manual hosted-journey verification); no remediation implemented.
