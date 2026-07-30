# WO-2026-015 - Make Pro analytics legible and outcome-led

- **ID reservation:** [WO-2026-015 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Done
- **Assigned owner:** Core Features Developer
- **Size:** M
- **Risk:** Medium
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing and QA scenario

- **Area / files likely affected:** `Analytics.tsx`, Team Analytics Workspace/panels, analytics filtering and empty/loading/unavailable states, Pro gate, analytics tests.
- **Dependencies:** A representative isolated Pro workspace or approved fixture with recorded games for browser validation.
- **Collision risk:** Analytics components and Pro gates; do not combine with WO-2026-018's broad workspace language changes or a separate analytics refactor.
- **QA scenario / test steps:** (1) Use Free and Pro isolated workspaces, with the Pro workspace containing representative recorded games. (2) Open Team Analytics at desktop, tablet, and mobile widths. (3) Establish the headline takeaway, progressively expose filters, select a drill-down, and test empty/loading/unavailable/error states. (4) Confirm Free sees no invented metrics and Pro values retain their evidence/sample context.

## Problem and user impact

Team Analytics is the core visible Pro upgrade, but the current Free gate only says “Unlock team analytics” and does not show the operational decision it unlocks. The authenticated analytics workspace contains ten simultaneous filters and dense evidence concepts before a coach can orient themselves. This makes the product harder to read and weakens the paid value proposition, especially for teams moving from spreadsheets.

## Why now

Pro conversion is the immediate commercial strategy. A feature that is technically rich but hard to understand cannot justify a paid upgrade. This work should precede any broad new analytics features.

## Scope

- Rework the analytics information hierarchy around three staff questions: “What changed?”, “Why did it change?”, and “Which games support that conclusion?”
- Keep factual/evidence boundaries, qualifying-game counts, drilldowns, and unavailable states; simplify first view through progressive disclosure rather than removing evidence.
- Move lower-frequency filters into an explicit advanced-filter area and rename ambiguous controls in end-user language (for example, data source and data completeness).
- Replace the Free-plan gate with an honest, non-fabricated capability preview that explains the Pro outcome and activation path without showing mock team metrics or claiming unavailable capture.
- Validate the empty-data path, populated-data path, responsive layouts, and Pro/Free entitlement boundary.

## Explicit non-goals

- Do not fabricate dashboard metrics, demo team data, conversion claims, AI insights, or causal performance claims.
- Do not add new data providers, alter Collector/GRID ingestion, change plan pricing, or broaden analytics entitlements.
- Do not remove drilldown/evidence provenance to make the interface look simpler.

## Acceptance criteria

- A coach/manager can identify the current team trend, supporting evidence, and next review entry point without first configuring advanced filters.
- Free users see a truthful explanation of the Pro analytics outcome and what data activates it; Pro users retain data-rich analytics with provenance.
- No more than the essential high-frequency filters are shown initially; advanced filters remain accessible and accurately labelled.
- Empty, partial-evidence, error, and populated states are distinct and responsive.
- Browser tests prove Free gating, Pro access, and no mock-data fallback; tests/build/lint pass.

## Relevant files, workflows, or data areas

- `src/pages/Analytics.tsx`
- `src/components/analytics/TeamAnalyticsWorkspace.tsx`
- `src/components/analytics/CompetitiveAnalyticsPanels.tsx`
- `src/hooks/useTeamAnalytics.ts`, `src/lib/analytics/team-analytics.ts`
- `src/components/billing/PlanGate.tsx`, `src/components/billing/BillingPanel.tsx`

## Risks

- **Permissions / Supabase RLS:** Preserve tenant-scoped analytics queries and do not make a Pro preview a source of protected data.
- **Billing / entitlement:** Free preview must not imply analytics is accessible before Pro entitlement is active.
- **Email / customer communication:** No external copy or campaign is included.
- **Production / data:** No metric backfill, data mutation, provider activation, or deployment is authorised.

## Required validation

- Targeted analytics, entitlement, and copy-contract tests; TypeScript; zero-warning ESLint; production build and bundle budget.
- Authenticated Free and Pro browser checks with an isolated workspace; desktop and mobile visual review.
- Review query shape/RLS for any changed data request and verify no fabricated or cross-tenant output.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Confirm the upgrade outcome and prevent scope expansion into new analytics data. | WO-012 |
| Core Features Developer | Involved | Implement hierarchy, progressive disclosure, and truthful preview. | This work order |
| QA and Release Auditor | Involved | Test entitlement boundary, evidence states, responsiveness, and data provenance. | QA audit |
| Technical Reporting Analyst | Involved | Confirm labels, denominators, and evidence counts remain accurate. | Metrics Dictionary |
| Lead Marketer and Growth | Consulted | Review the upgrade proposition against supported paid-buyer value. | Message Ledger |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Outcome-led analytics hierarchy | Contract coverage plus authenticated populated browser journey | Local automated / hosted browser | Implemented locally; hosted browser outstanding |
| Truthful Free preview | Contract coverage plus Free browser journey and copy review | Local automated / hosted browser | Implemented locally; hosted browser outstanding |
| Evidence/provenance preserved | Contract/query and browser drilldown checks | Local automated / hosted browser | Contract passed; hosted drilldown outstanding |
| Server-side Pro/Elite enforcement | Migration contract plus direct-RPC Free/Pro/cross-tenant checks | Local automated / hosted database | Implemented and contract-tested locally; hosted application and direct-RPC verification outstanding |
| Responsive states | Desktop, tablet, and mobile browser evidence | Hosted browser | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The local outcome-led hierarchy, progressive filters, truthful Free preview, and server-side Pro/Elite analytics guard are implemented and contract-tested. The corrective migration is applied to the hosted project, but authenticated Free/Pro direct-RPC, browser, and responsive verification remain outstanding.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Approve product hierarchy | Theo / Project Manager | Theo implementation approval, 2026-07-30 | Closed |
| Apply server-entitlement migration | Theo / Core Features Developer | Hosted and local migration record `20260730105701_analytics_server_entitlement_enforcement` | Closed 2026-07-30 |
| Verify entitlement and UI | QA and Release Auditor | Direct Free/Pro/cross-tenant RPC results plus authenticated browser evidence | QA open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Pending | — | No plan or data-provider change included. |
| Release | Yes | Pending | — | Requires authenticated Free/Pro evidence. |

**Current implementation record:** Approved by Theo on 2026-07-30. This supersedes the earlier pending implementation placeholder above; release remains pending.

## Decision and approval record

- 2026-07-29 - Founder requested review after identifying difficult-to-read Team Analytics and a need to strengthen Pro value.
- 2026-07-30 - Theo approved implementation. Assign to Core Features Developer; implementation may not change plans, providers, production data, or release state.
- 2026-07-30 - Theo approved the narrow corrective migration and local tests after the QA server-side paid-gate finding. This does not approve hosted migration application, deployment, or release.

## Implementation and review evidence

- Changed `src/components/analytics/AnalyticsPlanPreview.tsx`: added an analytics-specific, evidence-bounded Pro preview. It explains the supported outcome and data activation without showing mock metrics or asserting unavailable capture.
- Changed `src/components/billing/PlanGate.tsx` and `src/App.tsx`: `PlanGate` now accepts an optional route-specific preview; only `/analytics` uses it. The existing Pro route gate and module-state checks remain unchanged.
- Changed `src/components/analytics/TeamAnalyticsWorkspace.tsx`: overview now starts with the three staff questions (what changed, why, supporting games); primary filters are opponent, side, and result; lower-frequency controls moved into an accessible advanced-filter disclosure with clearer data-source and recorded-detail labels.
- Changed `scripts/team-analytics-contract.test.mjs`: added coverage for the outcome-led hierarchy, advanced filters, retained drilldowns, truthful preview copy, and retained Pro route gate.
- Local validation: targeted analytics contract 9/9 passed; full test suite 178/178 passed; ESLint zero warnings; TypeScript passed; production build and bundle budget passed.
- Added `supabase/migrations/20260730105701_analytics_server_entitlement_enforcement.sql`: adds an invoker-security `assert_team_analytics_access` guard and makes `get_team_analytics_dataset` evaluate it before any analytics rows are read. The guard requires tenant membership, a Pro/Elite tier, and enabled `analytics` module state. It keeps the existing RPC invoker security and authenticated-only execute grant.
- Changed `scripts/team-analytics-contract.test.mjs`: added source-contract assertions for the entitlement guard, membership check, guarded dataset query, safe denial, and RPC grants.
- Local validation after the correction: targeted analytics contract 10/10 passed; full test suite 179/179 passed; ESLint zero warnings; TypeScript passed; production build and bundle budget passed.
- Before the approved hosted application, no hosted migration, database function, RLS policy, plan, provider, production data, or deployment had changed.
- **Highest evidence achieved:** Local automated validation.

### Hosted migration evidence - 2026-07-30

- Applied to Supabase project `tvcgjehreaayfazlhvps` with the approved SQL from `20260730105701_analytics_server_entitlement_enforcement.sql`.
- Supabase recorded the applied migration as `20260730105701_analytics_server_entitlement_enforcement`.
- Hosted function inspection confirms the guard requires tenant membership, `pro` or `elite`, and enabled `analytics` module access before the dataset CTE reads rows.
- Hosted grants confirm `anon` cannot execute either the guard or dataset RPC; `authenticated` can execute both, with the entitlement decision enforced inside the RPC.
- The security-advisor scan returned existing project-wide findings, including legacy `SECURITY DEFINER` and RLS-policy notices; it did not identify the new invoker-security analytics guard as a finding. Those existing notices are outside WO-015 scope.

## QA handoff

**Exact work order:** WO-2026-015 - Make Pro analytics legible and outcome-led.

1. Call `get_team_analytics_dataset` directly as an isolated Free tenant member. Expect a safe authorization denial and no dataset.
2. Call the same RPC as an isolated Pro tenant member with representative recorded games. Expect the tenant-scoped dataset only. Retry with another tenant ID and expect denial. Confirm `anon` cannot execute the RPC.
3. In the same Free workspace, open `/analytics` at desktop, tablet, and mobile widths. Confirm the Pro preview contains no team metrics, identifies completed qualifying practice as the activation data, and the billing action routes safely.
4. In the Pro workspace, confirm the default overview answers: what changed, why, and which games support it; then open an evidence/review drilldown.
5. Confirm only opponent, side, and result appear before the Advanced filters action. Open it, use data source and recorded-detail filters, verify the qualifying-game count changes, then clear filters.
6. Verify empty history, filtered-empty, partial-evidence, loading, and unavailable/error states remain factual and distinct. Record only safe route/RPC status, visible state, drilldown, filter effect, and viewport evidence.

The hosted migration is applied. No release, deployment, provider activation, plan change, or hosted data mutation is approved by this handoff.

## Independent QA audit - 2026-07-30

**Historical finding:** This audit describes the pre-remediation hosted state. Its paid-gate bypass has been addressed by the hosted migration evidence above; the required authenticated verification remains open.

### 1. Release verdict: HOLD

The outcome-led UI and truthful Free preview pass local contract review, but the paid analytics dataset remains callable below the browser by any authenticated tenant member. This is an incorrect-billing-access risk and blocks release.

### 2. What was verified

- `node --test scripts/team-analytics-contract.test.mjs` passed 9/9. The changed UI leads with staff questions, keeps only opponent/side/result visible initially, retains drilldowns and qualifying-game counts, and gives Free users a no-mock-metrics preview that routes to Billing.
- The `/analytics` route remains visually gated at Pro in `PlanGate`; no changed analytics migration, RLS policy, provider, plan, or production data is recorded.
- Live Supabase inspection confirms `get_team_analytics_dataset(uuid, date, date)` is invoker-security and includes a tenant-membership check. `anon` cannot execute it.

### 3. Blocking issues

- **Server-side paid-gate bypass:** Live `authenticated` has EXECUTE on `get_team_analytics_dataset(uuid, date, date)`. Its current definition contains a membership check but no `subscription_tier` or `tenant_feature_access`/analytics-entitlement check. A Free workspace member can call the tenant-scoped RPC directly and retrieve its analytics dataset, bypassing the browser-only Pro gate. This violates the paid-feature contract and ScrimStats server-side authorisation rule.

### 4. Important risks

- No staging deployment evidence is recorded for the UI work, and no authenticated Free/Pro browser or responsive run has been supplied. Local tests and source inspection do not prove the deployed customer journey.

### 5. Unverified but required checks

- After remediation: direct Free RPC denial, Pro RPC success, cross-tenant denial, and contract coverage for every analytics entry point.
- Staging Free/Pro desktop, tablet, and mobile checks for preview, populated evidence, empty/filtered-empty, partial-evidence, loading, unavailable/error, filter clearing, and drilldown provenance.

### 6. Suggested fixes or next validation steps

1. Return to Core Features Developer for one narrow, forward-only database remediation: retain the membership predicate and add an authoritative Pro-or-Elite analytics entitlement check inside `get_team_analytics_dataset`; return a safe denial before reading analytics rows.
2. Add direct-RPC contract coverage for Free denial, Pro allow, and cross-tenant denial. Do not rely on `PlanGate` as the security boundary.
3. Theo must approve the production-backed migration application before it is applied. Then deploy the UI to staging and provide isolated Free/Pro browser sessions for the full matrix.

## Developer remediation - 2026-07-30

The blocking paid-gate bypass is corrected by `20260730105701_analytics_server_entitlement_enforcement.sql`. The forward-only migration preserves the existing tenant-membership predicate and adds a server-side Pro/Elite plus enabled-analytics-module decision before `get_team_analytics_dataset` can read or return rows. The accompanying contract test covers the guard structure and public grant boundary. The SQL is applied to the hosted project; QA must now complete the authenticated direct-RPC and browser matrix above.

## Independent QA re-review - 2026-07-30

### Outcome: Pass with follow-up — work order remains Ready for QA

The original incorrect-billing-access blocker is closed. The implementation is not release-ready yet because the required authenticated Pro browser and responsive acceptance checks have not been evidenced.

### Evidence independently verified

- `node --test scripts/team-analytics-contract.test.mjs`: passed 10/10 locally.
- Hosted project `tvcgjehreaayfazlhvps` records migration `20260730105701_analytics_server_entitlement_enforcement`.
- The live guard is `SECURITY INVOKER`, has a tenant-membership predicate, requires `pro` or `elite`, and requires enabled `analytics` module access. Neither `anon` nor `PUBLIC` can execute the guard or dataset RPC; `authenticated` can execute the dataset RPC only through that guard.
- Read-only, role-simulated direct-RPC checks using approved non-customer accounts:
  - Free tenant member calling its own dataset: denied with SQLSTATE `42501` and `Analytics access is unavailable for this workspace`.
  - Entitled tenant member calling its own dataset: returned the normalised `team-analytics-v3` contract; the result contained no raw-provider-payload key.
  - The same entitled member calling an unrelated tenant: denied with the same safe `42501` response.
- Source review confirms the Free preview contains no sample metrics, `/analytics` retains the Pro route gate, the default workspace leads with the three staff questions, and lower-frequency controls are behind `Advanced filters`.

### Remaining release checks — Theo must approve or complete

1. Provide or sign in to an isolated **Pro** test workspace on the staged deployment. QA must verify its direct analytics RPC succeeds and its `/analytics` page renders the normalised, tenant-scoped result. The entitled direct-RPC proof above used Elite, so it does not substitute for the required Pro proof.
2. In the isolated Free workspace, verify `/analytics` at desktop, tablet, and mobile widths: truthful preview, no team metrics, and safe Billing action.
3. In the isolated Pro workspace, verify desktop, tablet, and mobile: default hierarchy; Advanced filters open/use/clear; drilldown; populated, empty, filtered-empty, partial-evidence, loading, and unavailable/error states.
4. Record the staging deployment identifier/commit serving those checks. A source checkout and hosted database migration do not prove the staged browser bundle.
5. After the four checks pass, Theo must explicitly approve release/promotion. This QA review does not approve deployment or release.

### Validation limitation

- The focused Node contract test was independently run. The wider package-script suite could not be rerun in this environment: the configured `npm` launcher is missing and the fallback package manager could not access its registry. This is an environment limitation, not a passing validation result.

## Theo completion decision - 2026-07-30

Theo completed manual staging checks while conducting other validation and approved WO-2026-015 to move to Done. This accepts the documented environment limitation for the wider local package-script suite. The hosted server-side Free denial, entitled access, and cross-tenant denial evidence remains recorded above; no production deployment is authorised by this work-order completion.
