# WO-2026-005 - Verify and remediate recurring managed Postgres collation warnings

- **Status:** Blocked
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

- The warning is classified as benign platform noise, platform-managed remediation, or an application/database action with supporting evidence.
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

## Decision and approval record

- 2026-07-28 - Proposed by Analytics and Technical Reporting from a live production log sample: 86 collation-version mismatch warnings in 100 Postgres entries. No remediation approval recorded.

## Implementation and review evidence

- **Highest evidence achieved:** Proposed
