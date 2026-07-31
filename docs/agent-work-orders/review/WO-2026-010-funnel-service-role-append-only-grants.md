# WO-2026-010 — Enforce append-only service-role access for funnel events

## ID reservation

This work order reserves `WO-2026-010` in the [work-order index](../WORK_ORDER_INDEX.md). The next work order must use `WO-2026-011`.

## Status and ownership

| Field | Value |
| --- | --- |
| Status | Done |
| Assigned owner | QA |
| Size | M |
| Risk | High |
| Priority | High |
| Autonomy class | Needs Theo's approval before implementation |

## Delivery routing and QA scenario

- **Area / files likely affected:** Funnel grant migration, funnel contract test, `workspace_funnel_events`, triggers, scorecard RPC, Advisor record.
- **Dependencies:** Applied narrow migration evidence and an authorised isolated server-side trigger source; no customer data.
- **Collision risk:** Do not modify funnel grants, trigger functions, scorecard privileges, or RLS while QA validates the deployed contract.
- **QA scenario / test steps:** (1) Inspect effective live grants, owner, membership, RLS, policies, and RPC execute grants. (2) Exercise an authorised non-customer source action that inserts a funnel event through the existing trigger. (3) Confirm trigger outcome and service-only scorecard execution. (4) Confirm anon/authenticated denial and record dated Advisor output.

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

**SUPERSEDED BY THE 2026-07-29 INDEPENDENT QA AUDIT BELOW.** The narrow migration is applied and the primary live privilege, trigger-boundary, and scorecard checks passed. One isolated source-trigger exercise remains a follow-up.

### Exact outstanding checks

- QA independently verifies the live grants, RLS/policy state, controlled trigger path, scorecard execution, and Advisor output.
- Record any unrelated Advisor findings separately; do not change them as part of this work order.

## Independent QA audit - 2026-07-29

### Outcome: Pass with follow-up

- **Live grant boundary verified:** Migration `20260729090523_funnel_service_role_append_only_grants` is recorded. `workspace_funnel_events` is owned by `postgres`, has RLS enabled and no policies, and grants `service_role` only `SELECT` and `INSERT`. `anon` and `authenticated` have no `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, or `TRIGGER` privilege.
- **Scorecard verified:** `get_founder_funnel_scorecard(timestamptz)` is executable by `service_role` and not executable by `anon` or `authenticated`. An execution under `SET LOCAL ROLE service_role` completed successfully (zero rows in the current 30-day window; no customer records were inspected).
- **Trigger boundary verified by inspection:** The five source triggers are enabled and invoke `postgres`-owned `SECURITY DEFINER` functions with `search_path = ''`; their functions, not broad `service_role` table rights, own funnel-event insertion. The applied migration contains only the targeted revoke/grant statements, and `scripts/funnel-instrumentation-contract.test.mjs` passed 2/2.
- **Unverified follow-up:** No source-table insert was performed, including in a rolled-back transaction, because this QA audit did not have separate approval to exercise production source-data triggers. Before relying on fresh milestone generation operationally, validate one authorised non-customer source event in an isolated environment and confirm its expected funnel milestone.
- **Advisor review:** Security Advisor still reports the pre-existing project-wide RLS-without-policy informational entries and multiple unrelated executable `SECURITY DEFINER` warnings, plus leaked-password protection disabled. The funnel table's no-policy entry is expected for a service-only table with no browser privileges; none of these findings were altered or hidden by WO-010.

### QA release recommendation

**CONDITIONAL** for WO-010: the append-only privilege remediation is live and its primary security acceptance criteria pass. The isolated authorised-trigger check remains a required operational follow-up, not a reason to restore broad service-role privileges.

### Theo approval record

| Decision | Required | Status | Record |
| --- | --- | --- | --- |
| Implement the migration | Yes | Approved | 2026-07-29 — Theo approved WO-010 implementation. |
| Apply the production migration | Yes | Approved and applied | 2026-07-29 — Theo approved application; migration `20260729090523_funnel_service_role_append_only_grants` applied successfully. |
| Release/customer communication | No | Not applicable | No customer-facing change planned. |

## QA daily review - 2026-07-30

### Outcome: Pass with follow-up

- **Reproducible evidence:** `node --test scripts/premium-copy-integrity.test.mjs scripts/funnel-instrumentation-contract.test.mjs` passed 3/3. Live read-only inspection confirms migration `20260729090523` remains applied; `workspace_funnel_events` has RLS enabled and no policies; `anon` and `authenticated` have no `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, or `TRIGGER` privilege; `service_role` has only `SELECT` and `INSERT`; and the scorecard RPC is executable only by `service_role`. All five funnel triggers remain enabled.
- **Advisor:** The funnel table's RLS-without-policy informational finding remains expected for a service-only table with no browser grants. Current Security Advisor output still includes the pre-existing project-wide SECURITY DEFINER warnings and leaked-password-protection warning; this work order did not conceal or alter them.
- **Follow-up not performed:** No authorised source-table action was executed during this read-only daily review. The trigger's runtime path has not been freshly exercised, and the ledger remains empty.

### Exact remaining checks Theo must approve or complete

1. Make the same dedicated non-customer, production-backed staging test session available and confirm QA may perform one controlled source action.
2. QA must confirm exactly one expected milestone is recorded, the scorecard changes only in aggregate, a repeat is idempotent, and browser roles remain denied. This is shared with WO-003 and must not use customer data.
3. PM should keep this item in `Ready for QA` until that operational follow-up is recorded, then decide whether to move it to `Done`; no customer release approval is implied by this security-only result.

## Evidence and decision record

## QA daily review - 2026-07-31

### Outcome: Pass with follow-up

- No new developer handoff or production change was recorded after the 2026-07-30 review. The applied append-only migration, live grants/RLS boundary, scorecard execution boundary, trigger inventory, contract result, and recorded Advisor caveats remain the latest evidence.
- **Required check remains unperformed:** one Theo-approved, non-customer source-trigger exercise with an idempotency retry and aggregate-only scorecard confirmation. No production data or trigger was exercised by this daily review.
- **PM routing:** keep `Ready for QA`; return no implementation work to Developer. Theo must approve the isolated source action before QA can close the operational follow-up.

## Independent QA closure - 2026-07-31

### 1. Release verdict: READY

The append-only funnel-ledger grant remediation is live and all WO-010 acceptance criteria are now verified. This is a database/security release verdict only; it does not make a customer-facing funnel screen or broader commercial reporting release-ready.

### 2. What was verified

- **Least privilege live:** `workspace_funnel_events` retains RLS with no policies; `service_role` has exactly `SELECT` and `INSERT`; `anon` and `authenticated` have no table grants. The scorecard RPC has no `anon` or `authenticated` execute grant.
- **Authorised runtime source path:** Using the named non-customer `WO-024 QA Tenant A` fixture, QA set the authenticated owner context and performed two marked `scheduled` `scrims` inserts under the real staff RLS policy. The fixture had no Discord installation, subscription, or outbox before the exercise, so no provider-facing action was possible.
- **Idempotency and cleanup:** Both source writes triggered the existing `record_first_scheduled_block_trigger`, while the append-only unique milestone contract recorded exactly one `first_scheduled_block` at `2026-07-31T11:22:51.412772Z`. Both temporary source scrim rows were immediately deleted under the same authorised owner context; zero marked test scrims remain. The single aggregate-only ledger milestone intentionally remains.
- **Service-only aggregate:** Under `SET LOCAL ROLE service_role`, `get_founder_funnel_scorecard(now() - interval '1 hour')` returned only `first_scheduled_block: 1`; no tenant, actor, or customer detail is returned by that path.
- **Regression contract:** `node --test scripts/funnel-instrumentation-contract.test.mjs` passed 2/2 on 2026-07-31.
- **Advisor review:** Security Advisor continues to report the expected service-only `workspace_funnel_events` RLS-without-policy informational item, broader pre-existing `SECURITY DEFINER` warnings, and disabled leaked-password protection. Nothing was hidden or changed to close this work order.

### 3. Blocking issues

- None.

### 4. Important risks

- The live ledger now contains one deliberate, non-customer QA milestone. It is immutable by design and correctly survives source-record cleanup.
- The Advisor warnings are project-wide and outside this narrow grant remediation. They require their own security review; they are not evidence that the append-only grant contract failed.

### 5. Unverified but required checks

- No further checks are required for WO-010's append-only grant boundary.
- WO-003 remains separate and blocked until its broader approved non-customer funnel journey requirements are satisfied; this one scheduled-block exercise must not be misrepresented as a full Free-to-Pro conversion or first-recorded-game journey.

### 6. Suggested next steps

- PM may mark WO-010 complete and remove it from QA dispatch.
- Keep the existing `workspace_activated` and `first_recorded_game` validation, any scorecard UI exposure, and Advisor remediation in their separately scoped work orders.

- **2026-07-28 — QA & Release Auditor:** Production review found RLS enabled and no browser-role access for `public.workspace_funnel_events`, while `service_role` retained non-append-only table privileges. The finding is hosted-verified; the remediation remains proposed.
- **2026-07-28 — Project Manager:** Reserved this work order as a high-priority, narrow security and reporting-integrity change. No migration has been created or applied.
- **2026-07-29 — Theo:** Approved WO-010 for implementation.
- **2026-07-29 — Feature Developer:** Added the forward-only grant migration and contract coverage. Full automated suite passed (169/169), TypeScript and ESLint passed, and the production build passed. No data, RLS policy, trigger, function, billing, or browser code changed.
- **2026-07-29 — Theo:** Approved the Supabase application of the grant migration.
- **2026-07-29 — Feature Developer:** Applied `20260729090523_funnel_service_role_append_only_grants` to the configured Supabase project. Live inspection confirms RLS remains enabled with no policies; `service_role` has only `SELECT` and `INSERT`; `anon` and `authenticated` have no read/write table privileges; and `get_founder_funnel_scorecard` remains executable by `service_role` only.
