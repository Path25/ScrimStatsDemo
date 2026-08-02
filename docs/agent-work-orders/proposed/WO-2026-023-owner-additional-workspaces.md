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
