# WO-2026-040 - Make Discord scheduling and delivery production-ready through a controlled release

- **ID reservation:** [WO-2026-040 registry row](../WORK_ORDER_INDEX.md)
- **Status:** Ready for Development
- **Assigned owner:** Core Features Developer
- **Size:** M
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation and release

## Delivery routing

- **Area / files likely affected:** `supabase/functions/discord-interactions/`, `discord-dispatch/`, `discord-schedule-reminders/`, `discord-install/`, `discord-channels/`, `discord-config/`, `discord-roles/`, `supabase/config.toml`, production-only Vault/cron configuration, `docs/launch/EDGE_FUNCTION_MANIFEST.md`, `docs/operations/DISCORD_DELIVERY_SUPPORT.md`, and focused contracts.
- **Dependencies:** WO-2026-025 staging evidence pack; Theo's written approval for a production release candidate, Discord application/guild boundary, production configuration, customer-activation cohort, and release. Core must first determine whether a production-specific scheduler/manifest change is required; the current scheduler is explicitly test-only.
- **Collision risk:** High. Do not overlap with any Discord provider, shared helper, outbox, Integration Settings, entitlement, subscription, or production configuration work. WO-031 remains separate from plan/billing decisions.

## Problem and user impact

WO-2026-025 demonstrates one isolated staging path from a private Discord `/scrim` command to a receipt, canonical practice block, and delivered outbox event. It deliberately does not prove replay safety, authorization and entitlement denials, operational recovery, or a production provider/worker configuration. The release manifest still labels the Discord Functions test-only and excludes interactive Discord delivery from the web dashboard release boundary. Enabling customer workspaces now would make an unverified Elite promise and could create duplicate or unauthorised canonical schedule writes.

## Why now

Discord is a credible Elite operational capability only if it is dependable when a team depends on it. This order converts the staging-only evidence into a bounded, auditable production decision; it does not assume staging configuration is a safe production shortcut.

## Scope

- Re-audit the exact deployed production candidate (function revisions, migration/RLS/grant state, environment names only, manifest, and worker trigger) without exposing credentials.
- Complete the remaining controlled staging matrix: an exact signed provider replay; wrong guild; no permitted role; Free/Pro; disabled/revoked Discord module; overlap; and cross-tenant/role controls. For every mutation-capable case, record receipt, scrim, outbox, and delivery-attempt counts.
- Determine and implement, if necessary, a reviewed production-specific worker scheduling and release-manifest path. Do not invoke the `configure_discord_test_worker_schedule` routine as a substitute for a reviewed production activation decision.
- After separate Theo approval, configure only the approved production Discord application, endpoint, signing public key, bot permissions/token, dispatch secret, approved worker trigger, and `SCRIMSTATS_APP_URL` through the provider/Supabase secret stores. No credential value may enter source, browser variables, work-order evidence, or chat.
- Run a non-customer production smoke test first, then a named small customer cohort only after every gate passes. Keep Discord limited to the existing Elite, live/enabled module and schedule-only scope.
- Produce a support/rollback handoff: ownership, redacted logs/request IDs, outbox inspection, retry/failure response, disabling a workspace/module, endpoint/command rollback, and a clear no-claim rule until release approval.

## Explicit non-goals

- Do not change Stripe prices, subscriptions, checkout, tier copy, or make Discord available to Free/Pro.
- Do not add DMs, arbitrary message commands, Discord Scheduled Events, scouting/review/player-data relays, global command registration before the controlled pilot, or broad customer enablement.
- Do not reveal, rotate, copy, or request credentials in chat; do not use a customer guild/workspace for pre-production matrix checks.
- Do not deploy, apply a migration, activate a worker, configure provider secrets, register a production command, or enable a customer workspace without Theo's separate explicit approval.

## Acceptance criteria

- The named production revision matches the reviewed source and has a security review showing Discord Ed25519 verification before parsing/lookup; worker endpoints reject absent/wrong dispatch secrets; browser configuration functions require authenticated owner/admin membership; service-only RPCs remain inaccessible to browser roles.
- In controlled hosted fixtures, exactly one signed interaction produces one receipt, one canonical `scrims` row, one eligible Discord `integration_events` row, and the expected delivery-attempt evidence. An exact provider replay produces no second canonical or outbox row.
- Wrong guild, missing permitted role, Free/Pro, disabled/revoked module, overlap, invalid signature/payload, member/viewer, and cross-tenant attempts are hosted-verified to fail without a schedule or outbox mutation.
- Production worker scheduling is explicitly reviewed and enabled only through the approved production path; it is observable, retries bounded failures with backoff, records delivery attempts, and can be disabled without deleting historical evidence.
- A non-customer production smoke test and a named, consented small Elite pilot complete with redacted evidence, no captured secrets, and no customer-impacting failure. Broader activation remains a separate release decision.
- The release boundary, Edge Function manifest, support procedure, in-product availability state, and any future customer claim agree with actual verified availability. No public or in-product "active" claim precedes this evidence and Theo's release approval.

## Relevant files, workflows, or data areas

- `docs/agent-work-orders/proposed/WO-2026-025-discord-slash-command-scheduling.md` — staging evidence and residual-risk record.
- `docs/launch/EDGE_FUNCTION_MANIFEST.md`, `docs/launch/RELEASE_BOUNDARY.md`, `docs/operations/DISCORD_DELIVERY_SUPPORT.md`, `docs/operations/INCIDENT_RECOVERY.md`.
- `supabase/functions/discord-interactions/index.ts`, `discord-dispatch/index.ts`, `discord-schedule-reminders/index.ts`, `discord-config/index.ts`, `discord-roles/index.ts`.
- `supabase/migrations/20260729162640_discord_provider_scoped_outbox.sql`, `20260730173144_discord_test_worker_schedule.sql`, `20260802173000_discord_interaction_scheduling.sql`; `discord_installations`, `discord_permitted_roles`, `discord_interaction_receipts`, `integration_events`, and `integration_delivery_attempts`.

## Risks

- **Permissions / Supabase RLS:** High. A public provider endpoint writes canonical tenant schedule data. Signature, guild, role, module/entitlement, replay, RLS/grants, and service-only boundaries must independently hold.
- **Billing / entitlement:** High. Discord remains Elite plus live/enabled module only; direct function/RPC paths must not bypass the plan gate.
- **Email / customer communication:** Medium. Discord delivery is customer communication. Support states and customer claims must remain honest, and no cohort is enabled without consent and a rollback contact.
- **Production / data:** High. Secret/configuration and cron activation, command registration, outbound messages, and canonical practice blocks require explicit Theo approval and a reversible controlled-pilot plan.

## Required validation

- Re-run focused Discord interaction, entitlement, dispatch-environment, and message-presentation contracts; ESLint with zero warnings, TypeScript, production build/bundle budget, and `git diff --check` for any implementation.
- Hosted Supabase review: deployed revisions; migration history; RLS, grants, `SECURITY DEFINER` search paths/execution grants; function authentication; current Advisor results; and tenant-scoped database counts.
- Controlled provider matrix in isolated fixtures followed by production non-customer smoke: signed PING, permitted `/scrim`, exact replay, invalid signature/payload, guild/role/plan/module/overlap/tenant denials, receipt/outbox/delivery counts, and worker retry/disable evidence.
- Authenticated browser checks for owner/admin configuration, member/viewer denial, unavailable/retrying/failed/disconnected states, desktop and a real mobile viewport.
- QA and Release Auditor independently review the evidence pack. `Production-ready` may be recorded only after all acceptance criteria pass and Theo approves the named production release.

## QA scenario / reproducible test steps

1. Record a release candidate SHA/function revisions and prepare two non-customer hosted tenants, role controls, an approved private guild, an Elite/live/enabled fixture, and Free/Pro/disabled controls. Capture before-counts for receipts, scrims, outbox events, and attempts.
2. Send valid signed PING and one valid `/scrim`; verify exactly one receipt, canonical block, scoped outbox event, and delivery attempt. Submit the exact signed provider replay through the approved test mechanism and verify the same identifiers with no new rows.
3. Exercise invalid signature/payload, wrong guild, unpermitted role, member/viewer, Free/Pro, disabled/revoked module, overlap, and cross-tenant controls. Record after-counts showing no unauthorised mutation.
4. After Theo's configuration approval, enable the reviewed production worker path and run one non-customer production smoke. Verify required secrets are present by redacted health/result evidence only, workers authenticate, messages contain no mentions/embeds beyond the approved schedule prompt, and a failed test delivery follows the documented retry/disable path.
5. After Theo's separate pilot/release approval, enable only named consented Elite pilot workspace(s), monitor the first delivery window, retain redacted request IDs/counts, and keep an immediate disable/rollback owner available.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Maintain scope, readiness gates, approval record, and no-claim boundary. | This work order and WO-025. |
| Developer – Fast Lane | Not applicable | M/high-risk provider, secret, worker, and authorization work is not Fast Lane eligible. | N/A |
| Core Features Developer | Involved | Audit/implement any required production scheduler, manifest, function, or security correction; provide source and validation handoff. | Commit/PR and validation evidence. |
| QA and Release Auditor | Involved | Execute/independently inspect hosted matrix, production smoke, operational recovery, and final verdict. | Redacted evidence pack and verdict. |
| Technical Reporting Analyst | Not applicable | No product metric change; retain only operational evidence needed for the release audit. | N/A |
| Lead Marketer and Growth | Involved | Review any later customer-facing availability wording against verified support scope; no publishing is authorised here. | Message Ledger / copy review. |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Existing staging end-to-end path | One private Discord interaction, receipt, canonical scrim, one delivered outbox event | Hosted staging | Pass (bounded) |
| Replay and denial matrix | v13 controlled exact-replay case plus negative hosted evidence | Hosted staging | Partial pass: exact replay passed; denial matrix outstanding |
| Production-safe worker and release path | Per-channel retry evidence, provider nonce enforcement, inactive-by-default production scheduler, manifest and support controls | Source | Pass (source candidate only; hosted application/deployment outstanding) |
| Production smoke and controlled pilot | Redacted non-customer smoke, then named pilot evidence | Hosted production | Outstanding |
| Honest support and claim boundary | Updated operational/release documentation and approved claim review | Documentation / production | Pass at source; production verification outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The bounded v13 provider case now passes acknowledgement timing and exact-replay idempotency, but the denial, operational-recovery, worker-delivery, production configuration, smoke, and controlled-pilot gates have not been passed.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Production release-candidate and scheduler design review | QA and Release Auditor | Independently review the source candidate, then record deployed revision IDs and hosted function auth/RLS/grant evidence after separate deployment approval | Source complete; hosted review blocked |
| Staging replay and denial matrix | QA and Release Auditor | Independently audit the recorded v13 replay evidence, then provide redacted before/after counts for the remaining denial cases | Replay evidence ready for QA; denials open |
| Production provider/configuration activation | Theo / authorised operator | Written scope approval and redacted configured-state confirmation; no secrets | Blocked on Theo |
| Non-customer smoke then named controlled pilot | QA and Release Auditor / Theo | Hosted evidence and rollback/monitoring handoff | Blocked on prior gates |
| Customer availability claim | Theo / Lead Marketer and Growth | Theo release approval plus verified support path and Message Ledger review | Blocked on release |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation / production-readiness remediation | Yes | Approved | 2026-08-04 | Theo approved Phase 1 source-only remediation. This did not authorise hosted migration application, Function deployment, secrets/configuration, provider registration, outbound smoke messages, customer activation, or release. |
| Shared-project staging migration and dispatcher deployment | Yes | Approved | 2026-08-04 | Theo approved the exact bounded sequence: scoped commit/push, apply `discord_production_delivery_controls` to `tvcgjehreaayfazlhvps`, deploy only `discord-dispatch`, keep workers paused, and perform no provider configuration, outbound message, customer activation, or release. |
| Production provider/secret/worker configuration | Yes | Pending | 2026-08-04 | Must name the production Discord application, endpoint/command scope, operator, non-customer smoke boundary, and rollback owner; do not provide secrets in chat. |
| Named customer pilot | Yes | Pending | 2026-08-04 | Requires completed matrix and smoke, named consented Elite tenant(s), monitoring window, support/rollback owner, and no public claim. |
| Release / broader activation | Yes | Pending | 2026-08-04 | Requires QA production-ready verdict and the documented support/claim boundary. |

## Decision and approval record

- 2026-08-04 - PM created this successor to WO-025 after production-readiness review. WO-025 remains conditionally closed as staging-only evidence; this order does not reinterpret that acceptance as production approval.
- 2026-08-04 - Theo approved Phase 1 source-only production-readiness remediation with every hosted/provider/customer/release gate retained.
- 2026-08-04 - Theo approved the shared-project staging migration and `discord-dispatch` deployment while requiring both workers to remain paused and retaining every provider, outbound-message, customer, and release gate.
- 2026-08-05 - Theo approved Phase B for the existing isolated `clash` non-customer tenant and previously approved private Discord guild only: one short-lived replay arm, one permitted signed `/scrim` invocation, before/after aggregate evidence capture, and immediate arm cleanup. This does not approve workers, outbound delivery, customers, production configuration, Phases C-D, or release.

## Implementation and review evidence

- 2026-08-04 - Source review confirms `discord-interactions` uses Discord Ed25519 verification before parsing or tenant lookup, and calls the service-only canonical scheduling RPC. Dispatch/reminder workers require `DISCORD_DISPATCH_SECRET`; delivery records retry/failure attempts and cancellation states.
- 2026-08-04 - Existing evidence confirms exactly one isolated staging Discord interaction through receipt, canonical practice block, provider-scoped delivered outbox event, and one delivery attempt. Exact replay and required negative cases remain unverified.
- 2026-08-04 - `EDGE_FUNCTION_MANIFEST.md` still classes the Discord Functions as test-only, `RELEASE_BOUNDARY.md` excludes interactive Discord delivery, and the only checked scheduler is `configure_discord_test_worker_schedule`; no production configuration, customer activation, or release evidence was inspected or changed.
- 2026-08-04 - Source candidate adds target-scoped `integration_delivery_attempts.delivery_target_id`, a delivered event/channel uniqueness guard, deterministic 24-character Discord nonces with `enforce_nonce`, and skip-on-delivered retry behaviour. A provider success whose audit insert fails remains retryable instead of being reported delivered without evidence.
- 2026-08-04 - Migration `20260804143000_discord_production_delivery_controls.sql` is source-only and unapplied. On any later approved application it pauses both existing Discord cron jobs, retires the test-only activation function, and exposes only revoked, non-API `security.configure_discord_production_worker_schedule()` / `security.disable_discord_production_worker_schedule()` operator paths. It creates or changes no secret.
- 2026-08-04 - Manifest, release boundary, and Discord support runbook now agree that the candidate remains test-only. The support handoff records per-target evidence interpretation, bounded retry, global/workspace disable paths, retained cron history, redaction, and no-customer-claim gates.
- 2026-08-04 - Local validation passed: 11 focused Discord contracts; full 247-test suite; ESLint with zero warnings; TypeScript; production Vite build; bundle budget; and scoped `git diff --check`. Supabase CLI migration lint/reset was unavailable because this checkout has no Supabase CLI package. No hosted database, Function, secret, provider, customer, or outbound-message mutation was performed.
- 2026-08-04 - Core source phase is complete and handed to QA and Release Auditor for independent source review. Hosted QA remains blocked until Theo separately approves the exact migration application and Function deployment scope.
- 2026-08-04 - Scoped candidate commit `e268298` was pushed to `origin/codex/Staging`; unrelated dirty work was not staged. The shared-project migration applied successfully as `20260804134309_discord_production_delivery_controls`.
- 2026-08-04 - Hosted schema verification confirms nullable text `delivery_target_id`, the validated 17–20 digit target constraint, and the partial unique delivered event/channel index. Operator configure/disable routines and the retired test routine are `SECURITY DEFINER`, have fixed empty search paths, and deny execute to `anon`, `authenticated`, and `service_role`.
- 2026-08-04 - `discord-dispatch` deployed as active version 15 with `verify_jwt=false`, SHA-256 `79a753cd181637fd6bfc2644651c8f9218f737028309db6f67b6b2925d471f4f`, and deployed source confirmation for the custom dispatch secret, per-target lookup, and enforced nonce. An unauthenticated POST returned HTTP 401 before any outbox/provider work.
- 2026-08-04 - Cron jobs 4 (`scrimstats-discord-reminders`) and 5 (`scrimstats-discord-dispatch`) are both inactive. Their last successful starts were 2026-08-04 13:30:00 UTC and 13:43:00 UTC respectively, before migration history time 13:43:09. No worker was invoked or re-enabled.
- 2026-08-04 - Post-application Advisors show no finding for the new delivered-target index or the revoked operator routines. Existing project-wide findings remain outside this order; `discord_oauth_states` continues to report the intentional service-only RLS/no-policy informational item.
- **Highest evidence achieved:** Hosted verified (inactive staging-QA candidate plus earlier isolated positive path; full QA matrix outstanding)

## Independent QA source audit - 2026-08-04

### 1. Release verdict: HOLD

The source candidate is suitable for the separately approved hosted-QA stage only. It is not production-ready: the migration is unapplied, the exact Function revisions are undeployed, and no provider, worker, non-customer production-smoke, or pilot evidence exists.

### 2. What was verified

- Independent source review confirms the dispatch path remains worker-secret authenticated, preserves the existing Elite/live/enabled server-side entitlement check, records delivery evidence per Discord channel, and uses a deterministic 24-character Discord nonce with provider nonce enforcement.
- The migration adds a partial delivered event/channel uniqueness guard, pauses current Discord cron jobs by default, revokes all broad execution from its `SECURITY DEFINER` operator routines, and creates or changes no secret.
- Independent local validation passed: 13 focused Discord contracts, 247/247 full tests, zero-warning scoped ESLint, TypeScript, production Vite build, and `git diff --check` for tracked candidate changes.

### 3. Blocking issues

- **Blocking:** No approved hosted migration application, exact Function deployment, production Discord configuration, worker activation, or customer/pilot activation exists.
- **Blocking:** The signed replay, invalid signature/payload, guild, role, Free/Pro, module-state, overlap, member/viewer, and cross-tenant hosted denial matrix remains unverified.

### 4. Important risks

- **Important:** A Discord `nonce` deduplicates a provider message only for its documented short provider window; it does not replace database evidence, outbox locking, or the required production retry/recovery test.
- **Important:** The source candidate pauses existing cron jobs on application. The exact job IDs, active state, historical delivery queue, and rollback owner must be captured immediately before any approved migration.
- **Improvement:** Vite reports an outdated Browserslist dataset. This is not a release blocker.

### 5. Unverified but required checks

- **Unverified:** Current Advisor results, deployed revision IDs, migration/RLS/grants/function authentication, Vault-name presence, cron run history, and redacted production configuration evidence.
- **Unverified:** Non-customer production smoke and a named consented Elite pilot with support and immediate-disable ownership.

### 6. Suggested fixes or next validation steps

1. Keep the order **Blocked**. Do not apply or deploy this candidate without Theo's exact hosted migration/deployment approval.
2. Before approval, name the non-customer production fixture, private guild, function revisions, worker/rollback owner, and disposable-record cleanup boundary.
3. After deployment, QA will execute the complete hosted matrix and inspect redacted receipt, scrim, outbox, delivery-attempt, cron, and Function evidence before any customer activation decision.

## Core deployment handoff - 2026-08-04

Theo requested the normal **staging-first branch promotion** path and returned deployment/migration handling to Core. Core must prepare the exact staging candidate, named Supabase target, migration sequence, Function revisions, expected cron pause, rollback evidence, and post-deployment QA handoff. This does **not** authorise a production database migration, production Discord configuration, worker activation, outbound delivery, customer enablement, or production release. Obtain a separate exact approval before any such action.

### Core completion update

Core completed the approved staging-first promotion against shared project `tvcgjehreaayfazlhvps`. Candidate `e268298`, hosted migration `20260804134309`, dispatcher version 15, inactive cron jobs 4/5, fixed operator ACLs, and the HTTP 401 fail-closed check are recorded above. The order is handed back to QA and Release Auditor. Provider configuration, worker activation, outbound delivery, customer enablement, smoke/pilot work, and release remain unapproved.

## Independent QA hosted re-audit - 2026-08-04

### 1. Release verdict: HOLD

The approved staging-first candidate is hosted-verified and safe to enter its controlled hosted QA matrix. It is not production-ready: no worker or provider path has been activated and all mutation/denial, recovery, smoke, and pilot requirements remain outstanding.

### 2. What was verified

- **Hosted migration:** `20260804134309_discord_production_delivery_controls` is present. `integration_delivery_attempts.delivery_target_id` is nullable text, and the delivered event/channel partial unique index is present with the reviewed predicate.
- **Hosted function:** `discord-dispatch` is active at version 15, SHA-256 `79a753cd181637fd6bfc2644651c8f9218f737028309db6f67b6b2925d471f4f`. Retrieved deployed source matches the reviewed worker-secret check, per-target delivered lookup, deterministic nonce, and `enforce_nonce` path.
- **Authorization:** Both `security` operator routines and the retired public test-activation routine are `SECURITY DEFINER` with fixed empty search paths and deny execute to `anon`, `authenticated`, and `service_role`.
- **Safe inactive state:** Discord reminder job 4 and dispatch job 5 are both inactive. An independent unauthenticated `POST` to the deployed dispatcher returned HTTP 401 before outbox/provider processing.
- **Advisor:** Current Security Advisor output contains no finding naming the new index, target column, or operator routines. Its Discord finding remains the documented intentional no-policy/service-only `discord_oauth_states` informational item.

### 3. Blocking issues

- **Blocking:** The signed replay and all required hosted denial cases are still unverified.
- **Blocking:** Production provider configuration, worker activation, any outbound message, non-customer production smoke, named customer pilot, and release are not approved or verified.

### 4. Important risks

- **Important:** Paused workers mean no delivery/retry/recovery behaviour has been tested on this deployed revision.
- **Important:** The current shared project deployment is staging-first evidence only. It does not establish a production branch, production provider configuration, or production customer readiness.

### 5. Unverified but required checks

- **Unverified:** Controlled exact signed replay; invalid signature/payload; wrong-guild; missing-role; Free/Pro; disabled/revoked module; overlap; member/viewer; and cross-tenant matrix with before/after receipt, scrim, outbox, and attempt counts.
- **Unverified:** Authenticated owner/admin configuration and unavailable/retrying/failed/disconnected browser states at desktop and real mobile viewport.

### 6. Suggested fixes or next validation steps

1. Keep workers paused and use only the approved non-customer staging fixtures for the remaining provider matrix.
2. Return any failed matrix case to Core with redacted request ID, function version, and count deltas; do not repeat mutation-capable requests.
3. Do not request production configuration or activation until the staging matrix and operational recovery evidence pass.

## Independent QA hosted positive-path recheck - 2026-08-04

### 1. Release verdict: HOLD

The deployed staging candidate passes one newly created, isolated provider-to-canonical positive path with workers intentionally paused. This advances the controlled matrix but does not verify replay, denials, delivery, recovery, production smoke, pilot, or release.

### 2. What was verified

- The authenticated `clash` owner browser shows Discord delivery active for `ScrimStats Integration Test`, one saved permitted command role, four selected prompt types, and no browser warnings/errors on the resulting scrim list.
- Before counts were 4 scrims, 1 Discord interaction receipt, 6 Discord events, and 6 delivery attempts. One permitted private-guild `/scrim` returned `Practice block added to ScrimStats.`
- The labelled `WO-040 QA replay fixture` created exactly one new canonical scrim and one linked receipt. Counts became 5 scrims and 2 receipts. It created one linked `schedule_created` Discord outbox event in `pending`; delivery attempts remain 6 because both workers are deliberately inactive.
- The authenticated scrim list renders the labelled scheduled block (`BO5`, Wed 5 Aug, 19:00) without captured console warnings/errors.

### 3. Blocking issues

- **Blocking:** A normal second `/scrim` is a new Discord interaction, not an exact provider replay. Do not use it to test idempotency.
- **Blocking:** The remaining replay/denial matrix, worker delivery/retry/disable evidence, production configuration, smoke, pilot, and release remain unverified.

### 4. Important risks

- **Important:** The pending event is expected while workers are paused; it is not message-delivery evidence.

### 5. Unverified but required checks

- **Unverified:** Core must provide an approved, fixture-only mechanism to submit the exact retained signed provider interaction for replay verification without exposing a key or manufacturing a different interaction.

### 6. Suggested fixes or next validation steps

1. **Core Features Developer:** provide the bounded exact-replay test mechanism and handoff, with no worker activation and no customer data.
2. **QA:** then compare the same receipt, scrim, and outbox identifiers/counts before and after that replay; only after that proceed with non-mutating denial cases.

**QA routing update:** The work order is **Blocked** on Core's bounded exact-replay test mechanism. The current Discord UI cannot submit an exact replay; a second normal `/scrim` would be a new interaction and would invalidate the idempotency test.

## Core exact-replay fixture update - 2026-08-04

Theo approved a temporary, private-fixture-only exact signed replay path. Core committed candidate `0db1a9b` and deployed `discord-interactions` version 7 (SHA-256 `5ad1d92d79cfd65d87fcbe0cf8cdd130d9a0c6dde68e1778a9f82f931c5eed1a`) with `verify_jwt = false` retained for the endpoint's existing Discord Ed25519 authentication.

The source reuses the original request body, timestamp, and signature once through the same hosted signature-verifying endpoint only when all existing installation, guild, permitted-role, Elite/module, and tenant checks pass, the RPC reports a newly created record, the notes value exactly matches `WO-040 EXACT REPLAY`, and the request is not already the internal replay. The envelope remains memory-only; raw request bodies, signatures, and timestamps are neither logged nor persisted. An internal header prevents recursion, and the provider response is returned before the background replay completes.

Local evidence: zero-warning ESLint, TypeScript, 248/248 tests, production build, and bundle budget all passed. Hosted source retrieval confirms the fixture exists in active version 7. Cron jobs 4 and 5 remain inactive, and the read-only receipt/event/attempt check was completed without invoking the fixture.

The fixture is intentionally inert until the server-only environment name `DISCORD_QA_REPLAY_GUILD_ID` is set to the approved private non-customer guild. Core resolved the allowlist value from the active fixture installation but could not configure it because the available Supabase Dashboard browser session is signed out and the connected Supabase tooling does not expose environment-secret mutation. No credentials were entered or inferred. Keep the work order **Blocked** until an authorised Dashboard session is available, then configure only that name, verify workers remain paused, and hand the exact marker scenario back to QA. Provider activation, worker activation, outbound delivery, customer data, smoke/pilot work, and release remain out of scope.

## Core fixture configuration and QA handoff - 2026-08-04

Theo authenticated to the correct Supabase project and authorised completion. Core configured only the server-side environment name `DISCORD_QA_REPLAY_GUILD_ID` through the Edge Function Secrets page; its value is intentionally not recorded. Dashboard confirmation showed one custom-secret row with that name and cleared input fields after save.

The secret update produced active `discord-interactions` version 8 with the unchanged reviewed source SHA-256 `5ad1d92d79cfd65d87fcbe0cf8cdd130d9a0c6dde68e1778a9f82f931c5eed1a` and `verify_jwt = false` retained for Discord Ed25519 authentication. Cron jobs 4 and 5 remain inactive. No interaction was invoked and no outbound provider delivery was attempted during configuration.

Pre-QA baseline for the isolated `clash` fixture is 5 scrims, 2 Discord interaction receipts, 7 Discord events, 1 pending Discord event, 6 delivery attempts, and 0 active workers. QA must now:

1. Record the same six baseline counts and active Function version.
2. From the permitted role in the approved private guild, submit exactly one non-overlapping future `/scrim` whose notes value is exactly `WO-040 EXACT REPLAY`.
3. Verify the provider response reports one new practice block, Function evidence shows the original signed request and one internal exact replay, and the replay log records `replay_confirmed: true` without exposing the body, timestamp, or signature.
4. Verify final counts are exactly 6 scrims, 3 receipts, 8 Discord events, 2 pending Discord events, 6 delivery attempts, and 0 active workers. Confirm the original and replay resolve to the same interaction, receipt, scrim, and outbox identifiers with no duplicate canonical or outbox row.
5. Return the evidence to Core immediately so `DISCORD_QA_REPLAY_GUILD_ID` and the temporary replay source can be removed and the clean handler redeployed before any further matrix or activation work.

The work order is **Ready for QA** for this fixture-only exact-replay scenario. The overall release verdict remains **HOLD**; provider delivery, worker activation, customer data, production smoke, pilot, and customer/release claims remain unapproved and unverified.

## Independent QA exact-replay preflight - 2026-08-04

### 1. Release verdict: HOLD

The temporary replay fixture is correctly bounded for one private staging QA invocation. It is not production readiness evidence and must be removed immediately after the proof is captured.

### 2. What was verified

- Deployed `discord-interactions` version 8 has SHA-256 `5ad1d92d79cfd65d87fcbe0cf8cdd130d9a0c6dde68e1778a9f82f931c5eed1a`, the exact marker, private-guild environment gate, original signed-envelope reuse, and no raw body/signature/timestamp persistence path.
- Independent local focused contracts passed 14/14; scoped ESLint and TypeScript passed.
- Baseline is 5 scrims, 2 receipts, 7 Discord events, 1 pending event, 6 attempts, and both workers inactive.

### 3. Blocking issues

- **Blocking:** The exact replay has not yet been invoked or observed; customer, production, and delivery/retry evidence remains absent.

### 4. Important risks

- **Important:** This is temporary test-only source on an active hosted project. It must be removed and the clean interaction handler redeployed after the one fixture run, regardless of outcome.

### 5. Unverified but required checks

- **Unverified:** One permitted, non-overlapping private `/scrim` with notes exactly `WO-040 EXACT REPLAY`, resulting replay confirmation, and final count invariants.

### 6. Suggested fixes or next validation steps

1. Theo: submit exactly one private-guild command with the exact marker; do not submit a second command.
2. QA: inspect the returned response, Function log, and count invariants, then return the result to Core for immediate fixture removal.

## Independent QA exact-replay execution - 2026-08-04

### 1. Release verdict: HOLD

The exact-replay fixture did not complete its required positive path. It failed safely without a mutation, but remains a release-blocking Core defect until the handler can both complete the authorised fixture path and provide a redacted diagnostic for any denied server-side guard.

### 2. What was verified

- One permitted private-guild invocation using the exact `WO-040 EXACT REPLAY` marker reached deployed `discord-interactions` v8 and returned HTTP 200 to Discord with `This command is not authorised for this workspace.`
- No fixture data changed: counts remain 5 scrims, 2 receipts, 7 Discord events, 1 pending event, and 6 delivery attempts; no marker scrim or marker receipt exists.
- Read-only hosted configuration remains internally consistent: one Elite `clash` tenant, live/enabled Discord module, one active installation, one permitted role, and that role is attached to the active installation.

### 3. Blocking issues

- **Blocking:** The marked permitted command is rejected before canonical creation, so the exact replay has not occurred.
- **Blocking:** The handler maps every non-overlap RPC error to the same safe provider response and emits no redacted reason code. QA cannot distinguish role, guild, module, entitlement, or RPC-authorisation denial without unsafe probing.

### 4. Important risks

- **Important:** The fail-closed response prevented unauthorised schedule/outbox writes; do not weaken the guards or repeat the command as a diagnostic substitute.

### 5. Unverified but required checks

- **Unverified:** Exact replay confirmation, identifier/count invariants, fixture removal, and all remaining denial/recovery/delivery checks.

### 6. Suggested fixes or next validation steps

1. **Core Features Developer:** inspect the v8 request/RPC failure and correct the fixture's authorised path. Add a redacted internal reason code/log after signature verification and before the generic ephemeral response; it must not expose request bodies, signatures, provider secrets, tenant identifiers, or role IDs.
2. **QA:** re-run only after Core records the deployed correction and a new baseline. Do not invoke the marker command again on the current candidate.

**QA routing update:** WO-040 is **Blocked** and returned to Core. Remove the temporary replay fixture after diagnosis or correction; keep workers paused and preserve the failed no-mutation evidence.

## Core authorised-path correction and QA re-handoff - 2026-08-04

Theo approved the narrow correction and hosted Function deployment. Hosted request evidence showed the failed v8 command passed signature verification and active-installation lookup, then received HTTP 400 from `create_discord_scrim_block`; the failure class was consistent with validation or an insert constraint rather than the RPC's role/module authorization guards. The original signed body was correctly not retained, so the exact failing option cannot be reconstructed safely.

Core candidate `7aaea05` now trims and uppercases the optional series format, allows only the canonical hosted `scrims.format` values (`BO1`-`BO5` and `1G`-`5G`), and rejects any unsupported format before tenant lookup. Post-signature rejections now emit only a bounded reason, PostgreSQL/PostgREST code, `SB_EXECUTION_ID`, and Function-version context. The handler does not log the request body, signature, timestamp, tenant or guild identifier, role identifiers, or secret values; provider-facing authorization responses remain generic.

Validation passed zero-warning ESLint, TypeScript, 249/249 repository tests, production build, and bundle budget. `discord-interactions` version 9 is active with `verify_jwt = false`, SHA-256 `da2e049e59572496c3247cd7aa738527d036e0adcf774ae7d40c63bdc6b0abbb`, and retrieved hosted source containing the reviewed normalization and redacted diagnostics. Cron jobs 4 and 5 remain inactive.

The new pre-QA baseline remains 5 scrims, 2 receipts, 7 Discord events, 1 pending Discord event, 6 delivery attempts, and 0 active workers. QA may perform exactly one new private-guild invocation with a non-overlapping future time, a canonical supported format such as `BO5`, and notes exactly `WO-040 EXACT REPLAY`:

- On success, verify two Function invocations, `replay_confirmed: true`, and final counts of 6 scrims, 3 receipts, 8 Discord events, 2 pending events, 6 attempts, and 0 active workers, with one shared interaction/receipt/scrim/outbox identity and no duplicate row.
- On failure, record only the redacted reason, code, execution ID, Function version, provider response, and unchanged aggregate counts. Do not retry.
- In either outcome, return immediately to Core to remove `DISCORD_QA_REPLAY_GUILD_ID`, remove the temporary replay source, and deploy the clean handler before any further matrix work.

WO-040 is **Ready for QA** for that single non-customer exact-replay retry only. The release verdict remains **HOLD**; workers, outbound delivery, production configuration, customers, smoke/pilot work, and release remain unapproved.

## Independent QA correction re-audit - 2026-08-04

### 1. Release verdict: HOLD

The correction is hosted and independently reviewed, but the exact replay has not yet completed. This permits one bounded non-customer staging check only; it is not a production release decision.

### 2. What was verified

- **Hosted revision:** `discord-interactions` is active at version 9 with SHA-256 `da2e049e59572496c3247cd7aa738527d036e0adcf774ae7d40c63bdc6b0abbb`, matching the reviewed candidate.
- **Authorization and privacy:** Discord Ed25519 verification remains before parsing/lookup. Post-signature rejection logs contain only a bounded reason, database code, and execution ID; they omit the body, signature, timestamp, tenant/guild/role identifiers, and secrets.
- **Input safety:** The command normalizes supported formats to `BO1`–`BO5` or `1G`–`5G` before tenant lookup. Independent focused Discord contracts passed 15/15; zero-warning ESLint, TypeScript, and production build/bundle budget passed.
- **Hosted baseline:** The non-customer `clash` fixture remains at 5 scrims, 2 receipts, 7 Discord events, 1 pending event, and 6 attempts. It remains Elite with one active installation, one permitted role, and live/enabled Discord access. Workers 4 and 5 are inactive.

### 3. Blocking issues

- **Blocking:** The exact provider replay and its no-duplicate identifier/count invariants remain unverified.
- **Blocking:** Delivery/retry/recovery, full denial matrix, production configuration, smoke, pilot, and release requirements remain unverified or unapproved.

### 4. Important risks

- **Important:** This remains temporary hosted fixture source. It must be removed, along with the fixture secret, after the single outcome is recorded.
- **Important:** A second interaction is not a replay and would add data; do not retry after a failure.

### 5. Unverified but required checks

- **Unverified:** One successful private-guild command using a supported canonical format and exact marker, followed by an internal replay with the same identifiers and no extra receipt, scrim, or outbox record.

### 6. Suggested fixes or next validation steps

1. Submit exactly one command in the approved private guild: a non-overlapping future date/time, format `BO5`, and notes exactly `WO-040 EXACT REPLAY`.
2. QA will then inspect the provider response, two Function invocations, redacted execution evidence, and final aggregate counts. On either outcome, return the evidence to Core for immediate fixture/secret removal; keep workers paused.

## Independent QA current-state recheck - 2026-08-05

### 1. Release verdict: HOLD

The staged correction remains available for its one approved private-fixture invocation. No replay result exists yet, so this is not release evidence.

### 2. What was verified

- Active `discord-interactions` v9 still matches SHA-256 `da2e049e59572496c3247cd7aa738527d036e0adcf774ae7d40c63bdc6b0abbb`.
- Fixture counts remain 5 scrims, 2 receipts, 7 Discord events, 1 pending event, and 6 delivery attempts. There are zero marker scrims and zero marker receipts.
- Workers 4 and 5 remain inactive.

### 3. Blocking issues

- **Blocking:** The exact replay has not been invoked, so idempotency evidence is absent.

### 4. Important risks

- **Important:** Do not treat unchanged hosted configuration as a completed provider test or production readiness.

### 5. Unverified but required checks

- **Unverified:** One permitted private-guild `BO5` command with notes exactly `WO-040 EXACT REPLAY`, its internal replay, and the shared-identifier/no-duplicate invariants.

### 6. Suggested fixes or next validation steps

1. Run the one approved non-overlapping private-fixture command when ready; do not retry it.
2. QA will inspect the result and return it to Core for fixture/secret removal.

## Independent QA exact-replay execution recheck - 2026-08-05

### 1. Release verdict: HOLD

The permitted private-fixture command completed its canonical write safely, but the required exact replay is not evidenced. This remains a Core blocker and does not advance the production-release decision.

### 2. What was verified

- The provider replied `Practice block added to ScrimStats.` and the command used canonical `BO5` with notes exactly `WO-040 EXACT REPLAY`.
- Counts moved exactly once from 5 to 6 scrims, 2 to 3 receipts, 7 to 8 Discord events, and 1 to 2 pending events. Delivery attempts remain 6 and workers 4/5 remain inactive.
- The target has exactly one canonical scrim, one linked interaction receipt, and one linked `schedule_created` Discord event.
- The deployed v9 HTTP log contains the original successful Discord interaction.

### 3. Blocking issues

- **Blocking:** No second internal Function invocation or `replay_confirmed: true` log was available. The no-duplicate database result alone cannot prove an exact signed replay occurred.

### 4. Important risks

- **Important:** Do not submit another command. A second Discord interaction is a new provider request and would not repair the missing replay evidence.
- **Important:** The temporary fixture and secret now need prompt removal regardless of the incomplete replay proof.

### 5. Unverified but required checks

- **Unverified:** Internal exact-replay execution and its `replay_confirmed: true` evidence. The wider denial, delivery/retry, recovery, production configuration, smoke, pilot, and release matrix remains outstanding.

### 6. Suggested fixes or next validation steps

1. **Core Features Developer:** inspect why v9 did not surface or complete the background internal replay, preserve the successful canonical evidence, then remove `DISCORD_QA_REPLAY_GUILD_ID` and temporary replay source before any further test.
2. **Core Features Developer:** propose a reviewed, observable non-customer replay mechanism only if a new replay proof is still required; it must not expose the signed envelope or create duplicate data.

**QA routing update:** WO-040 is **Blocked** and returned to Core. Keep workers inactive. No production or customer action is approved.

## Core temporary-fixture cleanup update - 2026-08-05

### 1. Outcome

The temporary exact-replay source path has been removed and the clean Discord interaction handler is hosted. The temporary environment name still requires deletion because the in-app dashboard controller failed before page access; the order remains **Blocked** until that final configuration cleanup is independently confirmed.

### 2. Completed evidence

- Cleanup commit `53bf4fe` and exact dependency-pin commit `c861d8b` were pushed to `origin/codex/Staging`.
- `discord-interactions` version 10 is active on shared project `tvcgjehreaayfazlhvps` with SHA-256 `0181e9d3c3e763fe3b7c5fff9560b647c7dcecb963a6c46648ff1ad3d03864e6` and intentional `verify_jwt = false` for Discord Ed25519 authentication.
- Retrieved hosted source contains no `DISCORD_QA_REPLAY_GUILD_ID`, `WO-040 EXACT REPLAY`, or `EdgeRuntime.waitUntil`; supported-format validation and redacted rejection diagnostics remain present.
- The shared Supabase client import is pinned to the existing reviewed repository version `2.57.4` after the floating `@2` import failed hosted bundling against an unavailable transitive module.
- Post-deployment read-only counts remain 6 scrims, 3 receipts, 8 Discord events, 2 pending Discord events, 6 delivery attempts, and 0 active workers for the isolated `clash` fixture.
- Validation passed 5/5 focused interaction contracts, 248/248 full tests, zero-warning ESLint, TypeScript, production build, bundle budget, and scoped diff checks.

### 3. Remaining blocker and handoff

- Delete only the temporary server-side environment name `DISCORD_QA_REPLAY_GUILD_ID` in the Supabase Function secrets dashboard; never record its value.
- After deletion, QA and Release Auditor must confirm the name is absent, version 10 remains active with clean source, workers remain inactive, and aggregate fixture counts remain unchanged before deciding the next WO-040 evidence step.
- Exact signed replay remains unverified. Do not retry the provider command, activate workers, send outbound messages, use customer data, or make release claims.

## Independent QA final-cleanup re-audit - 2026-08-05

### 1. Release verdict: HOLD

The temporary replay code has been removed safely, but replay safety remains unproven and the temporary secret removal is operator-confirmed rather than independently dashboard-verified. This is not a production-ready Discord release.

### 2. What was verified

- Active `discord-interactions` v11 has SHA-256 `0181e9d3c3e763fe3b7c5fff9560b647c7dcecb963a6c46648ff1ad3d03864e6` and retains the required Discord signature-authentication configuration.
- Retrieved hosted source contains no `DISCORD_QA_REPLAY_GUILD_ID`, replay marker, or background replay path; supported-format validation and redacted diagnostics remain present.
- Read-only counts remain 6 scrims, 3 receipts, 8 Discord events, 2 pending events, and 6 attempts. Workers 4 and 5 are inactive.

### 3. Blocking issues

- **Blocking:** Exact signed replay was not evidenced before the fixture was removed.
- **Blocking:** The required independent secrets-list check cannot be completed from the currently unavailable dashboard browser connection. Theo's deletion confirmation is retained as operator evidence, not independent verification.

### 4. Important risks

- **Important:** Do not recreate the replay fixture or submit another command merely to replace missing evidence.
- **Important:** The broader denial, delivery/retry, recovery, production configuration, smoke, pilot, and release matrix remains unverified.

### 5. Unverified but required checks

- **Unverified:** Visible confirmation that the `DISCORD_QA_REPLAY_GUILD_ID` name is absent from the project Function secrets list, without disclosing any values.

### 6. Suggested fixes or next validation steps

1. Theo: in the Supabase project Function Secrets list, confirm only that `DISCORD_QA_REPLAY_GUILD_ID` is absent; do not share secret values. Tell QA when that check is complete.
2. Core/PM: decide whether the remaining hosted denial and operational matrix merits a new reviewed non-customer mechanism. Exact replay remains an outstanding release gate; do not activate workers or customers.

## Core final cleanup handoff - 2026-08-05

- Theo confirmed deletion of the temporary server-side environment name `DISCORD_QA_REPLAY_GUILD_ID`. The secrets-list UI could not be independently inspected because the in-app browser controller failed before page access, so this is recorded as operator-confirmed rather than browser-verified.
- Supabase reports active `discord-interactions` version 11 after the configuration change, retaining reviewed clean SHA-256 `0181e9d3c3e763fe3b7c5fff9560b647c7dcecb963a6c46648ff1ad3d03864e6`, intentional `verify_jwt = false`, the exact `2.57.4` dependency pin, supported-format validation, and redacted rejection diagnostics.
- Retrieved hosted source still contains no replay environment lookup, marker, or background replay path.
- Post-cleanup read-only evidence remains 6 scrims, 3 receipts, 8 Discord events, 2 pending Discord events, 6 delivery attempts, and 0 active workers.
- Core cleanup is complete and WO-040 is **Ready for QA**. QA and Release Auditor should confirm the temporary secret name is absent in the dashboard, reconcile v11 and the unchanged counts, and decide the remaining release-matrix route. Exact replay remains unverified; release remains **HOLD**.

## Operator confirmation: temporary-secret removal - 2026-08-05

### 1. Release verdict: HOLD

Theo confirmed that the temporary QA replay guild-ID Function secret is removed. This completes the cleanup confirmation but does not prove replay safety or make Discord production-ready.

### 2. What was verified

- **Operator-confirmed:** `DISCORD_QA_REPLAY_GUILD_ID` is absent from the Function Secrets list; no secret value was recorded.
- **Hosted evidence retained:** Clean `discord-interactions` v11 source and unchanged non-customer fixture counts remain the independent verification record.

### 3. Blocking issues

- **Blocking:** Exact signed replay was not evidenced before the temporary fixture was removed.

### 4. Important risks

- **Important:** Do not recreate the temporary replay mechanism or submit another Discord command simply to manufacture replay evidence.

### 5. Unverified but required checks

- **Unverified:** The remaining denial, delivery/retry, recovery, production configuration, smoke, pilot, and release matrix.

### 6. Suggested fixes or next validation steps

1. Core/PM must choose whether to design a separately reviewed, observable non-customer replay/denial mechanism.
2. Keep workers inactive and do not activate customer Discord delivery pending a complete release decision.

## Core/PM controlled-matrix design proposal - 2026-08-05

### 1. Proposed outcome and users

Provide the QA and Release Auditor with a deterministic, one-use, non-customer mechanism that can prove the same signed Discord interaction is accepted once and treated as a replay on the second complete pass, then execute the remaining authorization and operational matrix without exposing signed material, claiming unrelated outbox events, or activating customer delivery.

This is a **design proposal only**. Theo approved preparation of this proposal, not source implementation, migration application, Function deployment, provider configuration, worker invocation, test-data mutation, customer use, pilot activity, or release.

### 2. Architecture recommendation

Do not restore the previous `EdgeRuntime.waitUntil` self-fetch fixture. Supabase documents background tasks as bounded by worker lifetime, and the prior hosted run produced neither a second invocation nor completion/failure evidence. Do not add a proxy, persist a signed request envelope, or depend on a second manually submitted Discord command.

Instead, refactor `discord-interactions` into one shared request evaluator that:

1. reads the raw body once and verifies `X-Signature-Ed25519` over `X-Signature-Timestamp + rawBody` before parsing or lookup;
2. returns a bounded internal result union (`created`, `replay`, or a redacted rejection code) separately from the provider response;
3. on a short-lived, one-use, server-only QA arm for the named non-customer tenant, constructs a second in-memory `Request` with the exact same URL, body, timestamp, and signature and awaits the same evaluator again with QA recursion disabled;
4. requires the second evaluator pass to verify the signature again and return `replay` for the same interaction identity;
5. records only a private redacted QA result: opaque run ID, existing interaction ID, first/replay result, elapsed milliseconds, Function version, and completion time. It must never store or log the body, signature, timestamp, interaction token, guild ID, role IDs, provider credentials, or secret values;
6. returns the original ephemeral provider response only after the replay result is known.

The one-use arm should be database-backed rather than a new Function secret. Keep the control in the unexposed `security` schema, default inactive, with a maximum fifteen-minute expiry and an atomic single claim. Only fixed-search-path operator routines may arm or disable it. The Edge Function may claim or complete a run only through service-role-only RPCs whose broad execution is explicitly revoked. Arming must bind the named QA tenant, exact case key, and one interaction after signature and active-installation checks; it must not be reachable from a browser or inferred from user-editable metadata.

Discord requires an initial interaction response within three seconds. Implementation therefore has a hard pre-deployment performance gate: cold and warm hosted rehearsal must demonstrate the complete double evaluation with sufficient margin, targeted at no more than 2.5 seconds end-to-end. If that cannot be demonstrated without weakening authorization or moving signed material outside memory, stop and return the design to review rather than deploy it.

### 3. Phased implementation and approval gates

#### Phase A - source and disposable-database proof

- Create a source checkpoint at clean v11 (`0181e9d3c3e763fe3b7c5fff9560b647c7dcecb963a6c46648ff1ad3d03864e6`).
- Refactor signature verification and command evaluation without changing the normal provider response or authorization order.
- Add the inert one-use QA control, service-only claim/completion RPCs, fixed search paths, explicit grants, expiry, and immutable redacted result contract.
- Prove sequential and concurrent same-interaction calls yield one receipt, one scrim, one outbox event, and `created` plus `replay`; prove an already-used/expired/unarmed run cannot activate replay.
- Add negative tests for invalid signature/body, wrong guild, missing role, Free, Pro, disabled/revoked module, overlap, member/viewer configuration access, cross-tenant access, and null/forged QA controls.
- Run migration lint/reset or disposable-database assertions, RLS/grant/function checks, Advisors, focused contracts, full tests, zero-warning ESLint, TypeScript, production build, bundle budget, and scoped diff checks.

**Gate:** Theo must approve the exact reviewed migration and Function revisions before any shared-project application or deployment.

#### Phase B - isolated signed interaction and denial matrix

- Keep both workers inactive and record pre-case tenant-scoped counts.
- Arm exactly one short-lived replay run for the named private non-customer installation and submit one permitted, non-overlapping canonical `BO5` command.
- Require the provider response, redacted QA result, Function evidence, and post-case counts to agree: first result `created`, second result `replay`, one shared interaction/receipt/scrim/outbox identity, and no delivery attempt.
- Execute provider-bound wrong-guild, missing-role, and overlap cases only with named private guild/account fixtures. Execute Free, Pro, disabled/revoked-module, member/viewer, and cross-tenant cases through dedicated non-customer tenants or reversible configuration snapshots; never alter Stripe records or a customer tenant.
- For every denial, record zero deltas for receipts, scrims, outbox events, and delivery attempts plus only the bounded rejection code and Function execution context.
- Expire/disable the QA arm immediately after the single replay outcome. Do not retry a failed case without a new evidence review and explicit approval.

**Gate:** Theo must approve the exact fixture identities, reversible hosted mutations, provider invocations, and cleanup boundary. This phase does not authorise workers or outbound schedule messages.

#### Phase C - target-isolated dispatch, retry, and recovery proof

The current dispatcher claims globally eligible Discord events, including the two retained pending fixture events, so invoking it for a retry test could process unrelated evidence. Do not run the current dispatcher as a test harness.

Before operational QA, add a reviewed service-only exact-event claim path. A QA event ID may be honoured only while a matching one-use private QA run is armed and only when the event belongs to its non-customer tenant; normal production calls remain global and unchanged. Prove the exact-event path cannot claim another tenant or any event not bound to the run.

- Use one isolated synthetic schedule event and a deliberately non-postable private target to prove retry/backoff through five bounded attempts without sending a message.
- Prove already-delivered target evidence prevents another provider call, deterministic nonce enforcement remains enabled, and audit-insert failure remains retryable.
- Prove global disable retains cron definitions/history and that workspace disable retains receipts, events, and attempts.
- Keep both scheduled workers inactive throughout; invoke only the exact-event path manually under separate approval.

**Gate:** Theo must approve the source changes, exact synthetic event, private target, manual Function invocations, and retained evidence. Any successful outbound provider delivery requires a further separate approval.

#### Phase D - non-customer smoke, pilot, and release decision

- Reconcile the Function manifest, release boundary, support owner, monitoring, and rollback evidence.
- Run a non-customer smoke only after Phases A-C pass independently.
- Name and obtain consent for any later Elite pilot; define immediate workspace/global disable ownership and support contact.
- Broader activation and every customer-facing availability claim require Theo's separate release approval.

### 4. Acceptance evidence for the proposed mechanism

- Normal unarmed v11-equivalent behavior is unchanged and contains no browser-accessible test gate.
- The same immutable signed envelope passes signature verification twice through the same evaluator in one invocation; the second database result is `replay` for the same interaction ID.
- Exactly one receipt, canonical scrim, and eligible Discord outbox event exist; no duplicate or delivery attempt is created while workers are inactive.
- QA evidence is durable and independently queryable but contains none of the signed envelope, timestamp, guild/role identifiers, tokens, credentials, or secret values.
- The one-use arm is tenant-bound, short-lived, atomic, operator-only, fail-closed, and disabled after the outcome.
- Provider acknowledgement remains within Discord's three-second requirement with the recorded hosted timing margin.
- Every denial case produces the expected generic provider response, bounded internal reason, and zero tenant-owned mutations.
- Operational QA can claim only its exact synthetic event and cannot process the two retained pending fixture events or another tenant's data.

### 5. Rollback and cleanup

- Immediate stop: disable/expire every QA run and keep cron jobs 4 and 5 inactive.
- Function rollback: redeploy the reviewed clean v11 source checkpoint; do not restore the failed background fixture.
- Database recovery: use a forward migration to revoke and remove callable QA controls after evidence capture while retaining the minimal immutable redacted QA result required for provenance. Never delete receipts, scrims, outbox events, delivery attempts, or cron history to make a test pass.
- Provider rollback: remove only the separately approved private test command/configuration and verify normal endpoint signature checks still pass. Do not rotate or expose credentials unless a separate security incident requires it.

### 6. Risks and explicit non-goals

- **Highest risk:** the synchronous second pass could breach Discord's three-second acknowledgement deadline. The hosted timing gate is mandatory and failure blocks deployment.
- **High risk:** a QA control could become a production bypass. It must sit below browser access, require service/operator authorization, bind one tenant/case/interaction, expire automatically, and never skip normal signature, installation, Elite/module, role, overlap, or tenant checks.
- **High risk:** global dispatcher invocation could consume retained pending evidence. Phase C cannot begin without exact-event isolation.
- **Privacy risk:** the signed envelope and interaction token remain memory-only and absent from logs, tables, work-order evidence, and chat.
- **Non-goals:** no billing or entitlement change, customer workspace, general command registration, worker activation, outbound customer message, price/tier copy, automatic recommendation, or release claim.

### 7. Decision required before implementation

WO-040 is **Blocked** after this design proposal. Theo/PM must either:

1. approve Phase A source implementation only, with no hosted mutation; or
2. retain the release HOLD and park WO-040 without weakening or deleting the outstanding replay and operational acceptance criteria.

Approval of Phase A would not approve Phases B-D. Each later hosted/provider stage retains its own exact approval gate.

## Core Phase A source implementation - 2026-08-05

### 1. Outcome and users

Theo approved Phase A source implementation only. The local candidate now gives the QA and Release Auditor a private, one-use exact-replay control without restoring the failed background self-fetch fixture. The ordinary `/scrim` path remains available when the control is unarmed or its claim RPC is unavailable. No hosted database, Function, provider, worker, customer, billing, entitlement, or release state changed.

### 2. Acceptance criteria implemented

- Added source migration `20260805134134_discord_qa_replay_controls.sql` with an RLS-enabled table in the unexposed `security` schema, a maximum fifteen-minute arm, one-active-case partial uniqueness, atomic `FOR UPDATE SKIP LOCKED` claim, immutable terminal evidence, fixed search paths, operator-only arm/disable routines, and service-role-only public claim/completion RPCs.
- Refactored `discord-interactions` into a shared evaluator that verifies the Discord signature before parsing and before installation lookup on every pass.
- After signature and active-installation checks, an armed run can be claimed once. The handler then constructs a new in-memory `Request` from the exact URL, body, timestamp header, and signature header, awaits the same evaluator with recursion disabled, and records the bounded first/replay result before returning the original provider response.
- Claim-RPC failure is redacted and non-blocking for normal server-authorized scheduling. The QA path does not bypass existing Elite/module, installation, permitted-role, overlap, tenant, receipt, scrim, or outbox enforcement.
- Durable evidence is limited to the opaque run ID, existing interaction ID, bounded first/replay results, elapsed milliseconds, Function version, and lifecycle timestamps. The schema and evidence log contain no raw body, signature, signature timestamp, interaction token, guild ID, role IDs, provider credential, or secret value.
- Added source contracts for synchronous double evaluation, signature/header reuse, authorization order, lack of background/self-fetch code, atomic one-use controls, explicit privileges, immutable evidence, and redacted logs.
- Added `supabase/tests/wo040_discord_qa_replay.test.sql`, a rollback-only 22-assertion pgTAP suite covering RLS/ACLs, evidence-field privacy, expiry, API-role denial, service-role reachability, null/forged controls, single claim, successful completion, terminal immutability, expired runs, operator disable, and active-control concurrency protection.

### 3. Validation evidence

- Focused Discord interaction contracts: **6/6 passed**.
- Full repository tests: **249/249 passed**.
- ESLint: **passed with zero warnings**.
- TypeScript `--noEmit`: **passed**.
- Production Vite build: **passed** (`3365` modules transformed). The build emitted only the existing stale Browserslist-data advisory.
- Bundle budget: **passed**.
- Final scoped `git diff --check` plus untracked migration/test whitespace scan: **passed**.
- Supabase CLI, Deno, and local `psql` are unavailable in this checkout. The rollback-only pgTAP suite, migration lint/reset, local Edge Function type check, and post-migration Advisors therefore **were not run**. No hosted project was used as a substitute because Phase A approval expressly excluded hosted mutation.
- UI verification: not applicable; Phase A changes no browser surface.

### 4. Risks, non-goals, and remaining gate

- The synchronous second pass and evidence write add latency. Source compilation and tests do not prove Discord's three-second acknowledgement deadline; cold/warm hosted timing with the 2.5-second target remains mandatory before any provider-bound Phase B case.
- The migration and pgTAP suite have not executed against Postgres. RLS, grants, constraints, atomic claim behavior, and immutable evidence are source-reviewed/static-tested only until disposable or separately approved hosted database validation occurs.
- The same-interaction one-receipt/one-scrim/one-outbox result remains unverified end to end. Workers must stay inactive, and the current dispatcher must not be used for Phase C because it can claim unrelated pending events.
- Phase A does not include hosted migration application, Function deployment, secret/configuration change, provider invocation, fixture mutation, denial matrix, exact-event dispatcher isolation, worker activation, outbound delivery, customer use, pilot, billing/entitlement change, availability claim, or release.

WO-040 remains **Blocked** and on release **HOLD**. Core must present the exact migration and Function revisions for review and obtain Theo's separate explicit shared-project migration/deployment approval. After that approved source is hosted and its database/latency checks pass, assign the bounded Phase B evidence run to the QA and Release Auditor; do not mark the work order Ready for QA before those gates.

## Core hosted Phase A deployment - 2026-08-05

### 1. Approval and outcome

Theo explicitly approved the recommended shared-project migration application and `discord-interactions` Function deployment. Core applied only that reviewed Phase A scope to shared project `tvcgjehreaayfazlhvps`. No replay run was armed, no signed Discord interaction or provider request was submitted, no fixture/customer row was created or changed, no secret/configuration changed, and no worker or outbound delivery path was activated.

### 2. Hosted revisions

- Pre-deployment Function baseline: active `discord-interactions` v11, SHA `0181e9d3c3e763fe3b7c5fff9560b647c7dcecb963a6c46648ff1ad3d03864e6`, `verify_jwt=false` with request-level Discord Ed25519 verification.
- Applied hosted migration: `20260805134134_discord_qa_replay_controls`; the local migration filename was aligned to the hosted migration history.
- Active Function candidate: `discord-interactions` v12, SHA `b31bc919dea39da4a40080b574c5ec5179082e6f236b0dcb09df7f0c72c8cfae`, `verify_jwt=false`.
- Retrieved v12 entrypoint and `_shared/collector.ts` are exact normalized matches for the local reviewed files. The entrypoint contains the shared evaluator, private claim/completion RPC calls, and awaited in-memory second evaluation; it contains no `DISCORD_QA_REPLAY_GUILD_ID`, `EdgeRuntime.waitUntil`, or self-fetch replay path.

### 3. Hosted verification

- Private table exists with RLS enabled.
- `anon`, `authenticated`, and `service_role` lack `security` schema usage and direct table read access.
- Service role cannot execute operator-only arm/disable routines. Only service role can execute the narrow public claim/completion RPCs; anonymous and authenticated roles cannot.
- All four privileged routines are `SECURITY DEFINER`, owned by `postgres`, and have the reviewed fixed search paths.
- Replay evidence state remained inert after migration and deployment: `0` total runs and `0` armed/claimed runs.
- Discord cron jobs 4 (`scrimstats-discord-reminders`) and 5 (`scrimstats-discord-dispatch`) remain inactive.
- One unsigned direct POST to v12 returned HTTP `401` with `Invalid request signature.`; this proves the deployed endpoint still fails closed before parsing or lookup, not a provider workflow.
- Supabase Advisors reported no WO-040 warning/error. The only related notices were expected `INFO` items: RLS-without-policy on the deliberately inaccessible private table and an unused index immediately after creation.

### 4. Remaining gate and QA routing

The hosted migration and Function deployment are verified, but synchronous double-evaluation timing, exact signed replay, one-receipt/scrim/outbox identity, provider acknowledgement, and the denial/retry/recovery matrix remain unverified. The three-second Discord deadline cannot be inferred from an unsigned 401 or source inspection.

WO-040 remains **Blocked** and on release **HOLD**. The QA and Release Auditor is assigned the next independent review of the hosted revision, ACL/RLS evidence, inactive controls, and proposed Phase B procedure. Theo must separately approve the exact non-customer tenant/guild/account fixture, one short-lived arm, one signed Discord invocation, pre/post counts, and cleanup boundary before QA executes Phase B. Workers, delivery, customers, Phases C-D, and release remain unapproved.

## Independent QA Phase A hosted re-audit - 2026-08-05

### 1. Release verdict: HOLD

The Phase A replay-control candidate is safely deployed and suitable for a separately approved, one-run non-customer Phase B check. It is not production-ready and no provider-bound test is authorised by this audit.

### 2. What was verified

- Active `discord-interactions` v12 has SHA-256 `b31bc919dea39da4a40080b574c5ec5179082e6f236b0dcb09df7f0c72c8cfae`, retains Discord signature verification before parsing/lookup, and contains the reviewed synchronous shared evaluator without the old replay-secret, marker, background, or self-fetch paths.
- The private replay-runs table exists with RLS enabled. `anon`, `authenticated`, and `service_role` have no schema usage or table-read privilege.
- Claim/completion RPCs are `SECURITY DEFINER` with fixed search paths and are executable only by `service_role`; operator arm/disable routines are inaccessible to all API roles.
- Replay controls are inert: 0 total runs and 0 active runs. Workers 4 and 5 remain inactive.
- Independent focused contracts passed 9/9; scoped zero-warning ESLint and TypeScript passed.

### 3. Blocking issues

- **Blocking:** The synchronous signed second evaluation, durable `created`/`replay` evidence, and provider acknowledgement timing remain unverified on hosted Discord traffic.
- **Blocking:** The exact Phase B fixture identities, arm expiry, provider invocation, count boundary, and cleanup authority lack Theo's separate approval.

### 4. Important risks

- **Important:** The three-second Discord acknowledgement requirement cannot be inferred from source, contracts, or unsigned 401 evidence.
- **Important:** Workers, dispatch, and customer paths remain out of scope; the existing pending fixture events must not be used as a dispatcher test harness.

### 5. Unverified but required checks

- **Unverified:** One approved private-guild signed invocation with a short-lived run, recorded `created` then `replay`, one receipt/scrim/outbox identity, no delivery attempt, and a timing result within the agreed gate.
- **Unverified:** The remaining role, guild, plan, module, tenant, retry/recovery, production smoke, pilot, and release matrix.

### 6. Suggested fixes or next validation steps

1. Theo must explicitly approve the exact Phase B fixture, short-lived arm, single provider invocation, pre/post count capture, and cleanup boundary before Core/QA takes any hosted mutation action.
2. Keep WO-040 **Blocked** and workers inactive until that approval. Do not treat this audit as permission to arm a run, invoke Discord, or deliver a message.

## Phase B approval routing - 2026-08-05

Theo has now approved the exact bounded Phase B scope recorded in the decision log. Core Features Developer must arm only the existing `clash` private-fixture run for no more than fifteen minutes, record the redacted run reference and baseline, then hand the single provider invocation to QA. On any outcome, expire or disable the run immediately and preserve evidence. No worker, provider-delivery, customer, production, or release action is authorised.

## Phase B exact-replay outcome - 2026-08-05

### 1. Outcome and user-visible result

The single approved signed `/scrim` invocation was submitted once in the private fixture and was not retried. Discord displayed **"The application did not respond."** The hosted Function nevertheless returned HTTP `200`, but Supabase recorded a total request execution time of **3,184 ms**, beyond Discord's three-second acknowledgement window. The provider-acknowledgement and 2.5-second target gates therefore **failed**.

### 2. Redacted replay and mutation evidence

- Opaque run reference: `3633adfb-75f6-47ff-a6e4-58bc67b7c5c5`.
- Hosted Function evidence: v12 recorded `first_result=created`, `replay_result=replay`, and an internal elapsed time of **2,610 ms**.
- Before counts: 6 scrims, 3 interaction receipts, 8 Discord integration events, 2 pending Discord events, and 6 Discord delivery attempts.
- After counts: 7 scrims, 4 interaction receipts, 9 Discord integration events, 3 pending Discord events, and 6 Discord delivery attempts.
- The new receipt matched exactly one canonical scrim with the approved opponent, date/time, timezone, duration, format, and notes. That scrim matched exactly one Discord outbox event. The exact second evaluation created no duplicate receipt, scrim, or event.
- No signed body, signature, timestamp header, interaction token, guild ID, role ID, provider credential, or secret value was retained in this evidence.

### 3. Cleanup and safety state

- The run reached immutable `completed` state before cleanup; the operator disable routine correctly made no change to the terminal row.
- Post-run verification found **0 active replay runs** and **0 active Discord workers**. Delivery-attempt count remained unchanged at 6, so the newly queued private-fixture event was not dispatched.
- No customer tenant, worker, outbound delivery, secret/configuration, billing/entitlement, or later-phase release state was changed.

### 4. Verdict and required routing

The exact signed replay **passes idempotency and canonical-data integrity** but **fails provider acknowledgement timing**. WO-040 remains **In Progress** and release **HOLD**. Do not repeat this provider case: a retry would be a new Discord interaction and another canonical mutation, not confirmation of the captured result.

Core Features Developer must next propose a source-only timing correction that returns Discord's initial response within the provider deadline without losing durable replay evidence or weakening signature, installation, Elite/module, permitted-role, overlap, tenant, or service authorization. Any hosted migration, Function deployment, new provider invocation, worker/delivery action, customer use, production configuration, or later phase requires separate Theo approval.

## Core source-only acknowledgement timing correction - 2026-08-05

### 1. Outcome and approved scope

Theo approved the bounded source-only correction after the Phase B provider timeout. The local `discord-interactions` candidate now returns the already-authorised original Discord response without awaiting the QA-only exact second evaluation and evidence write. No hosted Function, database, provider, worker, customer, configuration, or delivery state changed.

### 2. Implementation and safety boundary

- The normal first evaluation is unchanged: Discord Ed25519 verification still occurs before parsing and installation lookup, and the service-only canonical RPC still enforces tenant, Elite/live-enabled module, installation, permitted-role, schedule validation, overlap, receipt idempotency, and outbox creation.
- Only a successfully claimed short-lived private QA run schedules follow-up work. The exact URL, raw body, signature timestamp, and signature remain memory-only in a bounded envelope.
- The QA task uses Supabase's documented `EdgeRuntime.waitUntil` background-task primitive. It constructs a new in-memory `Request`, re-runs the same evaluator with QA claiming disabled, and therefore re-verifies the original signature before reaching the idempotent scheduling RPC.
- The provider response is returned after the background task is registered rather than after replay/evidence completion. A redacted scheduling log records the source-side acknowledgement time; the durable completion row retains first result, replay result, total elapsed time, Function version, and lifecycle timestamps.
- Background evaluation and completion writes are caught and reduced to bounded `error`/`failed` evidence. If the runtime is interrupted before completion, the run remains non-successful (`claimed`) and cannot be interpreted as a passed replay.
- No self-fetch, recursive Function request, retained signed envelope, bypass flag, new secret, schema change, worker, outbound delivery, or customer path was added.

### 3. Validation evidence

- Focused Discord interaction contracts: **6/6 passed**.
- Full repository tests: **249/249 passed**.
- ESLint: **passed with zero warnings**.
- TypeScript `--noEmit`: **passed**.
- Production Vite build: **passed** (`3365` modules transformed); only the existing stale Browserslist-data advisory was emitted.
- Bundle budget: **passed**.
- Supabase's current Background Tasks documentation confirms that `EdgeRuntime.waitUntil(promise)` allows an Edge Function to return the response immediately while the registered task continues, subject to hosted runtime limits: <https://supabase.com/docs/guides/functions/background-tasks>.
- UI/mobile verification is not applicable because this correction changes no browser surface. Hosted provider acknowledgement and background completion remain unverified because this approval was source-only.

### 4. Remaining gate and handoff

The source candidate addresses the observed blocking order, but local contracts and a web build cannot prove Discord receives the response within three seconds or that hosted background execution completes. WO-040 remains **In Progress** and release **HOLD**.

Assign the source candidate to the QA and Release Auditor for independent review. Any commit/push, hosted `discord-interactions` deployment, re-arm, new signed provider invocation, worker/delivery action, customer use, configuration, later phase, or release requires its applicable separate approval. A later provider verification must use a newly approved non-overlapping private-fixture command exactly once and must require both: hosted HTTP acknowledgement below three seconds (2.5-second target) and terminal durable `created`/`replay` evidence with a single receipt/scrim/outbox delta.

## Independent QA acknowledgement-correction source review - 2026-08-05

### 1. Release verdict: HOLD

The source-only timing correction is a credible remedy for the observed 3.184-second provider timeout, but it is not hosted evidence. The active v12 Function remains the failed timing candidate; no new provider test is authorised.

### 2. What was verified

- The candidate returns the original authorised Discord response after registering the QA-only background task, rather than awaiting the second evaluation and evidence write.
- The background task reconstructs the signed envelope only in memory, re-verifies it through the same evaluator with QA claiming disabled, and records bounded durable result evidence. It does not reintroduce self-fetch, recursion, a secret, or a signature/tenant/guild/role log path.
- Independent focused contracts passed 9/9; scoped zero-warning ESLint and TypeScript passed.
- Current hosted state is safely terminal: one completed prior run, zero active runs, 7 fixture scrims, 4 receipts, 9 Discord events, 6 attempts, and zero active workers.

### 3. Blocking issues

- **Blocking:** The correction is not deployed; active v12 remains the candidate that exceeded Discord's response deadline.
- **Blocking:** A new Function deployment, re-arm, and a new provider interaction each require separate approval. The prior one-run approval was consumed by the timed-out case.

### 4. Important risks

- **Important:** `waitUntil` is documented to avoid blocking the response, but hosted provider acknowledgement and background completion must be measured together; source tests cannot establish either.
- **Important:** The arm is tenant-bound and one-use, so an unintended eligible interaction in the isolated fixture during the arm window could consume it. Keep the approved private fixture quiet and the window minimal.

### 5. Unverified but required checks

- **Unverified:** Hosted acknowledgement below the 2.5-second target and Discord's three-second deadline, plus terminal durable `created`/`replay` evidence from the new candidate.

### 6. Suggested fixes or next validation steps

1. Core must provide the exact commit and hosted deployment plan for the reviewed source-only correction. Theo must separately approve that deployment.
2. After hosted verification, Theo must separately approve a fresh ≤15-minute arm and one new, non-overlapping private-fixture command. Do not repeat or reactivate the prior run.

## Core scoped commit and hosted timing-correction deployment - 2026-08-05

### 1. Outcome and approval boundary

Theo approved the exact scoped commit/push and deployment of only the reviewed `discord-interactions` timing correction. Core created commit `dd354f8` (`Return Discord response before replay evidence`), pushed it to `origin/codex/Staging`, and deployed only `discord-interactions` to shared project `tvcgjehreaayfazlhvps`. No migration, secret/configuration, replay arm, provider interaction, worker, dispatch, customer, billing/entitlement, or release action occurred.

### 2. Exact committed and deployed revisions

- Scoped commit: `dd354f8`; seven WO-040 files only. The assignment-board index contained only the WO-040 row move, while unrelated dirty board/worktree changes remained unstaged.
- Active Function: `discord-interactions` v13, SHA `0346de39082a99ecc2a8aa874e58608d1316d405120e71cb71b4b9028e456fdb`, status `ACTIVE`, intentional `verify_jwt=false` with Discord Ed25519 request verification retained.
- Retrieved v13 entrypoint is an exact normalized match for the committed local entrypoint. Retrieved `_shared/collector.ts` is an exact normalized match for the unchanged pinned shared helper.
- Hosted source contains the reviewed `EdgeRuntime.waitUntil(recordExactReplay(...))` path and contains neither self-fetch (`fetch(request.url`) nor the retired `DISCORD_QA_REPLAY_GUILD_ID` name.

### 3. Post-deployment hosted verification

- One unsigned direct POST returned HTTP `401`, confirming the deployed endpoint still fails closed before parsing or tenant lookup.
- Active replay runs: **0**.
- Active Discord workers: **0**.
- Private-fixture counts remain unchanged from the completed v12 case: 7 scrims, 4 interaction receipts, 9 Discord events, and 6 Discord delivery attempts.
- No signed provider request was submitted, so this deployment does not prove acknowledgement timing or background replay completion.

### 4. QA handoff and remaining gate

The exact timing candidate is now hosted and inert. WO-040 remains **In Progress** and release **HOLD**. Assign v13 to the QA and Release Auditor for independent deployed-source, authentication, and inert-state review.

After QA accepts the hosted revision, Theo must separately approve a fresh tenant-bound arm for no more than fifteen minutes and exactly one new non-overlapping command in the approved private fixture. That later result must show both HTTP acknowledgement below Discord's three-second deadline (2.5-second target) and terminal durable `created`/`replay` evidence with exactly one receipt/scrim/outbox delta. Workers, delivery, customers, production configuration, later phases, and release remain outside this approval.

## Independent QA hosted v13 timing-correction review - 2026-08-05

### 1. Release verdict: HOLD

The reviewed timing correction is deployed as the active hosted candidate and is safely inert. It has not yet been verified against a signed Discord provider interaction, so WO-040 remains **In Progress** and is not production-ready.

### 2. What was verified

- Active `discord-interactions` is v13, `ACTIVE`, `verify_jwt=false`, with SHA-256 `0346de39082a99ecc2a8aa874e58608d1316d405120e71cb71b4b9028e456fdb`.
- Retrieved hosted source contains the reviewed `EdgeRuntime.waitUntil(recordExactReplay(...))` ordering, retains Ed25519 verification before parsing and tenant lookup, and has no retired replay-guild secret or self-fetch path.
- An independent unsigned malformed POST returned HTTP `401` and `Invalid request signature.`, confirming the hosted endpoint fails closed before a scheduling mutation.
- The replay control has one historical terminal run and **0** active (`armed`/`claimed`) runs. Discord workers 4 and 5 are inactive.
- The non-customer fixture baseline is unchanged: 7 scrims, 4 interaction receipts, 9 Discord events, and 6 delivery attempts. No provider message or delivery was sent during this review.

### 3. Blocking issues

- **Blocking:** No signed provider request has exercised v13. The provider acknowledgement time and durable background `created`/`replay` completion remain unverified.
- **Blocking:** A fresh arm and command are a new state-changing provider test. Theo's previous one-run approval was consumed by v12 and does not authorise this test.

### 4. Important risks

- **Important:** `waitUntil` changes execution order but source/deployment inspection cannot prove Discord receives the acknowledgement inside the 2.5-second target and three-second deadline, or prove hosted background completion.
- **Important:** The one-use arm is tenant-bound. Keep the isolated fixture quiet and the approved arm window no longer than fifteen minutes so another eligible fixture interaction cannot consume it.

### 5. Unverified but required checks

- **Unverified:** One newly approved non-overlapping private-fixture `/scrim` command, with pre/post aggregate counts, acknowledgement below 2.5 seconds, terminal durable `created` then `replay` evidence, exactly one receipt/scrim/outbox delta, no delivery attempt, and immediate expiry/cleanup.
- **Unverified:** The remaining denial, retry/recovery, worker-delivery, role/guild/plan/tenant, production smoke, pilot, and release matrix.

### 6. Suggested fixes or next validation steps

1. Theo must approve the exact fixture, no-more-than-fifteen-minute arm, one new non-overlapping provider command, pre/post aggregate capture, and cleanup boundary. Core may then arm the private replay run and hand the single command to QA.
2. Keep workers inactive and do not send delivery, touch customers, change production configuration, or advance later release phases. Record the one-run result before deciding whether another source correction is required.

## v13 controlled provider-retest approval - 2026-08-05

Theo approved the following bounded QA action only: arm the existing non-customer private fixture for no more than fifteen minutes; record redacted aggregate pre-state; submit exactly one new, non-overlapping signed `/scrim` command; capture acknowledgement and terminal durable replay evidence; and immediately expire or disable the run. Core Features Developer must arm the run and provide the redacted handoff before QA submits the single command. No worker activation, delivery, customer action, configuration/secret change, migration, production release, or later phase is approved.

## Core v13 controlled provider-retest outcome - 2026-08-05

### 1. Outcome and user-visible result

The single approved signed `/scrim` command was submitted once in the existing non-customer private fixture and was not retried. Discord displayed **"Practice block added to ScrimStats."** Supabase Edge Function logs record HTTP `200` from active `discord-interactions` v13 in **2,075 ms**, inside both Discord's three-second acknowledgement deadline and the work order's 2.5-second target.

### 2. Durable replay and canonical mutation evidence

- Opaque replay-run reference: `4fb91d22-40d2-4df4-a8c3-c5da3b328c9b`.
- The private run reached immutable `completed` state with `first_result=created`, `replay_result=replay`, interaction recorded, Function version 13, and total internal evidence time **2,573 ms**. The provider response was returned before the background exact-replay evidence completed, as designed.
- Counts moved exactly once from 7 to 8 scrims, 4 to 5 interaction receipts, 9 to 10 Discord integration events, and 3 to 4 pending Discord events. Delivery attempts remained 6.
- Exactly one receipt matched the approved command's opponent, date/time, `Europe/London` timezone, 120-minute duration, `BO5` format, and notes. That receipt resolved to exactly one canonical scrim and exactly one Discord outbox event; the exact second evaluation created no duplicate receipt, scrim, or event.
- No signed body, signature, timestamp header, interaction token, guild ID, role ID, provider credential, or secret value was retained in this evidence.

### 3. Cleanup and safety state

- The operator disable routine returned `false` because the run was already immutable and terminal, which is the expected safe result.
- A post-cleanup hosted query confirms **0 active replay runs** and **0 active Discord workers**. The unchanged delivery-attempt count confirms the newly queued private-fixture event was not dispatched.
- No worker, outbound delivery, customer tenant, configuration/secret, migration, billing/entitlement, production-release, or later-phase state was changed.

### 4. Validation verdict and QA handoff

The v13 correction passes this bounded hosted provider-acknowledgement, exact-replay idempotency, canonical-data integrity, and cleanup case. This result resolves the specific v12 timing failure; it does not complete WO-040's production-readiness acceptance criteria.

WO-040 is **Ready for QA** and assigned to the **QA and Release Auditor** for independent review of the v13 log row, terminal replay evidence, exact count deltas, canonical identity checks, and inactive cleanup state. The release verdict remains **HOLD**. The remaining denial, retry/recovery, worker-delivery, role/guild/plan/module/tenant, production smoke, controlled pilot, customer availability, and release gates remain unverified and require their recorded separate approvals. Do not repeat this command.

## Independent QA v13 controlled provider-retest audit - 2026-08-05

### 1. Release verdict: HOLD

The bounded v13 acknowledgement and exact-replay case passes. WO-040 is not production-ready: its remaining authorization, recovery, delivery, pilot, and release gates have not been exercised.

### 2. What was verified

- Hosted Edge Function logs independently record one active `discord-interactions` v13 HTTP `200` execution in **2,075 ms**, below the 2.5-second target and Discord's three-second deadline.
- The approved replay run is terminal `completed` with an interaction recorded, `first_result=created`, `replay_result=replay`, `elapsed_ms=2,573`, and the v13 deployment identifier.
- Compared with the independently recorded pre-run baseline, the isolated non-customer tenant now has exactly one additional scrim (8), receipt (5), and Discord event (10); delivery attempts remain 6. The replay result and receipt count rule out a duplicate canonical receipt/scrim/event for this case.
- Replay controls are inert: **0** active (`armed`/`claimed`) runs. Discord workers 4 and 5 remain inactive; no delivery was dispatched.

### 3. Blocking issues

- **Blocking:** The acceptance criteria for denial paths, retry/recovery, worker delivery, role/guild/Elite/module/tenant enforcement, production smoke, pilot, and customer availability are still unverified. This one private case cannot approve a controlled production release.

### 4. Important risks

- **Important:** The 2,075 ms log verifies hosted Function completion inside the provider budget, but QA did not independently observe the Discord client acknowledgement; the recorded visible success is developer handoff evidence.
- **Important:** Delivery is intentionally not tested because workers remain inactive. Do not infer outbox creation from this fixture as proof of provider delivery or customer-facing reliability.

### 5. Unverified but required checks

- **Unverified:** The approved negative authorization and schedule cases, retry/recovery handling, worker/outbound delivery with safe non-customer controls, role/guild/Elite/module/tenant matrices, production smoke, controlled pilot, and release criteria.

### 6. Suggested fixes or next validation steps

1. Return WO-040 to **In Progress** under Core Features Developer / QA and Release Auditor. Plan the next smallest non-customer validation gate with its own acceptance criteria and Theo approval; do not repeat this command.
2. Keep the release **HOLD** and workers inactive. Any delivery test, worker activation, customer exposure, production configuration, or production release needs its separately scoped approval and a new QA plan.

## Independent QA production-path reconciliation - 2026-08-05

### 1. Release verdict: HOLD

WO-040 has resolved the bounded inbound `/scrim` acknowledgement and replay defect in staging. Discord remains test-only and excluded from the customer release boundary because outbound dispatch, recovery, production configuration, smoke, and pilot evidence are incomplete.

### 2. What was verified

- The isolated v13 provider case is hosted-verified: valid signed input returned HTTP 200 in 2,075 ms and produced one canonical result plus terminal `created`/`replay` evidence without delivery.
- The inbound path remains fail-closed for an invalid signature, server-gated by installation and Elite/live-enabled Discord module checks, and its one-use replay control is inactive after use.
- The production-dispatch safety design, manifest, release boundary, and support runbook agree that Discord workers are inactive and Discord is not customer available.

### 3. Blocking issues

- **Blocking:** The current dispatcher can claim globally eligible Discord events. It must not be used as a QA harness while retained private-fixture events exist; Core must first provide a reviewed, service-only exact-event isolation path for a named non-customer event.
- **Blocking:** There is no hosted evidence for dispatch retry/backoff, terminal failure, provider receipt, global disable, workspace disable, or recovery. Enabling workers or customer Discord before this would expose unverified outbound communication.
- **Blocking:** Production Discord application/configuration, non-customer production smoke, consented Elite pilot, support monitoring, and Theo's final release approval are absent.

### 4. Important risks

- **Important:** A passing inbound command/outbox row is not proof that Discord can deliver reliably, deduplicate per target, recover safely, or be disabled during an incident.
- **Important:** The release references still correctly label Discord test-only. Changing customer copy, a module to available, or worker state before the evidence below would create an unsupported Elite claim.

### 5. Unverified but required checks

- **Unverified:** Hosted negative matrix: wrong guild, missing role, Free/Pro, disabled/revoked module, overlap, member/viewer configuration access, and cross-tenant cases—all with zero canonical/outbox/delivery deltas.
- **Unverified:** A separately approved target-isolated dispatch test using a deliberately non-postable private channel: bounded retry/backoff to terminal failure, delivered-target deduplication/nonce behaviour, audit-write recovery, global disable, and workspace disable with evidence retained.
- **Unverified:** Approved production configuration review (names/presence only, no secrets), non-customer production smoke, named consented Elite pilot, monitoring/support ownership, rollback rehearsal, and final release decision.

### 6. Suggested fixes or next validation steps

1. **Core:** propose the smallest Phase C source change: a server-only, one-use exact-event dispatcher claim bound to one non-customer tenant/event, with tests proving it cannot claim any other event or tenant. Do not deploy, invoke it, or activate workers without its own approval.
2. **QA:** independently review that candidate, then run the agreed denial matrix and isolated retry/recovery test only after Theo approves their exact fixture, Function invocations, and cleanup.
3. **Theo:** after staging gates pass, approve a separately named production configuration/smoke plan; then a named consented Elite pilot; then a final release decision. Broader client availability is the final step, not the next step.

## Core Phase C source-only exact-event dispatch candidate - 2026-08-05

### 1. Outcome and approved scope

Theo approved the smallest source-only Phase C correction requested by QA. The candidate provides a server-only, one-use dispatcher claim bound to one exact non-customer tenant/event so a later retry/recovery test cannot consume any other pending Discord event. No hosted migration, Function deployment, provider invocation, delivery, worker activation, secret/configuration change, customer action, or release action occurred.

### 2. Implementation and security boundary

- Migration `20260805170753_wo040_discord_qa_dispatch_controls.sql` creates private `security.discord_qa_dispatch_runs` evidence with RLS, no API-role table/schema access, a global one-active-run partial uniqueness guard, indexed tenant/event foreign keys, and bounded non-sensitive result metadata.
- `security.arm_discord_qa_dispatch(tenant,event,expiry)` and `security.disable_discord_qa_dispatch(run)` are database-operator-only. Arming requires an exact eligible Discord event, matching tenant, availability now, fewer than five attempts, and expiry within fifteen minutes. Service role cannot arm or disable a run.
- `public.claim_discord_qa_dispatch_event(run)` and `public.complete_discord_qa_dispatch_run(...)` use fixed empty search paths, fully qualified relations, explicit server-role checks, revoked default/browser execution, and narrow service-role grants. Claiming locks and updates only the armed run's exact tenant/event and consumes the run once.
- `discord-dispatch` accepts only an empty object or the single field `qa_run_id`. Malformed JSON, unknown fields, invalid UUIDs, unavailable controls, and zero/multiple claim results fail closed. A QA request calls only the exact-event RPC and cannot fall back to `claim_integration_events_for_provider`.
- The existing empty-body/`{}` global production path remains unchanged. Each later retry attempt requires a separately operator-armed one-use run after `available_at`; the source change does not create a reusable dispatcher bypass.
- Completion evidence records only run ID, event ID, bounded result status, Function deployment/execution metadata, and evidence-write state. It stores no provider request, channel, receipt, credential, secret, tenant identifier in logs, or customer content.

### 3. Validation evidence

- Focused Discord/Phase C contracts: **16/16 passed**.
- Full repository suite: **253/253 passed**.
- Rollback-only Phase C pgTAP contract: **28/28 passed**.
- Supabase database lint for `public,security`: **zero errors**.
- Scoped ESLint: **passed with zero warnings**.
- TypeScript `--noEmit`: **passed**.
- Production Vite build: **passed** (`3365` modules transformed); only the existing stale Browserslist-data advisory was emitted.
- Bundle budget: **passed**.
- The database migration and pgTAP test ran in a disposable database-only Supabase stack on isolated local ports because the separate ClimbLab stack occupied ScrimStats' configured defaults. Only minimal validation prerequisites plus the exact candidate migration were applied; the temporary containers and files were removed afterward. No hosted database was used.
- Current Supabase guidance confirms that `SECURITY DEFINER` functions require a controlled search path and explicit execution revocation/grants. The 2026 breaking-change index contains no change that alters this candidate's RPC or private-schema design: <https://supabase.com/docs/guides/database/functions>, <https://supabase.com/changelog?types=breaking-change>.
- UI desktop/mobile validation is not applicable because this source-only candidate changes no browser surface.

### 4. QA handoff and remaining gates

WO-040 is **Ready for QA** for an independent source audit of the exact migration, table/RLS/index design, operator/service grants, fail-closed Function routing, exact-event claim/completion behavior, and rollback-only evidence. The release verdict remains **HOLD**.

The source candidate is not hosted and cannot yet be invoked. Any commit/push, hosted migration, `discord-dispatch` deployment, event selection, arm, provider call, retry/recovery sequence, worker activation, outbound delivery, customer use, production configuration, smoke, pilot, or release requires its separately named approval. QA should not use the current deployed v15 global dispatcher as a test harness.

## Independent QA Phase C source audit - 2026-08-05

### 1. Release verdict: HOLD

The exact-event isolation design is suitable for the next gated non-customer delivery/recovery test after one narrow logging correction. It is source-only, unhosted, and cannot make Discord customer-ready.

### 2. What was verified

- The new private RLS-enabled `security.discord_qa_dispatch_runs` control is one-use, fifteen-minutes-or-less, globally single-active, and binds an exact tenant/event only. API roles lack schema/table access; only operator routines arm/disable it, while service role has only narrow claim/completion RPC execution.
- The claim RPC locks and verifies the armed tenant/event, then changes only that exact event to `processing`; it cannot invoke the global provider-queue claim. Invalid, malformed, unknown, or unavailable `qa_run_id` Function input fails closed and does not fall back to the global dispatcher.
- Completion is constrained to a claimed run, its bound event, a bounded terminal status, and a function-version token. A retry therefore needs a separate one-use arm after the event is eligible again.
- Independent focused contracts passed **7/7**, project-local TypeScript `--noEmit` passed, and scoped ESLint completed with zero warnings. Core's disposable-database pgTAP/database-lint evidence remains local-test evidence, not hosted proof.

### 3. Blocking issues

- **Blocking:** The candidate is not committed, deployed, or migration-applied. No exact-event retry/recovery, worker, provider-delivery, customer, production-configuration, smoke, pilot, or release action is authorised or verified.

### 4. Important risks

- **Important:** `discord-dispatch` still logs `event_id`, `tenant_id`, and `channel_id` when a provider success cannot be recorded in `integration_delivery_attempts`. This contradicts the Phase C no-tenant-identifier-in-logs boundary. Core must replace those identifiers with a bounded redacted correlation value before any delivery-oriented deployment or test.
- **Important:** The later deliberately non-postable-target test may produce a provider HTTP failure but must not be described as a delivered message. It is retry/recovery evidence only.

### 5. Unverified but required checks

- **Unverified:** Hosted migration/RLS/grant/Function revision verification and a signed worker-secret rejection check for the deployed candidate.
- **Unverified:** The separately approved exact-event retry/backoff, terminal-failure, deduplication/nonce, completion-evidence, global/workspace-disable, and retained-history matrix.

### 6. Suggested fixes or next validation steps

1. **Core:** redact the existing delivery-evidence failure log at `discord-dispatch/index.ts` before handing the source candidate back. Add a focused contract proving tenant/channel identifiers are absent from that log payload.
2. After QA rechecks the correction, Core must provide an exact commit and hosted migration/Function deployment plan. Theo must separately approve it. Only then can QA assess the hosted inert state and request a later exact-event test approval.

## Core Phase C delivery-log redaction correction - 2026-08-05

### 1. Outcome and users

Theo approved the narrow source-only correction returned by independent QA. The delivery-evidence write-failure log now retains only the existing hashed delivery correlation and the bounded database error code; it no longer emits the event, tenant, or channel identifiers. This is an operator/QA observability correction with no customer-visible or browser change.

### 2. Acceptance criteria and scoped changes

- `discord-dispatch/index.ts` replaces the `event_id`, `tenant_id`, and `channel_id` log fields with `delivery_correlation: nonce`. The nonce was already derived as a truncated SHA-256 digest of the event/target pair for provider deduplication, so the correction adds no new identifier or provider data.
- `discord-qa-dispatch-contract.test.mjs` extracts the exact `Unable to record Discord delivery evidence` payload, requires the correlation and bounded error-code fields, and rejects all three identifier keys.
- Dispatch selection, authorization, exact-event claims, delivery attempts, provider requests, retry behavior, migrations, and browser surfaces are unchanged.

### 3. Validation evidence

- Focused Discord production/Phase C contracts: **8/8 passed**.
- Full repository suite: **254/254 passed**.
- Scoped ESLint: **passed with zero warnings**.
- TypeScript `--noEmit`: **passed**.
- The current Supabase breaking-change index was checked; no Edge Function logging/runtime change affects this local payload-redaction correction.
- Production build and desktop/mobile browser checks are not applicable because this correction changes only a server log payload and a source contract.

### 4. Risks, non-goals, and QA handoff

WO-040 is **Ready for QA** for independent re-audit of the exact failure-log payload and focused regression contract. The release verdict remains **HOLD**.

No commit, push, hosted migration, Function deployment, provider invocation, exact-event arm, retry/recovery sequence, worker activation, outbound delivery, customer action, production configuration, smoke, pilot, or release action occurred or is authorised by this correction. After QA accepts the source, Core must provide the exact commit and hosted migration/Function deployment plan for Theo's separate approval.

## Independent QA Phase C redaction re-audit - 2026-08-05

### 1. Release verdict: HOLD

The returned privacy correction resolves the Phase C source-review finding. The candidate is suitable for Core to prepare a separately approved hosted migration and Function deployment plan; it remains unhosted and cannot establish customer readiness.

### 2. What was verified

- The delivery-evidence write-failure payload now contains only `delivery_correlation: nonce` and the bounded database error code. It no longer contains `event_id`, `tenant_id`, or `channel_id`; the correlation reuses the existing deterministic truncated SHA-256 provider nonce.
- The focused regression extracts the exact log payload and rejects the three identifier keys.
- Independent focused contracts passed **8/8**. Project-local TypeScript `--noEmit` and scoped ESLint passed with zero warnings.

### 3. Blocking issues

- **Blocking:** The Phase C migration and `discord-dispatch` source are not committed/deployed to the shared project. Hosted RLS/grant/function-authentication evidence and all retry/recovery/delivery checks are absent.

### 4. Important risks

- **Important:** A hashed correlation is safe operational evidence only when it remains bounded to server logs; it is not customer-facing data and must not be surfaced in browser responses or support copy.
- **Important:** The normal global dispatch route remains deliberately unchanged. Do not invoke it as a test harness or activate workers while unrelated private-fixture events exist.

### 5. Unverified but required checks

- **Unverified:** Hosted application of the migration, active dispatcher revision, fail-closed worker-secret check, private-control ACL/RLS review, and inert-state verification.
- **Unverified:** Separately approved exact-event retry/backoff, terminal failure, deduplication, disable/recovery, production smoke, pilot, and release evidence.

### 6. Suggested fixes or next validation steps

1. **Core:** provide the exact commit, scoped hosted migration/`discord-dispatch` deployment sequence, expected inactive worker state, rollback evidence, and no-provider/no-delivery boundary.
2. **Theo:** approve that exact hosted scope only after reviewing the plan. QA will then verify the deployed revision and inert state before any later event-arm or delivery test is proposed.

## Core Phase C hosted inert deployment - 2026-08-05

### 1. Outcome and approved scope

Theo approved the exact Phase C commit, push, hosted migration, `discord-dispatch` deployment, and inert verification plan. Core created commit `8986e82` (`Isolate WO-040 Discord QA dispatch`), pushed it to `origin/codex/Staging`, applied only the Phase C migration to shared project `tvcgjehreaayfazlhvps`, and deployed only `discord-dispatch`. No correct-secret dispatcher invocation, QA arm, provider request, delivery, worker activation, secret/configuration change, customer action, pilot, or release action occurred.

### 2. Exact hosted revisions

- Source commit: `8986e82`; seven wholly WO-040-owned files only. Shared assignment-board and index files contained unrelated dirty changes and were deliberately excluded from the commit.
- Hosted migration: `20260805191357_wo040_discord_qa_dispatch_controls`, applied from local migration `20260805170753_wo040_discord_qa_dispatch_controls.sql`.
- Active Function: `discord-dispatch` v18, `ACTIVE`, intentional `verify_jwt=false` with the existing `DISCORD_DISPATCH_SECRET` comparison retained before request parsing or event claiming.
- Deployed SHA-256: `f8706beefeb5d1e0becae4cd9609376c78f990b5ad14eafeda4bc65f71a990b2`.
- Retrieved v18 entrypoint and `_shared/collector.ts` are exact normalized matches for commit `8986e82`.
- The pre-deployment active Function was v17, rather than the older revision noted in the local manifest. Retrieved v17 was the reviewed global dispatcher source matching commit `e268298`/pre-Phase-C `HEAD`; it remains the bounded Function rollback source.

### 3. Hosted inert verification

- Before migration: Phase C table absent; 10 Discord events; 6 Discord delivery attempts; both `scrimstats-discord-dispatch` and `scrimstats-discord-reminders` jobs inactive.
- After migration/deployment: private table present with RLS enabled; API roles cannot use the `security` schema or table; service role has only the narrow public claim/completion grants and cannot arm/disable runs.
- Phase C evidence rows: **0 total**, **0 active**. No run was armed or claimed.
- Discord event and attempt counts remain unchanged at **10** and **6**. Both Discord worker jobs remain inactive.
- One deliberately invalid-secret POST with an otherwise valid-shaped QA UUID returned HTTP **401**, proving rejection before request parsing/event claim without using or recording the real secret.
- Security Advisor reports only the expected informational `rls_enabled_no_policy` notice for the deliberately private, no-API-policy table. Performance Advisor reports only expected informational unused-index notices for the newly created event indexes: [RLS no-policy guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [unused-index guidance](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

### 4. Rollback and QA handoff

The immediate Function rollback is redeployment of the pre-Phase-C global dispatcher from `e268298`; workers must remain inactive throughout. The migration is additive and inert. Removing it would require a separately approved forward rollback migration that first aborts if any Phase C evidence rows exist, then drops only the four Phase C routines and `security.discord_qa_dispatch_runs`; it must never drop the shared `security` schema or rewrite migration history.

WO-040 is **Ready for QA** for independent verification of commit `8986e82`, hosted migration `20260805191357`, dispatcher v18/SHA, exact retrieved source, invalid-secret rejection, private ACL/RLS/grant state, zero runs, unchanged 10/6 counts, and inactive workers. The release verdict remains **HOLD**. Any exact-event selection/arm/invocation, retry/recovery or delivery test, worker activation, customer use, production configuration, smoke, pilot, or release requires its separately named approval.

## Independent QA Phase C hosted inert audit - 2026-08-05

### 1. Release verdict: HOLD

The Phase C exact-event control is deployed correctly and safely inert in the shared staging project. It is suitable for a later separately approved non-customer retry/recovery test, but no delivery, client, or production-release claim is justified.

### 2. What was verified

- Active `discord-dispatch` is v18, `ACTIVE`, intentional `verify_jwt=false`, SHA-256 `f8706beefeb5d1e0becae4cd9609376c78f990b5ad14eafeda4bc65f71a990b2`. Retrieved source contains the reviewed strict `qa_run_id` routing and redacted delivery-evidence failure payload.
- Hosted `security.discord_qa_dispatch_runs` has **0** rows and **0** active runs. API roles have no `security` schema/table read access; service role cannot arm/disable but can execute only the narrow claim/completion RPCs; authenticated cannot claim.
- Discord counts remain **10** events and **6** delivery attempts. Workers 4 and 5 are inactive.
- An independent valid-shaped request with a deliberately invalid dispatch secret returned HTTP **401** `Unauthorized`, before request parsing or any event claim.

### 3. Blocking issues

- **Blocking:** No exact event has been selected or armed, and no isolated retry/backoff, terminal-failure, provider-receipt, deduplication, disable, or recovery result has been hosted-verified.
- **Blocking:** Production provider/configuration, non-customer production smoke, consented pilot, support monitoring, and final release approval remain absent.

### 4. Important risks

- **Important:** `verify_jwt=false` is appropriate only because this worker endpoint rejects its required server-side dispatch secret before parsing. Retain that ordering on every future revision.
- **Important:** The retained 10/6 evidence and inactive workers do not prove outbound delivery or recovery; do not activate the global route or workers as an ad-hoc test.

### 5. Unverified but required checks

- **Unverified:** One Theo-approved exact non-customer event/run with a deliberately non-postable private target, bounded retry/backoff to terminal failure, no message delivery, completion evidence, and immediate cleanup.
- **Unverified:** A separately scoped deduplication/nonce, global/workspace-disable, production smoke, pilot, support/rollback, and release matrix.

### 6. Suggested fixes or next validation steps

1. Core must provide a proposed exact-event test plan naming the non-customer tenant/event/target, one-use arm expiry, expected attempts and evidence, cleanup, and explicit no-delivery boundary.
2. Theo must approve that exact plan before Core arms anything or QA invokes v18 with the real dispatch secret. Keep workers inactive and customer Discord unavailable.

## Core Phase C controlled-test stop - 2026-08-06

### 1. Outcome and safety decision

Theo confirmed that the existing private `ScrimStats Integration Test / #scrimstats-test` target had been made non-postable and then explicitly approved the exact `clash` event `c02f5a12-fa66-476d-987f-15b2fa686fcc` for a five-attempt retry-to-terminal-failure sequence. Core preflight confirmed active `discord-dispatch` v18/SHA `f8706bee...90b2`, the exact Elite/live-enabled tenant/event, one enabled target, two required Vault names, zero active runs, 10 Discord events, 6 attempts, and inactive workers.

Attempt 1 disproved the no-delivery precondition: Discord accepted the provider request. Core stopped immediately and did not arm or invoke attempts 2-5. Continuing would have violated the approved no-delivery boundary.

### 2. Exact bounded result

- One five-minute run, opaque reference `07aa2f33-d27b-43fe-9593-811c2608fcd0`, was armed for only the approved tenant/event.
- The server-side dispatch secret was consumed inside Supabase Vault and was not returned, logged, or recorded in evidence.
- pg_net request `39418` reached v18 and returned HTTP `200` with `processed=1`, `delivered=1`, and `qa_evidence=recorded`.
- The run completed immutably with `result_status=delivered` and the v18 deployment identifier.
- The candidate event became `delivered`; its retry counter correctly remained zero. Discord delivery attempts moved exactly **6 to 7**, with one `delivered` attempt and a provider reference present. The reference value was not recorded.
- This is provider-receipt evidence that Discord accepted one delivery. No rendered-message observation or screenshot was collected, so it is not a claim about visible presentation.

### 3. Cleanup and isolation evidence

- Active Phase C runs: **0**. No cleanup mutation or evidence deletion was required.
- Both Discord workers remain inactive.
- Total Discord events remain **10**.
- The other three retained `clash` events remain pending with zero attempts; no unrelated event or tenant was claimed.
- No second arm, retry, backoff wait, terminal-failure attempt, message deletion, permission/configuration change, customer action, smoke, pilot, or release action occurred.

### 4. QA handoff and blocker

WO-040 remains **Ready for QA** for independent classification of this stopped result. The intended retry/backoff/terminal-failure criterion did **not** pass. Release remains **HOLD**.

The current channel cannot be reused for a no-delivery test based only on the prior permission confirmation. Before another attempt, QA and Core must agree a provider-verifiable non-postable target route—preferably an exact deleted/nonexistent private test-channel identifier created and retired for this purpose, with a separately approved temporary subscription mutation and restoration plan. Any message inspection/deletion, Discord permission change, new fixture/target, database mutation, arm, real-secret invocation, recovery, worker action, or release step requires separate approval.

## Core Phase C controlled retry completion - 2026-08-06

### 1. Outcome and users

Theo corrected the private Discord channel permissions so the ScrimStats app could view but not send messages, then explicitly approved a fresh five-attempt exact-event retry sequence. Core used only the retained non-customer `clash` event `fc160394-f8d1-45ca-87a5-6b5c92afb404` (`WO-040 Phase B`) and the existing `ScrimStats Integration Test / #scrimstats-test` target. The hosted retry/backoff/terminal-failure path completed without a delivered message.

This is operator and QA evidence for Discord delivery recovery behavior. It does not establish customer, pilot, production-configuration, worker, or release readiness.

### 2. Exact hosted result

- Preflight confirmed active `discord-dispatch` v18/SHA `f8706bee...90b2`, an eligible pending event at attempt count 0, exactly one enabled/active target, the two required Vault names, zero active runs, 10 total Discord events, 7 retained delivery attempts, and both Discord workers inactive.
- Each attempt used a fresh five-minute one-use run bound to the same tenant/event. The real dispatcher secret stayed inside Supabase Vault and was not returned or recorded.
- pg_net requests `39446`, `39451`, `39461`, `39480`, and `39514` each reached v18 and returned HTTP 200 with `processed=1`, `delivered=0`, and `qa_evidence=recorded`.
- Discord returned HTTP 403 for all five provider attempts. Outcomes were `retry`, `retry`, `retry`, `retry`, then `failed`; every provider-reference field remained absent.
- Event backoffs were enforced at 2, 4, 8, and 16 minutes before the following one-use arm. No eligibility timestamp was bypassed or rewritten.
- The event reached `status=failed`, `attempt_count=5`, `delivered_at=null`, and retained the bounded error `One or more Discord deliveries failed`.
- All five runs completed on v18. The first four recorded `result_status=pending`; the fifth recorded `result_status=failed`.

### 3. Cleanup and isolation evidence

- Active Phase C runs: **0**.
- Total Discord events remain **10**; total delivery attempts moved **7 to 12**, exactly matching the five approved provider failures.
- The two other retained pending events remain at attempt count 0 and were not claimed.
- Both `scrimstats-discord-dispatch` and `scrimstats-discord-reminders` remain inactive.
- No provider message was accepted in this sequence, and no provider reference was recorded. This is database plus provider-error evidence, not rendered-message evidence.
- No subscription, installation, secret/configuration, worker, customer, smoke, pilot, billing, deployment, migration, or release action occurred.

### 4. QA handoff and remaining gates

WO-040 is **Ready for QA** for independent review of the five exact run rows, request results, five 403 delivery-attempt rows, 2/4/8/16-minute timing, terminal event state, zero-active-run cleanup, retained-event isolation, and inactive workers. The release verdict remains **HOLD**.

This completes only the Phase C retry/backoff/terminal-failure criterion. Deduplication/nonce behavior, disable/recovery behavior, global/workspace-disable controls, production configuration and smoke, consented pilot, monitoring/support/rollback readiness, worker activation, customer availability, and final release approval remain separately gated.

## Independent QA Phase C retry/recovery audit - 2026-08-06

### 1. Release verdict: HOLD

The isolated retry/backoff/terminal-failure criterion passes in the non-customer fixture. Discord remains test-only: deduplication, disable/recovery, production smoke, pilot, and final release gates are still open.

### 2. What was verified

- The selected private event is terminal `failed`, has `attempt_count=5`, no `delivered_at`, and retained bounded failure text. It has five completed one-use runs with results `pending`, `pending`, `pending`, `pending`, then `failed`.
- Exactly five Discord attempt rows record `retry`, `retry`, `retry`, `retry`, then `failed`; all contain `Discord returned 403` and none has a provider reference.
- The observed intervals were 2.3, 4.4, 8.4, and 16.6 minutes, satisfying the configured 2/4/8/16-minute backoff sequence without an availability override.
- All five recorded `pg_net` requests completed to dispatcher v18 with HTTP 200 and no network timeout/error. The provider 403s therefore represent the intended non-postable-target outcome.
- No active QA dispatch run or worker remains. Total Discord events remain 10 and attempts are 12; two other eligible same-tenant fixture events remain pending at attempt 0, confirming exact-event isolation.

### 3. Blocking issues

- **Blocking:** Hosted deduplication/nonce, global-disable, workspace-disable, and recovery-after-disable evidence remains absent. The current arm routine intentionally cannot select the earlier delivered event, so it cannot simply be reused to prove a no-second-provider-call case.
- **Blocking:** Production provider configuration, non-customer production smoke, named consented Elite pilot, support monitoring/rollback rehearsal, and final release approval remain unverified.

### 4. Important risks

- **Important:** An earlier private precondition test produced one provider-accepted delivery after the target unexpectedly allowed posting. Core stopped immediately; it did not affect a customer or activate workers, but it must not be presented as rendered-message or customer-delivery evidence.
- **Important:** This recovery test proves provider denial and retained failure evidence only. It does not prove successful delivery, deduplication, or safe recovery following a provider-accepted message.

### 5. Unverified but required checks

- **Unverified:** A separately designed and approved safe hosted deduplication/nonce test, plus global and workspace disable/recovery controls, with no unplanned provider message or unrelated-event claim.
- **Unverified:** Production configuration review, non-customer smoke, controlled Elite pilot, support/rollback ownership, customer availability, and final release decision.

### 6. Suggested fixes or next validation steps

1. **Core:** propose the smallest safe hosted deduplication/nonce and disable/recovery evidence plan. It must explain how it proves no second provider call without reusing a delivered event through an ineligible arm or touching another queued event.
2. **Theo:** approve the exact isolated fixture, any reversible state change, provider boundary, evidence capture, and cleanup only after the plan is reviewed. Keep workers inactive and Discord unavailable to customers.

## 2026-08-06 Core Phase D source handoff

### Restated scope

- **Outcome:** provide QA with a narrow, source-only mechanism to prove Discord nonce behaviour and genuine delivered-evidence deduplication, plus reproducible global/workspace disable-and-recovery procedures.
- **Users:** QA and Release Auditor plus an authorised database/operator role; this adds no customer-facing surface.
- **Acceptance:** one fresh non-customer event and exact subscribed channel can be armed once; at most two byte-identical provider requests can be made; the first genuine receipt is recorded before the second request; the normal exact-event dispatcher can then prove skip-on-delivered evidence without another provider call; all recovery rehearsals are bounded and reversible.
- **Risks:** Discord may return two distinct messages, a provider success may precede an evidence-write failure, or a fixture/module/scheduler state may drift. The runbook treats each as an immediate stop and retains bounded evidence.
- **Non-goals:** no hosted migration, Function deployment, fixture mutation, permission/configuration change, provider call, worker activation, customer smoke/pilot, availability claim, or release is included in this source handoff.

### Implemented source candidate

- Migration `20260806095431_wo040_discord_nonce_qa_controls.sql` adds a private RLS-enabled evidence table, operator-only arm/disable routines, service-only claim/completion routines, exact fresh-event/Elite/live-module/subscription checks, a fifteen-minute maximum, and mutual exclusion with the existing exact-event dispatcher control. API roles cannot read the table or arm a run; provider identifiers remain only in the existing delivery-attempt ledger.
- New JWT-protected `discord-qa-nonce` source requires the separate dispatch secret before parsing, rechecks the event, entitlement, active exact subscription, and absence of any prior attempt, then permits a maximum of two byte-identical Discord POSTs. It records the first genuine provider receipt before the second request and returns/logs only bounded status/equality evidence.
- The production dispatcher and nonce probe now share one schedule-message and deterministic-nonce helper, preserving the existing localised timestamp, no-mention, and suppressed-embed presentation contract.
- `WO-2026-040_PHASE_D_QA.md` defines the future separately approved nonce/deduplication case, rollback-only global scheduler rehearsal, exact workspace module restoration case, stop conditions, and approval sequence. Workers remain inactive and the global dispatcher is never used for provider-facing Phase D evidence.

### Validation and handoff evidence

- Passed: focused Discord contracts 16/16; full repository tests 260/260; ESLint with zero warnings; TypeScript; production Vite build; bundle budget; and scoped diff checks.
- Authored: rollback-only pgTAP contract with 25 assertions covering RLS/grants, eligibility, mutual exclusion, service authorization, one-use claims, genuine evidence, disable, and tenant/event isolation.
- Not executed: the isolated pgTAP stack cannot bootstrap because historical hyphen-named migrations are skipped by the current CLI, leaving the first accepted underscore migration without its prerequisite enum. The attempt stopped before this WO migration or test ran; the temporary local container identity/ports were removed/restored, and no hosted state was touched. The earlier schema-lint result used the only running local database port, which belongs to ClimbLab, so it is not counted as ScrimStats database evidence despite returning clean.
- No UI changed, so desktop/mobile browser checks are not applicable. No hosted migration, Function deployment, fixture mutation, provider request, secret/configuration change, worker activation, customer action, or release action occurred.

### QA handoff

QA and Release Auditor should independently inspect the migration, shared helper, nonce Function, contracts, and Phase D runbook. Status is **Ready for QA for source audit only** and the release verdict remains **HOLD**. Any commit/push, hosted migration/Function deployment, or execution of Phases A-C requires the separately recorded approvals in the runbook.

## Independent QA Phase D source audit - 2026-08-06

### 1. Release verdict: HOLD

The nonce/deduplication and recovery design is directionally sound, but it is not eligible for hosted deployment because the claimed JWT gateway protection is not explicitly configured or independently tested.

### 2. What was verified

- The source bounds a nonce probe to one fresh Elite/live-module event and one active subscribed channel, mutually excludes the existing exact-event dispatch control, requires service-only claim/completion RPCs, and records the first genuine receipt before the maximum second byte-identical provider POST.
- Shared message and deterministic nonce construction are used by both the production dispatcher and probe. The probe's bounded response/log omit tenant, event, channel, provider-reference, secret, and message-body values.
- Independent focused contracts passed **14/14**; project-local TypeScript `--noEmit` and scoped ESLint passed with zero warnings.

### 3. Blocking issues

- **Blocking:** `supabase/config.toml` has no `[functions.discord-qa-nonce] verify_jwt = true` entry, while the Function contains no in-code JWT validation. The handoff and runbook claim gateway JWT verification, but deployment would rely on an implicit default rather than a reviewed explicit boundary. Add the explicit configuration and a contract proving it before any commit or deployment.
- **Blocking:** The rollback-only Phase D pgTAP contract was not executed against a ScrimStats database due historical migration bootstrap incompatibility. RLS/grant, mutual-exclusion, and completion assertions are source-only until a valid disposable database run is available.

### 4. Important risks

- **Important:** The nonce probe may send up to two private provider requests by design. Its later approval must name the temporary channel permission, maximum visible-message boundary, stop conditions, and restoration; it cannot be treated as a no-delivery test.
- **Important:** Add `discord-qa-nonce` to the Edge Function manifest as test-only before any hosted deployment, including its explicit JWT-plus-dispatch-secret boundary and no-customer-availability state.

### 5. Unverified but required checks

- **Unverified:** Disposable ScrimStats database migration/pgTAP execution; hosted migration/Function source and auth configuration; inert ACL/RLS checks.
- **Unverified:** Approved nonce/deduplication execution, rollback-only global scheduler rehearsal, workspace disable/recovery, production configuration/smoke, pilot, support/rollback, and release gates.

### 6. Suggested fixes or next validation steps

1. **Core:** add `[functions.discord-qa-nonce] verify_jwt = true`, add a focused config contract, update the test-only manifest, and resolve or document the valid ScrimStats disposable-database bootstrap path before returning the source candidate.
2. QA will re-audit those corrections. Only then may Core prepare a separately approved commit and inert hosted deployment plan; no provider action, fixture change, or worker activation is approved.

## Core Phase D authentication correction - 2026-08-06

### 1. Outcome and users

Core completed the QA-requested source-only correction for the Phase D nonce probe. The gateway JWT boundary is now explicit and regression-tested, the test-only manifest records both authentication layers, and the runbook defines a disposable ScrimStats database proof route that cannot substitute ClimbLab or the shared hosted project.

This remains an operator/QA harness only. It adds no customer-facing availability and does not authorise a commit, deployment, migration, provider request, fixture, worker, smoke, pilot, or release action.

### 2. Acceptance, risks, and non-goals

- **Acceptance:** `discord-qa-nonce` must declare `verify_jwt = true`, still reject the separate dispatch secret before parsing, appear as source-only/test-only in the manifest, and provide a valid isolated database-validation path.
- **Risks:** implicit gateway defaults can drift; schema-only exports require separate read approval and strict no-data handling; disposable container cleanup must target only the unique Phase D identity.
- **Non-goals:** no in-code replacement for gateway JWT verification, historical migration renaming, hand-built partial schema, ClimbLab reuse, hosted rollback experiment, secrets/configuration mutation, or provider execution.

### 3. Changes and validation evidence

- Added `[functions.discord-qa-nonce] verify_jwt = true` to `supabase/config.toml` while retaining the Function's pre-parse `x-discord-dispatch-secret` check.
- Added a focused contract asserting the explicit config, manifest wording, and source dispatch-secret boundary.
- Registered `discord-qa-nonce` in the test-only manifest as source-only and undeployed with explicit gateway-JWT-plus-dispatch-secret authentication.
- Added the schema-only disposable-clone procedure to `WO-2026-040_PHASE_D_QA.md`: separate read approval, zero data/secrets, matching Supabase Postgres major version, isolated identity/network/port, candidate-only migration, 25/25 rollback-only assertions, lint/advisors, exact cleanup, and explicit prohibition on ClimbLab/shared-hosted substitutes.
- Passed: focused Discord contracts **17/17**, repository tests **261/261**, ESLint with zero warnings, TypeScript, production Vite build, and bundle budget.
- The pgTAP suite remains authored but unexecuted; the new procedure documents the valid proof route rather than overstating database verification. No hosted or provider action occurred.

### 4. QA handoff

WO-2026-040 is **Ready for QA for source re-audit only**. QA should verify the explicit config contract, manifest boundary, and disposable-database procedure. Release remains **HOLD**; commit/push, hosted deployment/migration, schema-only hosted export, database proof execution, fixtures, provider calls, permissions/configuration, workers, customers, smoke, pilot, and release each retain separate approval gates.

## Independent QA Phase D authentication re-audit - 2026-08-06

### 1. Release verdict: HOLD

The JWT/configuration and manifest blockers are resolved in source. Phase D remains blocked on the separately approved execution of its database proof; it is not ready for commit, deployment, provider activity, or customer use.

### 2. What was verified

- `supabase/config.toml` now explicitly declares `[functions.discord-qa-nonce] verify_jwt = true`; the Function retains its pre-parse `x-discord-dispatch-secret` check.
- The test-only Edge Function manifest records the source-only nonce probe, explicit dual authentication, undeployed state, inactive workers, and no customer availability.
- The focused contract asserts the configuration, manifest, and secret-boundary contract. Independent focused checks passed **15/15**; TypeScript and scoped ESLint passed with zero warnings.
- The runbook now specifies a zero-data, isolated schema-only ScrimStats clone, candidate-only migration/test, advisor/lint, and identity-checked cleanup. It expressly rejects ClimbLab and shared-hosted substitutes.

### 3. Blocking issues

- **Blocking:** The Phase D migration and pgTAP suite still have not executed against a valid ScrimStats database. The documented clone procedure requires Theo's separate read-only, schema-only export approval before this RLS/grant proof can be claimed.

### 4. Important risks

- **Important:** A schema-only export must contain no rows, Auth users, Storage objects, Vault values, connection strings, or secrets. Its use must stay inside an isolated disposable environment and be cleaned up by explicit resolved identity.
- **Important:** Passing source contracts and an explicit function setting do not establish Supabase's deployed gateway-authentication behavior; that remains hosted verification after separate deployment approval.

### 5. Unverified but required checks

- **Unverified:** Approved isolated database migration, all 25 pgTAP assertions, and disposable-database lint/advisor output.
- **Unverified:** Commit/push, hosted migration/Function deployment, hosted auth/RLS/inert review, nonce/deduplication, recovery tests, smoke, pilot, and release.

### 6. Suggested fixes or next validation steps

1. **Theo:** decide whether to approve the exact read-only schema-only export and isolated disposable database proof described in `WO-2026-040_PHASE_D_QA.md`. This is the only current action needed to clear the remaining source-validation gate; it does not change hosted data, secrets, provider state, workers, or customers.
2. If approved and passed, Core can provide a separately scoped commit and inert hosted deployment plan for a later approval. Keep all provider and customer actions unapproved until then.

## Phase D disposable database-proof approval - 2026-08-06

Theo approved only the documented read-only, schema-only ScrimStats export and isolated disposable database proof in `docs/operations/WO-2026-040_PHASE_D_QA.md`. Core Features Developer may perform the approved export/proof route, applying only the Phase D candidate migration in the disposable clone and running the rollback-only pgTAP/lint/advisor checks. The export must contain no rows, Auth users, Storage objects, Vault values, connection strings, or secrets; the clone must use its unique Phase D identity and be removed after verification. No shared-hosted mutation, Function deployment, provider action, fixture change, worker activation, customer action, configuration/secret change, smoke, pilot, or release is approved.

## Core Phase D disposable database proof - 2026-08-06

### 1. Outcome

The approved read-only schema export and isolated PostgreSQL 17 proof completed. The Phase D migration applied cleanly; all **25/25** rollback-only pgTAP assertions passed; Phase D schema/RPC lint passed; advisors produced no Phase D or error-level finding; all fixtures rolled back; and the exact disposable resources plus exports were removed.

### 2. Exact evidence

- Schema-only exports contained zero data statements and no credential values. Checksums, sizes, clone identity, the exact Auth-helper correction, test output classification, inherited lint/advisor findings, hosted isolation, and cleanup are recorded in `docs/operations/WO-2026-040_PHASE_D_DATABASE_PROOF.md`.
- The first test pass stopped after assertions 1-11 because the CLI default dump excludes `auth.jwt()`. That transaction rolled back. Core exported the zero-data Auth schema and restored the exact hosted helper in the disposable clone; no candidate source changed. The second pass completed 25/25 and rolled back.
- `security` lint and direct checks of both new public RPCs returned zero issues. Full-schema lint retained unrelated inherited baseline errors; advisors returned only unrelated inherited public-schema performance warnings.
- Post-test disposable counts were zero tenants/events/attempts/nonce runs and zero active exact runs. RLS remained enabled on the Phase D table.
- Final read-only hosted evidence remained unchanged: Phase D table absent, 10 Discord events, 12 attempts, zero active exact runs, and zero active Discord workers.
- Cleanup verification found zero matching Phase D container/network/volume resources and no export directory. ClimbLab remained healthy and untouched.

### 3. Handoff and gates

WO-2026-040 is **Ready for QA for independent database-proof audit**. This clears the disposable source-validation blocker only. Release remains **HOLD**; commit/push, hosted migration/Function deployment, hosted gateway/RLS/inert verification, provider/fixture/permission work, recovery rehearsal, workers, customers, smoke, pilot, and release all remain separately approval-gated.

## Independent QA Phase D disposable database-proof audit - 2026-08-06

### 1. Release verdict: HOLD

The approved disposable proof clears the local database-validation blocker only. It does not establish a committed candidate, hosted migration or Function behavior, provider deduplication, customer safety in a live workspace, or production readiness.

### 2. What was verified

- The proof record documents a zero-data, schema-only ScrimStats export, a distinct PostgreSQL 17 disposable identity, candidate-only migration application, and removal of the exact disposable resources and export files. The recorded first test failure was preserved: it rolled back after the absent `auth.jwt()` helper, then the exact zero-data Auth schema helper was restored without changing candidate source.
- The reported second disposable pass covers all **25/25** rollback-only pgTAP assertions, including private-table RLS/revokes, service-only claim/completion, entitlement and subscription eligibility, one-use behavior, cross-control exclusion, evidence-backed completion, durable disable, and untouched unrelated fixtures. The proof also records zero Phase D security/RPC lint issues and no Phase D or error-level advisor result.
- Independent source inspection confirms the migration enables RLS, revokes API access from the nonce table and arm/disable routines, fixes `SECURITY DEFINER` search paths, restricts public claim/completion RPC execution to `service_role`, and retains the explicit `discord-qa-nonce` gateway JWT configuration plus dispatch-secret boundary in the source manifest.
- A fresh read-only hosted query confirms Phase D is still absent: no nonce table or migration history, **10** retained Discord events, **12** retained delivery attempts, and **zero** active exact-event runs or Discord workers.

### 3. Blocking issues

- **Blocking:** The Phase D source candidate remains uncommitted and undeployed. No hosted migration or `discord-qa-nonce` Function revision exists to verify gateway JWT enforcement, server authorization, grants/RLS, or inert behavior in the shared environment.
- **Blocking:** No approved provider-facing nonce/deduplication execution, recovery rehearsal, workspace recovery, non-customer smoke, pilot, support/rollback exercise, or release decision has occurred. These are required before Discord can be presented as available to other clients.

### 4. Important risks

- **Important:** The first disposable test failure was environmental (`auth.jwt()` excluded from the default schema dump), not a candidate change. The documented zero-data Auth-helper restoration is an acceptable disposable correction, but it is not evidence that hosted Auth gateway behavior will match after deployment.
- **Important:** The nonce probe may make two private provider POSTs. Any future approval must identify the non-customer workspace/channel, visible-message ceiling, exact event, stop conditions, restoration, and single-use evidence boundary.

### 5. Unverified but required checks

- **Unverified:** Exact commit/push and separately approved inert hosted migration plus Function deployment; then hosted function revision/configuration, JWT rejection, dispatch-secret rejection, public/authenticated/service-role ACL, RLS/grant, and inactive-worker checks.
- **Unverified:** A separately approved non-customer nonce/deduplication case, rollback-only global scheduler rehearsal, module-disable/recovery case, rendered-message inspection, then production smoke, controlled pilot, monitoring/support/rollback, and final release approval.

### 6. Suggested fixes or next validation steps

1. **Core Features Developer:** provide the exact candidate commit and a narrowly scoped inert hosted deployment plan (migration/function/revision, verification queries, rollback point, and explicit statement that workers, fixtures, provider calls, and customer availability remain untouched).
2. **Theo:** if satisfied with that plan, approve that exact inert hosted scope. QA will then independently verify its hosted security and inert state before requesting any provider-facing test approval.

## Core Phase D inert hosted deployment - 2026-08-06

### 1. Outcome

Theo approved the exact scoped Phase D commit/push, hosted migration, deployment of only `discord-qa-nonce`, and inert security verification. Core pushed candidate commit `1c05d7b`, then reconciled the connector-generated hosted migration identity in commit `a0180f0`; both commits are on `origin/codex/Staging`. The SQL content did not change during reconciliation.

Hosted migration `20260806130646_wo040_discord_nonce_qa_controls` applied successfully. `discord-qa-nonce` deployed as v1 with `verify_jwt=true` and SHA `85e9ed3099fd304b88e56754f9e148bfd10fb460011e9facff39bfa29c85dacf`. Retrieved hosted source exactly matches the committed entrypoint, `_shared/collector.ts`, and `_shared/discord-delivery.ts`. `discord-dispatch` remains untouched at v18.

### 2. Inert hosted verification

- Gateway authentication: missing JWT returned 401 `UNAUTHORIZED_NO_AUTH_HEADER`; invalid JWT returned 401 `UNAUTHORIZED_INVALID_JWT_FORMAT`.
- Function authentication: a valid public JWT with an absent or deliberately wrong dispatch secret returned 401 `Unauthorized`. No secret value was read or recorded.
- Database boundary: the exact hosted migration is present; `security.discord_qa_nonce_runs` has RLS enabled, zero policies, zero rows, and zero active runs. `anon`, `authenticated`, and `service_role` have no table `SELECT`; operator arm execution is revoked from all three. Only `service_role` can execute the public claim/completion RPCs.
- Isolation: Discord events remain 10, delivery attempts remain 12, active exact runs remain zero, and active Discord workers remain zero.
- Advisors: zero error-level findings. The Phase D table has the expected informational `RLS enabled with no policy` notice because all application access is intentionally revoked; its new indexes have expected unused-index informational notices before any approved run.

### 3. Boundaries and handoff

No nonce run was armed, no correct dispatch secret was used, no fixture or tenant/module row changed, no Discord/provider request occurred, no message was sent, no worker or cron job was activated, no customer workspace was used, and no production smoke, pilot, availability claim, or release action occurred.

WO-2026-040 is **Ready for QA** for independent verification of commits `1c05d7b` and `a0180f0`, hosted migration `20260806130646`, Function v1/SHA and retrieved source, authentication rejection evidence, ACL/RLS/inert counts, advisor classification, unchanged dispatcher v18, and inactive workers. Release remains **HOLD**. Provider nonce execution, recovery rehearsals, workspace-module testing, smoke, pilot, customer use, and release each require their separately named approvals.

## Independent QA Phase D inert hosted audit - 2026-08-06

### 1. Release verdict: HOLD

The exact inert hosted scope passes. This proves the candidate is deployed fail-closed and inactive; it does not prove provider deduplication, recovery, customer availability, or production readiness.

### 2. What was verified

- Git history contains candidate commit `1c05d7b` and migration-identity-only reconciliation `a0180f0`. The hosted project records migration `20260806130646`.
- Supabase reports `discord-qa-nonce` **v1**, `ACTIVE`, `verify_jwt=true`, SHA `85e9ed3099fd304b88e56754f9e148bfd10fb460011e9facff39bfa29c85dacf`, with the expected nonce entrypoint and shared collector/delivery files. `discord-dispatch` remains v18 SHA `f8706beefeb5d1e0becae4cd9609376c78f990b5ad14eafeda4bc65f71a990b2`.
- Independent POSTs with no JWT and a malformed JWT stopped at the gateway with 401 `UNAUTHORIZED_NO_AUTH_HEADER` and 401 `UNAUTHORIZED_INVALID_JWT_FORMAT`; neither request could reach the handler, database, or Discord.
- Hosted database inspection confirms the nonce table exists with RLS enabled and zero policies; `anon`, `authenticated`, and `service_role` cannot select it or arm a probe. Only `service_role` can execute the narrowly granted claim/completion RPCs. Counts remain **10** Discord events, **12** attempts, zero active nonce/exact runs, and zero active Discord workers.
- Focused source contracts independently pass **15/15**. Advisor output has no Phase D warning/error: the Phase D RLS-with-no-policy and unused-index notices are informational and expected while the harness is intentionally inactive.

### 3. Blocking issues

- **Blocking:** No approved non-customer nonce/deduplication execution has occurred. The deployed proof cannot establish that Discord returns a single deduplicated visible result or that the first receipt is durably recorded before the second request.
- **Blocking:** Recovery rehearsal, workspace module disable/recovery, rendered-message review, smoke, pilot, operational monitoring/support/rollback, and final release decision remain untested.

### 4. Important risks

- **Important:** Gateway JWT rejection was independently verified. A valid public JWT plus an absent/wrong dispatch secret was reported by Core but was not independently re-issued because it requires a current public JWT; retain that as developer-hosted evidence until a safe authenticated QA check is separately arranged.
- **Important:** The `security.discord_qa_nonce_runs` table is deliberately private. Its zero-policy advisor notice is correct only while access remains revoked and the service-only Function is the sole execution path.

### 5. Unverified but required checks

- **Unverified:** Exact single-use private nonce/deduplication scenario: named non-customer workspace, fresh eligible event, intended subscribed channel, maximum two requests, first-receipt evidence, second-request equality/deduplication, bounded logs, disable/cleanup, and unchanged unrelated events/workers.
- **Unverified:** Global scheduler recovery, module restoration, browser/admin states, production configuration/smoke, consented pilot, support/rollback, and release approval.

### 6. Suggested fixes or next validation steps

1. **Theo:** if advancing Phase D, approve one exact non-customer nonce/deduplication scenario only, naming the workspace, channel, event, temporary channel permissions, two-message ceiling, stop conditions, restoration, and required post-run checks. No customer workspace, worker activation, or production release should be included.
2. **Core and QA:** execute and independently audit that one case; return to HOLD immediately on any unexpected provider response, duplicated visible message, missing receipt, unrelated mutation, or incomplete cleanup.

## Independent QA Phase D fixture preflight - 2026-08-06

### 1. Release verdict: HOLD

The nominated Clash / ScrimStats Integration Test fixture is suitable in principle, but no provider action is authorised or ready because a fresh labelled event and temporary test-channel posting permission are still required.

### 2. What was verified

- The named fixture is an active Elite workspace with Discord live/enabled, an active installation for ScrimStats Integration Test, and enabled schedule-event subscriptions to its isolated `scrimstats-test` channel.
- No nonce or exact-event QA control is active and all Discord workers remain inactive.
- Two retained schedule-created events are technically eligible but are not fresh; QA did not arm, invoke, mutate, or reuse either one.

### 3. Blocking issues

- **Blocking:** The exact Phase D plan requires one fresh, labelled schedule-created event with zero delivery attempts. No such event has been nominated or created for this run.
- **Blocking:** The temporary channel permission allowing the app to post only in the isolated test channel has not been confirmed. No provider request may be made without it.

### 4. Important risks

- **Important:** Reusing a retained pending event could confuse prior evidence and undermine one-use attribution. Preserve it untouched.

### 5. Unverified but required checks

- **Unverified:** Fresh-event eligibility, zero-attempt baseline, exact channel permission, pre-arm counts, nonce deduplication result, dispatcher skip, restoration, and all later recovery/release checks.

### 6. Suggested fixes or next validation steps

1. **Theo:** in Clash, create one new clearly labelled QA schedule block (for example, `WO-040 nonce QA`) so it produces a fresh schedule-created event; then confirm the ScrimStats app may temporarily send only in `scrimstats-test`.
2. Reply `ready` after that setup. QA will perform a final read-only preflight and state the exact one-use provider action before any arm or invocation.

## Independent QA Phase D final fixture preflight - 2026-08-06

### 1. Release verdict: HOLD

The designated private fixture is ready for the separately approved one-use test only. It is not armed, invoked, or released.

### 2. What was verified

- One newly created schedule-created event is pending, available, and has zero delivery attempts.
- Clash remains Elite with its Discord module live/enabled, one active matching subscription in the isolated test channel, zero active nonce/exact controls, and zero active Discord workers.
- Retained historical events and attempt counts remain distinguishable and untouched.

### 3. Blocking issues

- **Blocking:** Theo has not yet explicitly approved the exact fresh-event arm, nonce invocation, two-message ceiling, channel restoration, and following exact dispatcher deduplication check as one bounded provider-facing action.

### 4. Important risks

- **Important:** The arm expires after five minutes. Do not arm it until the exact invocation is authorised and ready; an unexpected provider response or any second distinct provider reference is an immediate stop condition.

### 5. Unverified but required checks

- **Unverified:** The nonce probe/Discord result, durable first receipt, deduplication, visible-message count, dispatcher skip, restoration, and every later recovery/release stage.

### 6. Suggested fixes or next validation steps

1. **Theo:** explicitly approve this exact action: arm the fresh Clash event for at most five minutes; invoke `discord-qa-nonce` once; allow at most two visible messages in the isolated test channel; restore it view-only; then execute one exact dispatcher deduplication check and post-run read-only verification. No workers, customer workspace, or release action is included.

## Independent QA Phase D nonce/deduplication probe - 2026-08-06

### 1. Release verdict: HOLD

The bounded private nonce probe passed its provider-receipt and deduplication evidence. The follow-on exact dispatcher check is deliberately paused until the operator restores the channel to view-only and confirms the rendered result.

### 2. What was verified

- QA armed the approved fresh Clash event for five minutes and queued exactly one Vault-contained Function invocation. No secret was read, logged, or exposed.
- The Edge request returned HTTP **200** with `confirmed`; the first and second Discord provider requests both returned **200** and the same provider reference. The first receipt was durably recorded before the second request.
- The nonce run is `completed/confirmed`; the event remains `pending` with attempt count **0**; exactly one delivery-attempt receipt exists; nonce/exact controls and Discord workers are all inactive.

### 3. Blocking issues

- **Blocking:** The channel has not yet been independently confirmed view-only with exactly one visible test message. Do not invoke the normal dispatcher before that restoration, because a regression could otherwise create an unplanned second visible message.

### 4. Important risks

- **Important:** Same provider reference is strong provider deduplication evidence, but it does not replace human inspection of the private rendered-message count.

### 5. Unverified but required checks

- **Unverified:** Channel restoration and visible-message count; one exact dispatcher deduplication check; recovery/module cases; and all smoke/pilot/release stages.

### 6. Suggested fixes or next validation steps

1. **Theo:** restore ScrimStats to view-only in `scrimstats-test`, confirm exactly one new test message is visible, and reply `ready`.
2. QA will then invoke the already approved exact dispatcher check once. A successful deduplication result must make no new provider request or delivery-attempt row; any unexpected post, response, or mutation stops the work immediately.

## Independent QA Phase D-A nonce/deduplication completion - 2026-08-06

### 1. Release verdict: HOLD

The approved private Phase D-A path passes end-to-end. It materially improves Discord delivery evidence, but it is not a customer, pilot, or production release approval.

### 2. What was verified

- Theo confirmed that exactly one private test message was visible after the nonce probe and restored the test channel to view-only before the dispatcher check.
- The nonce run completed `confirmed`: the Function response was 200, both Discord POSTs were 200, both returned the same provider reference, and one genuine delivered-attempt receipt was written before the second call.
- The event remained pending at attempt count 0 with exactly one delivery receipt before the dispatcher check. The approved exact dispatcher invocation then returned HTTP **200** with `processed: 1`, `delivered: 1`, and `qa_evidence: recorded`; its run completed with result `delivered`.
- The dispatcher changed the event to delivered but did not add a second delivery-attempt row or provider request: the fixture retains exactly one attempt, while the expected aggregate deltas are one new event and one new receipt only. Both QA controls are terminal and Discord workers remain inactive.

### 3. Blocking issues

- **Blocking:** Rollback-only global scheduler recovery and private workspace disable/recovery have not been approved or executed.
- **Blocking:** Customer/role/tenant/entitlement denial matrices, production smoke, controlled pilot, operational monitoring/support/rollback, and release approval remain open.

### 4. Important risks

- **Important:** This is a successful isolated Elite fixture path. It does not prove ordinary customers can safely enable Discord or that all denied states fail closed in production.

### 5. Unverified but required checks

- **Unverified:** Phase D-B global recovery; Phase D-C module disable/recovery; customer-safe operational configuration, smoke, pilot, support/rollback, and release decision.

### 6. Suggested fixes or next validation steps

1. **Theo:** decide whether to approve Phase D-B only: the documented rollback-only global scheduler enable/disable rehearsal, with no committed worker activation or provider request.
2. If Phase D-B passes, assess Phase D-C as a separate exact fixture/change/restoration approval. Keep the release verdict HOLD until every required stage has independent evidence.

## Core Phase D-B rollback-only scheduler rehearsal - 2026-08-06

### 1. Outcome

Theo approved Phase D-B only. Core executed one explicit transaction that captured the inactive baseline, called `security.configure_discord_production_worker_schedule()`, inspected both named jobs, immediately called `security.disable_discord_production_worker_schedule()`, inspected them again, and rolled back. No Vault value or cron command text was selected or recorded.

The rehearsal **did not pass** its activation acceptance criterion. Jobs 4 and 5 were inactive before the configure call and remained inactive after it inside the transaction; the disable call also left them inactive. The transaction rolled back successfully.

### 2. Exact bounded evidence

- Before: zero active jobs; job 5 `scrimstats-discord-dispatch` retained `* * * * *`; job 4 `scrimstats-discord-reminders` retained `*/15 * * * *`; cron history 7,407; HTTP queue zero; Discord events/attempts 11/13; active nonce/exact controls zero.
- After configure inside the transaction: both named rows still reported `active=false`; every aggregate remained unchanged.
- After disable inside the transaction: both named rows remained `active=false`; every aggregate remained unchanged.
- After rollback: jobs 4/5 remained inactive; cron history remained 7,407; HTTP queue remained zero; Discord events/attempts remained 11/13; active nonce/exact controls remained zero.

### 3. Diagnosis and handoff

Hosted behavior shows that rescheduling an existing inactive named pg_cron job does not itself reactivate the row. This is consistent with pg_cron's separate `cron.alter_job(job_id, active := true)` activation control. The current configure routine returns `active: true` after calling named `cron.schedule(...)`, but it does not explicitly reactivate the existing rows, so its return contract is inaccurate for previously disabled jobs.

WO-2026-040 is **Ready for QA for independent failed-result audit** and remains on release **HOLD**. Phase D-C must not begin. Any correction to `security.configure_discord_production_worker_schedule()`, new migration, hosted application, repeat rehearsal, worker activation, provider action, customer action, smoke, pilot, or release requires a new exact Theo approval.

## PM release-stage definition — Phase E customer-safety matrix - 2026-08-06

### Current status and owner

**Blocked — PM / QA and Release Auditor.** Phase D-B scheduler recovery is now independently passed, and the Phase D-C private module-disable/recovery evidence is inert after approved cleanup. The next missing evidence is not another worker implementation change: it is one complete, controlled non-customer matrix proving that normal customer roles, plans, modules, guilds, and schedules fail closed when they should.

### One bounded QA stage

Before any production configuration, worker activation, customer message, smoke, pilot, or release, QA may run the following **single pre-approved non-customer Phase E matrix** only if Theo approves the exact fixture identities and cleanup owner:

1. **Browser configuration roles:** owner/admin permitted configuration; member/viewer and cross-tenant browser/RPC denials.
2. **Provider authorisation:** wrong guild and missing permitted Discord role, each producing a safe denial and zero receipt/scrim/outbox/attempt delta.
3. **Plan and module boundary:** existing Free and Pro fixtures plus a captured-and-restored disabled/revoked Discord-module fixture, each producing zero mutation.
4. **Schedule safety:** one deliberately overlapping request against an isolated fixture block, producing zero new receipt/scrim/outbox/attempt rows.
5. **Malformed request boundary:** invalid signature and validly signed malformed payload checks, each failing before mutation.
6. **Isolation and restoration:** tenant B/cross-tenant checks, before/after aggregate counts for every fixture, restoration of every reversible role/module/channel setting, and retained redacted evidence only.

Both Discord workers remain inactive throughout. No Free/Pro plan, Stripe subscription, customer workspace, customer guild, secret, global dispatcher run, production configuration, or outbound message is part of Phase E. A failure stops the relevant case; QA records the bounded reason/code and row-count delta once, then returns it to Core without retrying the mutation-capable case.

### Phase E definition of done

- Every approved case has a recorded fixture, action, expected response, and before/after receipt, scrim, outbox, and delivery-attempt count; every denial has a zero-mutation result.
- Owner/admin and member/viewer browser evidence covers desktop plus a real mobile viewport, with no role/plan overclaim.
- All temporary fixture state is restored or intentionally left inert, workers remain inactive, and no unrelated tenant/event changes.
- QA issues one consolidated hosted evidence verdict. A Core handoff occurs only for a reproduced defect, not for missing documentation or a request to repeat a case.

### Next gates after Phase E

1. **Phase F — production non-customer smoke:** separately approved production configuration presence/revision review, then one named non-customer production `/scrim` and schedule-delivery smoke with a documented immediate disable owner.
2. **Phase G — consented Elite pilot:** separately approved named Elite workspace(s), time-bounded monitoring, support/rollback owner, and no broad availability claim.
3. **Phase H — release:** only after QA production-ready verdict and Theo's explicit release approval. Discord remains Elite-only unless Theo separately approves a plan/entitlement change.

## PM handoff reset - 2026-08-06

### Current status and owner

**Blocked — Core Features Developer.** The Phase D-B result is a confirmed implementation defect, not an ambiguous QA finding: an existing inactive `pg_cron` job is not reactivated by the current configure routine. QA has completed the bounded failure classification and must not be sent another investigation until Core provides a corrected candidate and a new exact Theo-approved hosted rehearsal scope.

### One immediate Core outcome

Correct only `security.configure_discord_production_worker_schedule()` so that, for each of the two named existing jobs, it:

1. schedules or reconciles the intended command without exposing Vault values;
2. explicitly reactivates an existing inactive job through the appropriate `pg_cron` control;
3. verifies and returns the actual post-operation `active` state rather than reporting success optimistically; and
4. leaves `security.disable_discord_production_worker_schedule()` as the immediate global stop which preserves cron history.

### Definition of done for the correction handoff

- A focused disposable-database test covers both pre-existing inactive jobs and proves configure changes both to active, disable returns both to inactive, and rollback restores the original inactive state without sending HTTP requests or changing Discord/outbox data.
- RLS, grants, fixed search paths, Vault-name-only handling, migration lint, and relevant Advisor checks remain clean; no browser, provider, worker, customer, plan, or production configuration change is included.
- Core supplies the exact commit, migration, intended shared-project deployment plan, and rollback-only rehearsal steps. Theo must separately approve that narrow hosted application/rehearsal before deployment.
- Only after the hosted rehearsal passes is QA assigned the evidence audit. Phase D-C, full denial matrix, production configuration, smoke, pilot, and release remain separate gates.

### Explicit no-loop rule

Do not return this order from Core to QA merely because source tests pass. QA receives it only after a corrected candidate has been deployed under a new exact Theo approval and the one rollback-only rehearsal has produced the required active-then-inactive evidence.

## Core Phase D-B scheduler correction candidate - 2026-08-06

### 1. Outcome

Theo approved the source-only correction and disposable proof. Core prepared forward migration `20260806142907_wo040_discord_worker_reactivation.sql`; it changes only `security.configure_discord_production_worker_schedule()`. The routine now reconciles both named jobs, explicitly activates each returned job ID through `cron.alter_job`, re-reads both actual states, and raises transactionally unless both are active. The established `security.disable_discord_production_worker_schedule()` routine remains unchanged.

No commit, push, hosted migration, Function deployment, provider action, committed worker activation, fixture/customer change, Phase D-C action, or release action occurred.

### 2. Validation evidence

- Focused source contract asserts explicit activation, actual-state queries, fail-closed result construction, fixed search path, Vault-name-only reads, operator-only ACLs, no direct `cron.job` update, and no disable-routine redefinition. Related focused tests passed **11/11**; scoped ESLint passed with zero warnings; TypeScript passed; production build and bundle budgets passed.
- The migration applied with stop-on-error to a zero-data, isolated PostgreSQL 17 ScrimStats schema clone. A guarded disposable test began with both exact named jobs already present and inactive. Configure made both existing IDs active; the unchanged disable routine returned both inactive; rollback restored the original inactive IDs. Cron history, HTTP queue, Discord events, and delivery attempts remained **0/0/0/0**.
- Direct `plpgsql_check` returned zero issues. The function retained `search_path=''`; `anon`, `authenticated`, and `service_role` execute checks were all false. The Supabase CLI lint wrapper could not use the local non-TLS endpoint, so hosted Advisors remain an explicit inert post-application check rather than being claimed from source.
- The schema-only exports, uniquely named container/network/volume, and loopback proof database were removed after identity-checked cleanup. ClimbLab remained healthy and isolated on port 54322.

### 3. Exact hosted application and rollback-only rehearsal plan

This plan is **not yet approved**:

1. Commit and push only the correction migration, focused contract/proof, Phase D runbook/proof record, and the narrow WO/board handoff changes after verifying the final diff excludes unrelated dirty files.
2. Preflight the shared project read-only: exact migration absent; both existing Discord job IDs inactive; active nonce/exact controls zero; record only job IDs/schedules/active flags plus cron-history, HTTP-queue, event, and attempt counts. Never select cron command text or Vault values.
3. Apply only migration `20260806142907_wo040_discord_worker_reactivation.sql`. It must leave both jobs inactive because it does not invoke configure. Verify the hosted function definition, fixed search path, revokes, unchanged disable definition, inactive jobs, protected counts, and security/performance Advisors.
4. In one explicit transaction, capture the inactive baseline; call configure and retain only returned IDs/booleans; verify both existing rows active; immediately call disable and verify both inactive; compare every protected count; then roll back. Never commit an active job state.
5. Recheck both original IDs inactive and every protected count unchanged. Stop on any mismatch, unexpected HTTP/provider activity, active control, or unrelated mutation. If migration application fails, rely on its transaction rollback. Any later source reversal must be a separately approved forward migration restoring the prior configure definition while both jobs remain inactive.

### 4. Status and handoff

WO-2026-040 remains **Blocked — Core Features Developer** and release remains **HOLD**. Theo must separately approve the exact commit/push, hosted migration, inert verification, and rollback-only rehearsal above. Do not assign QA until the hosted active-then-inactive evidence passes. Phase D-C, denial matrices, production configuration, smoke, pilot, customers, and release remain separate gates.

## Core Phase D-B corrected hosted rehearsal - 2026-08-06

### 1. Outcome

Theo approved the exact commit/push, hosted migration, inert verification, and one rollback-only rehearsal. Core committed the six WO-040-owned correction/evidence files as `fe77294` and pushed `codex/Staging`. Shared-board and unrelated dirty files were excluded from that commit.

Hosted migration `20260806142907_wo040_discord_worker_reactivation` applied successfully to project `tvcgjehreaayfazlhvps`. The first application request contained command-wrapper text and failed at SQL parsing before any statement could execute; Core corrected the tool input and applied the exact committed SQL once. No partial migration or scheduler state resulted from the rejected request.

### 2. Inert hosted verification

- Immediately after migration, jobs 4/5 remained inactive with schedules `*/15 * * * *` and `* * * * *`; HTTP queue, active nonce runs, and active exact-dispatch runs were zero; Discord events/attempts remained **11/13**.
- The hosted configure routine is `SECURITY DEFINER` with `search_path=''`, contains two explicit `cron.alter_job(..., active := true)` calls and both actual-state checks, and remains non-executable by `anon`, `authenticated`, and `service_role`.
- The existing disable routine still contains both explicit `active := false` operations. Security Advisors returned 37 INFO / 56 WARN and performance Advisors 222 INFO / 20 WARN, with zero ERROR and no finding referencing the corrected function, cron job control, or migration. Existing unrelated warnings remain outside WO-040.

### 3. Rollback-only rehearsal evidence

Core ran one explicit transaction. Its fail-closed assertions verified that configure returned `active=true`, `dispatch_active=true`, and `reminder_active=true`; preserved existing job IDs 5 and 4; and made both actual rows active only inside the transaction. The unchanged disable routine then returned `active=false` and both rows reported inactive before rollback. Controlled Discord history, HTTP queue, events, and attempts did not change inside the transaction.

The transaction rolled back. Final hosted state: jobs 4/5 inactive; Discord-specific cron history **7,407**; HTTP queue **0**; Discord events/attempts **11/13**; active nonce/exact controls **0/0**. Global cron history was **40,170** at the final read and may continue to change because it includes unrelated scheduled jobs. No Vault value or cron command text was selected or recorded.

### 4. Boundaries and QA handoff

No active worker state was committed, no provider request or message occurred, no customer/fixture/module row changed, no Function or frontend deployment occurred, and Phase D-C, denial matrices, production configuration, smoke, pilot, customer availability, and release were not started.

The corrected Phase D-B acceptance criterion now passes. Migration-identity and hosted-evidence reconciliation is commit `fc0e8e8`. WO-2026-040 is **Ready for QA** and assigned to the **QA and Release Auditor** for independent audit of commits `fe77294` and `fc0e8e8`, hosted migration `20260806142907`, function/ACL evidence, the successful active-then-inactive transaction, and final inactive/no-mutation state. Release remains **HOLD**.

## Independent QA Phase D-B corrected scheduler audit - 2026-08-06

### 1. Release verdict: HOLD

The corrected rollback-only scheduler recovery passes. This proves the named jobs can be activated and immediately disabled inside a transaction without committed worker activity; it does not authorise normal worker activation, customer delivery, or release.

### 2. What was verified

- Git history contains correction commit `fe77294` and evidence/migration-identity reconciliation `fc0e8e8`; hosted migration `20260806142907` is present.
- Independent source and hosted-definition checks confirm `security.configure_discord_production_worker_schedule()` is `SECURITY DEFINER` with `search_path=''`, explicitly activates both returned job IDs, re-reads both actual rows, fails closed if either is not active, and is not executable by `anon`, `authenticated`, or `service_role`.
- Focused independent contracts pass **16/16**. Hosted jobs 4/5 retain their expected schedules and are currently inactive. Current protected state is HTTP queue **0**, Discord events/attempts **11/13**, active nonce/exact controls **0/0**, and Discord-specific cron history **7,407**.
- The recorded one-transaction rehearsal preserved IDs, made both jobs active only inside the transaction, disabled both before rollback, and finished with the inactive/no-mutation state above. Current security/performance advisors have no finding referencing the correction or cron activation control; their existing INFO/WARN baseline remains separate.

### 3. Blocking issues

- **Blocking:** Phase D-C private workspace module disable/recovery has not been separately approved or executed.
- **Blocking:** Customer/role/tenant/entitlement denial matrix, production configuration/smoke, controlled pilot, monitoring/support/rollback, and final release approval remain unverified.

### 4. Important risks

- **Important:** The correction deliberately makes the configure routine capable of activating workers. It must remain operator-only and may be used only under a separately approved, bounded scope; the successful rollback rehearsal does not permit a committed activation.

### 5. Unverified but required checks

- **Unverified:** Phase D-C fixture module snapshot/disable/restore and bounded non-postable provider boundary; all production and customer availability evidence.

### 6. Suggested fixes or next validation steps

1. **Theo:** decide whether to approve the exact Phase D-C procedure in `WO-2026-040_PHASE_D_QA.md`: one named private fixture, two fresh events, exact module snapshot/restore, one disable-path invocation, one view-only provider-boundary invocation, and evidence-preserving cleanup.
2. If approved, QA will preflight and execute only that bounded procedure. Keep workers inactive and release HOLD throughout.

## Independent QA Phase D-C workspace recovery audit - 2026-08-06

### 1. Release verdict: HOLD

The bounded workspace disable-path passes, but the required non-postable provider-boundary check failed. The supposedly view-only private channel accepted the one restored-module delivery. This is not production-ready evidence and no further Phase D-C action is authorised from this run.

### 2. What was verified

- Two fresh non-customer `clash` schedule events were created through the staging product flow: event A `488dbff9-6b87-45b6-9e0a-4b359740f9ce` and event B `d70be245-04b6-4294-8881-3f203041bab9`. Both began pending with zero attempts.
- Before the run, the fixture was Elite; its sole `discord` module row was `live`/enabled; one active `schedule_created` subscription targeted the private test channel; jobs 4/5 and all exact-dispatch controls were inactive.
- QA captured the module row (`live`, enabled, `updated_at` `2026-07-30 16:58:42.57749+00`, null updater), disabled only that row, armed only event A, and made one exact dispatcher request. Event A became `cancelled` with the expected unavailable error, zero Discord delivery attempts, and a completed `cancelled` QA run. The Function request returned 200.
- QA restored the captured module row exactly before event B. Event B was still pending with zero attempts and no active exact run before its one approved invocation.
- The second Function request returned 200 and its exact run completed. Both global Discord jobs remain inactive and no exact run remains active.

### 3. Blocking issues

- **Blocking:** Event B was `delivered`, not the required Discord 403 retry. It has one delivered Discord attempt, a provider receipt, and `delivered_at` `2026-08-06 17:36:19.464+00`; the target was the intended private test channel. The operator's view-only assertion was therefore not true at delivery time, or a higher-priority Discord permission still allowed the bot to send.
- **Blocking:** The approved two-fixture scope is exhausted. Do not reuse either retained event, edit its result, delete its evidence, or retry the restored-module invocation.
- **Blocking:** Customer/role/tenant/entitlement denial matrix, production configuration/smoke, controlled pilot, monitoring/support/rollback, and final release approval remain unverified.

### 4. Important risks

- **Important:** The unexpected successful provider delivery means the private QA Discord channel cannot currently be relied upon as a non-postable boundary. It must not be treated as safe containment for later denial testing.
- **Important:** The event is terminal `delivered`, so the planned retry-cleanup update is intentionally not applied. Altering it would conceal the failed acceptance result and is unnecessary to prevent queueing.

### 5. Unverified but required checks

- **Unverified:** A newly created, separately approved non-customer event with the bot demonstrably unable to send in the exact subscribed channel; the expected 403 retry and retained evidence; the full customer denial matrix; production configuration/smoke, pilot, support/rollback, and release readiness.

### 6. Suggested fixes or next validation steps

1. **Theo:** In the `ScrimStats Integration Test` server's subscribed private channel, remove `Send Messages` for the ScrimStats bot and any bot role/category/channel override that grants it. Keep only the visibility needed to test a 403. Confirm the exact channel is still the one subscribed to `schedule_created`; do not delete the delivered QA message or database evidence.
2. **Theo:** After that correction, separately approve one new named non-customer fixture and one exact one-use dispatcher request. QA will preflight it from zero attempts and stop on any non-403 result.
3. **Core Features Developer:** No code change is assigned from this result unless the Discord permission audit proves the bot was denied at the exact target when the successful delivery occurred. If so, investigate the provider-target/permission boundary with reproducible evidence.

### 7. Status and handoff

WO-2026-040 is **Blocked** for controlled QA pending Theo's Discord permission correction and a separate fresh-fixture approval. The release verdict remains **HOLD**. Workers, customer delivery, production configuration, smoke, pilot, and release remain out of scope.

## Independent QA Phase D-C provider-boundary retest - 2026-08-06

### 1. Release verdict: HOLD

The non-postable provider-boundary acceptance check now passes for one fresh non-customer event. This closes only that controlled case; the retained retry event needs separately approved evidence-preserving cleanup, and the broader customer and release matrix remains unverified.

### 2. What was verified

- Theo confirmed the ScrimStats bot's `Send Messages` permission was removed from the subscribed private Discord test channel, then approved exactly one replacement non-customer Clash schedule block and one one-use dispatcher invocation.
- QA created event `d8c9b793-d1e8-4857-bf24-03dfd901369f` through the normal staging flow. Before arming, it was `pending`, had zero attempts and no delivery-attempt rows; no active exact run was present.
- QA armed only run `843173bc-d40c-4357-a8b7-bb5252ae89dc` and issued one exact dispatcher request. HTTP request `40581` returned 200 without timing out.
- Discord returned 403 for target `1532431211086221314`. The event is `pending`, has `attempt_count=1`, no `delivered_at`, and a single `retry` attempt with `Discord returned 403` and no provider receipt. The exact run is completed with result status `pending`.
- The delivery is evidence of provider denial, not a customer delivery. No second invocation occurred; the event is deliberately retained, and both Discord worker jobs remain inactive.

### 3. Blocking issues

- **Blocking:** The retained retry event is now eligible for later dispatch. Cancellation of only event `d8c9b793-d1e8-4857-bf24-03dfd901369f`, while retaining its completed run and delivery-attempt row, needs Theo's exact cleanup approval before this controlled environment can be considered clean.
- **Blocking:** The customer role/tenant/entitlement denial matrix, production Discord configuration and smoke test, controlled pilot, monitoring/support/rollback evidence, and final production release approval remain unverified.

### 4. Important risks

- **Important:** The earlier delivered event `d70be245-04b6-4294-8881-3f203041bab9` remains a historical permission-misconfiguration result. It must not be rewritten or presented as successful denial evidence.
- **Important:** The observed 403 proves the current private-channel bot permission boundary only. It does not establish customer-workspace isolation, production provider configuration, or a safe general worker activation.

### 5. Unverified but required checks

- **Unverified:** Evidence-preserving cancellation of the exact pending retest event, post-cleanup proof of zero active exact runs and inactive workers, and no unrelated event mutation.
- **Unverified:** Customer tenant/role/plan denial paths; production bot credentials, allowed guild/channel and interaction configuration; production worker activation/disable recovery; production smoke, pilot, support and rollback rehearsal.

### 6. Suggested fixes or next validation steps

1. **Theo:** explicitly approve this exact cleanup only: set event `d8c9b793-d1e8-4857-bf24-03dfd901369f` to `cancelled` so it cannot be picked up later, while preserving its 403 retry attempt and completed QA run. QA will then verify the final inert state.
2. **Core Features Developer / PM:** prepare the next customer-safe denial-matrix and production-readiness plan as separately scoped, approval-gated work. Do not activate workers or deploy to production from this staging evidence.

## Independent QA Phase D-C cleanup verification - 2026-08-06

### 1. Release verdict: HOLD

The approved non-customer cleanup passes and the controlled environment is inert again. This does not clear the production-release gate.

### 2. What was verified

- Theo approved cancellation of only event `d8c9b793-d1e8-4857-bf24-03dfd901369f` while preserving the 403 and exact-run evidence.
- The event is now `cancelled`, retains `attempt_count=1`, has no `delivered_at`, and records the bounded QA-cancellation reason.
- Its single Discord delivery attempt remains a `retry` with `Discord returned 403` and no provider receipt; the exact QA run remains `completed` with its original `pending` result.
- Post-cleanup checks found zero active exact-dispatch runs and zero active Discord worker jobs.

### 3. Blocking issues

- **Blocking:** Controlled staging evidence does not cover customer tenant/role/entitlement denial paths, production provider configuration, worker activation/disable recovery, smoke, pilot, monitoring/support, rollback, or final release approval.

### 4. Important risks

- **Important:** The 403 test proves only the configured staging private-channel permission boundary. It cannot be used to claim production Discord readiness or customer isolation.
- **Important:** The previously delivered Phase D-C event remains preserved as a historical failed permission-boundary result and must not be omitted from later release evidence.

### 5. Unverified but required checks

- **Unverified:** Customer-safe role, tenant, and plan denial/allow matrix; production bot credential and guild/channel configuration; controlled worker activation plus recovery; production smoke, pilot, support, rollback, and release sign-off.

### 6. Suggested fixes or next validation steps

1. **PM / Core Features Developer:** create a separate, customer-safe work-order phase with explicit acceptance criteria for the remaining role/tenant/plan matrix and production operational gates.
2. **Theo:** approve each later production configuration, activation, pilot, or release action separately; no such action is implied by this staging cleanup.

## PM current routing — Phase E customer-safety matrix - 2026-08-06

This is the current next stage and supersedes the request to send WO-040 back to Core for an unspecified plan. The work order remains **Blocked — PM / QA and Release Auditor** until Theo approves the named non-customer fixtures and cleanup owner.

QA will run one consolidated matrix with both Discord workers inactive: owner/admin allow and member/viewer/cross-tenant browser/RPC denial; wrong guild and missing permitted role; Free/Pro; captured-and-restored disabled/revoked module; overlap; invalid signature and signed malformed payload. Every denial must record zero deltas for receipts, scrims, outbox events, and delivery attempts, with reversible fixture state restored and redacted evidence retained. Any defect returns once to Core with its bounded evidence; no mutation-capable case is retried.

After Phase E, the remaining release path is fixed: separately approved non-customer production smoke (Phase F), named consented Elite pilot (Phase G), then Theo release approval (Phase H). Discord remains Elite-only unless Theo separately approves a plan/entitlement change.

## Theo approval — Phase E consolidated non-customer matrix - 2026-08-06

Theo approved Phase E. QA and Release Auditor may nominate and record the exact existing non-customer fixture identities, private guild/channel/role controls, and cleanup owner in a preflight entry before the first provider or reversible configuration action. This approval covers only the Phase E cases and stop conditions recorded above, with both workers inactive and no customer workspace, customer guild, Stripe/plan change, secret/configuration change, global dispatcher, outbound customer message, production smoke, pilot, or release action.

If preflight reveals that a required fixture is missing or any step requires a new production/provider/configuration authority, stop and return that gap to Theo rather than substituting a customer or broadening the approval.

## Independent QA Phase E fixture preflight - 2026-08-06

### 1. Release verdict: HOLD

Phase E cannot safely begin. The approved matrix is correctly bounded, but the necessary non-customer roles, plans, and tenant controls have not been nominated or provisioned.

### 2. What was verified

- The known non-customer Clash tenant is active Elite with the Discord module `live`/enabled, an active installation, and one active schedule-created subscription.
- The tenant has one owner membership only. No admin, member, or viewer control is present in that tenant.
- Both Discord workers, exact-dispatch controls, and nonce controls are inactive.
- The tenant currently has two queueable integration events, alongside retained cancelled, delivered, and failed historical evidence. QA did not arm, invoke, or alter any event.

### 3. Blocking issues

- **Blocking:** Phase E requires named non-customer admin, member, and viewer fixtures plus a cross-tenant control. None has been nominated from the approved scope.
- **Blocking:** Named Free and Pro fixture tenants, their Discord/module states, and their cleanup owner have not been nominated.
- **Blocking:** The two existing queueable events make a no-delta provider test unsafe without a named isolation/cleanup plan. Workers are inactive, but Phase E cannot claim zero side effects by assuming those events are unrelated.

### 4. Important risks

- **Important:** Reusing Clash as an owner-only fixture would leave the critical role-denial and cross-tenant cases untested.
- **Important:** Listing or selecting arbitrary tenants to fill the gap could expose or affect customer data. QA must not infer that any other tenant is disposable.

### 5. Unverified but required checks

- **Unverified:** The complete Phase E allow/deny matrix: owner/admin, member/viewer, cross-tenant, Free/Pro, wrong guild, permitted role, disabled/revoked module, overlap, invalid signature, and signed malformed payload.
- **Unverified:** Fixture-specific baseline counts and cleanup proof for each authorised provider or reversible configuration action.

### 6. Suggested fixes or next validation steps

1. **Theo:** either nominate existing non-customer fixtures or explicitly approve creating them: one Elite tenant with owner/admin/member/viewer test memberships, one separate no-membership/cross-tenant account, and Free and Pro tenant controls. Identify the private test guild/channel and the one permitted role for the Elite allow case, plus who will restore/delete each fixture after QA.
2. **Theo:** identify whether the two Clash pending events are known QA events and approve their evidence-preserving isolation/cancellation, or nominate a different empty non-customer Elite tenant. Do not activate workers or invoke Discord before that decision.

## Independent QA Phase E fixture refinement - 2026-08-06

### 1. Release verdict: HOLD

The empty Elite role controls are partly identified and the named WO-040 queue is inert. Phase E remains incomplete because viewer and meaningful Free/Pro entitlement fixtures are not yet available without a separate identity/provider setup.

### 2. What was verified

- Theo confirmed that WO-040-labelled records are disposable QA evidence and approved QA to choose the safest bounded cleanup.
- QA cancelled only pending events `7b223753-6b1b-4169-9850-280c7650deaa` and `d471bb0d-ce36-4f71-ad36-58c71e39bd80`; both were zero-attempt, undelivered WO-040 fixtures. Their historical rows are retained.
- Clash now has zero queueable integration events, zero active exact controls, and inactive Discord workers. It remains the Elite/live owner and active-installation fixture.
- Authenticated browser evidence identifies `WO-024 QA Tenant B` as a non-customer Elite admin fixture and `WO-024 QA Tenant A` as a non-customer Elite member fixture. Both have zero queueable events, planned Discord modules, and no installation, so they are safe browser/RPC-denial controls but cannot send a provider command.

### 3. Blocking issues

- **Blocking:** No non-customer viewer identity is available in the approved fixture set.
- **Blocking:** No Free or Pro tenant with a meaningful inbound Discord installation/guild control is available. Creating an empty Free/Pro workspace alone would test only missing-installation denial, not the entitlement boundary.
- **Blocking:** A same-guild/provider setup for new entitlement fixtures is a Discord configuration action and is outside the current Phase E approval, which requires a stop when that authority is needed.

### 4. Important risks

- **Important:** Treating a planned/no-installation Free or Pro workspace as the paid-feature test would conflate installation absence with entitlement enforcement and could mask a server-side billing defect.
- **Important:** The currently available owner/admin/member fixtures are separate tenants; that supports cross-tenant denial, but not viewer authorization until a distinct viewer membership exists.

### 5. Unverified but required checks

- **Unverified:** Viewer browser/RPC denial; Free/Pro inbound entitlement denial with an otherwise valid signed Discord context; wrong-guild/missing-role/disabled-revoked/overlap/invalid-signature/malformed-payload cases.
- **Unverified:** The later production configuration, worker activation/recovery, smoke, pilot, support, rollback, and release gates.

### 6. Suggested fixes or next validation steps

1. **Theo:** nominate an existing non-customer viewer account/workspace if one exists. If not, explicitly approve creating a dedicated viewer QA account and membership in the empty WO-024 Tenant A or B.
2. **Theo:** choose a separate non-customer Discord guild/app fixture for Free and Pro entitlement testing, or explicitly approve the scoped Discord installation/configuration changes necessary to create valid Free/Pro inbound controls. QA will not reuse the active Clash guild for those tenants by assumption.

## Theo entitlement-boundary clarification - 2026-08-06

Theo confirmed that Discord remains **Elite-only** as initially agreed. Free and Pro workspaces must not receive a Discord installation merely to manufacture QA evidence.

Phase E therefore uses the existing non-customer Free/Pro workspaces only for bounded server-side/browser entitlement-denial checks that produce no scrim, receipt, outbox, or delivery-attempt delta. The Elite Clash fixture remains the sole configured provider allow/wrong-guild/permitted-role boundary. A non-customer viewer membership is still required for the browser/RPC role-denial case; Theo will arrange that fixture before QA begins that case.

## Phase E viewer-fixture provisioning - 2026-08-06

At Theo's exact request, QA manually added existing confirmed non-customer account `pathtoyourdream@gmail.com` to the Clash workspace as `viewer`. The pre-write check established no prior Clash membership; the guarded insert returned exactly one viewer membership and the post-write read-back matches. No account, invitation, invite Function, Discord installation, entitlement, event, attempt, worker, or control was changed. Clash remains queue-empty with zero active workers, exact-dispatch runs, and nonce runs.

The viewer fixture is ready for authenticated browser/RPC denial verification. Theo must sign in to that account and confirm when ready; the remaining Phase E cases remain bounded by the existing approval and **HOLD** remains.

## Independent QA Phase E viewer browser audit - 2026-08-06

### 1. Release verdict: HOLD

The viewer browser boundary passes. This is one role-layer result only; server-side mutation denial and the remaining entitlement/provider matrix are still required before any release claim.

### 2. What was verified

- Authenticated staging access as `pathtoyourdream@gmail.com` in Clash displays the `viewer` role and the intended workspace identity.
- On Scrim blocks, the viewer can read the approved fixture/history surfaces but has no `Schedule scrim`, `Edit block`, or equivalent mutation control.
- On Workspace settings, billing and workspace-setting actions are disabled and explicitly state that owner or admin access is required. Workspace timezone and logo controls are disabled.
- On Integrations, the viewer sees safe connection status only; no Discord/Riot configuration action is rendered. No provider, request, event, receipt, worker, or fixture state was changed.

### 3. Blocking issues

- **Blocking:** The browser does not prove server-side authorization. The viewer must still be denied by the relevant mutation API/RPC/RLS boundary with a zero-delta result.
- **Blocking:** Free/Pro no-delta entitlement denial, wrong-guild/missing-role, disabled/revoked module, overlap, invalid-signature, signed-malformed-payload, and all later release gates remain unverified.

### 4. Important risks

- **Important:** Viewer access to read-only workspace and team-access information appears intentional in the current UI, but this browser result must not be generalized into approval for broader team-data disclosure without the documented product/RLS contract.

### 5. Unverified but required checks

- **Unverified:** Direct authenticated viewer mutation rejection with no database delta; all remaining Phase E controls; production configuration, smoke, pilot, support, rollback, and release gates.

### 6. Suggested fixes or next validation steps

1. **QA:** continue only the approved no-delta server-side viewer denial and the remaining Phase E matrix cases; stop on the first unexpected mutation or provider output.
2. **Theo:** no further action is needed for this viewer browser case. Keep the viewer account available for any repeat browser verification.

## Independent QA Phase E viewer server-denial audit - 2026-08-06

### 1. Release verdict: HOLD

The viewer scheduling mutation is denied at the canonical server-side authorization boundary with no data delta. This clears the viewer case only; the release remains on HOLD.

### 2. What was verified

- QA bound the test transaction to the confirmed Clash viewer identity and verified it is not an owner or admin through the existing membership helper.
- One canonical `schedule_scrim_block` invocation with the unique `WO-040 VIEWER DENIAL MARKER` reached the server-side role check and raised the expected insufficient-privilege path before insertion. The transaction retained no change.
- Before and after protected counts are identical: 12 scrims, 14 integration events, and 15 delivery attempts. The marker has zero matching scrims and zero matching outbox events.

### 3. Blocking issues

- **Blocking:** Free/Pro entitlement denial, wrong-guild/missing-role, disabled/revoked module, overlap, invalid-signature, signed-malformed-payload, and every production release gate remain unverified.

### 4. Important risks

- **Important:** This verifies the canonical scheduling RPC's viewer boundary, not every workspace mutation or the external Discord interaction endpoint.

### 5. Unverified but required checks

- **Unverified:** The remaining Phase E entitlement/provider cases and the full production configuration, worker activation/recovery, smoke, pilot, support, rollback, and release path.

### 6. Suggested fixes or next validation steps

1. **QA:** continue the approved no-delta Free/Pro entitlement checks next, keeping Discord Elite-only and stopping on any marker or count delta.
2. **Theo:** no further action is needed for the viewer case.

## Independent QA Phase E database authorization matrix - 2026-08-06

### 1. Release verdict: HOLD

The bounded database-side role, entitlement, configuration, and overlap matrix passes fail-closed. This does not verify the external Discord signature-entry boundary or any production release gate.

### 2. What was verified

- The authenticated member fixture was denied by `schedule_scrim_block` before insertion; a viewer cross-tenant call against the explicitly QA-labelled Free tenant was likewise denied. The initial attempt to use the viewer against WO-024 Tenant A stopped before mutation because that account owns the tenant; QA corrected the control to the known no-membership Free fixture instead of assuming isolation.
- Under a verified service-only context, Free and Pro tenants both rejected `create_discord_scrim_block` at the Elite/live/enabled/active-installation availability gate. Both remain planned/disabled, uninstalled, and at zero scrims, receipts, events, and attempts.
- On the Elite Clash fixture, wrong guild, missing permitted role, and overlapping schedule requests each rejected before insertion. The exact existing permitted-role and guild values were used only inside the server routine and are not reproduced here.
- Within one transaction, QA set the Discord module to disabled and then planned, verified both denials, and restored its original `live`/enabled row including its captured metadata. The final hosted row is `live`/enabled.
- Every Phase E marker has zero matching scrims and receipts. Final protected state is Clash 12 scrims/5 receipts/14 events/15 attempts; workers are inactive.

### 3. Blocking issues

- **Blocking:** A deployed invalid-signature request and a genuinely Discord-signed malformed payload have not been independently exercised. A database/service call cannot establish the public Edge Function's Ed25519 verification behavior.
- **Blocking:** Production Discord configuration, worker activation/recovery, smoke, pilot, monitoring/support, rollback, and final release approval remain unverified.

### 4. Important risks

- **Important:** The failed initial cross-tenant fixture assumption demonstrates why membership must be verified from the exact test identity before each authorization case; browser workspace labels alone are not sufficient.
- **Important:** The provider-facing signature cases require either a controlled Discord-provider action or a valid signed fixture. Do not manufacture them with secrets, a customer guild, or an unrelated application.

### 5. Unverified but required checks

- **Unverified:** Deployed invalid-signature rejection, correctly signed malformed command rejection, and the full production operational release path.

### 6. Suggested fixes or next validation steps

1. **Theo:** approve one explicitly bounded deployed invalid-signature request and provide/approve the isolated Discord method for one genuinely signed malformed-command check. Both must target Clash only, create no customer/provider delivery, and stop on any unexpected database delta.
2. **QA:** retain the completed matrix evidence; do not rerun these markers or activate workers.

## Independent QA Phase E invalid-signature entry audit - 2026-08-06

### 1. Release verdict: HOLD

The deployed public signature gate passes one malformed-signature test. A valid Discord signature is still required to exercise the next semantic-rejection branch.

### 2. What was verified

- QA sent one approved, structurally plausible interaction POST with a deliberately invalid Ed25519 signature directly to deployed `discord-interactions`.
- HTTP request `41039` returned 401 with `Invalid request signature` and did not time out.
- Clash remains at 12 scrims, 5 interaction receipts, 14 integration events, and 15 attempts; the supplied interaction marker has zero receipts.

### 3. Blocking issues

- **Blocking:** A genuine Discord-signed malformed-command rejection remains unverified. It cannot be proved by a fabricated signature or service/database call.
- **Blocking:** Production configuration, worker activation/recovery, smoke, pilot, monitoring/support, rollback, and release remain unverified.

### 4. Important risks

- **Important:** Do not treat this synthetic 401 as evidence that Discord's provider delivery, signing, or command-registration path is healthy; it proves only the deployed Function's fail-closed signature verification.

### 5. Unverified but required checks

- **Unverified:** One authentic Discord-signed command containing a harmless semantic error and no resulting database delta; all remaining production gates.

### 6. Suggested fixes or next validation steps

1. **Theo:** In the isolated `ScrimStats Integration Test` server using the permitted role, submit exactly one `/scrim` with a unique opponent label such as `WO-040 signed malformed QA`, a valid date/time and duration, but timezone `Invalid/Zone`. This should return the safe validation response and create no block. Reply `done` immediately after; do not retry it.
2. **QA:** compare the signed interaction result with zero-delta database evidence, then stop Phase E.

## Independent QA Phase E completion - 2026-08-06

### 1. Release verdict: HOLD

Phase E is complete. Its bounded non-customer authorization, entitlement, configuration, signature, and semantic-validation matrix passes, but this is not a production-readiness or release approval.

### 2. What was verified

- Theo executed exactly one real Discord-signed malformed `/scrim` in the isolated test server using the permitted role. It returned the expected safe validation response: `Use the required opponent, date YYYY-MM-DD, time HH:MM (24-hour), valid timezone, and duration.`
- Post-command database checks confirm Clash remains at 12 scrims, 5 receipts, 14 integration events, and 15 delivery attempts. The `WO-040 signed malformed QA` marker has zero scrims and zero outbox events.
- Together with the retained Phase E evidence, this closes viewer/member/cross-tenant, Free/Pro, wrong-guild, permitted-role, overlap, module-state, invalid-signature, and real signed semantic-malformation denial coverage. Workers remain inactive throughout.

### 3. Blocking issues

- **Blocking:** Phase F non-customer production smoke, controlled worker activation/recovery, production Discord configuration review, consented pilot, monitoring/support, rollback rehearsal, and final release approval have not been planned, approved, or verified.

### 4. Important risks

- **Important:** Phase E establishes fail-closed staging behavior, not production provider health, customer readiness, or safe ongoing worker operation.
- **Important:** The historical delivered Phase D-C permission-misconfiguration evidence remains relevant and must stay in the release record despite the later 403 correction.

### 5. Unverified but required checks

- **Unverified:** A separately approved Phase F non-customer production smoke with the exact production project/app/guild/channel/worker scope, observed outbound receipt, recovery/disable proof, and cleanup; then consented pilot, operational support, rollback, and Theo release sign-off.

### 6. Suggested fixes or next validation steps

1. **PM / Core Features Developer:** write the Phase F plan with named production fixtures, pre/post counts, worker activation and disable/recovery procedure, stop conditions, cleanup, monitoring, and rollback owner. It must exclude customer tenants and messages unless separately approved.
2. **Theo:** approve that exact Phase F plan only after reviewing its production/provider scope. Do not activate workers or promote a release from Phase E evidence alone.

## PM Phase F production-smoke plan - 2026-08-06

### Approval interpretation and status

Theo approved Phase F execution only within the named non-customer scope recorded below. QA and Release Auditor is the primary authorised operator and monitor; Core Features Developer may act only as a fallback operator if QA is unavailable. This approval does not authorise a code change, deployment, secret/configuration change, customer message, customer workspace/guild/channel, pilot, or release.

WO-040 is **In Progress — QA and Release Auditor** for the corrected preflight and one-run sequence below. Discord remains Elite-only, test-only, and excluded from the customer release boundary.

### Purpose

Establish one reversible, non-customer production-path smoke: a valid private Discord '/scrim' produces exactly one canonical practice block, receipt, eligible schedule event, and one provider delivery receipt; then the two global Discord workers are disabled and their inactive state is verified. This is evidence for Phase F only, not a customer pilot or release.

### Mandatory preflight record

The PM/authorised operator must record the following in a redacted evidence pack before any worker or provider action. Do not place Discord identifiers, secrets, tokens, interaction bodies, or signatures in this work order.

| Required item | Required value / verification |
|---|---|
| Non-customer fixture | Clash workspace, ScrimStats Integration Test server, its existing subscribed private schedule-created channel, and the existing permitted Discord role; no customer account, tenant, guild, or channel |
| Scope state | Workspace is Elite; Discord module is live and enabled; installation and one schedule-only subscription are active; no other queueable Discord event is present |
| All-project isolation | Theo confirms no other tenant has Discord configured and all other Elite workspaces are his test fixtures. Immediately before activation, QA performs a redacted project-wide check for zero non-fixture claimable/leased Discord events and zero non-fixture reminder-eligible items during the worker window. This confirms the existing scope; it is not a further Theo decision gate. |
| Environment boundary | Record the exact Supabase project/environment, immutable deployed Function revisions, Discord application boundary, and current manifest/release-boundary classification. The current shared-project Discord path remains test-only; this smoke cannot be treated as customer activation or release. |
| Release candidate | Deployed Function revisions/SHA, applied migrations, current manifest classification, and configuration-name presence only |
| Operator and monitoring owner | QA and Release Auditor is the primary activation/disable operator and monitor; Core Features Developer is fallback operator only; Theo is the live stop contact |
| Baseline | Receipt, scrim, integration-event, delivery-attempt, active worker, and relevant cron-run counts captured immediately before activation |
| Stop controls | Operator has verified access to 'security.disable_discord_production_worker_schedule()' and the workspace-level installation/module stop; no invocation is made during preflight |

If any item is absent, stale, ambiguous, or refers to a customer, stop. No substitute fixture or configuration change is implied.

### Theo execution approval - 2026-08-06

Theo nominated the default non-customer Clash workspace and ScrimStats Integration Test Discord server for Phase F. QA and Release Auditor may perform the preflight, activate and immediately disable the approved worker schedule, and complete monitoring for one run. If QA is unavailable, Core Features Developer may perform the same operator-only sequence without changing code. This approval is limited to the existing subscribed private channel and current deployed revision.

If preflight finds the bot cannot post to that existing channel, QA/Core must stop before changing any Discord permission, channel subscription, guild/app setting, secret, or configuration. A permission/configuration correction requires a new explicit Theo approval.

## PM Phase F isolation correction - 2026-08-06

Independent QA found that the proposed two-worker activation was not fixture-scoped: the dispatcher can claim up to 25 project-wide Discord events and the reminder worker can create events for qualifying Elite workspaces. Theo confirms that no other tenant has Discord configured and all other Elite tenants are his test fixtures. The remaining all-project clean-queue and reminder-window check is therefore a read-only confirmation of the approved non-customer scope, not a customer multi-tenant blocker.

This correction preserves Theo's named non-customer fixture approval and records QA as the primary operator/monitor, Core as fallback only, and Theo as live stop contact. QA may perform the read-only preflight; if it confirms the recorded scope and the existing subscribed channel can receive the bot message, it may proceed with the already approved one-run sequence. Any unexpected tenant/event, unavailable channel permission, or configuration change remains an immediate stop.

## Theo tenant-scope confirmation - 2026-08-06

Theo confirmed that no other tenant has Discord configured and that all Elite workspaces other than Clash are his own test fixtures. This removes the customer multi-tenant exposure concern from Phase F. It does not change the requirement to preserve evidence, stop on any unexpected non-fixture event, or retain Discord as test-only until later pilot and release gates pass.

### Approved-sequence proposal for Theo's exact confirmation

1. Recheck the preflight baseline and confirm both workers are inactive.
2. Submit exactly one valid '/scrim' from the private fixture with a unique Phase F marker. Confirm one receipt, one canonical scrim, and one eligible schedule-only event; stop on any duplicate or unexpected row.
3. The authorised operator activates only the reviewed production worker schedule. QA verifies both named worker jobs report active, with no broad catch-up or unrelated-event claim.
4. Observe one eligible fixture event reach one provider delivery receipt in the approved private channel. Confirm deterministic nonce/idempotency leaves no second provider attempt or delivery for the same event/channel.
5. Immediately invoke 'security.disable_discord_production_worker_schedule()'. Verify both jobs are inactive, retain cron history and delivery evidence, and confirm no additional fixture or unrelated event was claimed after disable.
6. Retain the labelled practice block, receipt, event, attempt, redacted request IDs, and count deltas as evidence. Do not delete historical evidence. If the run fails, disable first, preserve evidence, classify the failure, and return the bounded defect to Core.

### Stop conditions

Stop immediately and invoke the global disable procedure if any of the following occurs: a customer target is selected; a secret/configuration change is requested; a non-fixture event is claimed; a duplicate scrim/receipt/event/delivery is observed; a provider response is not the approved private target; a worker cannot be disabled; an authorisation/tenant boundary fails; or any monitored count changes outside the recorded fixture scope.

### Definition of done

- Exact preflight record and Theo's named execution confirmation are retained.
- One non-customer signed '/scrim' has the expected single canonical data path and one private provider delivery receipt.
- Both workers were observed active only for the run, then observed inactive through the documented global stop, with retained cron/delivery evidence.
- QA independently verifies redacted before/after counts, no unrelated claims, no customer impact, safe operator recovery, and honest workspace availability state.
- The work order returns to **Blocked** pending a separately approved Phase G consented Elite pilot; Phase F alone never changes the release verdict.

## Independent QA Phase F plan audit - 2026-08-06

### 1. Release verdict: HOLD

Phase F is not safe to execute from the current record. The named non-customer fixture and immediate-disable intent are appropriate, but the plan does not yet prove that activating the two project-wide workers cannot claim or create work outside the fixture. Discord remains test-only and excluded from the customer release boundary.

### 2. What was verified

- The plan confines the intended provider target to Clash, the ScrimStats Integration Test server, its existing private subscribed channel, and an existing permitted role; it forbids customer targets and configuration/permission changes.
- The reviewed activation routine uses Vault-only values, requires both named cron rows to be active, and is operator-only. The disable routine retains cron history and deactivates both named jobs.
- The active dispatcher is not tenant-scoped when called without a QA run: it calls `claim_integration_events_for_provider('discord', 25)`. The reminder worker also evaluates all active Elite `practice_reminder` subscriptions and can create events for every qualifying tenant.
- The manifest and release boundary continue to label Discord test-only and exclude interactive Discord delivery from customer availability.

### 3. Blocking issues

- **Blocking:** The Phase F preflight says that no other queueable Discord event is present, but does not require a *global* pending/claimable Discord-outbox check or a global reminder-eligible scrim/subscription check. Activating the production schedule can therefore claim up to 25 unrelated events or create reminder events outside Clash.
- **Blocking:** The plan uses the term "production-path smoke" without pinning the exact Supabase project/environment, deployed Function revision, Discord application, and release-boundary classification. The existing evidence is for shared project `tvcgjehreaayfazlhvps`, whose manifest expressly remains test-only; the plan must not silently reinterpret it as production/customer activation.
- **Blocking:** The mandatory named activation/disable operator, QA monitor, and live stop contact are required by the plan but are not recorded. The preflight must name them before a global worker state change.

### 4. Important risks

- **Important:** A successful fixture delivery proves only one private non-customer message. It does not authorise an Elite customer pilot or make the Discord availability claim customer-ready.
- **Important:** The stop procedure is global. Its use is recoverable but can delay any unrelated Discord work; that reinforces the need for an all-project clean queue and reminder window before activation.

### 5. Unverified but required checks

- **Unverified:** A redacted, immediately-before-activation all-project inventory showing zero non-fixture claimable Discord events, zero non-fixture pending/leased deliveries, and no non-fixture reminder-eligible scheduled scrims/subscriptions for the worker window.
- **Unverified:** The exact project/environment, immutable deployed revisions, named Discord app/channel target, operator, monitor, and stop contact, plus a read-only confirmation that the operator can invoke the global disable routine.
- **Unverified:** The approved one-run delivery, deterministic per-target attempt/delivery evidence, cron activation history, immediate disable evidence, and all customer/pilot/release gates.

### 6. Suggested fixes or next validation steps

1. PM must amend the Phase F preflight to require a global clean-queue and reminder-window check, not a Clash-only count, and to state the exact environment/project, deployed revisions, Discord app boundary, operator, monitor, and stop contact.
2. Theo must explicitly confirm the corrected, environment-pinned global-worker activation scope. Until then, do not submit `/scrim`, activate either worker, or make any provider/configuration/customer change.
3. After the corrected approval, QA may perform only the recorded preflight and return for a go/no-go check before the one-run sequence.

## Independent QA Phase F preflight - 2026-08-06

### 1. Release verdict: HOLD

The corrected all-project preflight is partially clean, but the approved one-run smoke is not safe to start. QA stopped before creating a command, activating either worker, or causing a provider delivery.

### 2. What was verified

- The exact shared test-only Supabase project is `tvcgjehreaayfazlhvps`; the deployed Discord candidates remain `discord-interactions` v13, `discord-dispatch` v18, `discord-schedule-reminders` v13, and `discord-qa-nonce` v1. Required Vault configuration *names* are present; no values were read.
- Clash is Elite with a live/enabled Discord module, one active installation, and one active `schedule_created` subscription. Both named global Discord workers are inactive; all QA controls are inactive; the current operator context can invoke the documented global disable routine.
- The all-project inventory found zero non-fixture open or claimable Discord events, zero non-fixture reminder-eligible items, and zero currently claimable Discord events overall. The retained Clash failed event is at attempt count five and is not claimable.

### 3. Blocking issues

- **Blocking:** Clash has four active Discord subscriptions (`schedule_created`, `schedule_changed`, `schedule_cancelled`, and `practice_reminder`), not the approved one schedule-only subscription.
- **Blocking:** One Clash item is currently eligible for `practice_reminder`. Activating the global reminder worker can create an additional Discord event and may cause a second provider delivery, invalidating Phase F's exact-one-event acceptance criterion.

### 4. Important risks

- **Important:** The non-terminal retained Clash event is terminal `failed` at five attempts and is not currently dispatchable, but it must remain preserved as historical evidence and must not be repurposed for Phase F.
- **Important:** Disabling or editing a subscription is a workspace configuration change. The current approval explicitly requires QA to stop rather than make that change.

### 5. Unverified but required checks

- **Unverified:** A newly approved, isolated existing channel/subscription state with only the Phase F schedule-created delivery capable of being produced during the worker window.
- **Unverified:** The valid signed Phase F command, exactly one canonical data delta, one private provider receipt, active-to-inactive worker evidence, and immediate post-disable all-project count reconciliation.

### 6. Suggested fixes or next validation steps

1. Theo must explicitly choose one safe scope: either approve a temporary non-customer change that disables the three non-schedule subscriptions and restores them with evidence afterwards, or provide an already schedule-only isolated fixture. Do not alter the existing subscriptions under the current approval.
2. PM must record that chosen scope and the exact restoration/stop owner. QA can then repeat the read-only preflight immediately before the smoke.

## Phase F temporary subscription isolation and renewed preflight - 2026-08-07

### 1. Release verdict: HOLD

Theo approved the temporary non-customer isolation route. QA applied only that approved configuration change and the renewed preflight now passes for the one-run sequence; no command, worker activation, or provider delivery has occurred.

### 2. What was verified

- Immediately before the change, Clash had active `practice_reminder`, `schedule_changed`, and `schedule_cancelled` subscriptions, each enabled on its active installation. QA set only those three subscriptions to disabled; their prior enabled state is retained here for required restoration after the Phase F sequence.
- Clash now has exactly one enabled active subscription: `schedule_created`.
- The all-project inventory is clean: zero non-fixture open/claimable Discord events, zero claimable events overall, and zero reminder-eligible items. The retained failed historical Clash event remains non-claimable.
- Both Discord cron jobs and every QA control are inactive. Current fixture baseline is 12 scrims, 5 interaction receipts, 14 Discord events, and 15 Discord delivery attempts.

### 3. Blocking issues

- **Blocking:** The one approved, valid Discord-signed Phase F command has not yet been submitted. QA must not activate either worker until its exact one-row canonical/outbox delta is verified.

### 4. Important risks

- **Important:** The three disabled subscriptions must be restored to enabled only after the worker sequence is disabled and final counts are retained. They must not be left in the temporary QA state.

### 5. Unverified but required checks

- **Unverified:** One valid private fixture command, its exact data delta, one provider receipt, active-to-inactive worker evidence, and post-disable no-unrelated-claim proof.

### 6. Suggested fixes or next validation steps

1. Theo must submit exactly one valid `/scrim` in the existing private ScrimStats Integration Test fixture with the unique marker `WO-040 Phase F smoke 2026-08-07`, then reply `done` without retrying.
2. QA will verify the one-row delta before activating the workers, monitor one delivery, immediately disable the workers, reconcile all-project counts, and restore the three subscriptions with evidence.

## Independent QA Phase F command gate and activation stop - 2026-08-07

### 1. Release verdict: HOLD

The single approved private command passed its canonical-data gate, but the project-wide worker activation was not executed. The hosting control rejected activation pending explicit current approval for the global external-provider blast radius. QA restored the temporary subscription isolation immediately; workers remain inactive.

### 2. What was verified

- The unique `WO-040 Phase F smoke 2026-08-07` command produced exactly one new Clash scrim, one interaction receipt, and one pending `schedule_created` Discord event, with zero delivery attempts. Fixture totals changed exactly 12→13 scrims, 5→6 receipts, and 14→15 events; attempts remained 15.
- Immediately before the attempted activation, no non-fixture Discord work was open, the new event was the only claimable event, both workers and all QA controls were inactive.
- The hosting control rejected `security.configure_discord_production_worker_schedule()` without executing it. QA restored `practice_reminder`, `schedule_changed`, and `schedule_cancelled` to their prior enabled state; both workers are confirmed inactive.

### 3. Blocking issues

- **Blocking:** The worker schedule is project-wide and can invoke external Discord delivery. Theo must give a current explicit approval for *this exact action*: activating `security.configure_discord_production_worker_schedule()` in project `tvcgjehreaayfazlhvps` to dispatch only the already-created marker event, monitoring it, and immediately calling `security.disable_discord_production_worker_schedule()`.

### 4. Important risks

- **Important:** The marker event is now pending and claimable. Do not submit a second command; it would create a duplicate test case and breach the one-command boundary.
- **Important:** The temporary subscription isolation is no longer active. If activation is approved later, QA must repeat the approved isolation and fresh all-project preflight immediately before activation.

### 5. Unverified but required checks

- **Unverified:** Active worker evidence, one provider receipt/attempt, immediate disable, restored configuration after final reconciliation, and no unrelated claim.

### 6. Suggested fixes or next validation steps

1. Theo must explicitly approve the exact activation/monitor/disable action stated above. This must include the project ID, existing marker event only, external Discord delivery, and immediate global disable.
2. On that approval, QA will re-isolate the three subscriptions, repeat the clean preflight, activate once, monitor the existing event, disable immediately, reconcile globally, and restore the subscriptions.

## Independent QA Phase F controlled worker result - 2026-08-07

### 1. Release verdict: HOLD

The approved controlled activation completed its safety sequence but did not deliver. The only marker event received one Discord `403` retry and no provider receipt. QA immediately disabled both workers, restored the temporary subscriptions, and preserved the event/attempt evidence. WO-040 remains blocked.

### 2. What was verified

- After renewed isolation and preflight, the marker was the sole claimable Discord event: no non-fixture event was open or claimable, no reminder item was eligible, and only `schedule_created` was enabled for Clash.
- `security.configure_discord_production_worker_schedule()` activated both named jobs (`dispatch` 5 and `reminders` 4). The dispatch worker made exactly one attempt for the existing marker event.
- The marker remains `pending` at attempt count 1. Its only attempt is `retry`, records `Discord returned 403`, and has no provider receipt. Fixture totals are 13 scrims, 6 receipts, 15 Discord events, and 16 delivery attempts.
- `security.disable_discord_production_worker_schedule()` returned both jobs to inactive. No QA controls are active and no non-fixture event or attempt was observed.
- QA restored `practice_reminder`, `schedule_changed`, and `schedule_cancelled` to their prior enabled state.

### 3. Blocking issues

- **Blocking:** Discord rejected the approved private target with HTTP 403. The worker cannot deliver to that subscribed channel under its current provider permissions.

### 4. Important risks

- **Important:** The marker is deliberately retained as a pending evidence-bearing retry. Do not reactivate workers or submit another command: either action could create additional attempts or mutations.
- **Important:** Any Discord channel/bot permission, subscription, guild/app, or secret/configuration correction is outside this run and requires Theo's explicit approval before it is made.

### 5. Unverified but required checks

- **Unverified:** A correctly permissioned non-customer private delivery, provider receipt, deterministic no-duplicate evidence, retry/recovery outcome after a corrected target, pilot, support, and release gates.

### 6. Suggested fixes or next validation steps

1. Theo must decide whether to approve a narrowly scoped Discord permission correction for the existing subscribed non-customer channel. The correction must name the exact bot capability to grant and preserve all other channel/guild settings.
2. After a correction, QA must receive a fresh, separately approved one-event retry/cleanup plan. It must not reuse the current global-worker activation authority; retain and reconcile the existing 403 evidence first.

## Independent QA post-permission-change inert check - 2026-08-07

### 1. Release verdict: HOLD

Theo reported the narrow channel-permission correction complete. QA confirms a safe inert hosted state, but the correction itself remains unverified until one separately approved provider retry succeeds or fails.

### 2. What was verified

- The existing Phase F marker is still the sole claimable Discord event: it remains pending at attempt count one with no delivery receipt.
- No non-fixture Discord event is claimable; both global workers and all QA controls are inactive.

### 3. Blocking issues

- **Blocking:** The prior worker-activation authority was consumed by the recorded 403 run. A fresh explicit approval is required before a new project-wide activation can test the reported permission correction.

### 4. Important risks

- **Important:** Do not create a new command or event. The bounded retry must use only the retained marker, after the same all-project clean-queue/subscription isolation preflight.

### 5. Unverified but required checks

- **Unverified:** The Discord channel can now accept a bot message, the marker reaches exactly one provider receipt, and immediate disable/restoration leaves no unrelated work.

### 6. Suggested fixes or next validation steps

1. Theo must explicitly approve one fresh activation of `security.configure_discord_production_worker_schedule()` in project `tvcgjehreaayfazlhvps`, restricted to the existing marker retry, monitoring, immediate disable, and subscription restoration.

## Independent QA Phase F controlled retry completion - 2026-08-07

### 1. Release verdict: HOLD

Phase F completes as bounded, hosted non-customer evidence. The corrected private target delivered exactly once after the retained 403 retry. Discord remains test-only, customer activation is not approved, and WO-040 returns to **Blocked** pending a separately approved Phase G consented Elite pilot.

### 2. What was verified

- QA re-isolated the non-customer Clash fixture, then confirmed the retained marker was the sole claimable Discord event, no non-fixture event was claimable, and no reminder event could be created.
- Both named workers activated under Theo's fresh explicit approval. The retained marker reached terminal `delivered` with one provider receipt.
- The marker retains two delivery-attempt rows: the historical `Discord returned 403` retry without a receipt, and one later `delivered` row with a provider receipt. It has no duplicate canonical scrim, receipt, or outbox event.
- QA immediately disabled both workers. Final fixture totals are 13 scrims, 6 interaction receipts, 15 Discord events, and 17 delivery attempts. No non-fixture work is open; all QA controls are inactive.
- `practice_reminder`, `schedule_changed`, and `schedule_cancelled` were restored to their prior enabled state after the final disable.

### 3. Blocking issues

- **Blocking:** Phase F is not customer release evidence. A named, consented Elite pilot, monitored support/rollback procedure, and Theo's separate release decision remain required.

### 4. Important risks

- **Important:** The 403 retry is retained evidence of a real permission failure. Future channel/guild permission changes must be evaluated against it; do not erase or relabel it as a clean first-pass delivery.
- **Important:** A provider receipt verifies the hosted delivery API path, not end-user browser/UI receipt or broad operational reliability.

### 5. Unverified but required checks

- **Unverified:** Consented customer-pilot admission, customer-specific tenant/role/plan verification, monitoring and support handoff during a real delivery window, recovery/rollback drill, and final release approval.

### 6. Suggested fixes or next validation steps

1. PM must prepare a Phase G plan naming a consented Elite pilot workspace, customer contact/rollback owner, support monitoring window, scope limit, and immediate disable procedure. It must exclude all other customers.
2. Theo must approve that exact pilot plan before any customer Discord enablement, worker activation, or customer-facing availability claim.

## PM post-Phase F routing - 2026-08-07

Phase F is complete as **hosted, non-customer evidence**. It proves one retained fixture event can make one provider delivery after a documented 403 permission failure/retry, with project-wide isolation, immediate worker disable, and subscription restoration. It does not prove customer supportability, customer setup, sustained worker operation, browser-visible receipt, or general availability.

WO-040 is **Blocked — Project Manager** pending a separately scoped Phase G consented Elite pilot plan. No developer work is currently assigned. The work order remains on release **HOLD**.

### Required Phase G plan

- Name one consented Elite workspace only, its owner contact, pilot start/end window, support monitor, rollback owner, and immediate-disable contact.
- Verify that workspace's Elite entitlement, live/enabled Discord module, installation, permitted role, subscribed channel, and customer-role boundaries without exposing identifiers or credentials.
- Define one schedule-only success path, expected data/provider evidence, browser-visible customer state, monitoring cadence, retry/failure handling, and the customer-facing wording that remains truthful throughout the pilot.
- Define immediate workspace-level disable plus global-worker disable, evidence retention, incident escalation, and pilot exit/cleanup. No broad customer enablement or public availability claim is included.

### Definition of done for Phase G planning

A plan contains every named pilot/owner/window/rollback field above, its acceptance and stop conditions, exact before/after evidence requirements, and a Theo approval record. Only then may QA/Core receive a pilot execution assignment.

## PM pre-pilot customer-readiness route - 2026-08-07

Theo's direction is to make Discord technically and operationally ready for pilot teams before recruiting those teams. The former Phase G pilot stage is therefore split:

1. **Phase G — pre-pilot customer-readiness:** non-customer technical, operational, and release-boundary completion.
2. **Phase H — consented Elite pilot:** the first real teams use the already-prepared workflow under monitoring.
3. **Phase I — release decision:** only after pilot evidence and Theo's explicit decision.

### Phase G objective

Turn the successful non-customer Phase F delivery into a supportable customer-pilot candidate without enabling any customer workspace or making any customer-facing availability claim.

### Assigned Core outcome

- Reconcile the deployed Discord revisions, migrations/RLS/grants, worker authentication, provider configuration-name presence, and current manifest/release-boundary status against the reviewed source. Record safe revision and configuration-name evidence only.
- Close the pre-pilot multi-workspace operational gap: prove that normal scheduled dispatch and reminder processing can be enabled without cross-tenant delivery, duplicate claims, or unbounded unrelated work. Use non-customer fixtures only; if a second configured fixture or provider change is needed, stop and return the exact proposed scope to Theo.
- Verify owner/admin setup and member/viewer denial journeys, truthful unavailable/retrying/failed/disconnected states, and a workspace-level immediate disable alongside the global worker disable. Preserve historical attempts and receipts.
- Produce a pilot-support handoff: owner/admin setup checklist, event/attempt inspection procedure, bounded retry/failure handling, incident escalation, workspace disable, global disable, evidence retention, and a no-claim rule.
- Prepare a named production-candidate manifest/release-boundary update only after the technical and support evidence is complete. Do not deploy, reclassify Discord as customer-available, activate workers, or change provider/secrets/configuration without a new exact Theo approval.

### Phase G acceptance criteria

- At least two isolated non-customer workspace contexts demonstrate tenant-scoped enablement/denial, per-workspace disable, and no cross-tenant event/attempt change under normal dispatch and reminder conditions.
- Exact deployed candidate revisions, Function authentication, RLS/grants, worker schedules, and configuration-name presence are independently hosted-verified; no secret value is exposed.
- Owner/admin configuration and member/viewer denial are browser-verified, including unavailable, retrying, failed, and disconnected customer-support states.
- A written support/rollback runbook has an identified operator, evidence fields, immediate workspace/global disable actions, and a customer-safe incident escalation path.
- QA independently issues a **pre-pilot customer-ready** verdict. This is not a customer activation, pilot, or release approval.

### Phase G explicit non-goals

- Do not enable Discord for a customer, send a customer Discord message, recruit/claim a pilot, or publish availability.
- Do not change plan entitlements: Discord remains Elite-only and live/enabled module-gated.
- Do not change secrets, Discord app/guild/channel permissions, production configuration, database schema, or deploy Functions without a separately named Theo approval.

### Phase G reproducible QA scenario

1. Establish two confirmed non-customer tenant fixtures with distinct roles and clean before-counts. If the existing test Discord configuration cannot support this without a provider change, stop.
2. Verify all tenant/role/module/plan denials and the authorised owner/admin setup state. Confirm denied actions create no scrim, receipt, event, or delivery attempt.
3. Execute the approved normal dispatcher/reminder sequence only against the named non-customer fixtures; reconcile all tenant counts and prove each workspace-level disable prevents only its own future delivery while preserving history.
4. Exercise retry, failure, disconnected, and global-disable operator procedures using retained evidence. Do not manufacture customer or provider activity outside separate approvals.
5. QA independently reviews the deployed candidate, browser journeys, support handoff, and evidence pack, then issues its pre-pilot verdict.

## PM current routing after Phase F - 2026-08-07

The earlier Phase G pilot-planning entry is superseded by Theo's later pre-pilot direction. The current work is **Phase G pre-pilot customer-readiness**, assigned **Ready for Development** to Core Features Developer. Phase F remains completed hosted non-customer evidence only; its QA row is historical evidence, not an active blocker or a pilot authorisation.

The current release verdict remains **HOLD**. Core must hand back a bounded non-customer candidate and validation evidence before QA can assess pre-pilot customer readiness. If Core determines that a second configured non-customer fixture, Discord provider change, deployment, configuration change, or customer action is necessary, it must stop and return the exact scope to Theo.

## Core Phase G-A read-only readiness audit - 2026-08-07

Theo approved Phase G-A only: source inspection, local validation, read-only hosted reconciliation, authenticated browser inspection, and preparation of the two-context execution plan. No fixture row, provider request, worker state, secret/configuration, deployment, customer workspace, or production data was changed.

### Outcome and current verdict

Phase G-A is complete. The deployed security and worker boundaries remain safely inert, but the current candidate is **not ready for Phase G QA** because customer-visible delivery health and release wording are incomplete. The overall release verdict remains **HOLD**.

### Source and local validation evidence

- Discord signature verification occurs against the raw request body before JSON parsing or tenant lookup. The interaction path then enforces active guild installation, permitted Discord role, Elite/live/enabled module state, and server-owned canonical creation.
- Owner/admin configuration paths use authenticated Functions plus server-side membership and Discord entitlement checks. Member/viewer access is not trusted to the browser gate.
- Dispatcher and reminder Functions require `DISCORD_DISPATCH_SECRET`; dispatcher claims only provider-scoped events and rechecks tenant entitlement and tenant subscriptions before delivery.
- Operator worker and QA-arm routines are `SECURITY DEFINER` with fixed search paths and no `anon`, `authenticated`, or `service_role` execution. Service-only claim/completion RPCs remain unavailable to `anon` and `authenticated`.
- Focused Discord/competitive contracts: 18 passed, 0 failed.
- ESLint completed with zero warnings; TypeScript completed; production Vite build completed; bundle budgets passed; `git diff --check` completed with line-ending warnings only.

### Read-only hosted reconciliation

- Exact active revisions remain: `discord-install` v15, `discord-channels` v13, `discord-schedule-reminders` v13, `discord-dispatch` v18, `discord-config` v10, `discord-roles` v5, `discord-interactions` v13, and `discord-qa-nonce` v1. Their recorded hosted SHA-256 identities are unchanged from the previously reviewed WO evidence.
- Hosted migration history includes `20260802173000_discord_interaction_scheduling`, `20260804134309_discord_production_delivery_controls`, `20260805134134_discord_qa_replay_controls`, `20260805191357_wo040_discord_qa_dispatch_controls`, `20260806130646_wo040_discord_nonce_qa_controls`, and `20260806142907_wo040_discord_worker_reactivation`.
- Both named Discord cron jobs are inactive. There are zero claimable Discord events and zero active replay, dispatch, or nonce QA controls. One retained schedule-created event remains terminal `failed` at attempt count five and is not claimable.
- RLS is enabled on `discord_installations`, `discord_channel_subscriptions`, `discord_permitted_roles`, `discord_interaction_receipts`, `integration_events`, and `integration_delivery_attempts`. The security advisor returned no Discord-specific advisory.
- Worker Vault configuration names `project_url`, `publishable_key`, and `discord_dispatch_secret` are present. No value was read or recorded. Provider Edge-secret name presence could not be independently enumerated through the available read-only interface and remains unverified.
- Hosted configuration currently has one active installation, one distinct guild, one configured tenant, and four enabled subscriptions. This is insufficient for a two-configured-workspace provider proof.

### Authenticated browser and fixture findings

- The signed-in owner journey for the isolated configured fixture renders `Available`, `Delivery active`, four active prompt types, owner/admin configuration controls, and the warning that `/scrim` remains unavailable until release approval.
- Those simultaneous states are not an honest pre-pilot customer contract: `Available` and `Delivery active` overstate release readiness while the command and global workers remain release-gated and inactive.
- The current `discord-config` response exposes installation, subscriptions, and permitted roles only. It does not expose tenant-scoped recent delivery health, so the UI cannot distinguish queued/retrying, failed, disconnected, or last-delivered states.
- The approved test accounts provide owner, admin, member, and viewer memberships across Free, Pro, Elite/planned, Elite/live/unconfigured, and Elite/live/configured contexts. The Elite/live/unconfigured context can be the second non-customer negative-control workspace; no second Discord installation or provider change is required for the next source/browser matrix.
- Owner desktop state was browser-verified. Switching workspace roles through the current browser control timed out without changing data, and the requested mobile viewport override did not take effect; admin/member/viewer and real mobile evidence remain unverified.

### Documentation drift

- `EDGE_FUNCTION_MANIFEST.md` still calls `discord-qa-nonce` source-only and undeployed even though hosted v1 is active.
- `DISCORD_DELIVERY_SUPPORT.md` still describes the non-customer production smoke as outstanding although Phase F completed one bounded delivery after the retained 403 retry.
- `RELEASE_BOUNDARY.md` correctly continues to exclude interactive Discord delivery.

### Proposed Phase G-B source scope requiring Theo approval

1. Extend the authenticated, owner/admin-only Discord status response with bounded tenant-scoped delivery health derived from existing events/attempts; add no schema and expose no provider reference, secret, or cross-tenant data.
2. Replace premature `Available` / `Delivery active` wording with explicit setup state plus test-only/release-HOLD wording, and render honest disconnected, queued/retrying, failed, and last-delivered states.
3. Add focused contracts for tenant scoping, owner/admin authorization, member/viewer denial, state mapping, and release-safe copy.
4. Reconcile the manifest and support runbook with the hosted Phase F/G-A evidence while keeping the release boundary excluded.
5. Run focused tests, ESLint, TypeScript, production build, bundle budget, and desktop/mobile local browser checks. Do not deploy or mutate hosted state in Phase G-B.

After Phase G-B source validation, return for a separately approved Phase G-C hosted matrix. That later approval must name the configured fixture, the Elite/live unconfigured negative-control workspace, allowed temporary fixture changes, any worker activation, immediate disable/restoration owner, before/after counts, and the no-provider-change boundary.

## Core Phase G-B source implementation - 2026-08-07

Theo approved the bounded Phase G-B source scope recorded above. The implementation is complete locally; no Function or frontend was deployed and no hosted/provider state was changed.

### Changes implemented

- `discord-config` now returns a bounded owner/admin-only `delivery_health` projection after the existing authenticated membership and Elite/live/enabled checks. All event and attempt reads require the requested `tenant_id`, Discord provider, supported schedule event types, descending recency, and a one-row limit.
- The response exposes only mapped state, event status, attempt count, retry/delivery timestamps, and the latest attempt outcome. It does not select or return provider references, provider error text, payloads, event IDs, guild/channel IDs beyond the existing configuration contract, or cross-tenant data.
- A shared pure mapper covers `setup_required`, `connected`, `configured`, `queued`, `retrying`, `failed`, `delivered`, and `disconnected`. Connection/configuration state takes priority over stale historical event evidence.
- The Integrations badge now says `Test only` instead of `Available`. The Discord panel no longer says `Delivery active`; it renders evidence-specific, release-safe labels and permanently states that customer availability still requires hosted QA, a consented pilot, and Theo's release approval.
- Disabled Discord modules no longer render owner/admin controls. Member/viewer browser gating remains unchanged, and the Function continues to deny them below the browser through `managerMembership`.
- The manifest now records hosted `discord-qa-nonce` v1 and the completed Phase F bounded smoke honestly. The support runbook now defines pre-release states, operator ownership, evidence fields, workspace/global stop paths, and the retained release HOLD.

### Validation evidence

- Focused Discord, status, nonce, and competitive contracts: 23 passed, 0 failed.
- Complete local suite: 267 passed, 0 failed.
- ESLint: passed with zero warnings.
- TypeScript: passed.
- Production Vite build: passed, 3,365 modules transformed.
- Bundle budgets: passed.
- `git diff --check`: passed with existing Windows line-ending warnings only.
- React review: the state presentation is module-static, query reads remain deduplicated through React Query, and the Function parallelises independent status reads before the one dependent latest-attempt read.

### Remaining verification and release boundary

- The new `discord-config` source and frontend are not deployed. Hosted revision/source parity, authenticated owner/admin states, member/viewer denial, state rendering, and real desktop/mobile layout remain unverified for this candidate.
- No migration is required. The implementation reads existing tenant-scoped tables and does not change RLS, grants, worker scheduling, entitlements, provider configuration, or secrets.
- Workers remain inactive by the last Phase G-A hosted check. No provider request, fixture mutation, or customer action occurred during Phase G-B.
- Release remains **HOLD**. This source completion is not `Ready for QA`, customer activation, pilot evidence, or release approval.

### Exact next approval scope

Before Phase G-C data/worker execution, the candidate first needs a bounded deployment verification step:

1. Commit only the intentional WO-040 source/tests/docs plus the existing PM routing/evidence needed by this order; preserve unrelated WO-041/WO-042 files and other dirty work.
2. Push the current `codex/Staging` branch.
3. Deploy only `discord-config` with `verify_jwt=true`, including `_shared/collector.ts` and `_shared/discord-health.ts`; do not deploy or activate any worker or provider-facing Function.
4. Deploy the staging frontend only. Do not change environment variables, secrets, database schema/data, Discord configuration, or customer workspaces.
5. Verify exact hosted revision/source identity, then run read-only authenticated desktop/mobile owner/admin/member/viewer checks across the existing configured test fixture and Elite/live unconfigured negative-control workspace.

The later Phase G-C worker/provider matrix remains a separate approval after this deployment verification succeeds.

## Core Phase G-B staging deployment verification - 2026-08-07

Theo approved only the bounded candidate deployment and read-only verification scope recorded above. Core committed the reviewed WO-040 source/tests/docs as `405ca36` (`Prepare Discord pre-pilot delivery states`) and pushed it to `origin/codex/Staging`. Unrelated WO-041/WO-042 files and mixed assignment-board/index edits were not staged.

### Hosted deployment evidence

- Supabase project `tvcgjehreaayfazlhvps` reports `discord-config` version **11** as `ACTIVE`, with `verify_jwt=true` and deployed SHA-256 `3a880bb7950d7b4cced745bb35cc3bf85b5e302099559dafccbc05866e9fc5e4`.
- A read-back of hosted v11 contains the reviewed `discord-config` entrypoint plus `_shared/collector.ts` and `_shared/discord-health.ts`, including tenant-scoped bounded delivery-health reads and the `test_only` response contract.
- The established Git-triggered staging frontend path served HTTP 200 from `https://staging.scrimstats.gg/integrations` after the push. The response was last modified `Fri, 07 Aug 2026 11:41:24 GMT`, referenced `/assets/index-m6UGdxJD.js`, returned `x-vercel-cache: MISS`, and recorded request reference `arn1:iad1::r9p5t-1786102884618-2bbe2e4c724e`.
- The connected Vercel account still exposes no projects, so an immutable Vercel deployment ID and provider-side commit-to-deployment mapping could not be independently recorded. The authenticated hosted UI proves the new candidate contract is served, but this is not equivalent to an exact Vercel revision attestation.

### Authenticated desktop evidence

- At a measured 1280 x 720 viewport, the configured non-customer `clash` owner journey renders `Test only`, `Last delivery recorded`, the safe provider-receipt disclaimer, the permanent customer-availability HOLD copy, and the existing owner configuration controls.
- The `OnceUponATeam` member journey renders `Test only`, the read-only notification-bridge preview, `Unavailable until delivery is verified`, and no Discord configuration controls.
- The `WO-024 QA Tenant B` admin journey renders `Coming soon` and `Unavailable until delivery is verified`. This verifies the admin's planned/module-unavailable presentation, not an authorised admin setup path on an Elite/live configured workspace.
- No workspace, provider, database, secret, configuration, worker, or customer state was changed by these browser checks.

### Remaining verification gaps and verdict

- The current browser session is authenticated only as `fridayxiiiempire@gmail.com`; it has owner, admin, and member memberships but no viewer membership. The existing `pathtoyourdream@gmail.com` Clash viewer therefore remains unverified against this deployed frontend candidate.
- The in-app browser runtime exposes no viewport-resize operation and remained 1280 x 720 after the bounded mobile-viewport attempts. Real 390 px owner/admin/member/viewer evidence remains unverified.
- An authorised Elite/live admin configuration state is not present in the available signed-in account's workspaces. The admin evidence above is a fail-closed unavailable state only.
- Phase G-B remains **In Progress** and the release verdict remains **HOLD**. Do not assign Phase G-C, activate workers, mutate fixtures, invoke a provider delivery, enable a customer workspace, or make an availability claim.

### Exact QA handoff blocker

To complete this deployment-verification step, QA needs authenticated access to the existing Clash viewer fixture and a browser capable of a real 390 px viewport. It must repeat the deployed `/integrations` role presentation without mutations and record the exact staging revision if Vercel project visibility is available. After those checks pass, WO-040 may move to the QA and Release Auditor for Phase G-B review; Phase G-C remains separately approval-gated.

## Core Phase G-B authenticated viewer recheck - 2026-08-07

Theo supplied an authenticated staging session for the existing non-customer Clash viewer fixture. The read-only check used `pathtoyourdream@gmail.com`; no workspace, provider, database, configuration, or customer state was changed.

- `https://staging.scrimstats.gg/integrations` loaded the `clash` workspace and displayed the authenticated role as `viewer`.
- The Discord module rendered `Test only`, the notification-bridge preview, and `Unavailable until delivery is verified`.
- `Disconnect`, `Refresh channels`, `Load Discord roles`, `Save schedule prompts`, and `Connect Discord` each had zero rendered controls. This closes the deployed viewer presentation gap for the current candidate.
- The browser reported a 1280 x 720 viewport. Its control surface still exposes no real viewport resize, so 390 px responsive evidence remains unverified.
- A read-only membership/entitlement reconciliation across the four approved test accounts confirms there is no existing admin membership on an Elite/live Discord workspace: the available admin memberships are on planned-module tenants without an installation. No fixture was changed.

Phase G-B remains **In Progress** with release **HOLD**. Before QA handoff, Core/QA still needs a genuine 390 px role presentation check, an authorised Elite/live admin setup fixture or an explicitly accepted limitation, and immutable Vercel revision evidence if project visibility becomes available. Phase G-C remains separately approval-gated.

## Core Phase G-B temporary admin fixture verification - 2026-08-07

Theo approved the narrowly bounded non-customer fixture proposed above: temporarily change only `pathtoyourdream@gmail.com` in Clash from viewer to admin, perform read-only hosted verification, then restore the exact viewer role. No other membership, workspace, Discord configuration, worker, provider, event, or customer state was authorised.

### Preflight and temporary verification

- Guarded preflight found exactly one matching membership with role `viewer`; Clash remained Elite/live/enabled with one active Discord installation and zero active Discord workers.
- The guarded viewer-to-admin update changed exactly one row.
- After reload at 1280 x 720, staging displayed the role as `admin`, rendered `Test only` and `Last delivery recorded`, retained the provider-receipt limitation and release-HOLD wording, and rendered exactly one each of `Disconnect`, `Refresh channels`, `Load Discord roles`, and `Save schedule prompts`.
- No control was invoked and no configuration value was changed.

### Immediate restoration and postflight

- The guarded admin-to-viewer restoration changed exactly one row.
- After reload, staging again displayed `viewer`, rendered the read-only `Test only` / `Unavailable until delivery is verified` state, and rendered zero instances of all four management controls.
- Final database read-back confirms exactly one matching membership with role `viewer`, one active installation, four enabled subscriptions, one permitted Discord role, and zero active Discord workers.

The authorised Elite/live admin presentation gap is closed and the temporary fixture is fully restored. Phase G-B remains **In Progress** with release **HOLD** only because genuine 390 px hosted evidence and immutable Vercel revision mapping remain unavailable in the current tool surfaces. Phase G-C remains separately approval-gated.
