# WO-2026-012 - Define the paid buyer standard and Free-to-Pro conversion thesis

- **ID reservation:** [WO-2026-012 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** In Progress
- **Assigned owner:** PM
- **Size:** M
- **Risk:** Medium
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing and QA scenario

- **Area / files likely affected:** Buyer-standard decision record, plan positioning, conversion thesis, launch boundary, Metrics Dictionary, and follow-on work-order briefs.
- **Dependencies:** Theo decision on buyer outcome and $200 gross-MRR measurement convention; no implementation authority is implied.
- **Collision risk:** Do not let copy, pricing, entitlement, or marketing changes begin from this discovery work without a separately approved work order.
- **QA scenario / test steps:** (1) Trace each proposed Pro claim to implemented evidence. (2) Check its buyer job, activation signal, and upgrade trigger against the Metrics Dictionary. (3) Have QA flag any claim relying only on plan labels, mock data, or unverified hosted behaviour. (4) Record decisions and unresolved evidence gaps.

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
| Internal buyer-standard and planning work | Yes | Approved | 2026-08-03 | No pricing, packaging, entitlement, or claim change is authorised. |
| Release | Yes | N/A | — | Strategy-only work order. |

## Decision and approval record

- 2026-07-29 - ProComps meeting direction reviewed. The historic EUR100/month target is superseded for current planning by Free, Pro, Elite, and a possible future tier; the immediate objective is Free-to-Pro conversion.
- 2026-07-29 - Theo confirmed USD200 MRR remains the target at the current plan direction; required subscriber-volume scenarios must be made explicit before changing pricing or adding a tier.
- 2026-08-03 - Theo approved this work order's internal Pro buyer standard and conversion-thesis work. The planning direction is: Free, `Run your team consistently`; Pro, `Understand practice and prepare better`; and the recurring Pro job is schedule -> captured/recorded practice evidence -> review/coaching action -> next practice decision. This does not approve pricing, billing, entitlement, public-copy, outreach, provider, or release changes.

## Implementation and review evidence

- Current billing source displays USD9.99 Pro and USD19.99 Elite monthly prices. Historical Stripe reconciliation measured USD19.98 current MRR at its snapshot; paid tenant labels remain unreconciled and must not be used as revenue evidence.
- **Highest evidence achieved:** Proposed

## Founder hard-launch review - 2026-08-02

- **Proposed paid-buyer hypothesis:** a coach or manager who runs recurring custom-game practice and needs one dependable loop from scheduling, through captured/recorded game evidence, to review, coaching actions, and the next practice decision. This is a decision hypothesis, not a public claim or evidence of customer demand.
- **Current product fit:** Free already covers the initial team-operations loop. Pro is the only tier that currently joins Game Capture, analytics, scouting, and Draft around completed practice. The Analytics preview honestly waits for qualifying games rather than fabricating metrics, and Collector access is server-gated for Pro/Elite in source plus conditional hosted evidence.
- **Hard-launch gaps:** the isolated Free-to-Pro checkout/webhook/portal journey remains unverified under WO-2026-028; the activation/funnel journey remains unproved under WO-2026-003; and no observed cohort demonstrates that a team reaches a first captured game, review, repeat weekly use, then stays paid. Product analytics for visit-to-upgrade behaviour is unavailable.
- **Ten-day definition of done:** (1) a founder-approved one-page buyer standard names the weekly Pro job and one primary upgrade moment; (2) an isolated Pro purchase is hosted-verified; (3) at least one controlled non-customer Pro workflow proves the visible value loop from a scheduled block through a completed recorded game into analytics/review/coaching evidence, without a fabricated team result; (4) the reporting plan names the first measured activation, upgrade, and retained-paid indicators plus any unavailable sources; and (5) all Elite purchase posture is resolved under WO-2026-031 before public hard-launch claims.
- **Decision boundary:** this review does not approve pricing, public claims, customer outreach, provider activation, billing changes, or production release.

## External research review - 2026-08-02

- **Validated directional insight:** Abbott et al.'s qualitative study of ten European Tier 2/3 semi-professional/professional League players describes a standard high-volume training structure, uncertain rationale for it, and the value participants placed on pre-scrim aims, targeted formats, and review. It supports the hypothesis that ScrimStats should help staff make practice intentional and carry evidence into the next action; it does not prove demand, pricing, or retention for ScrimStats' buyer population.
- **Competitor context, not product evidence:** Prolytics currently presents automated scrim/timeline analysis, draft scouting, unified player views, and replay/minimap review, but also states that much of its value depends on custom setup and GRID access. This reinforces the need for an operationally dependable workflow; it does not justify copying its scope or making any ScrimStats claim.
- **Recommended tier language for founder decision only:** Free = `Run your team consistently.` Pro = `Understand practice and prepare better.` Elite should not be positioned as a complete competitive programme until one durable, verified staff system exists. A more disciplined future Elite hypothesis is `Run an improvement programme`, anchored in objectives, evidence, accountable actions, and follow-through.
- **Roadmap judgement:** Do not attempt four new Elite systems before hard launch. The highest-leverage post-launch candidate is one connected practice-development loop: pre-scrim objective, linked captured/recorded evidence, accountable coaching action, owner/due date, and next-session follow-up. A weekly command-centre is a summary surface for that system, not a separate product. Opponent/draft dossiers are a later repeatability layer; an organisation layer must wait for a separately safe multi-workspace/organisation design; Discord/calendar automation remains an enabling layer after the workflow is proven.
- **Launch implication:** The external notes strengthen the Pro value-loop hypothesis and the decision to withhold or re-scope Elite self-serve purchase. They create no customer-facing claim, product commitment, or implementation approval.
