# WO-2026-026 - Define a safe new-workspace activation follow-up

- **ID reservation:** [WO-2026-026 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** In Progress
- **Assigned owner:** PM
- **Size:** M
- **Risk:** Medium
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** Message Ledger; approved email template and operational runbook; potentially `supabase/functions/_shared/email.ts`, an authenticated server-side dispatch path, delivery audit records, and `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`.
- **Dependencies:** Theo's specific approval of each recipient, final rendered copy, sender identity, timing, and send. The initial delivery mode is manual; any automated option requires a new reviewed delivery/audit design and deployment approval.
- **Collision risk:** Do not modify invitation, Auth, notification-worker, billing, or pilot-provisioning flows merely to send activation follow-ups. Do not use the invitation flow to create a follow-up email.

## Problem and user impact

A newly created Free workspace can remain empty after its first day. Finals Gaming is a current example: the workspace was created with one owner but no roster, invitations, availability, calendar events, scrim blocks, reviews, Solo Queue, scouting, Draft, coaching, or Collector records. The product does not record page navigation, so it cannot distinguish brief exploration from immediate abandonment.

Without a safe follow-up, a coach or manager who needs help with the first setup steps may leave before receiving core operational value. One workspace is a signal for an activation intervention, not proof of a general onboarding defect.

## Why now

Theo has explicitly approved a helpful customer follow-up for this situation and wants a reusable approach for future new workspaces. The immediate objective is activation and pilot learning, not an unmeasured bulk-email campaign.

## Scope

- Define one evidence-based eligibility rule for an activation follow-up, initially limited to a newly created workspace with no persisted roster, invitation, availability, calendar, scrim, game, review, coaching, Solo Queue, scouting, Draft, or Collector action after an approved wait period.
- Choose and document one safe delivery mode:
  - a PM-operated manual send procedure with a reviewed template and recipient checklist; or
  - an automated server-side path with explicit eligibility, rate limiting, duplicate prevention, delivery/failure audit, and safe unsubscribe/assistance handling.
- Produce a premium, concise email that offers setup assistance and guides the first workflow: roster, availability, first scrim block, and review after a recorded game.
- Add the exact customer-facing statements to the Message Ledger, including evidence, release status, and prohibited overclaims.
- Define the activation outcome and reporting method: roster record or first scheduled scrim within seven days of the follow-up. Keep results as counts and explicit unavailable states until an approved population and measurement source exist.

### Initial delivery decision

Use the manual, one-to-one procedure in `docs/operations/NEW_WORKSPACE_ACTIVATION_FOLLOW_UP.md` first. This is the smallest safe experiment at the present evidence level. Do not build email automation until at least five approved manual sends have a recorded seven-day outcome and Theo separately approves automation discovery.

## Explicit non-goals

- Sending to Finals Gaming or any other workspace until the PM completes the approved recipient/checklist process and Theo approves the final send.
- Bulk marketing, discounts, paid-plan claims, competitor comparison, or Elite/Collector promotion.
- Recording page views, browsing behaviour, raw email content, user email addresses, Riot credentials, or gameplay data in growth reporting.
- Reusing invitation or Auth emails as a customer-follow-up mechanism.
- Changing database, Auth, billing, entitlement, secrets, or production configuration without a separately recorded Theo approval.

## Acceptance criteria

- The PM records the approved recipient rule, 48-hour to 7-day wait period, sender, manual delivery decision, and stop conditions.
- The Message Ledger contains the exact approved email claims and states the evidence and release boundary for each.
- The manual fallback includes a copyable template, recipient checklist, and delivery log with no unnecessary personal data.
- If automation is selected, dispatch happens only below the browser layer; it is idempotent, rate-limited, auditable, and has an explicit failure/duplicate/opt-out or support-handling state.
- The email avoids performance guarantees, AI claims, unverified integration claims, plan pressure, and fabricated urgency.
- The success report states recipient count, delivered/failed count where authoritative, and seven-day activation counts. It never treats page views or an unsaved click as activation.
- **Required evidence level:** PM-reviewed template and manual procedure before a manual send; local plus hosted isolated-workspace evidence before any automated send; Theo approval before every customer-facing send or production release.

## Relevant files, workflows, or data areas

- `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`
- `docs/agent-work-orders/proposed/WO-2026-014-paid-buyer-validation-and-conversion-proposition.md`
- `supabase/functions/_shared/email.ts`
- `supabase/functions/pilot-ops/index.ts`
- `supabase/functions/notification-worker/index.ts`
- `supabase/functions/team-invitations/index.ts`
- `public.tenants`, `players`, `team_invitations`, `player_availability`, `calendar_events`, `scrims`, `scrim_games`, `coaching_actions`, Solo Queue, scouting, Draft, and Collector activity tables
- `notification_deliveries` and any approved delivery-audit record

## Risks

- **Permissions / Supabase RLS:** Recipient selection and send authority must remain server-side or in a PM checklist; never expose tenant activity or contact details in the browser or a report.
- **Billing / entitlement:** Do not imply Free, Pro, Elite, Collector, or Discord availability beyond the current Message Ledger evidence.
- **Email / customer communication:** Unwanted, duplicate, or misleading email can harm trust. Confirm the lawful/operational basis, sender address, support reply route, cadence, and opt-out/support handling before automation.
- **Production / data:** A new automated sender, schedule, secret, provider call, tracking field, or database migration requires Theo approval, isolated verification, and release approval.

## Required validation

- PM and Marketing review the message against the Message Ledger and current release boundary.
- For a manual send: verify recipient eligibility from aggregate/persisted operational records, review the final rendered email, and record Theo's specific send approval.
- For automation: targeted unit/contract tests; zero-warning ESLint; TypeScript; production build; server-side authorization and duplicate/rate-limit tests; no browser-exposed recipient or provider credential.
- Use an isolated non-customer workspace and controlled delivery target to verify eligibility, suppression after an action, duplicate prevention, delivery failure, support/opt-out handling, and audit data minimisation.
- QA reviews desktop/mobile email rendering and confirms only approved, factual capability claims are present.

## QA scenario / reproducible test steps

1. Create or use an approved isolated non-customer Free workspace with an owner and no recorded operational actions after the agreed wait period.
2. Run the manual checklist or approved server-side eligibility evaluation.
3. Confirm the follow-up is eligible once, contains only the approved activation copy, and uses the approved sender/reply path.
4. Add a roster record or schedule a scrim, then rerun eligibility; the workspace must be suppressed from a follow-up.
5. Attempt a duplicate dispatch and a provider failure; confirm no duplicate customer email, clear internal failure state, no credentials or recipient details exposed, and auditable minimal metadata.
6. Record the rendered-email check, delivery evidence, suppression result, and any error reference. No customer workspace is used for automation QA.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Choose manual versus automated path, recipient rule, wait period, and release sequence. | This work order |
| Developer – Fast Lane | Not applicable | Automation is not isolated low-risk work. | N/A |
| Core Features Developer | Involved if automation is selected | Implement only an approved server-side, auditable path. | Commit/PR pending |
| QA and Release Auditor | Involved | Review claims, isolated delivery/suppression tests, and release evidence. | Test output pending |
| Technical Reporting Analyst | Involved | Define the post-follow-up activation report and unavailable states. | Metrics Dictionary update pending |
| Lead Marketer and Growth | Involved | Maintain the Message Ledger, template, and customer-language review. | Copy review pending |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Recipient rule and manual delivery mode approved | PM decision and Theo approval | PM-defined / Theo send approval pending | Outstanding |
| Approved, evidence-backed template | Message Ledger review | PM-reviewed draft | Outstanding |
| Manual safety path | Runbook and recipient checklist | PM-reviewed draft | Outstanding |
| Activation reporting definition | Metrics Dictionary review | Proposed | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** A manual, evidence-bounded procedure and draft exist, but no recipient, sender/reply route, final rendered copy, or customer send has Theo approval.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Approve the first specific recipient and rendered email | Theo | Approved recipient, sender/reply route, and final copy | Open |
| Record first manual delivery and seven-day outcome | PM / Analyst | Minimal delivery and activation-count record | Open |
| Decide whether automation discovery is warranted | Theo / PM | At least five approved manual outcome records | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Customer follow-up outcome | Yes | Approved | 2026-07-31 | A helpful setup follow-up is approved in principle; no send or delivery mechanism is yet approved. |
| Implementation | Yes | Pending | — | Required for any automated send path or production code/configuration change. |
| Release / customer sends | Yes | Pending | — | Required after final copy, recipient rule, and delivery procedure are reviewed. |

## Decision and approval record

- 2026-07-31 - Theo asked for a Project Manager review of a reusable activation follow-up for future new workspaces, with either safe automation or a manual-send template and procedure.
- 2026-07-31 - PM selected a manual-first experiment: one-to-one sends only, after 48 hours and before day 7, with Theo approval for every recipient and no new email automation. The procedure and Message Ledger draft were created; no customer follow-up was sent and no production system was changed.
- 2026-08-01 - Theo requested a draft follow-up that preserves the established ScrimStats email design and offers a direct Discord support route. The manual template and Message Ledger now require a verified recipient-specific Discord contact/invite and prohibit implying product Discord integration. No email was sent or email system changed.
- 2026-08-01 - At Theo's request, a one-off unsent Outlook `.eml` draft for Gustavo / Finals Gaming was prepared from the approved manual copy, with `@path1`, the approved community invite, and the safe shared `/overview` workspace route. Theo must still verify the customer email address, final rendered appearance, sender/reply route, eligibility, and one-time send before using it.
- 2026-08-03 - Theo confirmed the manual-first approach remains appropriate while product areas are completed. Keep automation discovery and any send path out of scope; every recipient, rendered message, sender/reply route, and delivery remains separately approval-gated.

## Implementation and review evidence

- A current one-day-old Free workspace, Finals Gaming, has a persisted `workspace_created` event and no recorded roster, invitation, availability, calendar, scrim, review, Solo Queue, scouting, Draft, coaching, or Collector action. This is an activation signal, not a generalised product conclusion.
- Existing email sources support invitations, pilot provisioning, and operational notifications; no audited reusable activation-follow-up send action exists.
- Manual procedure: `docs/operations/NEW_WORKSPACE_ACTIVATION_FOLLOW_UP.md`; claims: `docs/operations/MESSAGE_LEDGER.md`.
- **Highest evidence achieved:** Proposed manual procedure; no customer communication sent.
