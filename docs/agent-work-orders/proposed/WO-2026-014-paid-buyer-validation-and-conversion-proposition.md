# WO-2026-014 - Validate paid buyer problems and conversion proposition with target teams

- **ID reservation:** [WO-2026-014 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Blocked
- **Assigned owner:** Marketing
- **Size:** M
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing and QA scenario

- **Area / files likely affected:** Message Ledger, research script, call notes, buyer-problem synthesis, and approved conversion proposition.
- **Dependencies:** Theo and ProComps approval for outreach/contact, participant list, and approved claims; no external communication before approval.
- **Collision risk:** Do not publish, contact prospects, or change public marketing while product evidence/plan positioning is being revised.
- **QA scenario / test steps:** Blocked until contact approval. Then use the approved script with consent, retain only approved research notes, reconcile every stated capability with the Message Ledger, and have PM/QA review the synthesis for unsupported claims or invented metrics.

## Problem and user impact

The meeting correctly calls for external validation before building in isolation. ScrimStats has historical sign-ups but needs current evidence from target team staff about what makes them adopt Free, upgrade to Pro, and eventually consider Elite. Without it, feature and pricing decisions rely on internal assumptions.

## Why now

The immediate commercial strategy is Free-to-Pro conversion, not a EUR100/month package. Validating the paid buyer's problem and upgrade trigger prevents the team from adding an unsupported tier or building desktop/Elite work that does not move conversion.

## Scope

- Prepare an approval-ready interview plan for five reachable target teams and a minimum of two completed calls.
- Segment feedback by coach/manager, analyst, and organisation owner; distinguish current workflow, operational pain, willingness to try Free, Pro upgrade trigger, desktop/live value, and Elite/Discord value.
- Use a short evidence-led product walkthrough and neutral questions; do not promise unverified live integration, Overwolf, Riot API access, Elite automation, or pricing.
- Synthesize findings into ranked hypotheses for WO-012 and WO-013, separating must-have, valuable-but-later, and rejected assumptions.

## Explicit non-goals

- Do not contact teams, publish content, send messages, promise pricing, offer discounts, or schedule calls without Theo and required ProComps approval.
- Do not present competitor research as ScrimStats capability or copy competitors blindly.
- Do not change pricing or create a new tier from fewer than the defined validation calls.

## Acceptance criteria

- A reviewed interview guide, target-team list, consent/notes approach, and message draft are ready before outreach.
- At least two approved target-team conversations produce attributable internal notes without customer-sensitive data in shared product records.
- Findings identify one supported Free-to-Pro trigger, one desktop/live hypothesis, and one Elite hypothesis or explicitly state insufficient evidence.
- No public claim or pricing/plan change is made without separate approval.

## Relevant files, workflows, or data areas

- `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`
- `docs/agent-work-orders/proposed/WO-2026-012-paid-buyer-standard-and-conversion-thesis.md`
- `docs/agent-work-orders/proposed/WO-2026-013-desktop-live-integration-direction.md`
- Marketing Message Ledger and approved product walkthrough materials

## Risks

- **Permissions / Supabase RLS:** Not applicable; do not export customer/tenant data for research.
- **Billing / entitlement:** Do not promise price, trial, discount, upgrade, or access terms not currently approved.
- **Email / customer communication:** Outreach and calls are external communications requiring Theo and ProComps approval.
- **Production / data:** Do not add CRM, tracking, analytics, or contact records without approval.

## Required validation

- Project Manager reviews the interview guide against current verified capability and the Message Ledger.
- Theo/ProComps approves target list and each outreach channel before contact.
- Findings are reconciled with reported product evidence and labelled hypothesis, not fact, where appropriate.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Confirm priority, guardrails, and conversion decision use. | WO-012 |
| Feature Developer | Consulted | Provide accurate verified/unverified capability boundaries for walkthrough. | Current WOs |
| QA and Release Auditor | Consulted | Review claims against release evidence. | Release audits |
| Technical Reporting Analyst | Involved | Define qualitative/quantitative validation capture without fabricated metrics. | Metrics Dictionary |
| Lead Marketer and Growth | Involved | Draft research plan and synthesis; no outreach until approval. | Message Ledger |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Research plan ready | Approved draft | Proposed | Outstanding |
| Target-team conversations | Approved internal notes | Proposed | Outstanding |
| Conversion hypotheses | Reconciled synthesis | Proposed | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** External outreach is not approved; no calls or claims may be inferred from the meeting.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Approve team list and outreach approach | Theo / ProComps | Written approval | Open |
| Complete two calls | Lead Marketer and Growth | Internal research notes | Open |
| Reconcile findings to product direction | Project Manager | Updated WO-012/013 decisions | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Prepare research drafts | Yes | Pending | — | No external communication. |
| Contact teams / conduct calls | Yes | Pending | — | Requires ProComps approval where contract-relevant. |
| Publish claims | Yes | Pending | — | No publishing in scope. |

## Decision and approval record

- 2026-07-29 - ProComps meeting requested at least two target-team conversations and five reachable contacts. This work order records research preparation only; no outreach approval is implied.
- 2026-07-31 - Theo directed that this work order remain on hold until further product development is complete. Do not prepare outreach, contact teams, schedule calls, or publish related claims until Theo reopens the work order.

## Implementation and review evidence

- Current source and release evidence is sufficient for a truthful walkthrough of core operations and bounded Pro capture, but not for claims of universal desktop/live integration or finished Elite Discord automation.
- **Highest evidence achieved:** Proposed
