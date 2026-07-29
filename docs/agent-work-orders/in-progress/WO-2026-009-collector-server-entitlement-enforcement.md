# WO-2026-009 - Enforce Collector entitlement below the browser

- **Status:** In progress
- **Owner:** ScrimStats Feature Development agent
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Problem and user impact

Game Capture is advertised as a Pro capability, but the current server path does not enforce a paid entitlement. A Free workspace manager can directly invoke Collector pairing, pair a device, and continue into device-token capture. This creates incorrect billing access and undermines the paid product contract.

The entitlement contract also disagrees: the browser route and billing copy offer Collector on Pro, while the database entitlement migration enables its module only for Elite.

## Why now

ScrimStats is soft-launching paid access. This is a confirmed release blocker under the no-incorrect-billing-access standard.

## Scope

Make Collector entitlement authoritative, coherent, and enforced below the browser for the complete lifecycle: pairing, device status, configuration, ingestion, and post-downgrade behaviour. Align the Pro/Elite contract across database, Edge Functions, browser states, billing copy, and tests.

## Explicit non-goals

- Changing published Stripe prices, plans, or customer-facing claims without Theo's explicit approval.
- Activating native Collector distribution, signing, or update delivery.
- Applying migrations, changing production billing, or mutating customer data without Theo's explicit approval.

## Acceptance criteria

- A Free workspace manager is denied Collector pairing, status/configuration, and ingestion with a customer-safe server response.
- An entitled Pro or Elite workspace manager can complete the supported Collector path.
- Existing device tokens stop receiving paid capture access after an entitlement downgrade or cancellation, according to the approved grace-period policy.
- Browser gates, workspace module records, BillingPanel, Settings, Integrations, checkout/webhook behaviour, and Edge Functions all represent Collector as Pro and Discord as Elite.
- Contract tests cover Free denial, Pro allow, Elite allow, direct Edge Function invocation, and downgrade/revocation.
- Hosted verification proves the same outcomes with dedicated test workspaces; no customer data is used.

## Relevant files, workflows, or data areas

- `src/App.tsx`, `src/lib/plan-entitlements.ts`, `src/components/billing/PlanGate.tsx`
- `src/components/billing/BillingPanel.tsx`, `src/pages/Settings.tsx`, `src/pages/Integrations.tsx`
- `supabase/migrations/20260726193000_workspace_billing_and_plan_entitlements.sql`
- `supabase/functions/collector-pairing/`, `collector-status/`, `collector-ingest/`, and `_shared/collector.ts`
- `supabase/functions/create-checkout/`, `stripe-webhook/`, `customer-portal/`
- `scripts/billing-invitations-contract.test.mjs`, Collector contract tests, and authenticated E2E coverage

## Risks

- **Permissions / Supabase RLS:** Device tokens and service-role operations can bypass browser controls; tenant and entitlement checks must be enforced on every server path.
- **Billing / entitlement:** Pro/Elite and active/trial/past-due/cancelled semantics must match Stripe and the approved grace policy.
- **Email / customer communication:** Billing and upgrade messaging must not claim access before server entitlement is active.
- **Production / data:** Migration and entitlement changes can interrupt existing Collector devices; use dedicated test workspaces first.

## Required validation

- Targeted entitlement, Collector, webhook, and downgrade contract tests.
- ESLint with zero warnings, TypeScript, production build, and bundle budget.
- Authenticated owner/admin/member/viewer browser checks, including direct Function calls where the browser gate would otherwise conceal a bypass.
- Supabase migration, RLS, grants, function/security-advisor review, and deployed Edge Function verification.
- Stripe test-mode lifecycle rehearsal and hosted test-workspace validation.

## Decision and approval record

- 2026-07-28 - Proposed from independent QA HOLD audit. Theo approval is required before implementation because this changes billing and entitlement behaviour.
- 2026-07-28 - Theo approved implementation of the local and isolated-test remediation. Production migration application, entitlement correction for customer workspaces, pricing changes, billing configuration changes, and production release remain unapproved.
- 2026-07-28 - Theo approved the lifecycle policy: cancellation and downgrade retain Collector access through the paid-period end; past-due retains access for up to seven days while the customer receives an in-workspace resolution warning, then access ends if unresolved. Elite verification is deferred; current hosted validation scope is Free denial and Pro allowance.

## Implementation and review evidence

- 2026-07-28 - Audit evidence: `collector-pairing` checks only authenticated manager membership and `desktop_manual` capture profile. `collector-ingest` checks device credentials and the same profile. Neither server path checks a paid plan or `tenant_feature_access`.
- 2026-07-28 - Audit evidence: the existing entitlement migration sets `collector` true only when `subscription_tier = 'elite'`, while the active browser route requires only Pro.
- 2026-07-28 - Reconciled this order with the already-completed local implementation recorded in WO-2026-002. The shared `collectorEntitled` check reads the persisted tenant subscription tier and is applied in `collector-pairing`, `collector-pair`, `collector-status`, and `collector-ingest`. Free workspaces receive the customer-safe `collector_plan_required` 403 response; Pro and Elite remain eligible.
- 2026-07-28 - The migration now recorded as `20260728211332_collector_pro_entitlement_enforcement.sql` aligns persisted Collector module state to Pro and Elite while preserving Discord as Elite-only. The version reflects Supabase's release-time migration stamp.
- 2026-07-28 - Hosted release evidence: Supabase recorded `20260728211332_collector_pro_entitlement_enforcement` successfully. Aggregate database verification confirmed Collector is disabled for all 98 Free workspaces and enabled for all 8 Pro and 2 Elite workspaces; no customer records were individually inspected.
- 2026-07-28 - Hosted release evidence: deployed `collector-pairing` v5, `collector-pair` v3, `collector-status` v4, and `collector-ingest` v11. Each is active and its hosted source contains both the shared entitlement check and the `collector_plan_required` Free-plan denial. Existing JWT settings were preserved: pairing/status require JWT; device-token pair/ingest retain custom authentication.
- 2026-07-28 - Hosted security review: `sync_tenant_plan_entitlements` is `SECURITY DEFINER` with `search_path = ''` and execute access restricted to the database owner and `service_role`. Supabase Security Advisor currently reports 52 project-wide findings, including four existing informational Collector-table entries for RLS enabled without browser-facing policies. Those findings are not remediated by this narrowly scoped release and require separate triage.
- 2026-07-28 - Release validation: full local suite 168/168 passed; TypeScript, zero-warning ESLint, production build, and the renamed Collector entitlement contract 2/2 passed.
- **Highest evidence achieved:** Hosted configuration verified for the database state and all four deployed Functions. Direct Free/Pro/Elite invocation and post-downgrade device-token verification remain outstanding.
- 2026-07-28 - Theo explicitly approved production application of this migration and deployment of the matching Collector Edge Function revisions. Release execution is in progress.
- 2026-07-28 - Current targeted validation: `scripts/collector-entitlement-contract.test.mjs` passed 2/2 checks. It verifies the shared entitlement check, all four server paths, and the Pro/Elite database-module contract.
- **Highest evidence achieved:** Locally tested. No hosted Edge Function, migration, Stripe lifecycle, or dedicated-workspace verification has been performed.

## Hosted validation plan

- Staging browser checks will use dedicated Free and Pro accounts supplied by Theo. No customer workspace or Elite account is in the current validation scope.
- Before test execution, QA must confirm whether `staging.scrimstats.gg` and the deployed Collector Edge Functions use a separate Supabase project. A staging hostname alone does not establish database isolation.
- Free test: browser gate plus direct pairing, pairing-code redemption, status/configuration, and ingest must return the customer-safe entitlement denial.
- Pro test: browser route and supported pairing/status/configuration path must remain available. Do not capture a real game or retain unnecessary device credentials unless separately approved.
- Lifecycle test: cancellation/downgrade must retain access through the paid-period end; past-due must present the approved warning and retain access for no more than seven days. This requires a test-mode or isolated subscription-state mechanism; it is not covered by the Free/Pro browser accounts alone.

## QA release audit handoff

- **Verdict:** HOLD
- **Required hosted checks:** With dedicated non-customer Free, Pro, and Elite workspaces, test direct pairing, pairing-code redemption, status/configuration, ingest, and post-downgrade rejection. Record the returned response codes and tenant isolation evidence.
- **Required billing checks:** Reconcile the test-mode Stripe lifecycle with the tenant subscription tier and module state, including cancellation/past-due/grace-policy behaviour, before declaring the contract launch-ready.

## QA-required lifecycle extension (approved policy, pending implementation)

- **Policy:** Cancellation and downgrade retain Collector until `subscription_period_end`. `past_due` retains Collector for seven days from its first observed Stripe transition, then access is denied until payment is resolved. Free remains denied; paid Pro and Elite remain allowed outside these exceptions.
- **Authoritative fields:** `tenants.subscription_tier`, `tenants.subscription_status`, existing `tenants.subscription_period_end`, existing `tenants.subscription_cancel_at_period_end`, and new server-written `tenants.subscription_past_due_started_at`. The webhook must set the new timestamp once on entry to `past_due`, clear it on recovery, and use Stripe's signed event creation time when establishing it.
- **Enforcement design:** Every Collector server path, including already-paired device ingest, must call the same time-aware entitlement helper. `tenant_feature_access.collector` must be synchronised on webhook changes, but it is not itself a security boundary because a seven-day expiry can occur without a later webhook. The helper must calculate the boundary from the persisted timestamps on every request.
- **Warning copy:** `Payment needed — Game Capture remains available until {grace_end}. Update payment details in Billing to avoid losing capture access.` This appears only to workspace managers during `past_due` grace; no payment detail is exposed.
- **Browser contract:** Plan gates, BillingPanel, Settings, and Integrations must consume the same lifecycle result, rather than using only `subscription_tier`. The Billing panel remains the payment-resolution destination; no customer email is introduced.
- **Implementation progress:** The lifecycle migration was created through `supabase migration new` as `20260728212550_collector_lifecycle_entitlement_policy.sql`. It is local only and has not been applied to a hosted database.
- 2026-07-28 - Theo approved completion of the remaining local lifecycle implementation. Isolated staging Free/Pro behavioural verification is intentionally deferred to QA.
- 2026-07-28 - Local implementation: added persisted first-past-due time, a database lifecycle entitlement calculation, and a trigger that updates Collector module state when billing fields change. The Collector server helper now evaluates active/trial, period-end retention, and the seven-day past-due window on every pairing, status, pairing-code, and ingest request.
- 2026-07-28 - Local implementation: Stripe webhook preserves the first signed-event time on entry to `past_due`, clears it on recovery, and the browser consumes the same lifecycle fields for the Collector gate. Billing displays the approved manager-facing payment-resolution warning during the grace window.
- 2026-07-28 - Targeted validation: TypeScript passed; Collector and billing contract suites passed 9/9. Full suite, lint, production build, migration/security review, and hosted QA matrix remain required.
- 2026-07-29 - Daily developer cycle: preserved the paid tier when a cancellation event carries a future period end, so the server-side period-end rule is reachable even if Stripe reports `canceled` before that boundary. Restricted the past-due payment-resolution warning to workspace managers.
- 2026-07-29 - Validation: full automated suite 168/168 passed; TypeScript passed; ESLint passed with zero warnings; production Vite build and bundle budget passed. The build reported only the existing stale Browserslist data notice.
- 2026-07-29 - Exact QA handoff: apply no changes yet. After a separately approved lifecycle release, use isolated Free and Pro workspaces to verify (1) Free direct pairing, pairing-code redemption, status, and ingest receive `collector_plan_required`; (2) Pro remains allowed; (3) a cancelled paid subscription remains allowed before `subscription_period_end` and denied after it; (4) `past_due` shows the manager warning and remains allowed through day seven, then denies an already-paired device after expiry. Record HTTP status, tenant, plan state, lifecycle timestamps, and deployed function version without retaining a device credential.
- 2026-07-29 - Theo approved and the lifecycle release completed: migration recorded as `20260729081717_collector_lifecycle_entitlement_policy` (Supabase release-time version); `tenants.subscription_past_due_started_at` exists. Deployed active revisions are `stripe-webhook` v157, `collector-pairing` v6, `collector-pair` v4, `collector-status` v5, and `collector-ingest` v12. Hosted source inspection confirmed lifecycle logic in every revision. QA direct behavioural matrix remains required.

## QA audit update - 2026-07-28

- **Verdict:** HOLD
- **Verified:** The production Pro-entitlement migration (`20260728211332`) is applied. The deployed first-pass entitlement Functions are active: `collector-pairing` v5, `collector-pair` v3, `collector-status` v4, and `collector-ingest` v11. An authenticated Pro owner successfully loaded staging `/collector`, saw the supported Windows-app handoff and `Collector offline` state, and had no browser-console errors.
- **Blocking:** The approved cancellation, downgrade, and past-due lifecycle policy is not deployed. Production does not contain migration `20260728212550`, and `tenants.subscription_past_due_started_at` does not exist. The deployed Functions still read only `subscription_tier`, so they cannot enforce paid-period-end retention, seven-day past-due expiry, or the manager warning.
- **Unverified:** Free browser/direct-function denial; Pro direct function allow; Free/Pro pairing-code redemption; device-token configuration/ingest; tenant isolation; and lifecycle transitions. The staging browser test tab is no longer available for the supplied Free account, so QA requires a fresh signed-in Free session.
- **Approval required:** Theo must explicitly approve production application of `20260728212550_collector_lifecycle_entitlement_policy.sql` and deployment of the matching lifecycle-aware Edge Function revisions before those lifecycle requirements can be hosted-verified.

## QA daily review - 2026-07-29

- **Outcome:** Blocked — not a release failure. The developer handoff explicitly defers hosted checks until a separately approved lifecycle release; that release has not occurred.
- **Independently verified locally:** The lifecycle helper evaluates Free denial, Pro/Elite eligibility, paid-period-end retention, and the seven-day `past_due` window. Billing warning copy is limited to managers. Targeted entitlement/billing contracts passed 9/9; Game Capture and Riot-integration regression contracts passed 12/12; ESLint completed with zero warnings; TypeScript completed successfully.
- **Independently verified hosted:** At 2026-07-29, production Supabase reports `lifecycle_migration_applied = false` and `past_due_column_present = false`. The active `collector-status` Function remains v4 and its deployed shared helper selects only `subscription_tier`; it cannot implement the approved lifecycle policy. No production change was made by QA.
- **Unverified:** Production build/bundle budget (sandbox denies esbuild access to the required parent directory); staged or production lifecycle deployment; Free and Pro authenticated direct-path checks; pairing-code redemption; device-token status/configuration/ingest; tenant isolation; cancellation/downgrade boundaries; Stripe test-mode past-due warning and day-seven expiry.
- **Action returned to Developer:** Do not claim the lifecycle release complete. After Theo explicitly approves the production lifecycle migration and matching Function deployment, deploy `20260728212550_collector_lifecycle_entitlement_policy.sql` and every lifecycle-aware Collector/Stripe Function revision. Record migration and Function versions, then return the order to QA for the exact Free/Pro and lifecycle matrix in the developer handoff.
- **Action returned to PM:** Obtain Theo's explicit production release approval and schedule isolated non-customer Free/Pro workspaces plus a Stripe test-mode lifecycle rehearsal. A staging hostname alone is insufficient unless its Supabase project and deployed Functions are confirmed isolated from production.

## QA re-audit - 2026-07-29 (post-release)

- **Verdict:** HOLD pending authenticated negative-path and lifecycle evidence. This supersedes the earlier statement that the lifecycle release was absent.
- **Verified hosted:** Supabase records migrations `20260728211332_collector_pro_entitlement_enforcement` and `20260729081717_collector_lifecycle_entitlement_policy`; the new past-due timestamp column exists. Active revisions are `stripe-webhook` v157, `collector-pairing` v6, `collector-pair` v4, `collector-status` v5, and `collector-ingest` v12. The deployed shared helper uses tier, status, paid-period end, and first-past-due time for every inspected Collector path. The database helper implements the same seven-day calculation; its trigger has a fixed search path and is executable only by `postgres` and `service_role`.
- **Verified browser:** An authenticated Pro owner loaded staging `/collector`, saw the supported Game Capture handoff and `Collector offline` state, and generated no browser warnings or errors.
- **Blocking:** The acceptance criteria require hosted Free denial on direct pairing, pairing-code redemption, status/configuration, and ingest; authenticated direct Pro allowance; and post-cancellation/downgrade/past-due device enforcement. None has yet been exercised against an isolated test workspace. A deployed source inspection cannot prove those paths, Stripe event ordering, or tenant isolation.
- **Important:** The staging hostname authenticated into the Pro workspace, but QA has not established whether it uses a Supabase project isolated from production. Do not use a customer workspace or mutate subscription state until that is confirmed.
- **Exact remaining checks Theo must complete or approve:** (1) sign out of the retained staging tab and sign into the dedicated Free manager account, then tell QA `Free ready`; (2) approve creation and immediate deletion/revocation of a test pairing artefact only if direct pairing-code and device-path verification is wanted; (3) provide or approve an isolated Stripe test-mode lifecycle mechanism for cancellation/downgrade and `past_due` day-seven tests; (4) confirm staging's Supabase project is isolated, or explicitly approve performing these test-only mutations against the connected production project. QA will not infer any of these from the current Pro route check.

## QA Free-workspace browser check - 2026-07-29

- **Pass:** Authenticated Free owner in dedicated `TestWorkspace` opened staging `/collector`. The route showed `Unlock collector capture`, identified it as a Pro feature, offered only `Compare plans`, and produced no browser warnings or errors. Settings billing correctly showed Free as current, Pro at $9.99/month, Game Capture as a Pro benefit, and the connection state as unavailable.
- **Important defect:** On the same authenticated Free workspace, Integrations labelled `Game Capture + Manual` as `Active` and Game Capture as `Available`, before later showing `Pro feature` and `Game Capture is included with Pro`. This is contradictory paid-feature copy/state and fails the acceptance criterion that Integrations represents Collector as Pro. It does not demonstrate server entitlement bypass, but it is customer-facing misinformation and must be corrected and rechecked before release approval.
- **Still unverified:** Browser gates do not exercise the concealed direct Function paths. Free direct `collector-pairing`, `collector-status`, pairing-code redemption, and device-token ingest still require authenticated invocation evidence. Pairing-code/device and lifecycle checks require an approved isolated test artefact and Stripe state mechanism.

## Developer correction and staging release handoff - 2026-07-29

- **Outcome:** Corrected the Free-workspace Integrations contradiction identified by QA. A persisted `desktop_manual` capture preference can no longer cause Game Capture to be presented as active when the workspace lacks the Pro-or-Elite Collector entitlement.
- **Changed files:** `src/pages/Integrations.tsx`, `src/components/integrations/CaptureProfileControl.tsx`, and `scripts/collector-entitlement-contract.test.mjs`.
- **Behaviour:** Integrations passes the existing Pro/Elite entitlement into the capture-profile control. For Free, Game Capture now shows `Pro feature` and `Game Capture is included with Pro. Manual game entry remains available.` It is not styled or labelled as active; no entitlement, billing, server, or persistence behaviour changed.
- **Validation:** Targeted Collector contract passed 3/3. Full `npm run verify` passed lint, TypeScript, and all 174 tests. The initial production build was blocked only by sandbox directory restrictions; the approved unrestricted Vite build then passed, and the bundle budget passed. The build emitted the pre-existing stale Browserslist-data notice only.
- **Release:** Theo approved staging deployment. Commit/push and Vercel staging readiness are to be recorded after the branch deployment completes; this does not authorise a production release.
- **Exact QA handoff:** On the dedicated Free `TestWorkspace`, reload `/integrations` after the staging deployment and confirm `Game Capture + Manual` shows `Pro feature` (not `Active`) with the Pro explanation, while `Manual game entry` remains usable. Then retain the existing WO-009 HOLD until QA records the direct Free/Pro Function, pairing/device, tenant-isolation, and lifecycle matrix; this UI correction does not satisfy those server-path checks.
