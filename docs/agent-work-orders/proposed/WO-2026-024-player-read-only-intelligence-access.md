# WO-2026-024 - Give players reliable read-only intelligence access

- **ID reservation:** [WO-2026-024 registry row](../WORK_ORDER_INDEX.md)
- **Status:** Backlog
- **Assigned owner:** Core Features Developer
- **Size:** L
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** `src/pages/Scouting.tsx`, `src/pages/ScoutingTeamReport.tsx`, `src/pages/Draft.tsx`, `src/hooks/useScoutingWorkspace.ts`, `src/hooks/useDraftWorkspace.ts`, `src/hooks/useTeamAnalytics.ts`, `src/contexts/RoleContext.tsx`, `src/lib/workspace-capabilities.ts`, role-sensitive tests, and a new Supabase migration for relevant intelligence RLS/RPC policies.
- **Dependencies:** Theo's implementation approval; a defined member-versus-viewer access matrix; a safe two-tenant role-test fixture.
- **Collision risk:** Do not overlap with Draft, Scouting, `RoleContext`, tenant membership helpers, or intelligence RLS/RPC work. Reconcile with WO-2026-015 before touching shared analytics components.

## Problem and user impact

A signed-in player (`member`) cannot reliably use the same intelligence workflows as an owner or admin. `Scouting.tsx` deliberately returns a staff-only state for non-editors, `ScoutingTeamReport.tsx` does not load for them, and Draft policies/RPC data are shaped around published-only access. Team Analytics is intended for an entitled tenant member, but the reported intermittent failure has not yet been reproduced with a player session.

Theo's product direction is that players may view Team Analytics, Draft, and Scouting in their own workspace, but they must have no editing capability. The present split makes the player experience unreliable and harms the shared-team workflow.

## Why now

This is a core daily-use workflow and a weak first impression for a Pro team. It is an authorization/data-contract change, not cosmetic polish: changing only buttons or client routes would leave either the defect or a tenant-safety gap in place.

## Scope

- Establish one explicit role matrix for an entitled Pro/Elite tenant: owner/admin retain current view/edit rights; `member` (player) gains reliable read-only Team Analytics, Draft, and Scouting access; `viewer` retains current behaviour until Theo explicitly decides otherwise.
- Replace the player-facing Scouting staff-only dead end with read-only workspace/report views. Remove all create, edit, publish, archive, restore, and mutation controls for members.
- Make Draft's member experience consistent across list, plan, scenario, evidence, and detail views; align UI with the server contract rather than hidden controls.
- Verify and, if required, update the Team Analytics read contract so an entitled member receives only their own tenant's data consistently.
- Update relevant Supabase policies/RPCs with narrow tenant membership predicates. Member mutations must fail below the browser layer.
- Add role-contract tests and browser coverage for the matrix below.

## Explicit non-goals

- Do not permit member create/edit/publish/archive/restore/delete actions in Scouting or Draft.
- Do not expose cross-tenant data, provider secrets, billing data, or administration/integration screens.
- Do not change plan prices, entitlement definitions, checkout, or Free-plan access.
- Do not redesign role management, use client-side hiding as the security control, or extend access to `viewer` without a separate decision.

## Acceptance criteria

- In an entitled Pro/Elite workspace, a `member` can open Team Analytics, Scouting, an opponent report, and Draft reliably in an authenticated browser session; loading, empty, unavailable, and denied states are distinguishable and truthful.
- A member can view their own workspace's agreed intelligence records in read-only form, with no staff-only dead end solely because of their role.
- A member has no mutation controls and representative direct table/RPC mutation attempts fail server-side.
- Owner/admin authoring still works; a tenant-A member cannot read any Analytics, Scouting, Draft, or related RPC data from tenant B.
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
- Complete authenticated browser checks with separate owner/admin/member accounts for Analytics, Scouting, Scouting report, and Draft; record network/RPC outcomes for unavailable states.
- Inspect final RLS policies, grants, function security/search paths, and Supabase Advisor. Confirm anonymous/unauthenticated access remains denied.
- After Theo's explicit release approval, deploy through the approved path and repeat member and cross-tenant hosted checks.

## QA scenario / reproducible test steps

1. Prepare entitled Pro/Elite tenants A and B, each with owner, admin, and member; tenant A needs representative Analytics plus Scouting/Draft records in every supported status.
2. Sign in as tenant-A member and open `/analytics`, `/scouting`, `/scouting/:opponentId`, and `/draft`; refresh each and switch every available view.
3. Confirm intended tenant-A data is readable read-only, no mutation control is offered, and loading/empty/error/denial states are accurate rather than redirects or intermittent failure.
4. Attempt representative direct table/RPC mutations as the member; attempt direct reads against tenant-B IDs. Confirm all mutations and cross-tenant reads fail or yield no tenant-B data.
5. Repeat authoring as tenant-A owner/admin. Record browser evidence, request outcomes, test output, final policies/grants, and approved hosted evidence.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Confirm member-only scope, sequencing, and developer handoff. | This work order; source review 2026-07-30. |
| Developer – Fast Lane | Not applicable | L/high-risk shared role/RLS/RPC work. | N/A |
| Core Features Developer | Involved | Implement narrow role matrix, UI/read contract, migration, tests, and developer evidence. | PR/commit required. |
| QA and Release Auditor | Involved | Independently run role, mutation, tenant-isolation, and hosted-release matrix. | Release audit required. |
| Technical Reporting Analyst | Involved | Confirm Analytics reads remain tenant-scoped and neither widened across tenants nor silently absent for members. | Contract/query review. |
| Lead Marketer and Growth | Not applicable | No external claim or campaign work. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Member reads three intelligence workflows reliably | Not implemented | Proposed | Outstanding |
| Member mutations fail below browser layer | Not implemented | Proposed | Outstanding |
| Owner/admin authoring and tenant isolation remain intact | Not implemented | Proposed | Outstanding |
| Pro/Elite server entitlement remains enforced | Not implemented | Proposed | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The user impact and conflicting current role controls are source-evidenced, but implementation, migration review, authenticated tests, and hosted verification are outstanding.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Approve member read-only implementation | Theo | Explicit approval of scope and member-versus-viewer boundary | Open |
| Implement/test role, RLS, and RPC contract | Core Features Developer | PR/commit, test output, reproducible handoff | Open |
| Independent authorization/release audit | QA and Release Auditor | Role matrix, RLS/grant/Advisor, browser and hosted evidence | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Pending | 2026-07-30 | Product direction recorded; implementation changes RLS/RPC authorization. |
| Release | Yes | Pending | 2026-07-30 | Required before migration/deployment/hosted release. |

## Decision and approval record

- 2026-07-30 - Theo: players should view Team Analytics, Draft, and Scouting, with read-only Scouting/Draft access rather than staff-only denial. This work order scopes `member` as player; `viewer` remains unchanged pending a separate decision.

## Implementation and review evidence

- Source review 2026-07-30: `Scouting.tsx`/`ScoutingTeamReport.tsx` gate non-editors into staff-only states; `get_draft_workspace` and Draft RLS shape member access around published records; Team Analytics checks entitled tenant membership.
- **Highest evidence achieved:** Proposed
