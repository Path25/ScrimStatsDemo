# WO-2026-024 - Give players reliable read-only intelligence access

- **ID reservation:** [WO-2026-024 registry row](../WORK_ORDER_INDEX.md)
- **Status:** Done
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

## Independent QA hosted browser re-review - 2026-07-31

### 1. Release verdict: HOLD

The evidence `Revise` control is repaired, but the same authenticated Member report still exposes an external-history import workflow which can mutate tenant data. The role is not yet read-only.

### 2. What was verified

- Tenant-A `MEMBER` can read the live Scouting report, its evidence/tendency, and the unpublished Draft plan.
- The previously reported `Revise` control is absent from the current staging report.

### 3. Blocking issues

- **Member external-import mutation exposed:** the report still renders an editable `Exact Leaguepedia team name` input and enabled `Import history` button. Local source confirms this calls `useLeaguepediaDraftHistory().importHistory`, which invokes the `leaguepedia-draft-import` Edge Function with the opponent ID and entered provider name. Its successful path imports attributed draft records, so it is a data/provider mutation—not a read-only view. The component is mounted without a `canEditIntelligence` guard in `ScoutingTeamReport.tsx`.

### 4. Important risks

- The import invokes an external provider as well as creating/updating tenant evidence. It must not be offered to member/viewer roles regardless of whether a later server-side layer rejects it.

### 5. Unverified but required checks

- After this control is fixed: Viewer desktop/mobile journey, direct member/viewer mutation denial, tenant-B reads/RPCs, and owner/admin authoring regression.

### 6. Suggested fixes or next validation steps

1. **Core Features Developer:** make the Leaguepedia component's import input/button and any evidence-attachment mutations unavailable to member/viewer roles; ideally pass an explicit `canEdit` capability into the component and disable its mutation hooks/entry points when false.
2. Add member/viewer role coverage for absent import and evidence-attachment controls, redeploy staging, then provide the normal QA handoff.
3. **QA:** retest after deployment. Theo's final release approval remains required only after the full matrix passes.

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

## Developer Leaguepedia read-only repair - 2026-07-31

- Theo approved the scoped repair after QA found that a member report exposed the Leaguepedia provider-name input, `Import history`, and draft-evidence attachment controls.
- `ScoutingTeamReport` now passes `canEditIntelligence` explicitly to `LeaguepediaDraftHistory`. When false, the component preserves tenant-scoped imported-history reading but renders no provider-name input, import action, draft-brief selector, evidence-selection save action, or per-game attachment checkbox. Its empty state also avoids instructing a read-only user to import.
- `useLeaguepediaDraftHistory` receives the explicit mutation capability and rejects either import or brief-attachment mutation before a client call when false. This is defence in depth only: source inspection and the existing Leaguepedia contract confirm `leaguepedia-draft-import` requires a verified Supabase JWT and owner/admin membership before its service-client writes. No migration, RLS policy, fixture, billing, or customer data changed.
- Final local validation 2026-07-31: `node --test scripts/player-read-only-intelligence-contract.test.mjs scripts/leaguepedia-draft-contract.test.mjs` (9 passing); ESLint zero warnings; `tsc --noEmit`; Vite production build; bundle budget passed. The focused role contract now asserts explicit capability propagation and that all Leaguepedia import/attachment controls remain within a `canEdit` guard.
- **Status remains In Progress:** this source repair has not been deployed. After Theo approves the staging push/deployment, QA should sign in as the Tenant-A member and viewer, open the existing opponent fixture report, confirm imported games remain readable and that `Exact Leaguepedia team name`, `Import history`, `Attach selected games to a draft brief`, `Save evidence selection`, and attachment checkboxes are absent. Then complete the existing mobile, direct mutation-denial, tenant-B isolation, and owner/admin regression matrix. Release remains **HOLD** pending that independent evidence and Theo's separate release approval.

## Developer staging deployment trigger - 2026-07-31

- Theo approved the staging push/deployment. Commit `642a83e5ac87eadbf6e0e9ee50a6fff85c68ca4c` was pushed successfully to `origin/codex/Staging`, the documented Git-triggered staging branch; local `HEAD` and `origin/codex/Staging` matched immediately after push.
- Provider completion remains unverified in this developer session: the available Vercel connection returned no projects, and a read-only request to `https://staging.scrimstats.gg/` returned Vercel Login rather than an accessible application shell. This is neither a successful build nor authenticated workflow evidence.
- Keep **In Progress** until the staging deployment is confirmed. Then assign the work to **QA and Release Auditor** for the exact member/viewer fixture matrix above. Release remains **HOLD**.

## Independent QA hosted browser re-review - 2026-07-31 (Leaguepedia repair deployed)

### 1. Release verdict: HOLD

The two previously reported member-facing mutation controls are repaired in staging and the Member read/isolation checks now pass. Release remains on HOLD because the required Viewer, responsive, and direct server-mutation matrix is incomplete.

### 2. What was verified

- Authenticated Tenant-A `MEMBER` can read the active Tenant-A Scouting report, evidence, tendency, and unpublished Draft plan.
- The evidence `Revise` action, Leaguepedia provider-name field, `Import history` button, and all other visible report authoring controls are absent for that Member.
- While still in Tenant-A Member context, a direct route to the known Tenant-B report (`/scouting/c0e5dc3f-69b9-4367-bc56-ca6e38bfbb04`) returned the truthful `Opponent report unavailable` state and exposed no Tenant-B content.
- Switching this account to Tenant-B showed it is an `ADMIN` there and that authoring controls are available, demonstrating the UI role split. No authoring action was submitted.
- The user session was restored to Tenant-A Member after testing.

### 3. Blocking issues

- No current browser defect was reproduced. The release hold is evidence-completeness, not a newly reproduced failure.

### 4. Important risks

- The logged-in account has Tenant-A Member and Tenant-B Admin memberships; it is not the required Tenant-A Viewer fixture. An admin-visible control is not proof that owner/admin authoring still succeeds, and an absent Member control is not proof of server-side mutation denial.

### 5. Unverified but required checks

- Tenant-A Viewer desktop and mobile route checks for Analytics, Scouting/list/report, and Draft.
- Member and Viewer direct representative write attempts with recorded server denials, and direct tenant-B Analytics/Draft RPC/read checks.
- Owner/admin authoring success and responsive-state coverage after the current deployment.

### 6. Suggested fixes or next validation steps

1. **QA / Theo:** provide the existing Tenant-A Viewer session or a safe sign-in/recovery path. No data change is needed.
2. **QA:** complete the listed Viewer, responsive, direct-denial, and owner/admin matrix; then issue the final release verdict.
3. **Theo:** approve a production release only after QA records a READY verdict. No further implementation is currently returned to Developer.

## Independent QA owner-role audit - 2026-07-31

### 1. Release verdict: HOLD

The supplied session was Tenant-A `OWNER` rather than the requested Viewer. It exposed a new release-blocking regression: the owner is denied the live Scouting report. This invalidates the work order's requirement that owner/admin authoring remain intact.

### 2. What was verified

- Authenticated Tenant-A `OWNER` successfully loads `/analytics` with the honest zero-game state and `/draft` with the existing unpublished plan plus authoring controls (`New plan`, `Create main line`, scenario/restriction controls).
- On `/scouting/11ffd00f-80c2-4642-990a-2e994593919e`, the same owner consistently receives `Scouting is unavailable` / `Your current workspace role cannot read this intelligence workspace.` The denial reproduced after a full route reload.
- No authoring action or data change was submitted. The workspace was restored to `/overview` after testing.

### 3. Blocking issues

- **Owner Scouting capability regression:** `getWorkspaceCapabilities("owner")` returns an object without `viewIntelligence`, so `RoleContext.canViewIntelligence` is falsy for owners. `ScoutingTeamReport` consequently renders its role-denied state before loading the report. This prevents owners from viewing or authoring their own live Scouting intelligence.

### 4. Important risks

- The `OWNER` object also omits `viewPublishedIntelligence`. This may affect other current or future read gates. Preserve role capability completeness by deriving owner from the read-only baseline or explicitly returning every capability field.
- Tenant-A Viewer, responsive coverage, and direct server-side denial/RPC checks remain unverified, but must wait until the owner regression is repaired and redeployed.

### 5. Unverified but required checks

- Owner Scouting authoring success after repair; then Tenant-A Viewer desktop/mobile route matrix, Member/Viewer direct mutation denials, and tenant-B Analytics/Draft RPC/read checks.

### 6. Suggested fixes or next validation steps

1. **Core Features Developer:** correct `src/lib/workspace-capabilities.ts` so owner includes `viewIntelligence: true` and `viewPublishedIntelligence: true` (prefer spreading the `readOnly` baseline before adding management capabilities). Add a focused owner capability/Scouting route contract.
2. Redeploy staging and hand off the exact commit plus Owner and Viewer fixture steps.
3. **QA:** rerun Owner Scouting, then the remaining Viewer/security matrix. Theo's final production-release approval remains required after a READY verdict.

## Independent QA owner-role retest - 2026-07-31

### 1. Release verdict: HOLD

The Owner Scouting regression is repaired in staging. The release remains on HOLD solely because the Viewer, responsive, direct-denial, and actual authoring-success checks are still incomplete.

### 2. What was verified

- Authenticated Tenant-A `OWNER` can open `/scouting/11ffd00f-80c2-4642-990a-2e994593919e` after a full page reload and read the live fixture report.
- The Owner sees the expected staff-only authoring controls: `Add tendency`, `Add evidence`, `Revise`, opponent `Add`, Draft `New`, and Leaguepedia import input/action.
- The previous Owner `Scouting is unavailable` capability denial is not reproduced. No authoring action was submitted, and the browser was returned to `/scouting` after the check.

### 3. Blocking issues

- No current Owner read/access defect is reproduced. The release hold is remaining required evidence, not a live failure.

### 4. Important risks

- Visible Owner controls do not prove a successful authoring mutation, and no direct Member/Viewer mutation attempt has independently proved server-side denial.

### 5. Unverified but required checks

- Tenant-A Viewer desktop/mobile Analytics, Scouting/list/report, and Draft journeys.
- Member/Viewer direct representative write denials and Tenant-B Analytics/Draft read/RPC denials.
- One controlled non-customer Owner authoring success and responsive coverage.

### 6. Suggested fixes or next validation steps

1. **Theo / QA:** provide the existing Tenant-A Viewer session or safe recovery/sign-in path; no data change is needed for its read-only matrix.
2. **Theo:** if authoring-success must be independently demonstrated, explicitly approve one reversible non-customer fixture edit plus restoration. Otherwise record an accepted-risk decision for that single check.
3. **QA:** complete the remaining matrix, then request Theo's final production release approval only if the result is READY.

## Independent QA Viewer-session attempt - 2026-07-31

### Outcome: Blocked

- Theo provided a session described as Tenant-A Viewer. The authenticated staging header consistently identified it as `WO-024 QA Tenant A` / `MEMBER` (`fridayxiiiempire@gmail.com`), including after workspace loading completed.
- The Member Draft view loaded as expected, but it is duplicate evidence and cannot be recorded as Viewer validation. No mutation was submitted; the browser was restored to `/overview`.
- **Exact next input:** sign in as the existing Tenant-A user whose header shows `VIEWER`, then leave that session on `/overview` or `/scouting`. No workspace/data change is required.

## Independent QA Viewer-role audit - 2026-07-31

### 1. Release verdict: HOLD

The required Viewer read-only and direct Scouting-report isolation checks pass in staging. The work order remains on HOLD only for controlled server-side denial, responsive, and reversible Owner-authoring evidence.

### 2. What was verified

- Authenticated identity: `WO-024 QA Tenant A` / `VIEWER` (`pathdigitaldesigns@gmail.com`).
- Viewer `/analytics` loaded with the truthful zero-game state; `/scouting` listed the active Tenant-A opponent; the live report exposed its evidence, tendency, and unpublished Draft plan; `/draft` exposed the same unpublished plan.
- Neither the Viewer report nor Draft surface exposed authoring controls, writable inputs, Leaguepedia import, evidence attachment, or revision actions.
- A direct Viewer request to the known Tenant-B report (`/scouting/c0e5dc3f-69b9-4367-bc56-ca6e38bfbb04`) returned the truthful `Opponent report unavailable` state with no Tenant-B content.
- No mutation was submitted. The Viewer browser session was restored to `/overview`.

### 3. Blocking issues

- No browser role defect is currently reproduced. The release hold is incomplete required evidence, not a new implementation failure.

### 4. Important risks

- Browser control absence does not prove direct database/RPC mutation denial, and desktop validation does not establish responsive behaviour.

### 5. Unverified but required checks

- Controlled representative Member and Viewer direct write attempts with recorded server denials; direct Tenant-B Analytics/Draft RPC/read denials.
- Mobile/responsive journey for both read-only roles.
- One reversible non-customer Owner Scouting authoring success, then restoration.

### 6. Suggested fixes or next validation steps

1. **Theo:** explicitly approve a reversible fixture mutation test if the final authoring-success and direct server-denial evidence is required. The test must use only WO-024 non-customer records and restore them immediately.
2. **QA:** execute that approved matrix and capture mobile evidence; otherwise record each as accepted risk before requesting the final verdict.
3. **Theo:** give separate production-release approval only after QA reports READY.

## Independent QA approved RLS and authoring exercise - 2026-07-31

### 1. Release verdict: HOLD

The approved write-denial and Owner-authoring checks pass with no persistent fixture change. The final tenant-isolation RPC check is blocked because the purported two-tenant fixture assigns every Tenant-A test user a real membership in Tenant B; it cannot distinguish authorised multi-workspace access from a cross-tenant leak.

### 2. What was verified

- Under rollback-only `authenticated` RLS context, representative direct updates to the Tenant-A opponent returned **0 rows** for the Tenant-A Member and Viewer identities.
- The same rollback-only update as Tenant-A Owner returned **1 row** and observed the temporary marker. A post-rollback read confirmed the original fixture description remains unchanged and the marker is not persisted.
- No customer row, billing record, credential, provider setting, or external service was touched.

### 3. Blocking issues

- **Invalid cross-tenant test fixture:** Tenant-A Owner, Admin, Member, and Viewer are respectively also Tenant-B Owner, Viewer, Admin, and Member. The Tenant-A Viewer therefore legitimately received Tenant-B Draft RPC data when directly calling `get_draft_workspace(Tenant B)`. This is not currently evidence of an unauthorised leak, but it makes the required cross-tenant RPC denial test impossible with every supplied fixture identity.

### 4. Important risks

- The existing browser route check is still useful UI evidence because the active workspace was Tenant A, but it does not prove the server-side RPC boundary for an identity that has no Tenant-B membership.
- Mobile/responsive journeys remain unverified.

### 5. Unverified but required checks

- Direct Tenant-B Analytics and Draft RPC/read denials using a non-customer Tenant-A-only Member or Viewer identity.
- Mobile/responsive route matrix for Member and Viewer.

### 6. Suggested fixes or next validation steps

1. **Theo / PM:** explicitly approve either (a) removal of one non-customer fixture user's Tenant-B membership, or (b) creation of a new non-customer Tenant-A-only Member/Viewer. Do not modify customer memberships. Record the user/tenant IDs privately, not in the work order.
2. **QA:** use that identity for direct Tenant-B Draft and Analytics RPC/read-denial checks, then complete mobile coverage.
3. **Theo:** only after those pass may QA issue READY and request separate production-release approval.

## Independent QA fixture correction and direct-RPC isolation - 2026-07-31

### 1. Release verdict: HOLD

The authorised non-customer fixture correction removed the false isolation blocker. Direct Draft and Analytics cross-tenant denials now pass for the Tenant-A Viewer identity. Mobile/responsive evidence is the remaining release requirement.

### 2. What was verified

- With Theo's explicit approval, QA removed **only** the non-customer Tenant-A Viewer's Tenant-B membership. No customer membership, customer data, billing data, provider configuration, or credential was changed.
- Under authenticated Viewer RLS context, `user_belongs_to_tenant(Tenant B)` is now false and `get_draft_workspace(Tenant B)` returns `NULL`.
- The same Viewer call to `get_team_analytics_dataset(Tenant B, ...)` fails with the intended `Analytics access is unavailable for this workspace` denial. No Tenant-B Analytics payload was returned.
- Earlier in the approved session, Member and Viewer writes returned zero rows; Owner rollback-only authoring returned one row and was confirmed fully rolled back.

### 3. Blocking issues

- No current server-side read/write/tenant-isolation defect is reproduced. Release is held for mobile/responsive evidence only.

### 4. Important risks

- The removed Tenant-B membership is an intentional non-customer fixture change for this audit. It may be re-created later only if a distinct cross-tenant denial identity is preserved.

### 5. Unverified but required checks

- Member and Viewer mobile/responsive route matrix for Analytics, Scouting/list/report, and Draft.

### 6. Suggested fixes or next validation steps

1. **QA / Theo:** complete the mobile checks at the agreed narrow viewport with the existing non-customer Member and Viewer sessions.
2. **Theo:** after mobile passes, review the final QA evidence and separately approve production release if acceptable.

## Independent QA Viewer mobile audit - 2026-07-31

### 1. Release verdict: HOLD

The Tenant-A Viewer mobile matrix passes at 390 × 844. The only remaining work-order requirement is the equivalent Member mobile journey.

### 2. What was verified

- Authenticated Tenant-A `VIEWER` at a true 390 × 844 viewport loaded Analytics, Scouting/list/report, and Draft.
- Each route stayed within the narrow viewport (document width 384–390px; no horizontal overflow).
- Analytics finished loading into its truthful zero-game state. The Scouting report and unpublished Draft plan remained readable with no writable inputs or authoring controls.
- The temporary viewport override was reset and the original session restored to `/overview`.

### 3. Blocking issues

- No Viewer mobile defect is reproduced. Final evidence is incomplete because the current authenticated session is Viewer-only and QA cannot silently switch identities.

### 4. Important risks

- Member and Viewer share the intended read-only capability model, but that does not replace an authenticated Member mobile verification.

### 5. Unverified but required checks

- Tenant-A Member mobile Analytics, Scouting/list/report, and Draft journey at 390 × 844.

### 6. Suggested fixes or next validation steps

1. **Theo:** sign in as the existing Tenant-A Member fixture and leave it open on `/overview`.
2. **QA:** repeat the four-route 390 × 844 inspection, then issue the final release verdict.

## Independent QA Member mobile audit and final acceptance review - 2026-07-31

### 1. Release verdict: CONDITIONAL

WO-024's stated staging acceptance matrix now passes. It is conditionally ready for production deployment, not yet a production-release approval: Theo must separately approve the production deployment and QA must verify the deployed production revision before public/customer availability is claimed.

### 2. What was verified

- Authenticated Tenant-A `MEMBER` at a true 390 × 844 viewport loaded Analytics, Scouting/list/report, and Draft; the active report and unpublished plan remained readable.
- All four Member routes remained within the narrow viewport (document width 384–390px; no horizontal overflow). No Member authoring controls or writable inputs were exposed.
- Prior independent evidence in this work order now covers: Member and Viewer desktop/mobile reads; no authoring controls for either; live Scouting and unpublished Draft reads; direct Member/Viewer write denials; Owner rollback-only authoring success with no persisted change; UI report isolation; and direct Tenant-B Draft `NULL` plus Analytics access-denied responses for the Tenant-A-only Viewer.

### 3. Blocking issues

- None reproduced in the complete staging acceptance matrix.

### 4. Important risks

- This evidence is authenticated staging plus the shared production-backed Supabase project. It does not prove that a later production web deployment contains the same frontend revision.

### 5. Unverified but required checks

- After Theo's explicit production-deployment approval: verify the deployed production revision with a non-customer Member or Viewer on Analytics, Scouting/report, and Draft; confirm the same read-only boundary and tenant isolation.

### 6. Suggested fixes or next validation steps

1. **Theo:** explicitly approve the production web deployment only when ready to release WO-024.
2. **Developer:** deploy through the approved production path and record the revision/URL.
3. **QA:** repeat the concise authenticated production smoke test before declaring production-ready. No further staging implementation work is required.

## Developer owner-capability repair - 2026-07-31

- Theo approved the scoped fix for the reproduced Tenant-A Owner Scouting denial.
- `getWorkspaceCapabilities("owner")` now spreads the complete `readOnly` baseline before applying owner management capabilities. Owners therefore retain both `viewIntelligence: true` and `viewPublishedIntelligence: true` alongside their existing authoring permissions; no role, RLS, migration, fixture, billing, or customer-data change was made.
- The focused player-intelligence contract now asserts that the owner branch inherits the complete read baseline and retains intelligence management. Final local validation: `node --test scripts/player-read-only-intelligence-contract.test.mjs scripts/leaguepedia-draft-contract.test.mjs scripts/draft-workspace-contract.test.mjs scripts/team-analytics-contract.test.mjs` (29 passing); ESLint zero warnings; `tsc --noEmit`; Vite production build; bundle budget passed.
- **Status remains In Progress:** after Theo approves the staging push/deployment, QA and Release Auditor should sign in as the existing Tenant-A Owner, open `/scouting/11ffd00f-80c2-4642-990a-2e994593919e`, and confirm the report and owner authoring controls render. Then continue the already-required Tenant-A Viewer desktop/mobile and direct server-denial/tenant-isolation matrix. Release remains **HOLD** until QA records a READY verdict and Theo separately approves release.

## Developer owner-repair staging deployment trigger - 2026-07-31

- Theo approved the staging push/deployment. Commit `4d8a6202bbf16ebd2f22c1b3dddf405d05f241c8` was pushed successfully to `origin/codex/Staging`; local `HEAD` and `origin/codex/Staging` matched immediately after push.
- This is Git-trigger evidence only. Provider completion and the authenticated Owner Scouting report check remain unverified here and must be completed by QA and Release Auditor before changing the release HOLD.
