# WO-2026-031 - Reconcile Elite self-serve purchase with a verified differentiated outcome

- **ID reservation:** [WO-2026-031 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Backlog
- **Assigned owner:** Core Features Developer
- **Size:** M
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** `src/components/billing/BillingPanel.tsx`, `src/pages/Integrations.tsx`, `supabase/functions/create-checkout/`, relevant entitlement/module checks, `docs/operations/MESSAGE_LEDGER.md`, and billing/Discord contract tests.
- **Dependencies:** Theo's written decision on the permitted Elite purchase posture; WO-2026-028 isolated purchase evidence; the current Discord release boundary under WO-2026-001 and WO-2026-025.
- **Collision risk:** Do not overlap with checkout, Stripe price mapping, webhook, entitlement, Discord-module, or inbound `/scrim` work. Coordinate all implementation through Core Features Developer.

## Problem and user impact

The Billing screen offers Elite for $19.99/month as a self-serve upgrade. Its differentiated billing feature is Discord schedule prompts, while the current Integrations screen states that Discord scheduling is unavailable until delivery is verified. A buyer can therefore be asked to pay for a tier whose differentiated outcome is not established as generally available or supportable.

This undermines trust at the moment of purchase and makes hard-launch Elite conversion and retention unsafe to claim.

## Why now

Hard launch is targeted in ten days. The product must not sell a premium tier whose unique reason to buy is conditional, unverified, or unavailable to the purchaser.

## Scope

- Produce and implement exactly one Theo-approved Elite posture:
  1. withhold Elite from self-serve checkout until its differentiated capability has a verified, supportable customer path; or
  2. retain Elite self-serve purchase only after a separately evidenced, customer-available differentiated outcome and truthful plan presentation are approved.
- Align the selected posture across Billing, Integrations, checkout validation, entitlement/module state, Message Ledger, and support/recovery language.
- Preserve current Pro and Free purchase behaviour unless a separate approved change is required.

## Explicit non-goals

- Do not invent an Elite feature, change prices, configure Discord, register provider commands, publish marketing, or contact customers.
- Do not treat the isolated WO-001 Discord happy path as proof of general customer availability.
- Do not broaden WO-2026-025's unbuilt inbound `/scrim` scope.

## Acceptance criteria

- A Free workspace cannot purchase Elite self-serve unless its displayed differentiated outcome is customer-available, server-enforced, hosted-verified, and supportable under an approved release boundary.
- If Elite is withheld, Billing and all upgrade entry points state the truthful available alternative without fabricated urgency or a misleading feature comparison.
- If Elite remains purchasable, checkout, webhook, Billing, Integrations, module state, Message Ledger, and support boundary agree on the verified outcome.
- Free/Pro/Elite customer-visible states and direct server-side entitlement checks are verified in an isolated hosted matrix.
- **Required evidence level:** local validation, authenticated hosted browser and entitlement evidence, plus Theo's separate release approval. No production claim is authorised by implementation alone.

## Relevant files, workflows, or data areas

- `src/components/billing/BillingPanel.tsx`
- `src/pages/Integrations.tsx`
- `supabase/functions/create-checkout/index.ts`, `stripe-webhook/index.ts`, and `customer-portal/`
- `supabase/functions/_shared/collector.ts` Discord entitlement helper and `tenant_feature_access`
- WO-2026-001, WO-2026-025, WO-2026-028, and `docs/operations/MESSAGE_LEDGER.md`

## Risks

- **Permissions / Supabase RLS:** Server-side tier and module checks must remain tenant-scoped and authoritative; browser presentation cannot decide access.
- **Billing / entitlement:** High. Checkout/price mapping, webhook transitions, and existing subscribers can be affected. No Stripe/configuration change without Theo's approval.
- **Email / customer communication:** Any changed plan statement or customer explanation requires Message Ledger and Theo/ProComps approval before use.
- **Production / data:** High. Existing subscription records and provider configuration are out of scope unless explicitly approved.

## Required validation

- Targeted Billing, checkout/webhook, entitlement, and Discord-module contracts; zero-warning ESLint, TypeScript, production build, and bundle budget.
- Isolated hosted Free/Pro/Elite manager and non-manager browser matrix for Billing, Integrations, and plan-gated states.
- Direct server-side verification that an ineligible tier/module cannot use the gated outcome; no customer data or provider credentials exposed.
- QA review of Stripe/webhook and module-state evidence; update Message Ledger before any customer-facing claim.

## QA scenario / reproducible test steps

1. Prepare isolated Free, Pro, and Elite workspaces plus a second tenant; record the selected Elite posture and approval boundary.
2. Visit Billing and Integrations as a manager and non-manager for each workspace.
3. Confirm every displayed purchase/control/availability statement matches the selected posture and no unavailable capability is sold or represented as active.
4. Execute only the separately approved isolated checkout path, if applicable; correlate redacted webhook, tenant tier/module state, portal result, and second-tenant isolation.
5. Record deployed revision, screenshots, direct denial/allow results, and QA verdict without exposing customer or provider data.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Keep the value boundary and launch decision evidence-led. | This work order and WO-2026-012 |
| Developer – Fast Lane | Not applicable | Billing, entitlement, and provider-facing scope is not S/Low isolated work. | N/A |
| Core Features Developer | Involved | Implement only the selected cross-surface posture. | Commit/PR and validation handoff |
| QA and Release Auditor | Involved | Verify hosted purchase, entitlement, module, and tenant-isolation matrix. | Evidence pack and verdict |
| Technical Reporting Analyst | Involved | Ensure MRR/conversion statements use Stripe-authoritative evidence only. | Metrics Dictionary |
| Lead Marketer and Growth | Involved | Update claims only after the product boundary is verified and approved. | Message Ledger review |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Theo-selected Elite posture | Recorded founder decision | Proposed | Outstanding |
| Truthful purchase and plan presentation | Browser and source evidence | Local / Browser | Outstanding |
| Checkout/webhook/entitlement coherence where purchasable | Isolated hosted evidence | Hosted | Outstanding |
| Customer-available differentiated outcome | Hosted QA and support-boundary evidence | Hosted | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Elite is currently self-serve purchasable, but its differentiated Discord outcome is not established as generally customer-available. A founder decision and the resulting evidence are required before hard launch.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Select Elite self-serve posture | Theo | Written decision and boundary | Open |
| Implement selected posture | Core Features Developer | Commit and local validation | Open |
| Verify paid path and entitlement boundary | QA and Release Auditor | Isolated hosted evidence | Open |
| Approve public/customer claim and release | Theo / ProComps | Message Ledger and release approval | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Pending | — | Billing/entitlement/customer-facing change. |
| Release | Yes | Pending | — | Separate approval after isolated hosted QA. |

## Decision and approval record

- 2026-08-02 - Founder requested hard-launch review of paid value and conversion readiness. PM identified a mismatch between Elite self-serve purchase and its unverified differentiated Discord outcome.

## Implementation and review evidence

- Source: Billing lists Elite at $19.99/month with `Discord schedule prompts when available`; the checkout function accepts `elite`; Integrations presents Discord scheduling as unavailable until delivery is verified.
- WO-2026-001 conditionally accepted an isolated outbound Discord happy path, but its negative-path, revocation, and tenant-isolation evidence remains unexecuted; WO-2026-025 inbound `/scrim` is not built.
- **Highest evidence achieved:** Source reviewed; isolated hosted outbound evidence is conditional and not a customer-availability proof.
