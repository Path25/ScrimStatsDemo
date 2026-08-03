# WO-2026-037 - Restore membership-first workspace entry and owner creation access

- **ID reservation:** [WO-2026-037 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Ready for QA
- **Assigned owner:** QA and Release Auditor
- **Size:** M
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** `WorkspaceGate`, `TenantContext`, auth/route loading states, `Workspaces`, `CreateWorkspace`, `DashboardLayout` workspace menu, owner-only workspace creation entry points, and existing self-service workspace contracts.
- **Dependencies:** WO-2026-023 owner-only creation boundary and its evidence; controlled accounts for no-membership, owner with multiple workspaces, and non-owner-only roles; Theo approval before implementation. Any migration/RPC/production deployment requires separate approval.
- **Collision risk:** Shared auth, tenant selection, workspace creation, and `DashboardLayout` menu behaviour. Do not overlap with tenant/RPC/auth changes or a workspace-menu visual refactor; retain the opaque menu result under WO-2026-030.

## Problem and user impact

On staging, a signed-in user with existing workspace memberships is repeatedly prompted to create a workspace at login. This obscures their current workspace choices and makes routine sign-in appear like an onboarding failure. Users should enter an existing selected workspace or choose among their memberships; workspace creation should be an explicit owner action, not a repeated login prompt.

## Why now

Reliable workspace entry is a core team-operations expectation. The prior WO-2026-023 evidence identified loading/selection races around workspace management; this order addresses the customer-visible membership-first entry experience without changing the owner-only server boundary.

## Scope

- After authentication and tenant membership loading settle, route a user with one or more memberships to their persisted valid workspace or the workspace selector; never auto-open or redirect them to creation solely because loading is incomplete.
- Keep the no-membership account path honest: show workspace creation only after confirmed absence of memberships.
- In the dashboard workspace selector, show an explicit `Create workspace` action for eligible owners alongside the existing selectable workspaces; preserve selection and route to the established workspace-management/create flow.
- Retain an owner-only creation entry point from within an already selected workspace. Non-owner roles may switch/view their permitted workspaces but cannot see a misleading creation control or bypass the existing server-side owner check.

## Explicit non-goals

- No change to the owner-only `create_self_service_workspace` authorization, tenant RLS, schema, billing, Stripe state, plan entitlements, or workspace independence rules.
- No organisation hierarchy, shared workspace data, consolidated billing, automatic staff copying, or altered invitation flow.
- No dashboard redesign beyond the explicit creation entry in the workspace selector and the routing/loading states necessary to fix the reported behaviour.

## Acceptance criteria

- A user with one existing membership reaches that workspace after a fresh staging sign-in without a create-workspace prompt.
- A multi-workspace user sees selectable memberships and, when owner-eligible, an explicit `Create workspace` action in the dashboard selector; selection remains stable before and after visiting the action.
- A confirmed no-membership user alone receives the create-workspace journey.
- Member/admin/viewer-only accounts cannot see the owner creation entry and remain denied by direct server-side invocation.
- Existing owner-created workspaces remain independent and Free on creation; no billing or tenant data crosses boundaries.
- Required evidence level: targeted local contracts, authenticated browser checks, and hosted role/tenant verification before release consideration.

## Relevant files, workflows, or data areas

- `src/components/auth/WorkspaceGate.tsx`, `src/contexts/TenantContext.tsx`, `src/pages/Workspaces.tsx`, `src/pages/CreateWorkspace.tsx`, `src/components/layout/DashboardLayout.tsx`
- `create_self_service_workspace`, `tenant_users`, `tenants`, and `scripts/self-service-signup-contract.test.mjs`
- WO-2026-021, WO-2026-023, WO-2026-030, and the workspace route/authenticated staging flow

## Risks

- **Permissions / Supabase RLS:** High. Browser routing must not replace or weaken owner-only server authorization; every membership decision remains tenant-scoped.
- **Billing / entitlement:** New workspaces must retain the existing Free and isolated state. No plan or Stripe behaviour is in scope.
- **Email / customer communication:** Not applicable; no email, invitation, or outreach flow change.
- **Production / data:** High. Incorrect loading/tenant selection can put a user in the wrong workspace; no production data mutation or migration is authorised.

## Required validation

- Focused route/loading/tenant-selection and self-service-workspace contract tests; zero-warning ESLint, TypeScript, production build, and bundle budget.
- Authenticated browser matrix for single-membership, multi-workspace owner, no-membership, member-only/admin-only/viewer-only, and second-tenant accounts; include desktop and mobile workspace-selector checks.
- Direct server-side denial checks for non-owner-only roles; verify no new workspace is created during login or switching.
- Hosted staging verification records deployed revision, selected tenant before/after, browser console state, and redacted role/tenant evidence. Migration/RLS/Advisor review only if a database/function change becomes necessary and separately approved.

## QA scenario / reproducible test steps

1. Prepare controlled staging accounts: no-membership, one-workspace owner, multi-workspace owner, member-only, admin-only, viewer-only, and a second-tenant control.
2. For each account, sign in from a fresh session and wait for Auth and tenant membership loading to settle.
3. Confirm member accounts enter/select only their existing workspace(s), while only the no-membership account reaches creation. For the multi-workspace owner, switch A to B to A, open the explicit creation action, return without creating, and confirm the original selection persists.
4. Attempt browser and direct-RPC workspace creation as member/admin/viewer-only roles; confirm denial and no tenant/billing/module side effect. Record deployed revision, screenshots, console output, redacted membership/tenant evidence, and verdict.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Maintain membership-first outcome and approval boundary. | This work order |
| Developer - Fast Lane | Not applicable | Shared auth/tenant/route scope is not S/Low isolated work. | N/A |
| Core Features Developer | Involved | Implement contained routing/menu entry fix without changing owner-only authorization. | Commit/PR and validation handoff |
| QA and Release Auditor | Involved | Execute authenticated role/tenant/browser matrix. | Evidence pack and verdict |
| Technical Reporting Analyst | Consulted | Confirm no unintended workspace-created funnel event is emitted. | Metrics Dictionary / event review |
| Lead Marketer and Growth | Not applicable | No customer claim or outreach is in scope. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Membership-first post-login entry | Fail-closed current-user resolver, focused state tests, and exact deployed release marker | Local / hosted deployment | Pass locally and deployed; authenticated browser open |
| Explicit owner creation entry and selection preservation | Selector/create-route source contract and exact deployed release marker | Local / hosted deployment | Pass locally and deployed; hosted desktop/mobile open |
| No-membership / non-owner boundaries | Resolver tests plus read-only deployed RPC inspection | Local / hosted read-only | Source/server boundary passes; controlled browser/direct matrix open |
| No billing or tenant-isolation regression | RPC unchanged; no hosted mutation performed | Source / hosted read-only | No scoped change; creation exercise open |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The contained source fix is deployed as the exact reviewed candidate, but no authenticated staging role/tenant/browser matrix exists. Ready for QA is not release approval.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Reproduce and identify route/loading state | Core / QA | Source-state reproduction plus controlled staging account evidence | Source failure mode confirmed; hosted reproduction open |
| Approve implementation | Theo | Written approval after reviewed remediation scope | Complete (2026-08-03) |
| Implement and validate | Core Features Developer | Commit and local validation | Complete locally |
| Hosted role/tenant regression matrix | QA | Evidence pack and verdict | Open |
| Release approval | Theo | Separate approval after hosted QA | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved | 2026-08-03 | Theo directed Core to proceed with WO-037 after the prioritisation and diagnosis plan. No migration, deployment, or release was implied. |
| Staging frontend deployment | Yes | Approved and completed | 2026-08-03 | Theo explicitly approved pushing to `codex/Staging` and the Git-triggered staging frontend deployment. |
| Release | Yes | Pending | - | Separate after authenticated hosted QA. |

## Decision and approval record

- 2026-08-03 - Theo reported recurring staging login prompts to create a workspace despite existing memberships, and requested an explicit in-dashboard owner creation path instead.
- 2026-08-03 - PM separated this customer-visible workspace-entry defect from WO-2026-023's historical owner-creation evidence. The existing owner-only server boundary must be preserved unless a separately reviewed remediation is required.
- 2026-08-03 - Theo approved proceeding with WO-037. Core implemented the contained client-state and workspace-entry remediation without altering the owner-only RPC or hosted state.

## Implementation and review evidence

- WO-2026-023 previously recorded a `Workspaces` loading race that redirected a member to creation before memberships settled, plus later staging evidence that the picker can load correctly. The new reported login prompt may share that cause, but this is a hypothesis—not a confirmed diagnosis.
- Existing staging and authenticated evidence must be reconciled rather than overwritten; no code, migration, configuration, production data, or deployment changed under this PM work order.
- **Highest evidence achieved:** Exact reviewed revision deployed to staging; authenticated role/workflow browser verification remains outstanding.

## Core implementation and QA handoff - 2026-08-03

### Confirmed failure boundary

- `TenantContext` previously derived `hasNoTenant` from an empty membership array after loading, even when the membership query had failed. `WorkspaceGate`, `Workspaces`, and `CreateWorkspace` could therefore collapse an unavailable membership lookup into the no-membership creation journey.
- Auth events could also create duplicate same-user membership loads because the tenant loader depended on the full Auth user object. Read-only API logs showed two near-simultaneous successful membership reads for the same current session; all 14 observed `tenant_users` requests in the available 24-hour log window returned 200, so no hosted query failure is claimed as reproduced.
- The four supplied controlled accounts currently have three or four memberships and each owns at least one workspace. They can exercise multi-workspace/owner flows, but they cannot prove a member-only, admin-only, viewer-only, or no-membership browser denial.

### Implemented scope

- Added a pure fail-closed workspace-access resolver. Memberships and the selected tenant are exposed only when they were resolved for the current Auth user; unresolved or stale prior-user results remain loading rather than visible.
- Added request sequencing so a slower obsolete membership/logo response cannot overwrite the latest Auth user's workspace state, and made the loader depend on the stable user ID rather than token-refresh object identity.
- A membership-query error now remains an explicit retryable unavailable state in the workspace gate, workspace picker, and creation route. Only a confirmed successful empty result opens initial workspace creation.
- Owner-eligible accounts now receive an explicit `Create workspace` item inside the existing opaque workspace selector. Eligibility remains the existing account-level `memberships.some(owner)` rule, matching the server's any-owned-workspace contract; accounts with only member/admin/viewer roles do not receive the item.
- Opening the additional-workspace route does not change the active workspace, and the page provides a direct return to the current workspace.
- No SQL, migration, RPC, RLS, grant, billing, plan, invitation, funnel, or production-data change was made. `src/integrations/supabase/types.ts` was not edited by this work order.

### Validation evidence

- Implementation and local QA handoff commit: `717beffda22ea088fc0dbeafc340a8e449aa10ed`.
- Focused workspace/access/provisioning contracts: 16/16 passed.
- Full repository tests: 233/233 passed.
- ESLint: zero warnings.
- TypeScript: passed.
- Production Vite build: passed, 3,359 modules transformed.
- Bundle budget: passed.
- Read-only hosted inspection confirms `create_self_service_workspace(text,text)` remains authenticated-only, fixed-empty-search-path `SECURITY DEFINER`, permits membership-free onboarding or an account that owns at least one workspace, and rejects non-owner-only existing members.
- Supabase API logs and account/RPC inspection were read-only. No hosted schema, Auth, membership, tenant, billing, or customer data was changed.

### Reproducible QA handoff

1. Use `https://staging.scrimstats.gg/` at a revision containing application candidate `fcf54cb4ca15c3fe7b2a9382847344e69feb93cb`. Documentation-only evidence commits may follow it; reconcile any later application-code diff before testing.
2. Fresh-sign-in as a one-workspace owner, multi-workspace owner, member-only, admin-only, viewer-only, no-membership account, and second-tenant control. Confirm loading never exposes the create route and only the confirmed no-membership account enters initial creation.
3. For an owner-eligible account, open the sidebar workspace menu on desktop and 390x844 mobile, verify the WO-030 opaque surface remains intact, select A to B to A, open `Create workspace`, return without submitting, and confirm the original selection persists.
4. Confirm member/admin/viewer-only accounts have no creation item and remain denied by direct RPC invocation. Do not create another tenant merely to test navigation; any approved creation exercise must separately verify Free/default modules, no Stripe inheritance, funnel semantics, and tenant independence.
5. Record console output, deployed revision, redacted role/membership evidence, selected tenant before/after, and any retry/error-state result. Release remains HOLD until QA and Theo separately approve it.

### Staging deployment evidence - 2026-08-03

- Theo explicitly approved the push to `codex/Staging` and staging frontend deployment.
- `origin/codex/Staging` advanced from `27b1b10` to QA handoff commit `fcf54cb4ca15c3fe7b2a9382847344e69feb93cb`; implementation commit `717beffda22ea088fc0dbeafc340a8e449aa10ed` is in its ancestry.
- The established Git-triggered staging deployment completed. A protected Vercel fetch of `https://staging.scrimstats.gg/` returned HTTP 200 with `Last-Modified: Mon, 03 Aug 2026 16:43:42 GMT`, `x-vercel-cache: MISS`, and request reference `iad1:lhr1:iad1:iad1::2489p-1785775422583-26fba84bf1df`.
- The served entry bundle `index-kxix4OQm.js` embeds release `fcf54cb4ca15c3fe7b2a9382847344e69feb93cb`, proving the exact approved revision is served. This is deployment evidence only; it does not prove authenticated membership, role denial, tenant selection, desktop/mobile rendering, or browser console health.
- The subsequent documentation-only evidence deployment reported `READY` and retained the `staging.scrimstats.gg` alias. Its Vercel build completed and the bundle budget passed; the logs also contain a non-blocking TypeScript resolution warning for `@vercel/node` in `api/client-error.ts`, which is outside WO-037 and remains a separate build-hygiene concern.
- No Supabase migration, Edge Function, Auth, membership, tenant, billing, configuration, secret, or customer-data mutation was performed.
