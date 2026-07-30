# WO-2026-020 - Make Solo Queue tracker available on Free consistently

- **ID reservation:** [WO-2026-020 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Backlog
- **Assigned owner:** Core Features Developer
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
| Free route access | Authenticated browser matrix | Browser | Outstanding |
| Module-state alignment | Migration and hosted state query | Hosted | Outstanding |
| Tenant/role safety | Direct API/function and browser checks | Hosted | Outstanding |
| Truthful plan copy | Source and browser review | Browser | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Source-confirmed Pro-only route/module logic; no approved remediation exists.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Theo implementation approval | Theo | Written approval | Open |
| Entitlement-surface audit | Core Features Developer | Gate/function/migration inventory | Open |
| Hosted plan matrix | QA | Authenticated evidence | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Pending | - | Plan entitlement change. |
| Production migration/release | Yes | Pending | - | Separate approval after review. |

## Decision and approval record

- 2026-07-30 - Theo reported that Free should use Solo Queue tracker. Source review confirmed a Pro-only route gate and Pro/Elite-only module seed.

## Implementation and review evidence

- **Highest evidence achieved:** Source reviewed.
