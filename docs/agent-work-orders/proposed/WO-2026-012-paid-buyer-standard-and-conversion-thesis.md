# WO-2026-012 - Define the paid buyer standard and Free-to-Pro conversion thesis

- **ID reservation:** [WO-2026-012 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Proposed
- **Owner:** Project Manager
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Problem and user impact

The ProComps meeting identified a need for a credible paid buyer standard, but its historical EUR100/month framing no longer matches ScrimStats' current Free, Pro, and Elite direction. Without a concrete Free-to-Pro conversion proposition, product work can drift into a generic “pro-level” feature list and pricing/copy can overpromise.

At the currently displayed USD9.99 Pro and USD19.99 Elite monthly prices, the founder's original 3-5 Pro plus 1-2 Elite target yields roughly USD50-90 MRR, not USD200. Theo confirmed on 2026-07-29 that USD200 MRR remains the target and that the subscriber count may increase. This is a planning constraint, not a recommendation to change prices.

## Why now

The meeting makes desktop/live capability strategically important, but the immediate commercial objective is paid conversion from Free to Pro. This definition must guide WO-001, WO-002, WO-009, future pricing, and the public message ledger before adding another tier or changing plan claims.

## Scope

- Define the paid buyer: competitive amateur, grassroots, collegiate, and developing professional staff who buy or operate ScrimStats.
- Map the critical Free-to-Pro journey: initial team operations value, first scheduling/review evidence, the paid trigger, Pro activation, and retained paid use.
- Define a concise paid buyer standard: mandatory outcomes, evidence required to claim each outcome, known gaps, and explicit non-priorities.
- Reconcile the 30/60/90-day subscription and MRR objectives with current displayed plan prices; present viable scenarios without changing prices.
- Decide the decision rule for a future additional tier: no tier proposal until Elite's Discord outcome is hosted-verified and buyer validation identifies a separate, recurring high-value job.

## Explicit non-goals

- Do not change Stripe prices, plan names, entitlements, checkout, billing copy, public claims, or production data.
- Do not define “pro-level” by copying a competitor's feature list.
- Do not approve a new tier or build a broad pro-only feature suite.

## Acceptance criteria

- A one-page paid buyer standard names the target buyer, their critical jobs, mandatory outcomes, current evidence, and gaps.
- The Free-to-Pro journey identifies one primary upgrade trigger and one measurable activation path using the established funnel definitions.
- MRR scenarios reconcile exactly with current plan prices and the founder's target; any gap is explicitly shown.
- Future-tier criteria are documented and prevent premature packaging changes.

## Relevant files, workflows, or data areas

- `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`
- `docs/agent-work-orders/ready/WO-2026-001-elite-proposition.md`
- `docs/agent-work-orders/review/WO-2026-002-pro-paid-core-hosted-verification.md`
- `docs/agent-work-orders/in-progress/WO-2026-009-collector-server-entitlement-enforcement.md`
- `src/components/billing/BillingPanel.tsx`, `src/lib/plan-entitlements.ts`

## Risks

- **Permissions / Supabase RLS:** Not applicable; this is a product and commercial definition.
- **Billing / entitlement:** Treat current displayed price/plan evidence as a planning input only; no billing change is authorised.
- **Email / customer communication:** Do not turn the definition into customer claims or outreach without approval.
- **Production / data:** None; do not alter live plan records or metrics.

## Required validation

- Reconcile pricing arithmetic against the displayed plan values and Stripe-derived commercial reporting, never tenant labels.
- Review planned claims against implemented/hosted evidence and mark unverified capabilities honestly.
- Theo approves the standard before it drives development, pricing, or public positioning.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Own definition, prioritisation, scenario math, and founder decisions. | This work order |
| Feature Developer | Consulted | Identify the smallest product outcomes required for the proposed upgrade trigger. | WO-001, WO-002, WO-009 |
| QA and Release Auditor | Consulted | Distinguish implemented, hosted-verified, and release-ready capability. | Release audits |
| Technical Reporting Analyst | Involved | Validate metric definitions and MRR scenarios. | Metrics Dictionary |
| Lead Marketer and Growth | Involved | Translate approved buyer outcomes into a non-overclaiming conversion proposition. | Message Ledger |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Paid buyer standard | Founder-approved document | Proposed | Outstanding |
| Free-to-Pro journey and trigger | Product/funnel definition | Proposed | Outstanding |
| MRR scenario reconciliation | Current plan-price arithmetic and Stripe reporting | Proposed | Outstanding |
| Additional-tier decision rule | Founder-approved guardrail | Proposed | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Meeting direction is recorded, but the paid buyer standard and commercial targets must be reconciled before they drive build or positioning decisions.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Confirm paid buyer standard and target MRR horizon | Theo / Project Manager | Founder decision | Open |
| Validate against target-team feedback | Lead Marketer and Growth | WO-2026-014 evidence | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Pending | — | No pricing, packaging, or claim change is authorised. |
| Release | Yes | N/A | — | Strategy-only work order. |

## Decision and approval record

- 2026-07-29 - ProComps meeting direction reviewed. The historic EUR100/month target is superseded for current planning by Free, Pro, Elite, and a possible future tier; the immediate objective is Free-to-Pro conversion.
- 2026-07-29 - Theo confirmed USD200 MRR remains the target at the current plan direction; required subscriber-volume scenarios must be made explicit before changing pricing or adding a tier.

## Implementation and review evidence

- Current billing source displays USD9.99 Pro and USD19.99 Elite monthly prices. Historical Stripe reconciliation measured USD19.98 current MRR at its snapshot; paid tenant labels remain unreconciled and must not be used as revenue evidence.
- **Highest evidence achieved:** Proposed
