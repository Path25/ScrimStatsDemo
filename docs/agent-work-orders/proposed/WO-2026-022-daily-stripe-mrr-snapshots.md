# WO-2026-022 - Record daily Stripe MRR snapshots for measured churn reporting

- **ID reservation:** [WO-2026-022 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Blocked
- **Assigned owner:** Core Features Developer
- **Size:** M
- **Risk:** Medium
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before release

## Delivery routing

- **Area / files likely affected:** New reporting-only Stripe Edge Function, additive Supabase migration, `supabase/config.toml`, focused tests, and the Metrics Dictionary.
- **Dependencies:** Theo implementation approval; WO-2026-009 must reach Ready for QA before work begins; separate Theo release approval for migration, secret, cron, deployment, and first production snapshot.
- **Collision risk:** Billing-adjacent migrations, Stripe server use, Vault, and `pg_cron` overlap with WO-2026-009. Do not run concurrently.

## Problem and user impact

On 2026-07-29 a completed subscription-deletion webhook correctly moved its linked workspace to Free, but ScrimStats could not state the event's measured MRR impact. There is no immutable day-end Stripe snapshot, and a current Stripe read cannot recreate a historical MRR position.

## Why now

Daily churn and MRR movement are commercial priorities. The completed cancellation is measured evidence that event-only reporting is insufficient.

## Scope

- Add a service-only, append-only snapshot table: London business date, currency, active paid-subscription count, normalized monthly recurring amount in minor units, observed timestamp, and snapshot version only.
- Add an idempotent server-only worker that reads Stripe recurring subscriptions, normalizes monthly and annual prices, excludes non-recurring charges, and writes the completed London-day snapshot.
- Schedule it after day close with the existing Vault-backed `pg_cron`/`pg_net` worker pattern. Derive the date explicitly in `Europe/London`.
- Update reporting definitions only after hosted verification matches an independent Stripe aggregate.

## Explicit non-goals

- Any change to Stripe customers, subscriptions, prices, invoices, Checkout, webhooks, tenant entitlements, or feature access.
- Historical backfill from a current Stripe state.
- Persisting Stripe customer IDs, subscription IDs, email addresses, payment details, or raw payloads.

## Acceptance criteria

- Additive, RLS-protected, service-only schema has idempotency for business date, currency, and snapshot version.
- One completed London-day snapshot is written without customer or subscription identifiers.
- A repeat execution cannot duplicate or silently overwrite an accepted snapshot.
- The isolated test-mode Stripe aggregate equals the stored active-subscription count and normalized MRR.
- Daily MRR movement is reported as measured only after two consecutive verified snapshots; earlier movement remains unavailable.

## Relevant files, workflows, or data areas

- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/notification-worker/index.ts`
- `supabase/migrations/20260726164500_schedule_notification_worker.sql`
- `supabase/migrations/20260726133000_fix_soloq_cron_configuration.sql`
- `supabase/config.toml`
- `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`

## Risks

- **Permissions / Supabase RLS:** Snapshot table and worker must remain service-only; no browser-accessible financial data.
- **Billing / entitlement:** Reporting-only; must not update tenants, feature access, or Stripe resources.
- **Email / customer communication:** Not applicable; no messages may be sent.
- **Production / data:** Migration, deployment, Vault/secret configuration, schedule, and first snapshot need release approval.

## Required validation

- Unit/contract coverage for monthly/annual normalization, currency, exclusion rules, London date calculation, and idempotency.
- Migration/RLS/grant/advisor review confirming no customer or subscription identifiers persist.
- Lint, typecheck, production build, and focused Edge Function tests with zero warnings.
- Isolated test-mode Stripe aggregate versus stored snapshot; repeat invocation; authenticated browser RLS denial.
- Separately approved production verification: cron invocation and first aggregate reconciliation. No historical claim until two snapshots exist.

## QA scenario / reproducible test steps

1. Use approved isolated test-mode Stripe subscriptions: one monthly and one annual recurring price; no customer production records.
2. Invoke the worker for an explicit completed `Europe/London` date.
3. Verify exactly one service-only row per date/currency/version, no identifiers, and a matching independent Stripe aggregate.
4. Invoke it again and verify no duplicate or overwrite.
5. Verify an authenticated browser user cannot read the table or invoke the worker; record response, aggregate, row count, and RLS denial without secrets.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Sequence after WO-2026-009 and retain the release boundary. | This work order |
| Developer - Fast Lane | Not applicable | M/medium-risk Stripe, migration, and worker work belongs to Core. | N/A |
| Core Features Developer | Involved | Implement after collision clears. | Pending |
| QA and Release Auditor | Involved | Run the reproducible isolated-hosted scenario. | Pending |
| Technical Reporting Analyst | Involved | Update definitions only after verified snapshots. | Daily report 2026-07-29 |
| Lead Marketer and Growth | Not applicable | No public claim is in scope. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Service-only schema | Not implemented. | N/A | Outstanding |
| Idempotent worker | Not implemented. | N/A | Outstanding |
| Isolated aggregate reconciliation | Not run. | N/A | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Implementation is approved but is sequenced behind overlapping WO-2026-009 billing/Supabase work. Production release remains separately approval-gated.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| WO-2026-009 collision clears | PM / Core Features Developer | WO-2026-009 reaches Ready for QA. | Open |
| Implementation and tests | Core Features Developer | Code, migration, RLS/advisor review, and handoff. | Open |
| Hosted test-mode verification | QA | Reproducible test evidence. | Open |
| Production release approval | Theo | Explicit approval for release boundary. | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved | 2026-07-30 | Theo approved the daily Stripe MRR snapshot follow-up. |
| Release | Yes | Pending | 2026-07-30 | Migration, secrets, scheduling, deployment, and first production snapshot require separate approval. |

## Decision and approval record

- 2026-07-30 - Daily reporting measured a completed cancellation but no historical MRR snapshot.
- 2026-07-30 - Theo approved implementation; it is sequenced behind WO-2026-009 to prevent billing/Supabase collisions.

## Implementation and review evidence

- 2026-07-30 - Proposed from read-only reporting evidence. No code, migration, configuration, schedule, or production data changed.
- **Highest evidence achieved:** Proposed
