# WO-2026-028 - Verify an isolated Pro purchase, entitlement, and billing-return journey

- **ID reservation:** [WO-2026-028 registry row](../WORK_ORDER_INDEX.md)
- **Status:** Blocked
- **Assigned owner:** QA and Release Auditor
- **Size:** L
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** Read-only verification of hosted `create-checkout`, `stripe-webhook`, `customer-portal`, `BillingPanel`, Settings, plan gates, `tenants` subscription fields, and redacted Stripe/Supabase logs. A defect found by QA must be handed to Core Features Developer in a separate remediation work order.
- **Dependencies:** An isolated non-customer workspace; a safely isolated Stripe test-mode path **or** Theo's explicit approval for one tightly bounded live-mode internal purchase and cancellation; the deployed revision and redacted webhook/log access. Provider/Riot/GRID validation is deliberately excluded and remains under WO-2026-013's selected-direction work.
- **Collision risk:** Do not alter checkout, Stripe mappings, webhook configuration, entitlements, prices, or customer data while testing. Do not overlap with any new billing, entitlement, or migration work.

## Problem and user impact

Theo's manually observed Stripe journey and WO-2026-009's conditional Collector closure are useful evidence, but they do not supply a reproducible, isolated record that a new Pro buyer can complete checkout, receive the correct hosted entitlement, return to an honest billing state, and reach the billing portal. Without this, ScrimStats cannot honestly call its paid purchase path fully verified.

## Why now

The immediate commercial goal is paid Pro conversions. This is the smallest remaining commercial-release check; it avoids reopening accepted Collector lifecycle risk and avoids incorrectly treating data-provider readiness as a checkout test.

## Scope

- Verify one isolated Free-to-Pro purchase journey from the hosted workspace Billing UI through checkout completion, webhook processing, persisted subscription/entitlement state, Pro UI gates, and customer-portal return.
- Record only redacted request/event identifiers, timestamps, price/plan outcome, tenant-safe state transitions, and visible customer states.
- If a cancelled-state check is performed, verify only the immediate displayed/persisted state and record it as a separate evidence line; no long lifecycle/grace-period claim is permitted.

## Explicit non-goals

- Do not charge, alter, inspect, or cancel a customer subscription.
- Do not change price IDs, plans, checkout, webhook settings, secrets, entitlements, database rows, or production configuration.
- Do not claim Riot/GRID connection, Collector lifecycle, Elite purchase, cancellation-period retention, past-due expiry, or cross-tenant security is proven by this order.
- Do not use a live-mode purchase unless Theo explicitly chooses that option and caps its cost/scope.

## Acceptance criteria

- An isolated hosted Free workspace reaches the intended Pro checkout contract and returns to ScrimStats without a customer-visible error.
- The authorised payment-completion signal reaches the deployed webhook and produces a coherent, tenant-scoped Pro subscription/entitlement state without exposing provider credentials to the browser.
- Billing UI, Settings, and one Pro-gated workflow agree on the resulting Pro state; the customer portal is reachable and presents the expected test/internal subscription context.
- QA records the deployed revision, redacted Stripe event/log correlation, before/after state, and result of each scenario.
- No customer record, pricing/configuration value, provider credential, or unrelated tenant data is changed or disclosed.
- Required evidence level: authenticated hosted browser plus hosted webhook/database evidence. This order alone cannot yield a blanket production-ready claim for the paid product.

## Relevant files, workflows, or data areas

- `supabase/functions/create-checkout/`, `stripe-webhook/`, `customer-portal/`
- `src/components/billing/BillingPanel.tsx`, Settings, plan-gate components, `src/lib/plan-entitlements.ts`
- `tenants` billing fields, `tenant_feature_access`, Stripe webhook/event records, `docs/operations/PILOT_RUNBOOK.md`
- WO-2026-008, WO-2026-009, and the release evidence inventory

## Risks

- **Permissions / Supabase RLS:** High. Verify only the active test tenant and confirm browser-visible state does not expose another tenant or provider data.
- **Billing / entitlement:** High. A checkout/webhook timing or price-map defect could grant/withhold Pro incorrectly. Do not infer Stripe revenue from a tenant label.
- **Email / customer communication:** Medium. Payment/auth emails may be emitted by the provider; do not send manual messages or use a customer email account.
- **Production / data:** High. The connected Stripe evidence previously identified live-mode-only access. Test-mode is preferred; a live internal purchase/cancellation is a financial and production-data action requiring Theo's explicit, recorded approval.

## Required validation

- Authenticated isolated-owner browser capture: Free Billing state, intended Pro checkout, return state, Billing/Settings/one Pro gate, and customer portal.
- Hosted redacted Stripe event and deployed webhook/log correlation; read-only tenant subscription/feature state check.
- A second isolated tenant remains Free and must not inherit Pro UI access from the tested tenant.
- Record whether the environment is isolated from production; never label it staging-safe merely from its hostname.
- QA reviews auth/RLS/Advisor evidence relevant to the touched state; no migration or source change is in scope.

## QA scenario / reproducible test steps

1. Confirm the approved test mode or Theo-approved live internal purchase boundary, max cost, account, workspace, cancellation authority, and target environment.
2. In an isolated Free owner workspace, capture baseline Billing, Settings, and one Pro-gated workflow state; use a separate isolated Free tenant as a non-entitlement comparator.
3. Start the intended Pro checkout, complete the approved internal/test payment, and capture the safe return result.
4. Correlate the redacted provider event to the deployed webhook and active tenant's subscription/feature state; then recheck Billing, Settings, a Pro workflow, portal entry, and the comparator tenant.
5. Revoke/cancel only if explicitly approved; retain evidence and record cleanup. QA issues READY, CONDITIONAL, or HOLD with exact gaps.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Keep scope separate from provider/Collector work; reconcile final verdict. | This order; WO-002 supersession. |
| Developer – Fast Lane | Not applicable | Billing/webhook work is not S/low-risk isolated work. | N/A |
| Core Features Developer | Involved only if defect found | Receive a separately scoped remediation; do not modify systems during QA. | QA defect handoff. |
| QA and Release Auditor | Involved | Execute approved isolated journey and issue evidence-led verdict. | Hosted evidence pack. |
| Technical Reporting Analyst | Involved | Confirm any MRR statement uses Stripe subscription evidence, not plan labels. | Metrics dictionary. |
| Lead Marketer and Growth | Not applicable | No paid-path marketing claim is authorised by this verification. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Isolated Free-to-Pro checkout and safe return | Not yet run | Proposed | Outstanding |
| Webhook-to-entitlement coherence | Not yet run | Proposed | Outstanding |
| Billing/Settings/Pro gate/portal consistency | Not yet run | Proposed | Outstanding |
| Tenant isolation comparator | Not yet run | Proposed | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The necessary payment environment and financial-action boundary are not yet selected or approved. Historical WO-008/009 evidence cannot substitute for this repeatable journey.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Select test-mode or approved live internal-purchase route | Theo | Recorded environment, account, cost cap, and cancellation boundary | Open |
| Supply isolated workspace/accounts and redacted event/log access | Theo / QA | Safe test setup | Open |
| Execute hosted matrix | QA | Evidence pack and verdict | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Isolated test-mode execution | Yes | Pending | — | Preferred route; no production configuration change. |
| Live internal purchase/cancellation, if no test mode exists | Yes | Pending | — | Requires explicit account, cost cap, and cleanup approval. |
| Production remediation/release | Yes | Pending | — | Separate approval if a defect is found. |

## Decision and approval record

- 2026-07-31 - PM split the remaining checkout/entitlement evidence from superseded WO-2026-002. Collector enforcement remains WO-2026-009; provider/live-integration readiness remains WO-2026-013.

## Implementation and review evidence

- WO-2026-008 records Theo's manual hosted Stripe-journey acceptance, but its connected source exposed live-mode evidence only and did not provide a reproducible isolated test execution.
- WO-2026-009 conditionally closes Collector server entitlement after hosted Free denial/Pro device evidence and Theo's accepted lifecycle/manager-endpoint risk; it does not prove checkout/webhook purchase flow.
- **Highest evidence achieved:** Proposed
