# WO-2026-024 - Give players reliable read-only intelligence access

- **ID reservation:** [WO-2026-024 registry row](../WORK_ORDER_INDEX.md)
- **Status:** In Progress
- **Assigned owner:** Core Features Developer
- **Size:** L
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** `src/pages/Scouting.tsx`, `src/pages/ScoutingTeamReport.tsx`, `src/pages/Draft.tsx`, `src/hooks/useScoutingWorkspace.ts`, `src/hooks/useDraftWorkspace.ts`, `src/hooks/useTeamAnalytics.ts`, `src/contexts/RoleContext.tsx`, `src/lib/workspace-capabilities.ts`, role-sensitive tests, and a new Supabase migration for relevant intelligence RLS/RPC policies.
- **Dependencies:** A safe two-tenant role-test fixture and normal Core developer sequencing.
- **Collision risk:** Do not overlap with Draft, Scouting, `RoleContext`, tenant membership helpers, or intelligence RLS/RPC work. Reconcile with WO-2026-015 before touching shared analytics components.

## Problem and user impact

A signed-in player (`member`) cannot reliably use the same intelligence workflows as an owner or admin. `Scouting.tsx` deliberately returns a staff-only state for non-editors, `ScoutingTeamReport.tsx` does not load for them, and Draft policies/RPC data are shaped around published-only access. Team Analytics is intended for an entitled tenant member, but the reported intermittent failure has not yet been reproduced with a player session.

Theo's product direction is that players may view the same Team Analytics, Draft, and Scouting intelligence that coaches can view in their own workspace, but they must have no editing capability. The present split makes the player experience unreliable and harms the shared-team workflow.

## Why now

This is a core daily-use workflow and a weak first impression for a Pro team. It is an authorization/data-contract change, not cosmetic polish: changing only buttons or client routes would leave either the defect or a tenant-safety gap in place.

## Scope

- Establish one explicit role matrix for an entitled Pro/Elite tenant: owner/admin retain current view/edit rights; `member` and `viewer` receive the same tenant-scoped intelligence read set as coaches across Team Analytics, Draft, and Scouting, including live Scouting reports and unpublished Draft working material; neither role may mutate.
- Replace player/viewer-facing Scouting staff-only dead ends with read-only workspace/report views. Remove all create, edit, publish, archive, restore, and mutation controls for these roles.
- Make Draft's read-only member/viewer experience consistent across list, plan, scenario, evidence, and detail views, including working material that coaches can view; align UI with the server contract rather than hidden controls.
- Verify and, if required, update the Team Analytics read contract so entitled `member` and `viewer` users receive only their own tenant's data consistently.
- Update relevant Supabase policies/RPCs with narrow tenant membership predicates. Member/viewer mutations must fail below the browser layer.
- Add role-contract tests and browser coverage for the matrix below.

## Explicit non-goals

- Do not permit member/viewer create/edit/publish/archive/restore/delete actions in Scouting or Draft.
- Do not expose cross-tenant data, provider secrets, billing data, or administration/integration screens.
- Do not change plan prices, entitlement definitions, checkout, or Free-plan access.
- Do not redesign role management or use client-side hiding as the security control.

## Acceptance criteria

- In an entitled Pro/Elite workspace, `member` and `viewer` can open Team Analytics, Scouting, an opponent report, and Draft reliably in an authenticated browser session; loading, empty, unavailable, and denied states are distinguishable and truthful.
- Member/viewer roles can view the same intelligence records their workspace coaches can view, including live Scouting and unpublished Draft material, in read-only form with no staff-only dead end solely because of role.
- Member/viewer roles have no mutation controls and representative direct table/RPC mutation attempts fail server-side.
- Owner/admin authoring still works; tenant-A member/viewer users cannot read Analytics, Scouting, Draft, or related RPC data from tenant B.
- Existing Pro/Elite server entitlement enforcement remains intact for all three routes and data calls.
- Required evidence level: locally tested, authenticated browser verified, Supabase RLS/function reviewed, then hosted verified after Theo approves release.

## Relevant files, workflows, or data areas

- Routes/pages: `src/App.tsx`, `src/pages/Analytics.tsx`, `src/pages/Scouting.tsx`, `src/pages/ScoutingTeamReport.tsx`, `src/pages/Draft.tsx`
- Role/data: `src/contexts/RoleContext.tsx`, `src/lib/workspace-capabilities.ts`, `src/hooks/useTeamAnalytics.ts`, `src/hooks/useScoutingWorkspace.ts`, `src/hooks/useDraftWorkspace.ts`
- Supabase: `public.get_team_analytics_dataset`, `public.get_draft_workspace`, current Scouting policies, `supabase/migrations/20260730105701_analytics_server_entitlement_enforcement.sql`, `supabase/migrations/20260726153000_draft_workspace_completion.sql`, `supabase/migrations/20260726163000_draft_evidence_split_metadata.sql`
- Rules: `AGENTS.md`, `docs/launch/RELEASE_BOUNDARY.md`, `docs/security/ADVISOR_REVIEW.md`

## Risks

- **Permissions / Supabase RLS:** High. Existing non-staff Scouting and non-published Draft restrictions are intentional. Preserve tenant isolation and server-side mutation denial; no `SECURITY DEFINER` shortcut.
- **Billing / entitlement:** Medium. These pages are Pro-gated and Analytics has a server entitlement assertion. Direct RPC calls must not bypass plan access.
- **Email / customer communication:** Not applicable.
- **Production / data:** High. Likely migration/policy work; no production migration, policy change, or RLS weakening without Theo's release approval.

## Required validation

- Add focused role/RPC contract tests for owner/admin/member/viewer and a second tenant, covering reads and direct mutations.
- Run affected tests, ESLint with zero warnings, TypeScript, and production build.
- Complete authenticated browser checks with separate owner/admin/member/viewer accounts for Analytics, Scouting, Scouting report, and Draft; record network/RPC outcomes for unavailable states.
- Inspect final RLS policies, grants, function security/search paths, and Supabase Advisor. Confirm anonymous/unauthenticated access remains denied.
- After Theo's explicit release approval, deploy through the approved path and repeat member and cross-tenant hosted checks.

## QA scenario / reproducible test steps

1. Prepare entitled Pro/Elite tenants A and B, each with owner, admin, member, and viewer; tenant A needs representative Analytics plus live Scouting and Draft records in every supported status.
2. Sign in as tenant-A member, then tenant-A viewer, and open `/analytics`, `/scouting`, `/scouting/:opponentId`, and `/draft`; refresh each and switch every available view.
3. Confirm both roles can read the same tenant-A intelligence as the coach, with no mutation control; confirm loading/empty/error/denial states are accurate rather than redirects or intermittent failure.
4. Attempt representative direct table/RPC mutations as each role; attempt direct reads against tenant-B IDs. Confirm all mutations and cross-tenant reads fail or yield no tenant-B data.
5. Repeat authoring as tenant-A owner/admin. Record browser evidence, request outcomes, test output, final policies/grants, and approved hosted evidence.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Confirm approved member/viewer read-only scope, sequencing, and developer handoff. | Theo approval 2026-07-30; source review 2026-07-30. |
| Developer – Fast Lane | Not applicable | L/high-risk shared role/RLS/RPC work. | N/A |
| Core Features Developer | Involved | Implement narrow role matrix, UI/read contract, migration, tests, and developer evidence. | PR/commit required. |
| QA and Release Auditor | Involved | Independently run role, mutation, tenant-isolation, and hosted-release matrix. | Release audit required. |
| Technical Reporting Analyst | Involved | Confirm Analytics reads remain tenant-scoped and neither widened across tenants nor silently absent for members. | Contract/query review. |
| Lead Marketer and Growth | Not applicable | No external claim or campaign work. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Member/viewer reads three intelligence workflows reliably | Additive tenant-member Scouting/Draft `SELECT` policies and read-only Scouting views implemented; local contract tests pass | Locally tested | Authenticated browser and hosted verification outstanding |
| Member/viewer mutations fail below browser layer | Existing owner/admin-only mutation policies retained; migration adds no mutation policy; local contract tests pass | Locally tested | Direct authenticated mutation attempts outstanding |
| Owner/admin authoring and tenant isolation remain intact | All new reads use `public.user_belongs_to_tenant(tenant_id)`; mutation controls remain staff-only in UI | Locally tested | Four-role/two-tenant RLS matrix outstanding |
| Pro/Elite server entitlement remains enforced | Analytics retains `assert_team_analytics_access` and `SECURITY INVOKER` contract; local contract test passes | Locally tested | Authenticated and hosted verification outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Local implementation and source-contract checks are complete, but the migration is not applied and no authenticated or hosted role evidence exists yet.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Prepare safe four-role/two-tenant fixtures | Core Features Developer | Reproducible owner/admin/member/viewer test setup | Open |
| Apply/test role, RLS, and RPC contract locally | Core Features Developer | Local migration application plus direct read/mutation matrix | Open |
| Independent authorization/release audit | QA and Release Auditor | Role matrix, RLS/grant/Advisor, browser and hosted evidence | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved | 2026-07-30 | Member and viewer receive the same tenant-scoped intelligence read access as coaches, with server-enforced read-only permissions. |
| Release | Yes | Pending | 2026-07-30 | Required before migration/deployment/hosted release. |

## Decision and approval record

- 2026-07-30 - Theo approved implementation. `member` and `viewer` receive the same tenant-scoped Team Analytics, Draft, and Scouting read access as coaches, including live Scouting and Draft working material; both remain server-enforced read-only.

## Implementation and review evidence

- Source review 2026-07-30: `Scouting.tsx`/`ScoutingTeamReport.tsx` gate non-editors into staff-only states; `get_draft_workspace` and Draft RLS shape member access around published records; Team Analytics checks entitled tenant membership.
- Local implementation 2026-07-30: added `20260730205840_player_read_only_intelligence_access.sql`, which grants only authenticated tenant-member reads for Scouting/Draft records and preserves existing owner/admin mutation policies. Scouting list/report now load read-only views for members/viewers; authoring, archive, restore, and edit controls remain staff-only.
- Local validation 2026-07-30: `node --test scripts/player-read-only-intelligence-contract.test.mjs scripts/draft-workspace-contract.test.mjs scripts/team-analytics-contract.test.mjs` (22 passing); ESLint zero warnings; `tsc --noEmit`; Vite production build; bundle budget passed.
- Environment note 2026-07-30: a bundled pnpm invocation attempted an npm-to-pnpm conversion and was blocked from registry access. The moved package directories were restored before validation; no dependency manifest or lockfile was changed.
- **Highest evidence achieved:** Locally tested
