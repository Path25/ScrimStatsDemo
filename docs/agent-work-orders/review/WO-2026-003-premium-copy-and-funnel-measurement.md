# WO-2026-003 - Protect premium copy and establish funnel measurement

- **Status:** Blocked
- **Assigned owner:** QA
- **Size:** L
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing and QA scenario

- **Area / files likely affected:** Copy integrity tests, funnel migration/triggers, scorecard RPC/surface, Metrics Dictionary, and production grant evidence.
- **Dependencies:** WO-2026-010 grant evidence and the deployed founder scorecard; isolated test workspace only.
- **Collision risk:** Do not alter funnel schema, grants, trigger functions, scorecard surface, or analytics definitions while QA exercises the ledger.
- **QA scenario / test steps:** (1) In an isolated tenant, exercise registration/workspace creation, first schedule, first completed recorded game, activation, and an approved paid transition. (2) Retry each source action where idempotency applies. (3) Verify aggregate-only, service/operator-only scorecard access and ordinary browser-role denial. (4) Check copy-integrity output, trigger records, empty/unavailable/error states, and preserve no sensitive event payload.

## Problem and user impact

Customer-visible encoding corruption undermines ScrimStats' premium quality bar. The business also needs reliable evidence from registration through activation and paid conversion rather than registration counts alone.

## Why now

First impressions and commercial acquisition are the stated primary blockers, while the 30-day objective depends on real subscriptions.

## Scope

Remove customer-visible encoding defects, expand copy-integrity checks, define privacy-preserving funnel milestones, and surface an approved founder scorecard from authoritative data.

## Explicit non-goals

- A marketing campaign or customer outreach.
- Collecting Riot credentials, player records, game payloads, IP addresses, or free-form tracking metadata.
- Publishing or changing public claims without approval.

## Acceptance criteria

- Customer-facing source and rendered screens contain no encoding corruption.
- Copy-integrity checks cover public, authentication, billing, and workspace customer surfaces.
- Funnel definitions are documented and derive from authoritative server-side events.
- The scorecard distinguishes unavailable data from measured values.

## Relevant files, workflows, or data areas

- `src/pages/Landing.tsx`, `src/components/billing/BillingPanel.tsx`, `src/components/integrations/RiotApiIntegration.tsx`, `index.html`
- `scripts/premium-copy-integrity.test.mjs`, `scripts/funnel-instrumentation-contract.test.mjs`
- `supabase/migrations/20260728103000_premium_copy_and_funnel_instrumentation.sql`
- `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`

## Risks

- **Permissions / Supabase RLS:** Funnel events and scorecard functions must remain service-only unless a separately authorized role is designed.
- **Billing / entitlement:** Paid-upgrade events must reconcile with Stripe rather than infer revenue from plan labels.
- **Email / customer communication:** Copy changes can affect transactional emails and public claims.
- **Production / data:** Analytics must be privacy-preserving, release-safe, and not backfill or mutate customer records unexpectedly.

## Required validation

- Targeted copy and funnel contract tests, lint, typecheck, production build, and browser checks.
- Migration/RLS/function review and Supabase advisor check.
- Hosted verification using a dedicated test workspace, with no sensitive event payload retained.

## Decision and approval record

- 2026-07-28 - Proposed from founder review.
- 2026-07-28 - Theo approved implementation: "I approve WO-003, it is safe to implement." Hosted migration application, deployment, production-data changes, billing changes, and customer communications remain unapproved.
- 2026-07-28 - Theo approved the canonical activation definition: first scheduled practice block plus first completed recorded game.
- 2026-07-28 - Theo approved application of the reviewed additive funnel migration to production. No production test-data creation, billing changes, or customer communications are approved by this decision.
- 2026-07-28 - Theo approved isolated non-customer hosted test-workspace verification for the reviewed migration and funnel workflow. This does not authorise customer-data changes, billing changes, customer communications, or a production release beyond the separately recorded migration decision.
- 2026-08-03 - Theo directed that WO-003 should wait for activity to occur naturally. No synthetic/test workflow or production-backed test-data creation is authorised by this direction. Retain the HOLD until a naturally occurring, authorised, privacy-safe eligible journey can be inspected using aggregate or redacted evidence.

## Implementation decision

- Activation is defined as a workspace having both its first scheduled block and first recorded game.
- A paid upgrade is recorded only after the workspace subscription transitions from Free to an `active` Pro or Elite subscription. Checkout intent, failed payment, and past-due state do not count.
- Funnel milestones are first-party, append-only, service-only events derived from authoritative database writes. They retain no email, IP address, device identifier, Riot credential, player record, game payload, or free-form tracking metadata.

## Implementation and review evidence

- Added `supabase/migrations/20260728103000_premium_copy_and_funnel_instrumentation.sql` with service-only funnel storage, RLS, idempotent triggers, and `get_founder_funnel_scorecard`.
- Added `scripts/premium-copy-integrity.test.mjs` covering `src/`, `public/`, `index.html`, Auth templates, and the shared transactional-email renderer.
- Added `scripts/funnel-instrumentation-contract.test.mjs` covering milestone sources, privacy bounds, idempotency, RLS, and service-only scorecard access.
- Local verification on 2026-07-28: 164/164 tests passed; TypeScript passed; ESLint passed with zero warnings; production build and bundle budget passed; desktop, 768px tablet, and 390px mobile public-route checks passed with no horizontal overflow or error overlay.
- Source inspection found no stored mojibake in the named customer surfaces; the observed terminal rendering issue was not a source-encoding defect. The new integrity test protects against a real regression.
- **Highest evidence achieved:** Browser verified

## Review and release blockers

- The migration was applied to production as `20260728154602` (`premium_copy_and_funnel_instrumentation`) on 2026-07-28. This is schema/deployment evidence, not workflow evidence.
- QA production review confirmed `workspace_funnel_events` has RLS enabled, no `anon` or `authenticated` table privileges, and `get_founder_funnel_scorecard` executable only by `service_role`. All five intended triggers are enabled.
- QA production review found no retained funnel events yet. No account/workspace/schedule/game/upgrade workflow can therefore be inferred as exercised after migration application.
- **Important:** the table is not truly append-only for the service role: it retains DELETE, UPDATE, TRUNCATE, REFERENCES, and TRIGGER privileges in addition to SELECT and INSERT. Theo must explicitly approve a corrective production migration before those privileges are narrowed.
- Supabase Advisor reports `workspace_funnel_events` as RLS-enabled-with-no-policy. This is expected for the current service-only design because browser roles have no table grants; it is not evidence of browser access. The advisor also contains pre-existing project-wide findings that are outside this work order.
- QA must still verify, in the approved isolated non-customer workspace, registration, workspace creation, first schedule, first completed recorded game, activation, active paid upgrade, retry idempotency, service-only scorecard access, and browser-role denial before release approval.

## QA audit update - 2026-07-28

- **Verdict:** HOLD
- **Verified:** Production migration presence; trigger enablement; RLS; browser-role denial for the table and scorecard function; no post-migration events in the aggregate ledger.
- **Blocking:** No isolated hosted workflow has exercised the milestone triggers or scorecard. The scorecard has no implemented authenticated founder surface, so it cannot yet distinguish unavailable data from measured values for its intended operator.
- **Important:** Service-role write privileges contradict the claimed append-only ledger. Correct by migration only after Theo's explicit production approval.
- **Accepted by Theo:** Hosted paid-upgrade / Stripe lifecycle verification is accepted for this work order on 2026-07-28 because Theo confirmed that the Stripe system had been completed and verified previously. This exception applies only to WO-2026-003; it does not resolve or change the separate Stripe-to-entitlement reconciliation HOLD in WO-2026-008.
- **Unverified:** Registration, workspace creation, first schedule, first completed recorded game, activation, retries/idempotency in hosted use, browser responsive states for a scorecard surface, and any hosted deployment that exposes a founder scorecard safely.

## QA daily review - 2026-07-30

### Outcome: Blocked

- **Reproducible evidence:** `node --test scripts/premium-copy-integrity.test.mjs scripts/funnel-instrumentation-contract.test.mjs` passed 3/3. Live read-only inspection still shows migration `20260729090523` applied; all five named funnel triggers enabled; zero retained funnel events; RLS enabled with zero policies; no table or scorecard-RPC access for `anon` or `authenticated`; and `service_role` limited to ledger `SELECT`/`INSERT` plus scorecard execution.
- **Why blocked:** No dedicated non-customer authenticated test session was available to exercise the approved workflow, and this daily review did not create production-backed test data. With zero events, trigger operation, idempotency, activation, and scorecard measurement remain unproved.
- **Advisor:** The funnel-table RLS-without-policy information item remains expected for its no-browser-grants design. The dated Security Advisor also retains the known project-wide SECURITY DEFINER and leaked-password-protection warnings; none was introduced or hidden by this work order.

### Exact remaining checks Theo must approve or complete

1. Provide a dedicated non-customer test workspace signed-in session and reconfirm that QA may create the minimum temporary schedule and completed-game records in the production-backed staging project.
2. QA will verify registration/workspace creation where applicable, first schedule, first completed game, one repeat attempt for idempotency, activation, and aggregate scorecard output; it will record milestone names/counts only and remove/revoke only artefacts that have an approved recovery path.
3. PM must retain any founder/operator browser scorecard exposure under WO-011. This work order must not expose raw funnel events to a browser role.

## QA assigned-order refresh - 2026-07-29

### 1. Release verdict: HOLD

The privacy and append-only controls are now materially stronger, but the required isolated hosted journey has not generated a single funnel event. The scorecard therefore cannot yet be treated as measured operational evidence.

### 2. What was verified

- **Local contracts:** `scripts/premium-copy-integrity.test.mjs` and `scripts/funnel-instrumentation-contract.test.mjs` passed 3/3 combined.
- **Hosted trigger/configuration:** All five named funnel triggers are enabled: account registration, workspace creation, first scheduled block, first recorded game, and first paid upgrade.
- **Hosted data and privileges:** The funnel ledger currently contains zero events. `anon` and `authenticated` have no table privileges or scorecard execution. `service_role` retains only SELECT/INSERT on the ledger, no non-append-only table privileges, and can execute the scorecard. This includes the later WO-010 grant remediation.

### 3. Blocking issues

- No approved non-customer hosted journey has exercised registration/workspace/schedule/completed-game triggers, activation, or scorecard output. Zero rows are correctly reported as unavailable, not evidence that the funnel is working.

### 4. Important risks

- The previously recorded service-role append-only privilege defect is remediated by WO-010; this work order must retain a linked operational trigger exercise rather than infer one from grants and source inspection.

### 5. Unverified but required checks

- One authorised non-customer workflow: registration, workspace creation, first scheduled practice block, first completed recorded game, activation, retry idempotency, and resulting service-only scorecard milestones.
- Any founder/operator scorecard browser surface remains separately governed by WO-011; do not expose raw ledger events.

### 6. Suggested next validation steps

1. Theo confirms the existing isolated non-customer funnel-test approval still applies to the production-backed staging project and supplies/opens the dedicated test account.
2. QA performs the one controlled workflow and records only milestone names/counts, then reissues the verdict.

## QA daily brief - 2026-08-01

### 1. Release verdict: HOLD

No new hosted or authenticated evidence is available to move this high-risk order from its existing blocked state.

### 2. What was verified

- **Local, current checkout:** `node --test scripts/premium-copy-integrity.test.mjs scripts/funnel-instrumentation-contract.test.mjs` passed 3/3 on 2026-08-01.
- **Implementation boundary:** the reviewed migration retains RLS and no `anon` or `authenticated` grant path for `workspace_funnel_events`; the scorecard function remains service-role-only in the migration. The later append-only grant migration is present in source and limits `service_role` to `SELECT` and `INSERT`.
- **Release routing:** the assignment board still records this order as blocked, with no Ready-for-QA handoff or authorised isolated journey.

### 3. Blocking issues

- **Blocking:** No controlled non-customer authenticated journey has produced a ledger event. Registration/workspace creation where applicable, first scheduled block, first completed recorded game, activation, retry idempotency, and aggregate scorecard output remain unproved in a hosted environment.

### 4. Important risks

- **Important:** Passing local contracts and source inspection cannot establish deployed trigger operation, tenant-bound event attribution, or safe operator-scorecard availability. Do not treat an empty ledger as evidence of a working funnel.

### 5. Unverified but required checks

- **Unverified:** An approved production-backed staging workspace and authenticated session; the minimum temporary schedule and completed-game workflow; one repeat attempt; aggregate-only scorecard output; ordinary browser-role denial; and visible unavailable/error states on any separately governed operator surface.

### 6. Suggested fixes or next validation steps

1. **Theo:** reconfirm the prior isolated non-customer approval for the production-backed staging project and provide the dedicated test account/workspace.
2. **QA:** run the documented minimum workflow, retain only milestone names/counts and redacted correlation evidence, and verify the retry does not add duplicate milestones.
3. **PM:** retain any browser-accessible founder scorecard work under WO-011; this order must not create a browser path to raw funnel events.
