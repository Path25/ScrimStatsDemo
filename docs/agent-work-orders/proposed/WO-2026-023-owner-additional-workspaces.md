# WO-2026-023 - Let workspace owners create additional independent workspaces

- **ID reservation:** [WO-2026-023 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** In Progress
- **Assigned owner:** Core Features Developer
- **Size:** L
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** `CreateWorkspace`, `Workspaces`, `WorkspaceGate`, `TenantContext`, tenant selection, self-service workspace RPC, `tenants`/`tenant_users` RLS, onboarding contracts, and funnel events.
- **Dependencies:** Theo implementation approval; reviewed forward-only RPC/migration design; isolated owner/member/cross-tenant accounts. Production migration/release approval remains separate.
- **Collision risk:** Do not overlap with WO-2026-021 Auth/onboarding recovery, WO-2026-017 tenant settings/storage, or tenant-membership/RPC migration work.

## Problem and user impact

Workspace selection already supports multiple memberships, but `create_self_service_workspace` rejects any user with an existing membership. An organisation owner cannot create a separate workspace for a second team, despite needing separate roster, practice, review, scouting, and permission boundaries.

## Why now

Multi-team organisations are within the target buyer profile. The current one-workspace limit blocks a legitimate owner workflow and encourages unsafe account workarounds.

## Scope

- Allow a verified user who is an **owner of at least one workspace** to create another independent Free workspace and become its owner.
- Provide a clear account/workspace-selection entry point without losing the selected current workspace.
- Preserve strict independence: roster, settings, billing state, integrations, data, and membership do not cross workspace boundaries.
- Use a reviewed server-side owner check; never rely on browser state or user-editable metadata.

## Explicit non-goals

- No organisation parent entity, shared cross-workspace roster, consolidated billing, white-label packaging, bulk provisioning, or automatic staff copying.
- No additional-workspace creation by non-owner admin/member/viewer roles.
- No reassigning memberships or changing existing workspace data.

## Acceptance criteria

- A verified owner can create a second Free workspace and is recorded as owner only of the new one.
- Member/admin/viewer-only accounts are denied server-side, including direct RPC calls.
- The new workspace starts empty, Free, and independent: no data, integration, paid module, billing, or membership leaks from source workspace.
- Owner can select/switch both; a user with no workspace retains the existing creation path.
- Tenant/RPC RLS/grants, funnel events, contracts, and authenticated multi-tenant browser checks prove the boundary.

## Relevant files, workflows, or data areas

- `src/pages/CreateWorkspace.tsx`, `src/pages/Workspaces.tsx`, `src/components/auth/WorkspaceGate.tsx`
- `src/contexts/TenantContext.tsx`, `src/contexts/AuthContext.tsx`
- `supabase/migrations/20260727111002_self_service_signup.sql`
- `public.tenants`, `public.tenant_users`, self-service workspace RPC, `workspace_funnel_events`
- `scripts/self-service-signup-contract.test.mjs`, tenant/RPC/RLS tests

## Risks

- **Permissions / Supabase RLS:** High. Server must verify authenticated/confirmed user plus owner membership, fixed search path, and least-privilege function grants.
- **Billing / entitlement:** New workspace must be Free and must not inherit Stripe customer/subscription or paid-module state.
- **Email / customer communication:** Not applicable; no automated invitation/email.
- **Production / data:** Identity and tenant-boundary migration/RPC change; use dedicated accounts and require production approval.

## Required validation

- RPC, RLS, role, tenant-isolation, entitlement-seeding, and funnel-event contracts; TypeScript, zero-warning ESLint, production build, bundle budget.
- Authenticated browser checks: owner creates/switches, non-owner denial, no-workspace creation, and two-tenant separation.
- Migration/function/grants/advisor review and hosted verification after approved migration application.
- Confirm new workspace Stripe/paid-module fields are Free/empty and existing workspace unchanged.

## QA scenario / reproducible test steps

1. Prepare controlled owner-with-one-workspace, member-only, admin-only, viewer-only, no-workspace, and second-tenant accounts.
2. Use the product entry point and direct RPC calls to attempt additional workspace creation for each role.
3. Verify only owner creates a new empty Free workspace, switches between both, and sees no source data; verify other roles are denied.
4. Record responses, role/membership rows, plan/module state, browser journeys, RLS/grant/advisor evidence, and funnel behaviour with no customer data.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| PM | Involved | Keep outcome to independent owner-created workspaces; reject organisation hierarchy scope. | This work order |
| Developer – Fast Lane | Not applicable | Tenant/RPC/auth work is shared and high-risk. | N/A |
| Core Features Developer | Involved | Design/implement server boundary, UI entry, and switching. | Commit/PR |
| QA | Involved | Test role/tenant/billing/module isolation. | QA audit |
| Analyst | Consulted | Confirm workspace-created funnel semantics for multiple workspaces. | Metrics Dictionary |
| Marketing | Consulted | No public claim before hosted proof. | Message Ledger |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Owner-only creation | Shared-project migration `20260802150008_owner_additional_workspaces` retains verified-auth checks and adds a direct owner-membership predicate; local contract test passes | Hosted migration / local | Pending hosted direct-RPC matrix |
| Tenant independence | New RPC still inserts a new Free tenant and only a new owner membership; existing tenant/module/funnel triggers are unchanged | Source / local | Pending hosted two-tenant inspection |
| Safe switching | `CreateWorkspace` refreshes with the returned tenant ID; owner Settings link opens workspace management | Source / local | Pending authenticated browser check |
| Function/RLS/grant safety | Hosted function inspection confirms SECURITY DEFINER, fixed empty `search_path`, anon/public denied, authenticated execute only, and unchanged seeding/funnel triggers | Hosted | Advisor reviewed; role matrix pending |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Local implementation is ready for an approved hosted migration and role/tenant verification matrix; no hosted proof exists yet.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Theo implementation approval | Theo | Written approval | Complete (2026-08-02) |
| Owner-only server design | Core Features Developer / QA | Reviewed RPC, grants, RLS | Hosted migration/function/grants complete; authenticated role matrix open |
| Hosted multi-tenant matrix | QA | Authenticated evidence | Open; frontend deployment and controlled member-only/no-workspace accounts required |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved | 2026-08-02 | Theo approved WO-023 implementation. |
| Production migration/release | Yes | Pending | - | Separate approval after review. |

## Decision and approval record

- 2026-07-30 - Theo requested owner-created additional independent workspaces for multi-team organisations.
- 2026-08-02 - Theo approved implementation. Hosted migration/release approval remains separate.

## Implementation and review evidence

- Source: Workspaces already selects multiple memberships, but self-service creation rejects any `tenant_users` membership.
- Local implementation: `20260802140000_owner_additional_workspaces.sql` permits a verified account with no memberships or at least one owner membership; member/admin/viewer-only accounts remain denied in the RPC. It retains the original Free tenant, new owner-membership, authenticated-only grant, and fixed-search-path behaviour.
- UI: owner-only Settings entry point opens `/workspaces`; that screen can open the existing workspace or start an additional independent workspace. The newly returned tenant ID is selected only after the refreshed tenant-scoped membership query confirms it.
- Local validation: `node --test scripts/self-service-signup-contract.test.mjs` (5/5), full scripts suite (205/205), ESLint zero warnings, TypeScript, Vite production build, and bundle budget all passed on 2026-08-02.
- Hosted migration: applied to the shared project as `20260802150008_owner_additional_workspaces` on 2026-08-02 after Theo approval.
- Hosted function/grant inspection: `security_definer=true`; `search_path` is fixed empty; `anon` and `public` cannot execute; `authenticated` can execute. Existing `sync_tenant_plan_entitlements_trigger` and `record_workspace_created_trigger` remain installed for new tenant/module/funnel isolation.
- Advisor: the WO-023-specific security warning is the expected authenticated-callable SECURITY DEFINER classification. Its direct verified-auth/owner predicate, fixed search path, and minimal execute grant were reviewed; no unrelated advisory findings were changed by this migration.
- Not performed: authenticated browser role matrix, direct-RPC role matrix, or staged frontend deployment. The supplied controlled accounts each have at least one owner membership, so they cannot prove the member/admin/viewer-only denial case; a controlled member-only and no-workspace account are still required.
- **Highest evidence achieved:** Hosted migration/function/grant inspection plus local validation.

## Independent QA audit - 2026-08-02

### 1. Release verdict: HOLD

The owner-only RPC design is defensible in source and the staging workspace-management UI is reachable, but no authorised isolated creation or direct role-denial matrix has exercised the deployed boundary.

### 2. What was verified

- **Local:** `node --test scripts/self-service-signup-contract.test.mjs` passed 5/5.
- **Source:** `create_self_service_workspace` requires `auth.uid()`, confirmed email, and—where memberships already exist—at least one server-side `owner` membership. It creates a fresh `Free` tenant and only a new owner membership; the function has a fixed empty search path and direct execution is revoked from `PUBLIC`/`anon`.
- **Hosted browser:** `/workspaces` is reachable on staging. The supplied viewer session also owns a different workspace, so its displayed `Create another workspace` link matches the approved any-owner rule and is not a viewer-only allow result. No creation form was opened or submitted.

### 3. Blocking issues

- **Blocking:** No approved isolated owner workspace-creation exercise exists. Until one runs, new-tenant Free/module/billing state, switching after creation, funnel behaviour, and independence from the source workspace are unproved.
- **Blocking:** No member-only, admin-only, viewer-only, or no-workspace account is available for direct RPC and browser denial checks. The supplied viewer is not viewer-only because it owns another workspace.

### 4. Important risks

- **Important:** The work-order evidence says frontend deployment is pending, but the staging `/workspaces` surface is visible. Core must record the deployed revision and deployment evidence rather than leave these conflicting statements.
- **Important:** The repository migration filename is `20260802140000_owner_additional_workspaces.sql`, while the recorded hosted migration is `20260802150008_owner_additional_workspaces`. Reconcile the deployed migration-history version and exact SQL before further promotion; do not assume filename/source parity.

### 5. Unverified but required checks

- **Unverified:** Owner creation of a second Free workspace; all new module/entitlement rows; Stripe fields absent; empty roster/settings/integrations; source workspace unchanged; workspace switch persistence; `workspace_created` funnel event; direct RPC denial for non-owner-only and unauthenticated callers; RLS/advisor evidence against the exact deployed migration.

### 6. Suggested fixes or next validation steps

1. **Theo:** explicitly approve one isolated, non-customer owner creation and its recovery/cleanup boundary, then provide controlled owner, member-only, admin-only, viewer-only, no-workspace, and second-tenant accounts.
2. **Core Features Developer:** record the staging deployment revision and reconcile `20260802140000` versus `20260802150008` migration provenance before QA exercises the RPC.
3. **QA:** execute the browser/direct-RPC matrix and issue a new verdict; do not create provider, billing, or customer data.

## Authenticated owner-creation QA - 2026-08-02

### 1. Release verdict: HOLD

The approved isolated owner creation completed, but its post-create selection and workspace-management journey regress. This is a blocking workflow defect, not a failed authorization boundary.

### 2. What was verified

- **Hosted owner creation:** QA created one clearly labelled isolated workspace, `WO-023 QA Additional 2026-08-02`, through the staging owner flow. It initially opened as the new workspace with the creator as owner, an empty Overview, zero scheduled/completed activity, and no browser warnings/errors.
- **Isolation observed at initial load:** the newly created Overview contained no source-workspace scrim, schedule, or coaching data.
- **Source diagnosis:** `CreateWorkspace` calls `refreshTenant(createdWorkspace.tenant_id)`, which selects the returned tenant only for that refresh. `Workspaces` does not wait for `TenantContext.isLoading` before redirecting when `memberships` is initially empty.

### 3. Blocking issues

- **Blocking — active-tenant regression:** after the successful creation, the next navigation loaded a previously selected viewer workspace instead of retaining the returned new owner workspace. This risks placing an owner into the wrong tenant immediately after provisioning.
- **Blocking — workspace-management race:** a subsequent direct `/workspaces` navigation redirected to `/create-workspace` while the membership query was loading. Once the context later had memberships, the form labelled itself `New independent workspace`, confirming this was not a no-membership account. The workspace picker is therefore unreliable after creation.

### 4. Important risks

- **Important:** The fresh workspace exists as an intentional QA fixture. It must remain isolated and must not receive provider credentials, billing, invitations, or operational data while the defect is repaired.
- **Important:** The defect prevents completing the required Free billing/module, switch-persistence, source-workspace-unchanged, and funnel-event checks from the intended post-create tenant. No browser-only conclusion should override the server-side tenant boundary.

### 5. Unverified but required checks

- **Unverified:** Persisted active selection of the returned tenant; workspace picker after tenant refresh; new tenant's Billing/Settings module state; source workspace unchanged after a stable switch; `workspace_created` funnel event; direct member-only/admin-only/viewer-only/no-workspace RPC denial; and migration-version provenance.

### 6. Suggested fixes or next validation steps

1. **Core Features Developer:** fix the active-tenant persistence/selection handoff after successful creation and make `Workspaces` wait for tenant loading before any no-membership redirect. Keep the change scoped away from WO-030's `DashboardLayout` work and do not alter the owner-only RPC without a separate security review.
2. **Core Features Developer:** provide a staging revision and a focused regression test covering creation → new workspace Overview → Settings → `/workspaces` picker → source-workspace switch.
3. **QA:** rerun the owner creation and role/tenant matrix using the existing QA fixture; do not create additional workspaces until the regression is corrected.

## Core regression remediation - 2026-08-02

- `TenantContext` now persists the server-confirmed `preferredTenantId` after the refreshed membership query contains it. A later route remount therefore retains the newly created workspace instead of restoring an older browser selection.
- `Workspaces` now waits for both Auth and TenantContext loading before it evaluates the no-membership redirect, preventing the observed `/workspaces` to `/create-workspace` race.
- Local migration provenance now matches the hosted migration record: `20260802150008_owner_additional_workspaces.sql`. This is a source-file rename only; no new database SQL was applied.
- Local validation passed: focused provisioning contract (5/5), ESLint zero warnings, TypeScript, production Vite build, and bundle budget.
- **Pending:** Theo staging-deployment approval, then QA rerun using the existing isolated workspace fixture. No additional workspace, provider, billing, or customer-data action is authorised by this remediation.
