# ScrimStats Data Source Map and Metrics Dictionary

**Purpose:** the single reporting contract for ScrimStats growth, team activity, revenue, reliability, and data quality.

**Last audited:** 2026-07-28  
**Current reporting state:** Supabase and Stripe production are connected for read-only reporting as of 2026-07-28. Metrics backed by the queried sources are measured for their stated report period; website acquisition, Vercel web-performance/runtime, and installer-download metrics remain unavailable until their authoritative sources are queried. No estimates are used.

## Reporting rules

- Report calendar-week and calendar-month values separately. Compare a period only with the immediately preceding equivalent period.
- A **team** is a `tenants` record. Count distinct tenant IDs, never user rows, for team-level metrics.
- A team is **active** when it performs at least one listed qualifying activity in the period. Report the qualifying activity breakdown alongside the union; do not treat a login alone as evidence of operational adoption.
- An **activated team** has both its first scheduled practice block and its first completed recorded game. This operational funnel milestone is not a roster-completeness or review-quality measure.
- MRR is the sum of normalized monthly recurring subscription amounts for active paid Stripe subscriptions. Do not infer MRR from plan labels or tenant records alone.
- Report rates only when their numerator and denominator are both measured over the same population and period. Otherwise mark the rate unavailable.
- Never include Riot credentials, collector credentials, raw event payloads, user emails, or player/game content in reporting.

## Data source map

| Source | What it can prove | Owner / integration | Refresh | Current access | Limits |
|---|---|---|---|---|---|
| Supabase Postgres | Workspace, membership, roster, invitations, scrims, reviews, coaching actions, Collector sessions, webhook ledger and operational records | ScrimStats / Supabase | Query on report run; proposed daily snapshot | **Connected for aggregate reporting** | Does not record anonymous acquisition, page views, sessions, attribution, download clicks, or generic product events. |
| Supabase Auth and logs | Confirmed users, auth outcomes, API and Edge Function execution/error evidence | ScrimStats / Supabase | Query on report run; alerts need separate configuration | **Connected for read-only inspection** | Auth access must be aggregated; database records do not show every failed authentication attempt. |
| Stripe | Subscriptions, invoices, plan changes, payments, MRR and churn | ScrimStats / Stripe | Daily for MRR; near-real-time event audit | **Connected for read-only reporting** | Internal webhook ledger proves processing attempts, not Stripe’s authoritative revenue state. |
| Vercel | Deployments, runtime logs, web traffic, real-user performance and availability | ScrimStats / Vercel | Deployment/event logs near-real-time; performance daily | **Project resolved; metric read pending** | Web Analytics and Speed Insights must be enabled to measure acquisition and performance. |
| GitHub Releases | Collector release download counts and release version | ScrimStats / GitHub Releases | Daily | **Connection pending** | Downloads are not installs, launches, pairings, or successful captures. |
| Collector service records | Paired devices, version, last seen, capture lifecycle, completion and quality | ScrimStats Collector / Supabase Edge Functions | Written during Collector use; report daily/weekly | **Connected through Supabase** | No installer launch, crash, update, uninstall, or download-click event. Capture events are documented as a short-lived diagnostic buffer. |
| Browser client-error intake | Client error payload with path, release and correlation reference | Web app / `/api/client-error` | Event-driven | **Hosted receiver confirmed** | Vercel received a Scouting error, but its release was labelled `local`; release attribution needs remediation. |
| Product analytics event stream | Visits, attribution, signup starts, feature use, sessions and navigation conversion | **Not connected** | Event-driven | **Unavailable** | Requires approved analytics tool and instrumentation. |

## Metrics dictionary

### Website acquisition and conversion

| Metric | Exact definition | Data source | Owner / integration | Refresh | Known limitations | Status |
|---|---|---|---|---|---|---|
| Unique website visitors | Distinct anonymous visitor IDs with `website_visited` in the period. | Product analytics event stream | Product / approved analytics tool | Daily | No visitor ID or visit event exists. | **Unavailable** — add `website_visited` and analytics connection. |
| Acquisition by source | Distinct visitors grouped by normalized referrer and UTM source/medium/campaign on `website_visited`. | Product analytics event stream | Marketing / approved analytics tool | Daily | No UTM or referrer event is stored. | **Unavailable** — add attribution properties to `website_visited`. |
| Signup starts | Distinct anonymous visitor IDs with `signup_started` in the period. | Product analytics event stream | Product / approved analytics tool | Daily | The current codebase records neither event nor signup-form abandonment. | **Unavailable** — add `signup_started`. |
| Confirmed signups | Distinct authenticated users whose email confirmation completed in the period. | Supabase Auth | ScrimStats / Supabase | Daily | Auth access is required; this does not establish workspace creation. | **Unavailable** — connect Supabase Auth read-only access. |
| Visitor-to-confirmed-signup conversion | Confirmed signups divided by unique website visitors in the same period. | Product analytics + Supabase Auth | Product and Supabase | Daily | Requires identity-safe attribution and both measured components. | **Unavailable** — add visit tracking and connect Supabase Auth. |
| Signup-to-workspace conversion | New workspaces created by a confirmed signup divided by confirmed signups in the period. | Supabase Auth + `tenants` + `tenant_users` | ScrimStats / Supabase | Daily | Must link owner user to new tenant without exposing user-level reporting. | **Unavailable** — connect Supabase read-only access. |
| Collector download clicks | Distinct authenticated tenant/user context clicks on the Collector download control. | Product analytics event stream | Product / approved analytics tool | Daily | GitHub downloads cannot be attributed to a workspace or user. | **Unavailable** — add `collector_download_clicked`. |

### Product activation and retention

| Metric | Exact definition | Data source | Owner / integration | Refresh | Known limitations | Status |
|---|---|---|---|---|---|---|
| New workspaces | Distinct tenant IDs created in the period. | `tenants.created_at`; self-service workspace RPC records `settings.signup_source` | ScrimStats / Supabase | Daily | Includes all creation paths; report source where recorded. | **Unavailable** — connect Supabase read-only access. |
| Roster-completed teams | Distinct tenant IDs whose first point in time with at least five active player records occurs in the period. | `players` | ScrimStats / Supabase | Daily | Requires historical creation/state timestamps; staff-only teams should be reported separately rather than silently excluded. | **Unavailable** — connect Supabase and confirm roster-complete rule. |
| Invitation acceptance rate | Accepted invitations divided by invitations sent in the period. | `team_invitations.delivery_status`, invitation timestamps | ScrimStats / Supabase + email delivery | Daily | Delivery state is not proof of email open; accepted invitations may originate in an earlier period, so cohort reporting is also needed. | **Unavailable** — connect Supabase read-only access. |
| First scrim import | Distinct tenant IDs whose first completed `scrim_games` record created from any supported import/capture source occurs in the period. | `scrim_games`, capture/evidence metadata | ScrimStats / Supabase | Daily | Manual game entry and import sources must be explicitly distinguished before source-level comparisons. | **Unavailable** — connect Supabase and validate source fields. |
| First review completed | Distinct tenant IDs whose earliest `scrims.review_completed_at` falls in the period. | `scrims.review_completed_at` | ScrimStats / Supabase | Daily | Only records the workflow’s completion state, not review quality. | **Unavailable** — connect Supabase read-only access. |
| First coaching action created | Distinct tenant IDs whose earliest `coaching_actions.created_at` falls in the period. | `coaching_actions` | ScrimStats / Supabase | Daily | Creation does not prove acknowledgement or completion. | **Unavailable** — connect Supabase read-only access. |
| Activated teams | Distinct new tenants meeting the documented activation rule within 14 days of creation. | Supabase workspace, roster, scrim-game and review records | ScrimStats / Supabase | Daily; cohort weekly | Depends on the roster-complete decision and reliable source/timestamps. | **Unavailable** — connect Supabase and confirm roster rule. |
| Active teams | Distinct tenant IDs with at least one qualifying operational activity in the period: roster change, invite, scheduled scrim, imported game, completed review, coaching action, Collector pairing, or completed Collector capture. | Supabase operational tables | ScrimStats / Supabase | Daily; weekly/monthly reporting | A broad union must always be accompanied by the activity-type breakdown. Activity events without timestamps cannot qualify. | **Unavailable** — connect Supabase and document query mapping. |
| Activity mix | For active teams, count and share of teams qualifying through each active-team activity type. A team may appear in multiple types. | Supabase operational tables | ScrimStats / Supabase | Weekly/monthly | Not a mutually exclusive distribution. Login/session activity is unavailable. | **Unavailable** — connect Supabase and document query mapping. |
| Weekly retained teams | Activated tenants active in both the prior calendar week and current calendar week, divided by activated tenants active in the prior week. | Supabase operational tables | ScrimStats / Supabase | Weekly | Requires a stable active-team query and activation cohort. | **Unavailable** — connect Supabase. |
| Monthly retained teams | Activated tenants active in both the prior calendar month and current calendar month, divided by activated tenants active in the prior month. | Supabase operational tables | ScrimStats / Supabase | Monthly | Does not measure paid retention; report alongside subscription retention. | **Unavailable** — connect Supabase. |
| Collector pairing rate | Distinct tenants with at least one redeemed Collector pairing code divided by tenants that clicked download or were explicitly offered Collector access. | `collector_pairing_codes`, product analytics or entitlement cohort | Collector / Supabase | Weekly | The denominator is currently absent. A redeemed code proves pairing, not successful capture. | **Unavailable** — connect Supabase and add Collector-offer/download event. |
| Collector capture completion rate | Completed capture sessions divided by sessions started in the period. | `collector_capture_sessions.status`, timestamps | Collector / Supabase | Daily; weekly | A session may remain `capturing`; define a stale-session threshold before classifying failure. | **Unavailable** — connect Supabase and approve stale-session rule. |
| Collector usable-import rate | Completed capture sessions linked to a game with acceptable capture quality divided by completed sessions. | Capture session, linked game, quality classification/flags | Collector / Supabase | Weekly | “Acceptable” quality threshold must be approved; incomplete custom games may be valid for some use cases. | **Unavailable** — connect Supabase and approve quality threshold. |

### Subscription and plan conversion

| Metric | Exact definition | Data source | Owner / integration | Refresh | Known limitations | Status |
|---|---|---|---|---|---|---|
| Checkout starts | Distinct tenant IDs for which a Stripe Checkout session is successfully created in the period. | Stripe Checkout + `create-checkout` logs | Billing / Stripe + Supabase | Daily | The current local code does not persist a Checkout-start record in Postgres. | **Unavailable** — connect Stripe; add durable checkout-attempt event if Stripe Events cannot supply it. |
| Paid plan conversion | Distinct tenants that move from Free to an active paid subscription in the period, divided by eligible active Free tenants in the same period. | Stripe subscriptions + tenant plan history | Billing / Stripe + Supabase | Daily; monthly | Eligibility and plan-history source must be verified; never infer conversion solely from current plan. | **Unavailable** — connect Stripe and Supabase. |
| Plan upgrades and downgrades | Count of active subscription changes to a higher or lower paid plan in the period, classified from Stripe price/plan transition. | Stripe subscription events | Billing / Stripe | Daily | Requires authoritative price-to-plan mapping. | **Unavailable** — connect Stripe and confirm price map. |
| Gross MRR | Sum of normalized monthly recurring amounts for active paid subscriptions at period end, before churn and expansion adjustments. | Stripe subscriptions/prices | Billing / Stripe | Daily | Exclude one-time charges, trials without payment, tax, and non-recurring invoices; annual plans require monthly normalization. | **Measured** — direct Stripe read is connected; reconcile against tenant entitlement state before reporting paid-team counts. |
| Net MRR movement | Current period-end MRR minus prior period-end MRR, reconciled into new, expansion, contraction, reactivation, and churn components. | Stripe subscriptions/invoices | Billing / Stripe | Monthly | Requires complete historical subscription state and price mapping. | **Unavailable** — connect Stripe. |
| Paid subscription retention | Active paid subscriptions retained at current period end divided by active paid subscriptions at prior period end. | Stripe subscriptions | Billing / Stripe | Monthly | Separate logo retention from MRR retention; tenant-to-customer mapping must be reconciled. | **Unavailable** — connect Stripe and Supabase. |
| Webhook processing failure rate | Failed webhook ledger rows divided by all completed or failed webhook ledger rows processed in the period. | `stripe_webhook_events` | Billing / Supabase Edge Function | Daily | Shows application processing failures, not deliveries Stripe may still retry or failures before the function is invoked. | **Unavailable** — connect Supabase; reconcile with Stripe Events. |

### Technical health

| Metric | Exact definition | Data source | Owner / integration | Refresh | Known limitations | Status |
|---|---|---|---|---|---|
| Browser client error rate | Client error events divided by page views for the same release and period. | Client-error receiver + web analytics | Engineering / Vercel + error monitoring | Daily | Receiver is hosted and receiving events, but page views are not instrumented and the observed release label was `local`. | **Unavailable** — add a page-view source and repair release attribution. |
| Authentication failure rate | Failed authentication attempts divided by all authentication attempts in the period. | Supabase Auth logs | Engineering / Supabase | Daily | User-facing failures must be separated from bot/rate-limit traffic. | **Unavailable** — connect Supabase Auth logs. |
| Edge Function error rate | Non-2xx function invocations divided by all invocations, grouped by function and release. | Supabase Edge Function logs/metrics | Engineering / Supabase | Near-real-time; daily report | A function may return 2xx while a downstream operation fails; pair with structured logs and business outcomes. | **Unavailable** — connect Supabase logs/metrics. |
| Edge Function latency | p50, p95 and p99 invocation duration by function in the period. | Supabase Edge Function metrics | Engineering / Supabase | Near-real-time; daily report | Requires platform duration metrics; do not derive latency from client clocks. | **Unavailable** — connect Supabase metrics. |
| API failure rate | Failed HTTP API requests divided by all API requests, grouped by route/status family. | Supabase API logs and Vercel logs | Engineering / Supabase + Vercel | Daily | Requires a route inventory and separation of expected authorization responses. | **Unavailable** — connect platform logs. |
| Database health | Current database health indicators: availability incidents, connection saturation, slow-query evidence, backup/PITR status, and relevant advisor findings. | Supabase dashboard, logs, advisors | Engineering / Supabase | Daily health check; incident-driven | This is a health checklist, not a single scalar metric. | **Unavailable** — connect Supabase dashboard read-only access. |
| Website performance | Real-user Core Web Vitals by route and device class: LCP, INP and CLS. | Vercel Speed Insights or approved RUM tool | Engineering / Vercel | Daily | Synthetic build checks do not measure real-user performance. | **Unavailable** — connect Vercel and confirm Speed Insights/RUM is enabled. |
| Website availability | Successful synthetic checks divided by scheduled checks for public marketing, signup, authenticated shell, and Collector download routes. | Approved uptime monitor | Engineering / monitoring tool | 5-minute checks; daily report | No uptime-monitor connection is identified. Authenticated checks need a safe test account. | **Unavailable** — connect or approve an uptime monitor. |
| Collector stale-session rate | Capture sessions that remain `capturing` beyond the approved stale threshold divided by sessions started. | `collector_capture_sessions` | Collector / Supabase | Daily | The threshold is not yet approved; do not label sessions failed before it is set. | **Unavailable** — connect Supabase and approve threshold. |

### Data quality and missing instrumentation

| Metric | Exact definition | Data source | Owner / integration | Refresh | Known limitations | Status |
|---|---|---|---|---|---|---|
| Capture-quality distribution | Completed Collector games grouped by quality classification and quality flags. | Game capture quality fields and `scrim_games` evidence | Collector / Supabase | Weekly | Quality classification exists, but the business definition of “usable” is not yet approved. | **Unavailable** — connect Supabase. |
| Roster identity match rate | Collector participants marked as matched divided by Collector participants belonging to the team. | Collector-imported participant records | Collector / Supabase | Weekly | Requires a consistent definition of team-side participants; excludes opponents. | **Unavailable** — connect Supabase and validate participant source fields. |
| Import-source completeness | Imported scrim games with a non-null, recognized source/evidence record divided by imported scrim games. | `scrim_games` and evidence metadata | ScrimStats / Supabase | Weekly | Legacy/manual records may predate standardized source metadata. | **Unavailable** — connect Supabase and audit legacy rows. |
| Event coverage | Required canonical product events implemented and verified in production divided by required events in the approved taxonomy. | Source audit + production analytics debugger | Product / analytics tool | Per release; monthly | This is instrumentation coverage, not customer behavior. | **Unavailable** — approve event taxonomy and connect analytics debugger. |
| Attribution completeness | Website visits and signup starts with a normalized acquisition source divided by all website visits and signup starts. | Product analytics event stream | Marketing / approved analytics tool | Weekly | Requires consent-aware attribution policy and event fields. | **Unavailable** — add visit/signup events with attribution fields. |
| Reporting reconciliation gap | Absolute difference between paid active tenants in Supabase and active paid Stripe subscriptions, with unmatched records listed only in secure operations detail. | Supabase tenants + Stripe subscriptions | Billing / Stripe + Supabase | Daily; monthly close | Mapping can be affected by migration timing, cancellations, trials, and webhook lag. | **Unavailable** — connect Stripe and Supabase. |

## Meaningful-change monitoring

Create a Project Manager handoff only when a signal has a material user or business implication. Prioritise:

1. Any sustained increase in browser, authentication, API, Edge Function, import, or webhook failures.
2. Any Collector completion, usable-import, or pairing-rate degradation after a release.
3. A broken funnel step: visit-to-signup, signup-to-workspace, roster completion, first import/review, or checkout-to-paid conversion.
4. A material decline in activated-team retention, active-team mix, MRR, or paid retention.
5. Data that contradicts an assumption, such as download volume without pairing, pairing without capture, active workspaces without operating activity, or plan access inconsistent with Stripe.

Do not hand off normal day-to-day variance, one-off expected authorization responses, or a low-count percentage change without the underlying counts and period context.

## Project Manager handoff

Use this structure for every confirmed issue or instrumentation risk. Mark a finding **verification required** when local-source evidence exists but production evidence is not yet available.

```md
### [Short issue title]

- **Evidence:** [measured value, period, comparison, source, correlation/release where available]
- **Severity:** [Critical / High / Medium / Low]
- **User/business impact:** [affected journey, teams/revenue/risk]
- **Likely owner:** [Product, Web, Backend, Collector, Billing, Data, or external provider]
- **Recommended next action:** [smallest safe diagnostic or remediation action]
- **Required verification:** [specific query, log, browser check, test, or reconciliation required before closing]
- **Status:** [Open / Monitoring / Resolved]
```

### Resolved discovery: client-error intake is hosted; route and release quality need follow-up

- **Evidence:** Vercel Runtime Errors confirms one `/scouting` client error was received through `/api/client-error` on 2026-07-27. Its release field was `local`.
- **Severity:** Medium.
- **User/business impact:** Error intake is no longer invisible, but failure-to-deployment correlation is impaired and the Scouting route may fail for a customer state.
- **Likely owner:** Web / Backend.
- **Recommended next action:** Follow proposed `WO-2026-007-fix-scouting-client-error-and-release-attribution.md`.
- **Required verification:** Reproduce or explain the fault state; ship a safe deployment release identifier; confirm hosted events retain no sensitive fields.
- **Status:** Open follow-up.

## Maintenance procedure

1. Update this file only after a source, query, event, or definition is verified.
2. Keep unavailable metrics visible with their exact missing dependency; never substitute an estimate.
3. Record the report period, query version, and source access date in each report.
4. Reconcile Supabase and Stripe before presenting paid-team counts or MRR as measured.
5. Any production tracking, database, deployment, dashboard, or configuration change requires Theo's explicit approval before implementation.
