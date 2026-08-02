# WO-2026-020 - Make Solo Queue tracker available on Free consistently

- **ID reservation:** [WO-2026-020 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Ready for QA
- **Assigned owner:** QA and Release Auditor
- **Size:** M
- **Risk:** Medium
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** `src/App.tsx`, `tenant_feature_access`, active entitlement trigger/migration paths, BillingPanel plan copy, Solo Queue contracts, and any server SoloQ plan check found during audit.
- **Dependencies:** Theo's direction that Free includes Solo Queue. Coordinate with WO-2026-009 before shared entitlement changes; production migration/release needs separate approval.
- **Collision risk:** Plan/entitlement changes overlap Collector, billing, Settings, and Integrations. Do not run concurrently with WO-2026-009 or another entitlement migration.

## Problem and user impact

Free workspaces are blocked from Solo Queue tracker although Theo has confirmed it belongs in Free. `App.tsx` uses a Pro PlanGate, and both active entitlement migrations seed `soloq` only for Pro/Elite. This creates a false upgrade barrier.

## Why now

It blocks a core Free workflow during soft launch and weakens the intended Free-to-Pro journey.

## Scope

- Align the route, module state, active entitlement trigger paths, plan copy, and tests so Free, Pro, and Elite receive the approved Solo Queue tracker access.
- Preserve tenant, role, and provider-key safeguards. Free availability must not imply Riot credentials or automatic sync are guaranteed.
- Reconcile existing module rows only through a reviewed forward-only migration after Theo approves production application.

## Explicit non-goals

- Do not change Riot credentials, enable a provider, increase API usage, alter paid prices, or weaken RLS, tenant isolation, roster eligibility, or refresh permissions.

## Acceptance criteria

- A Free owner can open Solo Queue tracker without a Pro gate and receives honest configuration/empty/unavailable states.
- Free, Pro, and Elite module state agree that `soloq` is enabled, including existing records after approved migration.
- Reads/refreshes remain tenant-scoped and preserve manager/provider safeguards.
- Billing copy no longer claims Solo Queue is Pro-only; contracts and authenticated plan/role/tenant tests pass.

## Relevant files, workflows, or data areas

- `src/App.tsx`, `src/pages/SoloQTracker.tsx`, `src/hooks/useSoloQTracker.ts`
- `src/components/billing/BillingPanel.tsx`, `src/components/billing/PlanGate.tsx`
- `supabase/migrations/20260726193000_workspace_billing_and_plan_entitlements.sql`
- `supabase/migrations/20260729081717_collector_lifecycle_entitlement_policy.sql`
- `tenant_feature_access`, `soloq-*` Functions, `scripts/billing-invitations-contract.test.mjs`

## Risks

- **Permissions / Supabase RLS:** Preserve tenant-scoped reads and manager-only refresh controls.
- **Billing / entitlement:** Browser, database, BillingPanel, and server state can diverge.
- **Email / customer communication:** Not applicable.
- **Production / data:** Existing module rows require a reviewed production migration; no mutation without Theo approval.

## Required validation

- Targeted plan/entitlement, Solo Queue, and migration contracts; TypeScript, zero-warning ESLint, production build, bundle budget.
- Authenticated Free/Pro/Elite, manager/member, and cross-tenant browser/API checks using isolated workspaces.
- Migration/RLS/function/advisor review and hosted module-state inspection after approved application.

## QA scenario / reproducible test steps

1. Prepare isolated Free, Pro, Elite, and second-tenant workspaces with manager and non-manager accounts; leave the Free provider unconfigured.
2. Open `/soloq`, read tracker data, attempt manager/manual refresh, and attempt cross-tenant access.
3. Verify every plan can open the tracker, only permitted roles refresh, and missing provider/roster data is explained rather than gated as Pro.
4. Record route, module rows, request responses, browser states, and migration/advisor evidence without customer data.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| PM | Involved | Preserve Free Solo Queue decision and prevent provider-expansion scope. | This work order |
| Developer – Fast Lane | Not applicable | Shared plan/entitlement and migration work is not isolated. | N/A |
| Core Features Developer | Involved | Reconcile gates, trigger, module rows, copy, and tests. | Commit/PR |
| QA | Involved | Test plan/role/tenant matrix and migration evidence. | QA audit |
| Analyst | Consulted | Confirm provider-unavailable is not counted as product usage. | Metrics Dictionary |
| Marketing | Consulted | Keep plan claims release-evidence-backed. | Message Ledger |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Free route access | `/soloq` now renders `SoloQTracker` directly; route contract passes and an authenticated staging owner reaches the tracker without an upgrade gate. | Source / local test / authenticated staging browser | Free-plan-specific QA remains outstanding |
| Module-state alignment | Forward-only `20260801111044_enable_free_soloq_entitlement.sql` was applied to the shared hosted project. Aggregate hosted query returned Free: 100, Pro: 7, Elite: 6 Solo Queue rows, all `live` and enabled. | Hosted query | Pass |
| Tenant/role safety | Existing tenant-scoped client queries, Riot-key-only sync, and `managerMembership(user.id, player.tenant_id)` manual-refresh check were audited and contracted. No RLS or function authorization was changed. | Source / local test | Ready for authenticated QA |
| Truthful plan copy | Free lists Solo Queue; Pro now lists Team analytics without claiming Solo Queue is paid-only. | Source / local test | Ready for browser QA |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The approved migration was applied and `23b040c` was pushed to the staging branch. An authenticated staging owner reaches Solo Queue without a plan gate. Plan-specific, role-specific, and tenant-isolation QA remains required before any release claim.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Approved hosted migration application | Core Features Developer | Theo approval and migration-tool receipt for `20260801111044_enable_free_soloq_entitlement.sql` against shared project `tvcgjehreaayfazlhvps` | Complete |
| Hosted plan matrix | QA and Release Auditor | Authenticated Free/Pro/Elite manager/member and second-tenant evidence after deployed migration | Open |
| Database lint and advisor review | QA and Release Auditor | Hosted advisor export plus migration application evidence; local lint was unavailable because no local database is running | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved | 2026-08-01 | Theo approved completion of WO-2026-020. |
| Hosted migration and staging deployment | Yes | Approved and applied | 2026-08-02 | Migration tool returned success; `23b040c` pushed to `origin/codex/Staging`. |

## Decision and approval record

- 2026-07-30 - Theo reported that Free should use Solo Queue tracker. Source review confirmed a Pro-only route gate and Pro/Elite-only module seed.
- 2026-08-01 - Theo approved implementation. Core removed the browser gate, corrected plan copy, and created a forward-only entitlement migration. No hosted mutation was requested or performed.
- 2026-08-02 - Theo approved hosted migration application and staging deployment. The migration was applied to `tvcgjehreaayfazlhvps`; `23b040c` was pushed to `codex/Staging` and authenticated staging browser verification reached `/soloq` without a plan gate.

## Implementation and review evidence

- **Highest evidence achieved:** Local source validation.
- **Implementation:**
  - `/soloq` now renders the tenant-scoped Solo Queue tracker for all plans; Analytics, Collector, Scouting, and Draft retain their existing paid gates.
  - `20260801111044_enable_free_soloq_entitlement.sql` preserves the current Collector lifecycle logic, changes only Solo Queue to live/enabled for every tier, and reconciles existing (including missing) Solo Queue rows with a scoped upsert.
  - The migration retains `SECURITY DEFINER` fixed search path and service-role-only execution for the internal trigger; it introduces no table, RLS, provider, billing-price, or Edge Function change.
  - Billing copy lists Solo Queue with Free and removes the Pro-only implication.
- **Validation:**
  - `node --test scripts/billing-invitations-contract.test.mjs scripts/soloq-tracker-contract.test.mjs scripts/riot-integration-contract.test.mjs` — 20/20 passing.
  - ESLint (`--max-warnings 0`) — passing.
  - TypeScript (`tsc --noEmit`) — passing.
  - Production Vite build and `scripts/bundle-budget.mjs` — passing; only the pre-existing Browserslist data-age notice was emitted.
  - `supabase db lint --local --fail-on warning` — not run to completion: no local Postgres was listening at `127.0.0.1:54322`. No local reset/start or hosted fallback was performed.
- **Hosted validation (2026-08-02):**
  - Migration tool receipt: success for `enable_free_soloq_entitlement` on `tvcgjehreaayfazlhvps`.
  - Aggregate query: all 113 existing Solo Queue module rows are `live` and enabled (Free 100, Pro 7, Elite 6); no workspace or customer identifiers were retrieved.
  - Function ACL query: `anon` and `authenticated` cannot execute `sync_tenant_plan_entitlements`; `service_role` can.
  - Security and Performance Advisors were reviewed after application. They continue to report the documented project-wide legacy notices; this migration added no table, policy, index, or client-executable function and no new Solo Queue-specific advisor finding was observed.
  - Authenticated staging browser: an owner workspace opened `https://staging.scrimstats.gg/soloq`, reached the Solo Queue tracker, and emitted no browser console warning/error. This evidence does not establish Free-plan, non-manager, or cross-tenant behavior.
- **QA handoff:** After Theo approves hosted application and deployment, QA and Release Auditor should use isolated Free, Pro, Elite, manager/member, and second-tenant accounts to verify the route, `tenant_feature_access` rows, Riot-unconfigured state, manager-only refresh, and cross-tenant denial. Capture browser, request, migration-history, function-log, and advisor evidence without customer data.
