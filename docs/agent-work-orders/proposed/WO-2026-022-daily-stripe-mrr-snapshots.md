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
- **Dependencies:** Theo's 2026-07-30 implementation approval; separate Theo release approval for migration, secret, cron, deployment, and first production snapshot. An isolated Stripe test-mode aggregate is required before release verification.
- **Collision risk:** WO-2026-009 is complete under Theo's accepted-risk decision, so its sequencing lock is lifted. Avoid concurrent work with any newly opened billing, Stripe, Vault, `pg_cron`, or entitlement migration.

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
| Service-only schema | Hosted original migration `20260731151435`, corrective migration `revoke_mrr_snapshot_mutation_privileges`, RLS/grant query, and no snapshot-table-specific Advisor finding. | Hosted least-privilege boundary verified | Passed |
| Idempotent worker | Edge Function `stripe-mrr-snapshot` version 1 active; unauthenticated POST returned 401. | Hosted deployment and access denial verified | Passed |
| Isolated aggregate reconciliation | No approved isolated test-mode fixture or test-key route was supplied. | N/A | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The hosted schema and service-only append-only boundary are verified. The cron is intentionally suspended until isolated Stripe QA completes. Stripe aggregate reconciliation, repeat execution, and a second verified daily snapshot remain QA work; MRR movement is still unavailable.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| WO-2026-009 collision clears | PM | WO-2026-009 completed under recorded accepted-risk decision. | Closed |
| Implementation and tests | Core Features Developer | Code, migration, RLS/advisor review, and handoff. | Closed |
| Append-only correction and provenance recovery | Core Features Developer | Forward migration, no service-role mutation privileges, cron suspension, and matching original migration version. | Closed |
| Hosted test-mode verification | QA | Reproducible test evidence. | Open |
| Production release approval | Theo | Explicit approval for release boundary. | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved | 2026-07-30 | Theo approved the daily Stripe MRR snapshot follow-up. |
| Release | Yes | Approved | 2026-07-31 | Theo approved migration application, worker deployment, Vault-backed scheduling, and the first production snapshot boundary. |

## Decision and approval record

- 2026-07-30 - Daily reporting measured a completed cancellation but no historical MRR snapshot.
- 2026-07-30 - Theo approved implementation; it is sequenced behind WO-2026-009 to prevent billing/Supabase collisions.
- 2026-07-31 - PM confirmed WO-2026-009 is complete under Theo's accepted-risk decision. The sequencing block is lifted; WO-2026-022 moves to Ready for Development. This does not approve a migration, secret/configuration change, schedule, deployment, or first production snapshot.
- 2026-07-31 - Theo approved the hosted WO-2026-022 release boundary. The migration, Edge Function deployment, Vault-backed schedule configuration, and first production snapshot boundary are approved; isolated test-mode aggregate verification remains required.
- 2026-07-31 - Theo approved the forward-only least-privilege correction, temporary cron suspension, and local migration-provenance reconciliation after the independent QA audit.

## Independent QA audit - 2026-07-31

### 1. Release verdict: HOLD

WO-022 is not releasable. The live table is not append-only for `service_role`, and the deployed migration version does not match the repository migration file. No Stripe aggregate, idempotency result, or second verified snapshot is available.

### 2. What was verified

- The table exists, RLS is enabled, browser roles have no `SELECT` privilege, and the active Edge Function is `stripe-mrr-snapshot` version 1 with custom worker-secret authentication.
- The active cron job is `scrimstats-stripe-mrr-snapshot` at `30 0 * * *`, but it has no recorded runs and the snapshot table is empty.
- The live SELECT and INSERT policies are limited to `service_role`; no snapshot-table-specific Security Advisor finding was returned.
- The source contract establishes the intended monthly/annual normalisation and passed developer-recorded local validation. It does not substitute for a Stripe-provider reconciliation.

### 3. Blocking issues

- **Append-only boundary failed:** `service_role` has effective `UPDATE`, `DELETE`, and `TRUNCATE` privileges on `public.stripe_mrr_daily_snapshots`, in addition to `SELECT` and `INSERT`. This conflicts with the work order's immutable reporting-ledger contract.
- **Migration provenance mismatch:** production records `20260731151435_daily_stripe_mrr_snapshots`; the repository file is `20260731140000_daily_stripe_mrr_snapshots.sql`. Do not infer that future schema tooling will safely reconcile this state.
- **No provider evidence:** no approved isolated Stripe test-mode route has produced a monthly-plus-annual aggregate, repeat/idempotency result, or stored snapshot comparison.

### 4. Important risks

- The active cron can create a live Stripe aggregate before the append-only correction and isolated reconciliation are complete. A current snapshot must not be reported as measured MRR movement until two consecutive independently verified day-end snapshots exist.
- The current deployment does not prove that its `STRIPE_SECRET_KEY` points to the intended isolated/test Stripe account; QA did not read or expose any secret value.

### 5. Unverified but required checks

- Effective service-role mutation denial after remediation; browser-role table/RPC denial; deployed worker secret verification; cron invocation; first aggregate row; duplicate-run response; and an independent test-mode Stripe monthly/annual reconciliation.
- A second consecutive verified London-day snapshot before any MRR-change or churn-movement reporting.

### 6. Suggested fixes or next validation steps

1. **Core Features Developer:** prepare a forward-only corrective migration that revokes all table privileges from `service_role` and grants only `SELECT, INSERT` on `public.stripe_mrr_daily_snapshots`. Add a live-grant contract assertion for no `UPDATE`, `DELETE`, or `TRUNCATE` effective privilege.
2. **Core Features Developer / PM:** reconcile repository migration provenance with the live `20260731151435` entry. Do not rewrite Supabase migration history or apply a duplicate table migration. Record the reviewed recovery approach.
3. **Theo:** explicitly approve applying that new production-backed corrective migration. Separately decide whether the active cron should be suspended until the repair and isolated Stripe test-mode reconciliation complete.
4. **QA:** after the repair, test against approved isolated Stripe test-mode subscriptions (one monthly, one annual), reconcile the aggregate, repeat the invocation, and wait for a second verified London-day snapshot.

### QA-audit remediation - 2026-07-31

- The service-role mutation finding is resolved by hosted forward migration `revoke_mrr_snapshot_mutation_privileges`: effective UPDATE, DELETE, and TRUNCATE are all false while SELECT and INSERT remain true.
- The source/live provenance finding is resolved without hosted-history changes: the repository migration is now `20260731151435_daily_stripe_mrr_snapshots.sql`, matching the original hosted record.
- The named cron job is intentionally suspended and the table has zero rows. The remaining block is the approved isolated Stripe test-mode provider scenario and later second verified London-day snapshot.

## Implementation and review evidence

- 2026-07-30 - Proposed from read-only reporting evidence. No code, migration, configuration, schedule, or production data changed.
- 2026-07-31 - Source-only implementation added `stripe_mrr_daily_snapshots`, the server-only `stripe-mrr-snapshot` worker, dormant service-role cron configuration, and focused aggregate/RLS contract tests. The worker accepts active paid monthly/annual recurring prices only, derives the latest completed `Europe/London` date, and rejects duplicate snapshots without update/delete paths.
- 2026-07-31 - Local validation passed: five focused contract tests, ESLint with zero warnings, TypeScript, production build, and scoped diff check. The production build emitted the pre-existing Browserslist data-age notice only.
- 2026-07-31 - No hosted migration, Vault secret, Edge Function deployment, cron schedule, or snapshot has been created. Migration execution/RLS advisor review and isolated Stripe test-mode reconciliation remain outstanding.
- 2026-07-31 - Hosted original migration record is `20260731151435_daily_stripe_mrr_snapshots`; local source now uses the same version. This source-only provenance recovery did not rewrite hosted migration history or reapply the table migration.
- 2026-07-31 - Independent QA correctly found effective service-role UPDATE/DELETE/TRUNCATE privileges. With Theo's approval, `revoke_mrr_snapshot_mutation_privileges` was applied forward-only and the named cron job was unscheduled before it created a row.
- 2026-07-31 - Post-correction hosted query confirmed service-role SELECT/INSERT true; UPDATE/DELETE/TRUNCATE false; cron absent; and zero snapshot rows. Security and performance advisors returned no finding naming `stripe_mrr_daily_snapshots`.
- 2026-07-31 - Not run: isolated Stripe test-mode monthly/annual aggregate reconciliation, duplicate invocation, authenticated browser RLS denial, and second verified daily snapshot. No MRR movement or customer-facing availability claim is authorised.
- **Highest evidence achieved:** Hosted deployment and security boundary verified
