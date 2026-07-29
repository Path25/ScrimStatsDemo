# WO-2026-010 — Enforce append-only service-role access for funnel events

## ID reservation

This work order reserves `WO-2026-010` in the [work-order index](../WORK_ORDER_INDEX.md). The next work order must use `WO-2026-011`.

## Status and ownership

| Field | Value |
| --- | --- |
| Status | Review |
| Owner | QA and Release Auditor |
| Priority | High |
| Autonomy class | Needs Theo's approval before implementation |

## Problem and user impact

Production QA verified that `public.workspace_funnel_events` has RLS enabled and browser roles have no table access, but `service_role` retains `DELETE`, `UPDATE`, `TRUNCATE`, `REFERENCES`, and `TRIGGER` privileges. That conflicts with the intended append-only funnel-ledger contract. An erroneous or compromised server-side path could alter historical funnel evidence and make reporting less trustworthy. This is not a browser-access exposure.

## Why now

The finding came from the production QA review of the newly introduced funnel reporting foundation. Fixing the narrow grant boundary before further reliance on funnel scorecards protects the integrity of future evidence without changing customer data or product behaviour.

## Scope

- Inspect the effective ownership and grants for `public.workspace_funnel_events` before writing SQL; confirm that revocation can achieve the intended boundary.
- Add one narrow, forward-only migration that removes non-required table privileges from `service_role` and grants only `SELECT` and `INSERT` on `public.workspace_funnel_events`.
- Preserve existing RLS, browser-role denial, triggers, trigger functions, and the service-only scorecard path.
- Extend the relevant contract test or add a focused grant test so the intended privileges cannot silently broaden.
- Produce an implementation/release audit with the exact final grants and verification evidence.

## Explicit non-goals

- Do not apply the migration to production without Theo's explicit approval.
- Do not delete, update, truncate, backfill, or otherwise modify existing funnel-event data.
- Do not grant `anon` or `authenticated` browser access, add browser writes, or alter RLS policies.
- Do not disable, recreate, or broaden triggers, trigger functions, scorecard functions, or unrelated database roles.
- Do not change billing, entitlements, emails, pricing, customer-facing copy, or analytics definitions.

## Acceptance criteria

- [ ] A reviewed migration makes `service_role` table privileges on `public.workspace_funnel_events` no broader than `SELECT` and `INSERT`, accounting for table-owner and role-inheritance semantics.
- [ ] `anon` and `authenticated` retain no table privileges, and no RLS policy permits browser-role reads or writes.
- [ ] Existing funnel-event triggers still fire for an authorised server-side insert; trigger execution remains owned by the database object/owner rather than requiring broad service-role table privileges.
- [ ] The service-only `get_founder_funnel_scorecard` path still executes as intended, and no browser role can execute it.
- [ ] The relevant contract test verifies the least-privilege grant contract and passes alongside affected checks.
- [ ] Supabase Advisor results are reviewed; any unrelated warnings are recorded separately rather than hidden.
- [ ] Production application, final live-grant inspection, and hosted verification occur only after Theo records migration approval.

## Relevant files, workflows, or data areas

- `supabase/migrations/20260728103000_premium_copy_and_funnel_instrumentation.sql`
- New forward-only migration under `supabase/migrations/`
- `scripts/funnel-instrumentation-contract.test.mjs`
- `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`
- `docs/security/ADVISOR_REVIEW.md`
- `public.workspace_funnel_events`, its triggers, and `public.get_founder_funnel_scorecard`

## Risks

| Area | Risk and required control |
| --- | --- |
| Permissions / Supabase RLS | PostgreSQL ownership, inherited privileges, or `BYPASSRLS` can make a simple `REVOKE` insufficient. Inspect effective grants and ownership before claiming least privilege. Keep RLS and browser-role denial intact. |
| Reporting integrity | A faulty migration could block the authorised ingest path or break trigger-derived reporting. Test insert and scorecard behaviour without altering production history. |
| Billing / entitlement | None expected; do not couple this migration to plan changes. |
| Email | None expected. |
| Production | This is a production database migration. It must be reviewed and explicitly approved by Theo before application, then verified against live grants, policies, triggers, and advisor output. |

## Required validation

- Review the generated migration for the exact `REVOKE` and `GRANT` statements and for absence of data-changing statements.
- Inspect local/staging effective grants, table owner, RLS state, policies, role memberships/inheritance, and relevant function execution privileges.
- Run `scripts/funnel-instrumentation-contract.test.mjs` and affected database/security checks.
- Verify an authorised server-side funnel insert fires its existing triggers; verify `get_founder_funnel_scorecard` works for `service_role` only.
- Verify `anon` and `authenticated` cannot select, insert, update, delete, truncate, reference, trigger, or execute the scorecard path.
- After Theo approves production application: inspect final live grants/RLS/policies, repeat the trigger and scorecard checks, and review Supabase Advisor results.

## Role handoffs

| Role | State | Handoff |
| --- | --- | --- |
| Project Manager | Involved | Maintain scope, confirm evidence level, and obtain Theo's approval before implementation and before production application. |
| Feature Developer | Assigned | Inspect effective ownership/role semantics, then prepare the narrow migration and contract coverage. Do not apply it to production. |
| QA & Release Auditor | Involved | Review effective privileges, RLS/policies, trigger operation, scorecard execution, Advisor output, and final live evidence. |
| Technical Reporting Analyst | Involved | Confirm the remediation preserves append-only funnel evidence and report reconciliation. |
| Lead Marketer & Growth | N/A | No customer-facing or campaign change. |

## Release audit

### Acceptance-criteria traceability

| Criterion | Evidence required | Status |
| --- | --- | --- |
| Least-privilege `service_role` grants | Migration review plus final privilege query | Outstanding |
| Browser roles remain denied | Live/local privilege and policy inspection | Partially evidenced by QA production review; recheck after migration |
| Trigger operation preserved | Authorised insert and trigger evidence | Outstanding |
| Scorecard execution preserved | Service-role success and browser-role denial evidence | Partially evidenced by QA production review; recheck after migration |
| Advisor review | Dated Advisor output | Outstanding |

### Final verdict

**AWAITING QA REVIEW** — the narrow migration is applied to the configured Supabase project and live privilege inspection confirms the required grant boundary. QA still needs to independently verify the controlled trigger path and service-only scorecard execution.

### Exact outstanding checks

- QA independently verifies the live grants, RLS/policy state, controlled trigger path, scorecard execution, and Advisor output.
- Record any unrelated Advisor findings separately; do not change them as part of this work order.

### Theo approval record

| Decision | Required | Status | Record |
| --- | --- | --- | --- |
| Implement the migration | Yes | Approved | 2026-07-29 — Theo approved WO-010 implementation. |
| Apply the production migration | Yes | Approved and applied | 2026-07-29 — Theo approved application; migration `20260729090523_funnel_service_role_append_only_grants` applied successfully. |
| Release/customer communication | No | Not applicable | No customer-facing change planned. |

## Evidence and decision record

- **2026-07-28 — QA & Release Auditor:** Production review found RLS enabled and no browser-role access for `public.workspace_funnel_events`, while `service_role` retained non-append-only table privileges. The finding is hosted-verified; the remediation remains proposed.
- **2026-07-28 — Project Manager:** Reserved this work order as a high-priority, narrow security and reporting-integrity change. No migration has been created or applied.
- **2026-07-29 — Theo:** Approved WO-010 for implementation.
- **2026-07-29 — Feature Developer:** Added the forward-only grant migration and contract coverage. Full automated suite passed (169/169), TypeScript and ESLint passed, and the production build passed. No data, RLS policy, trigger, function, billing, or browser code changed.
- **2026-07-29 — Theo:** Approved the Supabase application of the grant migration.
- **2026-07-29 — Feature Developer:** Applied `20260729090523_funnel_service_role_append_only_grants` to the configured Supabase project. Live inspection confirms RLS remains enabled with no policies; `service_role` has only `SELECT` and `INSERT`; `anon` and `authenticated` have no read/write table privileges; and `get_founder_funnel_scorecard` remains executable by `service_role` only.
