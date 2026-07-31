# WO-2026-027 - Diagnose OnceUponATeam owner Draft-load failure

- **ID reservation:** [WO-2026-027 registry row](../WORK_ORDER_INDEX.md)
- **Status:** Done
- **Assigned owner:** QA and Release Auditor
- **Size:** M
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Safe to implement

## Delivery routing

- **Area / files likely affected:** Read-only review of `src/pages/Draft.tsx`, `src/hooks/useDraftWorkspace.ts`, `src/contexts/TenantContext.tsx`, `src/contexts/RoleContext.tsx`, `public.get_draft_workspace`, current Draft/Scouting RLS policies, OnceUponATeam tenant records, and authenticated staging/production browser/runtime evidence. A later remediation may affect those areas but is out of scope for this order.
- **Dependencies:** An authenticated OnceUponATeam owner session or reproducible error/correlation ID; current hosted function/RLS/migration inventory. Coordinate findings with WO-2026-024 without changing its role-policy scope.
- **Collision risk:** Do not modify Draft, Scouting, role/capability, RLS, or `get_draft_workspace` code/policies while WO-2026-024 QA is active. This order is read-only investigation only; any repair requires a successor work order.

## Problem and user impact

Theo reports that Draft does not load for an owner in the OnceUponATeam workspace, while it works in other workspaces. A tenant-specific owner failure blocks a core Pro workflow and creates a poor customer impression. Current evidence does not distinguish among a malformed tenant record, Draft RPC/RLS data shape, stale active-workspace state, browser/runtime failure, or a deployment-specific regression.

## Why now

The issue affects a real workspace and is not safely explained by a general role gate. Guessing at a shared policy or data repair could expose another tenant or corrupt customer intelligence data, so the next action must establish a minimal reproducible cause first.

## Scope

- Reproduce the failure using the OnceUponATeam owner session and capture the exact route, browser console error, request/RPC response, deployment revision, and safe correlation identifier.
- Compare the authenticated `get_draft_workspace` result and route data lifecycle with a healthy owner workspace, using counts/shape and tenant-scoped metadata only where possible.
- Read-only inspect OnceUponATeam Draft-related references for broken tenant ownership, invalid status/JSON fields, orphaned relationships, or RLS/policy denials that could make the RPC fail or return an unusable payload.
- Verify active workspace selection and owner role resolution before and after a direct `/draft` refresh.
- Produce one evidence-backed diagnosis and either: (a) a no-code recovery instruction, or (b) a new, separately approved remediation work order with exact target, rollback/recovery plan, and validation.

## Explicit non-goals

- Do not edit, delete, backfill, normalise, or otherwise change OnceUponATeam/customer records.
- Do not change Draft/Scouting RLS, RPCs, role capabilities, migrations, or deployment configuration during investigation.
- Do not access or disclose unrelated tenant data, credentials, raw provider payloads, customer email addresses, or scouting content in reports.
- Do not treat a healthy different workspace as proof that OnceUponATeam is healthy, or claim a production-ready fix without hosted owner verification.

## Acceptance criteria

- A reproducible failure record identifies the OnceUponATeam owner role, active workspace, route, deployment revision, and exact safe browser/RPC failure or successful response.
- The diagnosis classifies the cause as browser/client state, tenant data integrity, RLS/RPC authorization, deployment/revision, or unavailable with an explicit evidence gap.
- The read-only comparison establishes whether `get_draft_workspace` returns a valid tenant-scoped dataset for OnceUponATeam and whether its child data shape is consumable by Draft.
- No customer data or hosted configuration is changed during the investigation.
- If remediation is needed, a successor work order contains exact scope, non-goals, target/rollback, approval boundary, and QA matrix before any implementation begins.
- Required evidence level: authenticated browser and hosted read-only verification; no production-ready claim is possible from diagnosis alone.

## Relevant files, workflows, or data areas

- `src/pages/Draft.tsx`, `src/hooks/useDraftWorkspace.ts`, `src/contexts/TenantContext.tsx`, `src/contexts/RoleContext.tsx`
- `public.get_draft_workspace`, `draft_playbooks`, `preparation_briefs`, `draft_scenarios`, `draft_scenario_actions`, `draft_plan_restrictions`, `opponent_teams`, and associated tenant/RLS policies
- `supabase/migrations/20260726153000_draft_workspace_completion.sql`, `supabase/migrations/20260726163000_draft_evidence_split_metadata.sql`, current policy cleanup migrations
- `docs/security/ADVISOR_REVIEW.md`, `docs/operations/INCIDENT_RECOVERY.md`, WO-2026-024 evidence

## Risks

- **Permissions / Supabase RLS:** High. A tempting policy/RPC change could widen cross-tenant Draft access. Preserve tenant membership and owner role checks below the browser.
- **Billing / entitlement:** Medium. Draft remains Pro/Elite-gated; diagnosis must not bypass or change entitlement to make the page load.
- **Email / customer communication:** Not applicable.
- **Production / data:** High. OnceUponATeam is a customer workspace. Read-only investigation is authorised; any data repair, migration, deployment, or config change requires Theo approval under a successor order.

## Required validation

- Capture authenticated owner browser evidence including network response and console error, with sensitive values redacted.
- Perform read-only hosted queries/RPC inspection scoped to OnceUponATeam and a healthy comparison workspace; record aggregate/shape findings without exporting intelligence content.
- Verify active tenant/role context and direct `/draft` refresh behaviour.
- If source changes are proposed later: targeted contracts, ESLint zero warnings, TypeScript, production build, two-tenant role matrix, migration/RLS/grant/Advisor review, and hosted owner verification.

## QA scenario / reproducible test steps

1. Sign in as the OnceUponATeam owner and select that workspace explicitly; open `/draft` from navigation and by direct URL, then refresh.
2. Record visible state, browser console error, network/RPC status, active tenant ID/role metadata, and deployed revision without recording customer intelligence data.
3. With approved read-only access, invoke or inspect `get_draft_workspace` only for the active tenant and compare response schema/counts against an owner session in a healthy workspace.
4. Inspect read-only tenant integrity/RLS evidence for the Draft-linked records identified by the failure; do not alter any row.
5. Classify the cause and attach either a recovery instruction or a new remediation work order. QA independently repeats the original owner journey after any separately approved fix.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Maintain read-only boundary; assess diagnosis and create successor if needed. | This work order. |
| Developer – Fast Lane | Not applicable | Tenant/RPC/RLS diagnostic is M/high-risk shared-data work. | N/A |
| Core Features Developer | Involved | Run read-only technical diagnosis and provide precise reproducible evidence. | Investigation handoff. |
| QA and Release Auditor | Involved | Independently reproduce owner path and review evidence/candidate remediation. | Browser/RPC evidence. |
| Technical Reporting Analyst | Not applicable | No metric/reporting change; do not add instrumentation during incident diagnosis. | N/A |
| Lead Marketer and Growth | Not applicable | No external message or claim work. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Reproducible OnceUponATeam owner failure or successful counter-evidence | Not yet captured | Proposed | Outstanding |
| Tenant-scoped Draft RPC/data diagnosis | Not yet captured | Proposed | Outstanding |
| Safe recovery or separately scoped remediation | Not yet determined | Proposed | Outstanding |

### Final verdict

- **Verdict:** CONDITIONAL
- **Rationale:** The diagnosis is complete: an authenticated owner reproduction and hosted read-only evidence identify an RLS policy cardinality defect. No repair is applied under this investigation; QA must independently review/reproduce before Theo approves the separately scoped WO-2026-029.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Independently reproduce OnceUponATeam owner failure | QA and Release Auditor | Safe owner route/refresh evidence and correlated failure review | Passed 2026-07-31 |
| Review proposed repair scope | QA and Release Auditor / Theo | WO-2026-029 RLS scope, rollback, and matrix accepted before implementation | Passed; implementation-only approval recorded 2026-07-31 |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Read-only investigation | No | Authorised by work-order creation | 2026-07-31 | No data/configuration/code change permitted under this order. |
| Remediation implementation | Yes | Pending | — | Requires a separate work order after diagnosis. |
| Release | Yes | Pending | — | Required for any production fix. |

## Decision and approval record

- 2026-07-31 - Theo reported that OnceUponATeam owner Draft fails to load while other workspaces work. Created as a read-only tenant-specific investigation, separate from WO-2026-024's role-access work.

## Implementation and review evidence

- Reported symptom only: OnceUponATeam owner cannot load Draft; other workspace Draft paths appear to load. No authenticated error, RPC response, or customer data record has yet been captured.
- **Highest evidence achieved:** Proposed investigation

## Developer initial read-only diagnosis - 2026-07-31

- No customer data, deployment, configuration, RLS, RPC, or source change was made.
- Hosted aggregate inspection confirmed that OnceUponATeam is an active Elite workspace with one owner and an enabled `draft_preparation` module. Its release label is `planned`, which is the configured product label; the route gate uses `is_enabled`, so this label alone does not explain a failed load.
- The current `get_draft_workspace` function is tenant-membership gated and returns the expected v2 aggregate shape. The workspace has a small Draft dataset (one plan, one scenario, two actions); aggregate referential-integrity checks found zero missing opponent, brief, playbook, or scenario relationships.
- Current Postgres logs contain no identifiable OnceUponATeam Draft/RPC failure in the available window. The only query errors observed were this investigation's initial schema-column lookups; no customer request was issued.
- **Evidence gap / next required input:** an authenticated OnceUponATeam owner browser session, safe recovery/sign-in path, or support correlation ID/time window. With it, capture `/draft` navigation and refresh behaviour, console error, `get_draft_workspace` request status/response shape, active tenant/role, and deployed revision before classifying browser/client-state, authorization/RPC, tenant-data, or deployment cause.

## Developer authenticated diagnosis - 2026-07-31

- Using Theo's already authenticated owner session, active workspace **OnceUponATeam**, direct navigation to `/draft` and a full page refresh each reproduced the visible state: **“Draft could not be loaded.”** The browser console contained no customer-safe client error. The available browser tooling did not expose a safe RPC response body/status; correlated hosted Postgres logs supplied the backend error evidence.
- Read-only membership inspection showed the affected owner has three workspace memberships, including the OnceUponATeam owner membership. This is the distinguishing condition absent from a single-workspace owner path.
- Contemporaneous hosted Postgres logs reported: `more than one row returned by a subquery used as an expression`. Policy inspection traced that error to `game_drafts`' active SELECT policy, which compares `s.tenant_id` to a scalar subquery over all `tenant_users` rows for `auth.uid()`. `get_draft_workspace` aggregates `game_drafts` into its `team_drafts` payload, so the SELECT policy error aborts the whole RPC for a multi-workspace owner.
- **Diagnosis:** RLS/RPC authorization defect. It is not explained by tenant integrity, the Draft module's release label, or a missing owner capability. Aggregate integrity checks remain clean; no customer intelligence content was exported.
- Created successor [WO-2026-029](WO-2026-029-repair-multi-workspace-draft-rls.md) for a narrowly scoped, separately approved SELECT-policy repair. It preserves write policies and requires multi-workspace/cross-tenant validation before any hosted migration.
- No customer data, RLS policy, RPC, source code, deployment, configuration, or entitlement was changed. **Highest evidence achieved:** authenticated browser reproduction plus hosted read-only logs and policy inspection.

## Independent QA closure - 2026-07-31

### 1. Release verdict: CONDITIONAL

The investigation is complete. The defect is reproducible and WO-2026-029 is approved for implementation only; the corrective migration and release remain separately gated.

### 2. What was verified

- The currently authenticated OnceUponATeam member session showed `Draft could not be loaded` after direct `/draft` navigation and a full refresh.
- Read-only authenticated-RLS reproduction as the affected owner (three workspace memberships) produced the exact error: `more than one row returned by a subquery used as an expression` from `get_draft_workspace`.
- `game_drafts` has RLS enabled. Its existing SELECT policy alone uses the scalar, multi-row `tenant_users` subquery. The record-to-tenant `game_drafts -> scrim_games -> scrims` relationship is intact.
- The standard `public.user_belongs_to_tenant(uuid)` helper is a fixed-search-path membership existence check. It is the appropriate narrow replacement for the scalar predicate; no write-policy, grant, RPC, entitlement, or customer-data change is in scope.

### 3. Blocking issues

- The customer Draft read path remains broken for multi-workspace users until a separately approved hosted migration is applied and verified.

### 4. Important risks

- The current INSERT and UPDATE policies retain the same scalar pattern. They are intentionally excluded from WO-2026-029; do not broaden the repair without new evidence and approval.

### 5. Unverified but required checks

- After implementation and Theo's separate hosted-migration approval: migration review, two-tenant multi-workspace role matrix, cross-tenant and unauthenticated denial, unchanged-write-policy verification, Advisor review, and original owner browser refresh.

### 6. Suggested next steps

- Core Features Developer may implement WO-2026-029 within its existing narrow scope. Theo must separately approve applying that migration to the production-backed Supabase project.
