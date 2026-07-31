# WO-2026-029 — Repair multi-workspace Draft RLS cardinality failure

**Status:** Ready for QA  
**Size / risk:** M / High  
**Assigned owner:** QA and Release Auditor  
**Autonomy:** Theo must approve implementation and hosted migration application separately.

## Outcome and users

Restore the Draft workspace for legitimate owners/members who belong to more than one workspace, without weakening tenant isolation. The immediate affected user is the OnceUponATeam owner; all multi-workspace users benefit from a policy that authorizes against the active Draft record's tenant rather than assuming a user has exactly one membership.

## Problem and evidence

WO-2026-027 authenticated reproduction showed `/draft` failing as OnceUponATeam owner. Read-only hosted logs showed `more than one row returned by a subquery used as an expression`. The `game_drafts` SELECT RLS policy uses a scalar `tenant_users.tenant_id` lookup for `auth.uid()`; the affected owner has three memberships. `get_draft_workspace` reads `game_drafts` for its `team_drafts` payload, so policy evaluation aborts the RPC.

## Scoped change

- Create one reviewed migration that replaces only the `game_drafts` SELECT policy's scalar membership predicate with the established `public.user_belongs_to_tenant(s.tenant_id)` helper while retaining the existing `game_drafts → scrim_games → scrims` tenant relationship.
- Keep RLS enabled, preserve grants, and leave INSERT/UPDATE/DELETE policies unchanged.
- Add focused migration/RLS contract coverage for a multi-workspace user, authorized active-tenant reads, and cross-tenant denial.
- Record rollback SQL that restores the exact pre-change SELECT policy if validation identifies a regression.

## Non-goals

- No customer-data edits, backfills, membership changes, or entitlement changes.
- No RPC, browser route, capability, billing, or Draft data-model change.
- No broad RLS cleanup, `SECURITY DEFINER` adoption, policy changes for write paths, or remediation of unrelated tables. The scalar predicates in write policies require separate evidence and approval if they prove user-impacting.
- No hosted migration, deployment, or release claim without Theo's explicit approval.

## Acceptance criteria

- A user with multiple workspace memberships can load `/draft` for their authorized active tenant.
- The same user cannot read another tenant's Draft data through direct table access or `get_draft_workspace`.
- Single-workspace authorized access remains functional and unauthenticated access remains denied.
- Existing `game_drafts` write policies, RLS enablement, grants, and customer rows are unchanged.
- The migration has focused RLS tests, rollback instructions, Advisor review, lint with zero warnings, TypeScript, and production build evidence.
- After separate hosted-migration approval, the original OnceUponATeam owner refresh succeeds and QA records a two-tenant, multi-workspace role matrix without exposing customer intelligence content.

## Relevant areas

- New timestamped migration under `supabase/migrations/`
- Existing `game_drafts` policies and `public.user_belongs_to_tenant`
- `public.get_draft_workspace`
- Draft/RLS tests and `docs/security/ADVISOR_REVIEW.md`

## Risks and boundaries

- **RLS / tenant isolation: High.** A malformed replacement predicate can expose another tenant. Use the established helper and preserve the record-to-tenant join.
- **Hosted data: High.** `tvcgjehreaayfazlhvps` is production-backed; do not apply the migration until Theo explicitly approves exact hosted scope.
- **Regression: Medium.** Policy syntax or helper behavior can alter legitimate reads. Test multi-workspace, single-workspace, cross-tenant, and unauthenticated cases.
- **Collision: High.** Do not overlap any other Draft/RLS migration or shared authorization refactor.

## Required validation and QA scenario

1. Inspect the generated migration diff and verify it drops/recreates only the SELECT policy named in WO-2026-027; verify write policies, grants, and RLS settings remain identical.
2. Run focused database/RLS tests, Supabase migration lint, Advisor review, ESLint (zero warnings), TypeScript, and production build.
3. Following separate hosted approval, use an approved multi-workspace owner session: select OnceUponATeam, load `/draft`, then direct-refresh. Record the successful loaded state without recording intelligence content.
4. In an isolated second workspace/tenant, verify the same user can see only its selected authorized workspace and cannot retrieve the other tenant's Draft payload.
5. Verify a non-member and unauthenticated actor remain denied; verify a write attempt follows the unchanged existing write policy.
6. If a regression appears, use the reviewed rollback migration/policy statement and stop for Theo approval before applying it.

## Rollback statement (approval required)

If a validated regression requires rollback after hosted application, create a new reviewed rollback migration that drops only `Users can view drafts for their tenant games` and recreates its exact pre-WO-029 definition from `20250614181029-027445dd-1a55-4eaf-94a7-251e9e55b1d9.sql`. That restores the prior behavior, including its known multi-workspace failure, so it is an emergency recovery action rather than a successful release path. Do not run it without Theo's explicit hosted-change approval.

## Role handoff

| Role | Involvement | Handoff |
|---|---|---|
| Core Features Developer | Involved | Implement only after approval; record source and hosted evidence separately. |
| QA and Release Auditor | Involved | Independently reproduce WO-2026-027, review migration scope, and execute post-hosted QA matrix. |
| Project Manager | Informed | Keep the work order/index/board status accurate. |
| Developer – Fast Lane | Not applicable | Shared RLS/migration work is outside Fast Lane. |

## Implementation and validation evidence — 2026-07-31

- Added `20260731124310_repair_multi_workspace_draft_rls.sql`, generated with the Supabase CLI. It drops and recreates only `Users can view drafts for their tenant games` on `public.game_drafts` as `FOR SELECT TO authenticated`.
- The replacement preserves the existing `game_drafts → scrim_games → scrims` relationship and calls `public.user_belongs_to_tenant(scrim.tenant_id)`. It contains no grant, RLS-enablement, RPC, data, INSERT, UPDATE, DELETE, or entitlement change.
- Added a focused Draft contract assertion that rejects the legacy scalar `tenant_users` subquery and any write-policy operation in this migration.
- Passed: `scripts/draft-workspace.test.ts` and `scripts/draft-workspace-contract.test.mjs` (14 tests); ESLint with zero warnings; TypeScript; production Vite build and bundle budget.
- Read-only Security Advisor review remains at the documented project baseline of legacy deny-by-default and intentional authenticated `SECURITY DEFINER` notices. This migration adds no function, grant, table, or new advisor category. The project-level leaked-password-protection warning is out of scope.
- Unavailable locally: `supabase migration list --local` could not connect to a local Postgres service (`LegacyDbConnectError`). No local schema was altered and no hosted command was attempted.
- No hosted migration, deployment, browser-success verification, customer-data change, or release claim has occurred.

## Hosted application and verification — 2026-07-31

- Theo explicitly approved application of WO-029 to the production-backed Supabase project `tvcgjehreaayfazlhvps`.
- Supabase applied migration `20260731124310_repair_multi_workspace_draft_rls` successfully.
- Read-only policy inspection confirms only `Users can view drafts for their tenant games` changed: it is now `FOR SELECT TO authenticated`, preserves the `game_drafts → scrim_games → scrims` relationship, and calls `user_belongs_to_tenant(scrim.tenant_id)`. The existing INSERT and UPDATE policy definitions remain unchanged.
- Authenticated browser verification: the OnceUponATeam owner refreshed `/draft` and the full Draft workspace loaded, including the existing match plan and draft sequence. The prior `Draft could not be loaded` state did not reappear.
- No write was performed during browser verification and no customer rows, grants, RPCs, plans, or application deployment were changed.

## Release audit

- **Current verdict (supersedes the pre-application HOLD below):** CONDITIONAL — hosted migration and the original owner refresh passed; the release remains pending QA's cross-tenant/non-member denial and unchanged-write-policy matrix.

- **Source status:** Ready for QA — the local migration and static validation are complete; hosted application and release remain blocked on Theo's separate approval.

- **Current verdict:** HOLD — diagnosis identifies a candidate repair, but no migration exists or is approved.
- **Implementation approval:** Approved by Theo on 2026-07-31 after independent QA reproduction. This covers source implementation and local validation only.
- **Hosted migration approval:** Approved and applied by Theo on 2026-07-31; migration receipt and active-policy inspection recorded above.
- **Release approval:** Pending QA evidence and Theo's separate release decision.

## QA conditional approval record

Theo's 2026-07-31 approval was recorded only after QA reproduced the failure in the authenticated browser and under the affected owner's RLS context, and confirmed the candidate change is limited to the faulty SELECT policy. A production-backed migration application, deployment, and release are expressly excluded and require separate approval.

## Independent QA re-review - 2026-07-31

### 1. Release verdict: CONDITIONAL

The live read-path repair passes the owner success and tenant-isolation checks. It is not READY because deployed-migration provenance does not match the committed migration filename; that must be reconciled before this high-risk RLS release is closed.

### 2. What was verified

- Theo manually verified the OnceUponATeam owner browser journey succeeds after the hosted application.
- Independent authenticated-RLS verification for that multi-workspace owner returned the complete, expected Draft workspace shape, including `team_drafts`; the owner can directly see the tenant's 36 Draft records through the repaired SELECT policy.
- The active policy is `FOR SELECT TO authenticated`, retains the `game_drafts -> scrim_games -> scrims` join, and uses `user_belongs_to_tenant(scrim.tenant_id)`. RLS remains enabled.
- An isolated non-member can see zero OnceUponATeam `game_drafts` through direct table access and receives no payload from `get_draft_workspace` for that tenant.
- Anonymous direct access to the joined Draft path is denied by the database. The current Security Advisor output has no `game_drafts`-specific finding.
- `node --test scripts/draft-workspace-contract.test.mjs` passed 10/10. Live INSERT and UPDATE policy definitions remain the pre-existing scalar-subquery definitions; the applied SELECT policy is the only observed policy change.

### 3. Blocking issues

- None reproduced in the deployed owner read path or the tenant-isolation checks.

### 4. Important risks

- **Migration provenance:** reconciled on 2026-07-31. The repository source is `20260731124310_repair_multi_workspace_draft_rls.sql`, matching the live migration history; no hosted migration history was altered.

### 5. Unverified but required checks

- A direct runtime write attempt was not made: the existing write policies were inspected as unchanged, but this audit will not target a customer Draft row even inside a rollback transaction. If runtime write-policy evidence is required, use a separately approved non-customer fixture only.

### 6. Suggested next steps

- QA may issue its release recommendation without reopening the customer workflow. Runtime write-policy evidence remains a separate non-customer-fixture decision.

## Decision record

- 2026-07-31 — Created from WO-2026-027's authenticated owner reproduction and read-only hosted policy/log diagnosis. Scope is deliberately limited to the failing SELECT policy; write-policy findings are not implicitly authorized.
