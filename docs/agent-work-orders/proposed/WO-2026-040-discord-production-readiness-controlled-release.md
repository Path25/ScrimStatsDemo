# WO-2026-040 - Make Discord scheduling and delivery production-ready through a controlled release

- **ID reservation:** [WO-2026-040 registry row](../WORK_ORDER_INDEX.md)
- **Status:** Blocked
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
| Replay and denial matrix | Controlled signed replay and negative hosted evidence | Hosted staging | Outstanding |
| Production-safe worker and release path | Per-channel retry evidence, provider nonce enforcement, inactive-by-default production scheduler, manifest and support controls | Source | Pass (source candidate only; hosted application/deployment outstanding) |
| Production smoke and controlled pilot | Redacted non-customer smoke, then named pilot evidence | Hosted production | Outstanding |
| Honest support and claim boundary | Updated operational/release documentation and approved claim review | Documentation / production | Pass at source; production verification outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** WO-025 is strong staging-positive-path evidence, not production evidence. The current manifest and scheduler are explicitly test-only, and the required replay, denial, operational-recovery, production configuration, smoke, and controlled-pilot gates have not been passed.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Production release-candidate and scheduler design review | QA and Release Auditor | Independently review the source candidate, then record deployed revision IDs and hosted function auth/RLS/grant evidence after separate deployment approval | Source complete; hosted review blocked |
| Staging replay and denial matrix | QA and Release Auditor | Redacted request IDs and before/after receipt, scrim, outbox, and attempt counts | Open |
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
