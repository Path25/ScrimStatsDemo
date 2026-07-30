# WO-2026-005 - Verify and remediate recurring managed Postgres collation warnings

- **Status:** Done (conditional; Theo accepted platform-managed risk)
- **Assigned owner:** Analyst
- **Size:** S
- **Risk:** Medium
- **Priority:** Medium
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing and QA scenario

- **Area / files likely affected:** Managed Postgres/Supabase advisor output, database version/collation metadata, migration history, and security/release documentation.
- **Dependencies:** A current dated warning sample, affected environment/database version, and Theo decision if remediation is in scope after read-only investigation.
- **Collision risk:** Do not combine this with unrelated migrations or attempt a database upgrade/collation rewrite during another database release.
- **QA scenario / test steps:** Blocked until the exact warning is captured. Then record the source/time/environment, compare against database metadata and Supabase guidance, classify impact, and have QA independently verify any proposed remediation is forward-only and does not alter tenant/customer data.

## Problem and user impact

The production ScrimStats Supabase Postgres log sample on 2026-07-28 contained 86 `database ... has a collation version mismatch` warnings in the latest 100 entries. The warnings affected the `postgres` and `template1` databases.

There is no confirmed customer-facing failure, data loss, or query error attributable to this warning. However, a collation-version mismatch can make locale-sensitive text ordering and indexes inconsistent after the underlying operating-system collation library changes. Repeated warnings also obscure operational logs.

## Why now

The reporting baseline now depends on production database health evidence. This should be classified and resolved or accepted with explicit platform evidence before it becomes background noise.

## Scope

- Confirm the warning's source, affected databases, platform guidance, and whether managed Supabase maintenance is required.
- Assess whether any ScrimStats indexes or queries depend on locale-sensitive collation ordering.
- Obtain an approved remediation plan from Supabase documentation/support if a collation refresh, reindex, or platform operation is required.
- Verify the warning count after the approved action and record any impact on application queries.

## Explicit non-goals

- Running `ALTER DATABASE`, collation refresh, reindex, migration, or maintenance commands without Theo's explicit approval.
- Treating the warning as an incident or claiming customer impact without evidence.
- Deleting logs or historical data.

## Acceptance criteria

- The warning is classified as a platform-managed remediation/condition, with hosted evidence and no approved ScrimStats-side database action.
- Any remediation has a documented rollback/recovery path and Theo's approval before execution.
- Post-action logs show whether the warning recurs.
- Locale-sensitive query/index impact is explicitly verified if a database action is recommended.

## Relevant files, workflows, or data areas

- Supabase production project `tvcgjehreaayfazlhvps`
- Supabase Postgres Logs Explorer
- `docs/operations/INCIDENT_RECOVERY.md`
- `docs/security/ADVISOR_REVIEW.md`

## Risks

- **Permissions / Supabase RLS:** Not applicable to investigation; any SQL remediation must preserve RLS and tenant isolation.
- **Billing / entitlement:** Not applicable.
- **Email / customer communication:** Not applicable.
- **Production / data:** Collation or index maintenance can affect query availability and ordering. Treat all remediation as a production-data change.

## Required validation

- Timestamped log sample before and after any action.
- Supabase platform documentation/support confirmation for the recommended approach.
- Advisor review and a targeted, read-only check of affected indexes/queries before execution.
- Hosted smoke checks for tenant search, roster/scrim sorting, and relevant workspace routes after an approved action.

## Platform escalation record

The investigation is complete enough to rule out an application migration. The original escalation draft below is retained as provenance if Supabase support is later needed; it is not a current delivery dependency. No agent should execute the proposed commands directly.

> **Subject:** Managed Postgres collation mismatch — approved maintenance sequence and recovery plan requested
>
> Production project ref: `tvcgjehreaayfazlhvps`. We are seeing repeated `database ... has a collation version mismatch` warnings for `postgres` and `template1` after the managed runtime changed from collation version 2.39 to 2.40. A dated read-only check found the default `en_US.UTF-8` collation and 132 indexes using the database default; there is no known customer-facing error.
>
> PostgreSQL guidance requires rebuilding affected objects before refreshing the recorded version. Please confirm whether this is a Supabase-managed maintenance issue and provide the approved sequence for this project: required reindex scope/method, whether any work must be performed by Supabase, expected locks or availability impact, backup/PITR and rollback path, and whether `template1` requires separate action. Please also confirm the post-maintenance verification query/log evidence you expect.

### Reopen trigger and next action

Reopen this work order only if Supabase communicates a customer-run action, customers experience a confirmed locale/sort/query fault, or a Supabase maintenance notice requires ScrimStats verification. Then the Analyst attaches dated platform evidence and the PM creates a separate production-remediation work order with the exact command sequence, maintenance window, backup/recovery evidence, and smoke-test plan. Theo must approve that separate work order before any maintenance.

## Decision and approval record

- 2026-07-28 - Proposed by Analytics and Technical Reporting from a live production log sample: 86 collation-version mismatch warnings in 100 Postgres entries. No remediation approval recorded.
- 2026-07-30 - Read-only review confirmed PostgreSQL 17.6 records database collation version 2.39 while the managed runtime supplies 2.40 for both `postgres` and `template1`. The current 100-entry Postgres log sample contains 77 such warnings for `postgres`.
- 2026-07-30 - Read-only impact check found 132 indexes using the database default collation and no dependencies on an explicitly version-mismatched custom collation. This is classified as a **platform-managed remediation pending Supabase support**, not benign noise and not an application migration.
- 2026-07-30 - Do not run `ALTER DATABASE ... REFRESH COLLATION VERSION` or `REINDEX` from a ScrimStats migration. PostgreSQL guidance requires rebuilding affected objects before refreshing the recorded version; Supabase must provide the approved maintenance sequence, availability window, and recovery path.
- 2026-07-30 - Unblock action is an authorised Supabase support request using the draft above. Until the platform response identifies a safe owner and maintenance sequence, the work order remains Blocked and no application-side remediation is authorised.
- 2026-07-30 - Theo accepted this as a platform-managed condition after confirming it is a widespread Supabase Postgres-upgrade issue. ScrimStats will not pursue an application-side fix; the work order is Done (conditional) and reopens only on the stated trigger.

## Implementation and review evidence

- 2026-07-30 - Production metadata: default `en_US.UTF-8` collation, recorded version 2.39, actual version 2.40; `postgres` and `template1` both mismatch.
- 2026-07-30 - Production index metadata: 132 indexes use the database default collation; 40 use `C`. The read-only check did not identify a mismatched explicit custom collation dependency.
- 2026-07-30 - Official PostgreSQL guidance: rebuild objects affected by the changed collation before refreshing the database/collation version. See https://www.postgresql.org/docs/current/sql-altercollation.html.
- **Highest evidence achieved:** Hosted verified (read-only production metadata and log review); no ScrimStats remediation implemented or required under the accepted platform-managed-risk decision.
