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
| Member/viewer reads three intelligence workflows reliably | Hosted authenticated-role simulation reads tenant-A live Scouting plus unpublished Draft records; fixture is Elite and module-enabled | Hosted database verified | Browser journey outstanding |
| Member/viewer mutations fail below browser layer | Member/viewer direct update attempt returned zero rows; owner/admin policies were not widened | Hosted database verified | Browser/API mutation attempts outstanding |
| Owner/admin authoring and tenant isolation remain intact | Tenant-B read/RPC returns no data after rollback-only removal of the cross-membership; admin Draft RPC and update succeed | Hosted database verified | Browser role matrix outstanding |
| Pro/Elite server entitlement remains enforced | Member Analytics RPC returns `team-analytics-v3`; fixture is Elite with Analytics enabled | Hosted database verified | Browser journey outstanding |

### Final verdict

- **Verdict:** READY FOR QA (release HOLD)
- **Rationale:** Theo-approved production migrations and a non-customer two-tenant fixture are in place. Hosted database/RLS checks pass, but independent authenticated browser QA and release approval remain required.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Prepare safe four-role/two-tenant fixtures | Core Features Developer | `wo-024-qa-tenant-a` and `wo-024-qa-tenant-b`, each Elite with owner/admin/member/viewer | Complete |
| Apply/test role, RLS, and RPC contract | Core Features Developer | Production migrations, hosted read/isolation/mutation simulation, Advisor review | Complete |
| Independent authenticated browser/release audit | QA and Release Auditor | Browser role matrix, mobile/desktop evidence, direct API mutation attempts, release verdict | Open |

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
- Hosted implementation 2026-07-30: Theo-approved migrations `20260730205840_player_read_only_intelligence_access` and `20260730211820_consolidate_player_intelligence_read_policies` applied to `tvcgjehreaayfazlhvps`. The latter removed six legacy duplicate read policies after Advisor review; no mutation policies changed.
- Hosted fixture 2026-07-30: created non-customer Elite workspaces `wo-024-qa-tenant-a` and `wo-024-qa-tenant-b`, each with owner/admin/member/viewer. Tenant A has one active Scouting evidence item, one tendency, one unpublished Draft playbook, and one unpublished Draft plan; tenant B has distinct Scouting evidence for isolation checks. No Stripe identifiers, provider credentials, customer workspaces, or billing records were changed.
- Hosted RLS evidence 2026-07-30: rollback-only authenticated-role checks showed tenant-A member/viewer read the tenant-A Scouting item plus 1 unpublished Draft playbook/plan, see zero tenant-B Scouting rows, receive `NULL` from tenant-B `get_draft_workspace`, and update zero opponent rows. Tenant-A admin created a rollback-only Draft playbook, updated one opponent row, and received `team-analytics-v3`; member Analytics also returned `team-analytics-v3` with an honest empty-game set.
- Hosted Advisor review 2026-07-30: no affected multiple-permissive-policy notices remain. The only relevant security notices are pre-existing `SECURITY DEFINER` functions `set_preparation_brief_evidence` and `supersede_scouting_evidence`, neither modified by this work order.
- Final local validation 2026-07-30: 22 focused contracts passed; ESLint zero warnings; `tsc --noEmit`; Vite production build; bundle budget passed.
- **Highest evidence achieved:** Hosted database verified

## Independent QA preliminary audit - 2026-07-30

### 1. Release verdict: HOLD

The local implementation has credible source and contract evidence, but the high-risk migration has not been applied to the hosted project and no authenticated role/tenant matrix exists. It is not Ready for QA or release.

### 2. What was verified

- Independently ran `player-read-only-intelligence`, Draft workspace, and Team Analytics contracts: **22/22 passed**.
- Inspected the proposed migration: it adds only `SELECT` policies with tenant-membership predicates and retains owner/admin-only mutation policies; it does not introduce a `SECURITY DEFINER` shortcut.
- Read the current hosted policy inventory. Existing mutation policies for the relevant Scouting and Draft tables are owner/admin-only with appropriate `USING`/`WITH CHECK` predicates. The migration is therefore not masking an inherited all-member write path.
- Confirmed the migration `20260730205840_player_read_only_intelligence_access` is absent from hosted migration history. No production/staging policy behaviour has changed.

### 3. Blocking issues

- **Hosted security/functionality unverified:** No migration application, authenticated member/viewer reads, direct mutation denials, cross-tenant reads, or hosted browser journey is available. Local contracts cannot establish RLS behaviour.

### 4. Important risks

- **Contradictory member copy:** `ScoutingTeamReport.tsx` still tells members they receive read-only **published** Draft plans, despite the accepted scope and migration granting same-tenant access to unpublished working material. Correct the copy before QA; otherwise the product makes a materially narrower promise than the actual access model.

### 5. Unverified but required checks

- Four roles (owner, admin, member, viewer) across two entitled test tenants: Analytics, Scouting list/report, and every Draft view, including loading/empty/error states.
- Direct member/viewer mutation attempts and direct tenant-B reads/RPC calls.
- Hosted migration/policy/grant/function review and Supabase Advisor run after approved application.

### 6. Suggested fixes or next validation steps

1. **Core Features Developer:** correct the published-only copy and record the completed local validation as a developer handoff.
2. **Theo/PM:** create or approve a non-customer two-tenant/four-role fixture, then separately approve applying this high-risk migration to the shared production database.
3. **QA:** after that handoff, perform the authenticated RLS/browser matrix. Do not move this work order to Ready for QA until the developer records the deployment/migration evidence and reproducible fixture details.

## Independent QA re-review - 2026-07-30 (hosted policy review)

### 1. Release verdict: HOLD

Hosted policy state supports the intended read-only access model, but WO-024 is blocked from release by migration-history divergence and incomplete independent browser validation.

### 2. What was verified

- Hosted policy inventory contains each intended tenant-member `SELECT` policy for Scouting and Draft. Their predicates are tenant membership only; the existing mutation policies remain owner/admin-only with restrictive `USING` and `WITH CHECK` predicates.
- `ScoutingTeamReport` copy now accurately says members receive the same workspace intelligence in read-only form.
- The underlying two named migrations exist in the hosted project as `20260730211300_player_read_only_intelligence_access` and `20260730211922_consolidate_player_intelligence_read_policies`.

### 3. Blocking issues

- **Migration provenance mismatch:** local files are versioned `20260730205840_player_read_only_intelligence_access.sql` and `20260730211820_consolidate_player_intelligence_read_policies.sql`, while the hosted migration history records different versions (`20260730211300` and `20260730211922`) for the same logical changes. This makes schema history non-reproducible and can make a later migration deployment fail or apply an unintended duplicate. Do not treat the work-order migration evidence as reconciled.
- **Independent authenticated browser matrix incomplete:** no QA-controlled member/viewer browser session or direct API mutation/cross-tenant check has yet been performed.

### 4. Important risks

- The security advisor still has broad pre-existing project warnings, including exposed `SECURITY DEFINER` functions and RLS-without-policy information. They were not introduced by this work order, but they do not replace the required targeted browser/RLS verification.

### 5. Unverified but required checks

- Tenant-A member and viewer desktop/mobile journeys for Analytics, Scouting list/report, and Draft, including loading, empty, unavailable, and error states.
- Direct member/viewer mutations and direct tenant-B reads/RPC calls using the fixture identities.

### 6. Required next steps

1. **Core Features Developer / PM:** reconcile local and hosted migration history before any further database deployment. First compare the exact applied SQL/state; rename/repair only with an explicit, reviewed plan. Theo must approve any production migration-history repair.
2. **Developer:** provide QA a safe sign-in or recoverable access path for the existing non-customer member/viewer fixture identities, plus the tenant-A/tenant-B test matrix. Do not share passwords in the work order.
3. **QA:** after history reconciliation, execute and record the authenticated browser and direct API matrix. Separate Theo release approval remains required even if it passes.

## Developer migration-history reconciliation - 2026-07-30

- Theo approved a repository-only alignment on 2026-07-30. No hosted migration-history, schema, RLS policy, Auth, fixture, billing, or customer data was modified.
- Renamed `20260730205840_player_read_only_intelligence_access.sql` to `20260730211300_player_read_only_intelligence_access.sql` and `20260730211820_consolidate_player_intelligence_read_policies.sql` to `20260730211922_consolidate_player_intelligence_read_policies.sql`.
- Read-only hosted migration inventory confirms the corresponding hosted records are `20260730211300_player_read_only_intelligence_access` and `20260730211922_consolidate_player_intelligence_read_policies`.
- Migration provenance blocker is resolved. This work order is **Ready for QA**; release remains **HOLD** until the independent authenticated browser and direct API matrix is complete and Theo separately approves release.

## Independent QA re-review - 2026-07-30 (migration-alignment regression)

### 1. Release verdict: HOLD

Hosted migration history is now correctly aligned with the renamed local migration files, but the required player-intelligence contract test was not updated with that rename and fails. WO-024 must return to Core Features Developer before QA can rely on its regression suite.

### 2. What was verified

- Hosted history contains `20260730211300_player_read_only_intelligence_access` and `20260730211922_consolidate_player_intelligence_read_policies`, matching the current local filenames.
- The Draft and Team Analytics contract files executed successfully in the focused run.

### 3. Blocking issues

- **Broken required contract:** `scripts/player-read-only-intelligence-contract.test.mjs` still reads `20260730205840_player_read_only_intelligence_access.sql` and `20260730211820_consolidate_player_intelligence_read_policies.sql`, neither of which exists after the approved rename. The focused validation run fails with `ENOENT` before executing the player-intelligence assertions (19 passed, 1 failed test file).

### 4. Important risks

- The developer handoff's claim of 22 passing focused contracts is stale after the migration-history correction. Do not use it as evidence for a release decision.

### 5. Unverified but required checks

- Repaired focused contracts, then the outstanding authenticated member/viewer browser and direct API mutation/cross-tenant matrix.

### 6. Required developer handoff

1. Update the two migration paths in `scripts/player-read-only-intelligence-contract.test.mjs` to the reconciled filenames.
2. Rerun and record the complete 22-test focused suite, ESLint, TypeScript, and build. Return the work order to Ready for QA only after they pass.
3. Keep the migration versions unchanged; no database action is required for this repair.

## Developer regression repair - 2026-07-30

- Theo approved the local regression repair on 2026-07-30. Updated the two file paths in `scripts/player-read-only-intelligence-contract.test.mjs` to the reconciled hosted migration versions; no migration SQL, hosted schema, RLS policy, Auth, fixture, billing, or customer data changed.
- Final local validation 2026-07-30: `node --test scripts/player-read-only-intelligence-contract.test.mjs scripts/draft-workspace-contract.test.mjs scripts/team-analytics-contract.test.mjs` (22 passing); ESLint zero warnings; `tsc --noEmit`; Vite production build; bundle budget passed.
- Status returned to **Ready for QA**. The outstanding independent authenticated browser and direct API role matrix remains the only release-evidence blocker; Theo's separate release approval is still required.

## Independent QA recheck - 2026-07-30 (regression repair passed)

### 1. Release verdict: CONDITIONAL

The migration-history alignment and its contract regression are repaired. The work order is Ready for QA, but cannot be released until the authenticated member/viewer browser and direct API matrix is independently completed.

### 2. What was verified

- Independently ran the focused player-intelligence, Draft workspace, and Team Analytics suite: **22/22 passed**.
- The corrected contract now references the reconciled migration filenames, so it exercises the intended policy assertions rather than failing at file load.

### 3. Blocking issues

- No current source/build blocker is reproduced. Release evidence remains incomplete rather than failed.

### 4. Important risks

- The current authenticated staging session is not identified as either non-customer fixture member/viewer. It cannot establish the required role, mutation-denial, or tenant-isolation behaviour.

### 5. Unverified but required checks

- Tenant-A member and viewer browser checks for Analytics, Scouting list/report, and Draft at desktop and mobile.
- Direct member/viewer write and tenant-B read/RPC attempts using the fixture accounts.

### 6. Exact next action

Provide a staging sign-in session for `wo-024-qa-tenant-a` **member** first, then its **viewer** (or provide the safe recovery/sign-in path for those existing fixture identities). QA will perform only read-only browsing and controlled direct API denials; no fixture records will be created, edited, or deleted.

## Independent QA hosted browser audit - 2026-07-31

### 1. Release verdict: HOLD

The authenticated Tenant-A **member** journey fails a core acceptance criterion in the deployed staging application. The member can view Analytics and the unpublished Draft plan, but is explicitly denied the live Scouting report that the work order requires them to read. Database/RLS evidence cannot compensate for this deployed application failure.

### 2. What was verified

- Authenticated browser identity: `WO-024 QA Tenant A`, role `MEMBER` (non-customer fixture).
- `/analytics` loaded successfully. Its zero-game state was truthful: it reported `0 qualifying games`, did not substitute sample data, and retained the expected filters and unavailable-data explanations.
- `/draft` loaded `WO-024 QA unpublished plan A`, including its non-customer unpublished-plan description and one factual prompt. The member-visible controls were navigation/review controls only; no Draft authoring control was exposed in that view.
- Read-only fixture inventory independently confirmed the active Tenant-A opponent `WO-024 QA Opponent A` (`11ffd00f-80c2-4642-990a-2e994593919e`) with one evidence item. This establishes that the following report test was not an honest empty-state result.

### 3. Blocking issues

- **Deployed member Scouting/report denial:** opening `/scouting/11ffd00f-80c2-4642-990a-2e994593919e` while authenticated as the Tenant-A member rendered: `Private staff workspace` and `Living opponent evidence is restricted to owners and admins. Open Draft to read published snapshots shared with the team.` This is the pre-WO staff-only dead end and conflicts directly with the approved scope: member/viewer access to live Scouting reports and unpublished Draft material in read-only form. The member cannot reach the active report/evidence in staging.

### 4. Important risks

- The staging Scouting list also rendered a staff-only experience (`Private staff workspace` / `Open published plans`) rather than the implemented local `Private scouting` list. This strongly indicates the staging deployment is serving an older application bundle or an unreconciled role gate, even though the hosted RLS fixture has the intended records.
- Only the member desktop journey was independently tested. Viewer, mobile/responsive, owner/admin authoring regression, direct mutation denial, and tenant-B isolation remain unverified; do not infer them from the earlier hosted database simulation.

### 5. Unverified but required checks

- After the deployed Scouting fix, repeat Tenant-A member and viewer journeys for `/analytics`, `/scouting`, the fixture report, and `/draft` on desktop and mobile.
- Perform controlled direct member/viewer mutation denials and tenant-B read/RPC attempts using the fixture identities; record the actual request outcomes.
- Verify owner/admin can still author, then obtain Theo's separate release approval.

### 6. Suggested fixes or next validation steps

1. **Core Features Developer:** compare the staging bundle/commit with `src/pages/Scouting.tsx` and `src/pages/ScoutingTeamReport.tsx`. Deploy the implementation that uses `canViewIntelligence` for member/viewer reads and reserves only authoring controls for `canEditIntelligence`; remove the deployed staff-only report branch. Record the deployed URL/commit and reproducible member steps.
2. **QA:** rerun the complete authenticated role and tenant-isolation matrix after that handoff. No production release decision should be requested before it passes.
3. **PM:** return WO-024 to **In Progress** / Core Features Developer; it is not Ready for release QA completion.

## Independent QA hosted browser retest - 2026-07-31

### 1. Release verdict: HOLD

The previously-blocking deployed read path is repaired, but the authenticated member report still exposes an evidence-mutation control. This is an authorization/role-UX regression against an explicit acceptance criterion, so the work order cannot return to Ready for QA completion or release.

### 2. What was verified

- Authenticated Tenant-A `MEMBER` browser session on staging now opens `/scouting` and lists the active `WO-024 QA Opponent A` fixture with `Open report`.
- The member can open `/scouting/11ffd00f-80c2-4642-990a-2e994593919e` and read the active evidence, tendency, and linked unpublished Draft plan. The former `Private staff workspace` denial is no longer reproduced.
- No mutation was submitted during this retest.

### 3. Blocking issues

- **Member edit control exposed:** the live report displays a `Revise` control next to `WO-024 QA evidence A` for the authenticated `MEMBER`. Revising evidence is a mutation and the work order explicitly forbids member/viewer create, edit, publish, archive, restore, and delete controls. Local source confirms the cause: `src/pages/ScoutingTeamReport.tsx` renders that button unconditionally around lines 286-292, unlike the adjacent authoring controls guarded by `canEditIntelligence`.

### 4. Important risks

- Server-side RLS may reject a submitted revision, but that would not make this acceptable: browser UI must not offer forbidden authoring, and the direct server mutation-denial check remains outstanding.

### 5. Unverified but required checks

- After fixing the control, the remaining member/viewer desktop/mobile route matrix, direct denied mutations, direct tenant-B reads/RPCs, and owner/admin authoring regression.

### 6. Suggested fixes or next validation steps

1. **Core Features Developer:** guard the evidence `Revise` button and any associated dialog/mutation entry point with `canEditIntelligence`; add a role-contract/browser assertion that it is absent for both member and viewer.
2. **Developer:** redeploy staging and provide commit/deployment evidence plus reproducible fixture steps.
3. **QA:** retest the repaired control and complete the remaining hosted role matrix. Theo's final release approval remains required after QA passes.

## Developer deployment handoff - 2026-07-31

- Theo reports that `codex/Staging` was pushed and deployed after the hosted browser audit. Local and `origin/codex/Staging` both resolve to commit `920b0c5`.
- No authenticated browser session or accessible Vercel project connection was available in this developer session, so the deployed member Scouting/report behavior is **not independently re-verified here**.
- Status returns to **Ready for QA** solely to repeat the failed hosted regression and complete the remaining QA matrix. Release remains **HOLD** until independent authenticated evidence passes and Theo separately approves release.

## Developer evidence-control repair - 2026-07-31

- Theo approved the scoped repair after QA found that a member report exposed the evidence `Revise` action.
- The evidence revision entry point is now rendered only when `canEditIntelligence` is true. The focused role contract asserts that the `reviseEvidence` trigger remains inside this guard.
- This is a browser-role UX repair only: migration SQL, RLS policies, Auth, fixtures, billing, and customer data remain unchanged.
- Final local validation 2026-07-31: `node --test scripts/player-read-only-intelligence-contract.test.mjs scripts/draft-workspace-contract.test.mjs scripts/team-analytics-contract.test.mjs` (22 passing); ESLint zero warnings; `tsc --noEmit`; Vite production build; bundle budget passed. A fresh staging deployment and authenticated QA retest are still required before returning to QA.
- Staging deployment handoff 2026-07-31: commit `ea33ae4` (`Hide scouting evidence revisions from members`) was pushed to `origin/codex/Staging`, the documented Git-triggered staging branch. `https://staging.scrimstats.gg/` responded with the ScrimStats public shell after the push. This is availability evidence only; no authenticated member/viewer route was exercised in this developer session.
