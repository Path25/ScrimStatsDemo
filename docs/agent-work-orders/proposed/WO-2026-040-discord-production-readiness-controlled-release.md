# WO-2026-040 - Make Discord scheduling and delivery production-ready through a controlled release

- **ID reservation:** [WO-2026-040 registry row](../WORK_ORDER_INDEX.md)
- **Status:** Ready for QA
- **Assigned owner:** Core Features Developer / QA and Release Auditor
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
