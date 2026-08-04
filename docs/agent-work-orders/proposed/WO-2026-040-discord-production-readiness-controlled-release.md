# WO-2026-040 - Make Discord scheduling and delivery production-ready through a controlled release

- **ID reservation:** [WO-2026-040 registry row](../WORK_ORDER_INDEX.md)
- **Status:** In Progress
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
| Production provider/secret/worker configuration | Yes | Pending | 2026-08-04 | Must name the production Discord application, endpoint/command scope, operator, non-customer smoke boundary, and rollback owner; do not provide secrets in chat. |
| Named customer pilot | Yes | Pending | 2026-08-04 | Requires completed matrix and smoke, named consented Elite tenant(s), monitoring window, support/rollback owner, and no public claim. |
| Release / broader activation | Yes | Pending | 2026-08-04 | Requires QA production-ready verdict and the documented support/claim boundary. |

## Decision and approval record

- 2026-08-04 - PM created this successor to WO-025 after production-readiness review. WO-025 remains conditionally closed as staging-only evidence; this order does not reinterpret that acceptance as production approval.
- 2026-08-04 - Theo approved Phase 1 source-only production-readiness remediation with every hosted/provider/customer/release gate retained.

## Implementation and review evidence

- 2026-08-04 - Source review confirms `discord-interactions` uses Discord Ed25519 verification before parsing or tenant lookup, and calls the service-only canonical scheduling RPC. Dispatch/reminder workers require `DISCORD_DISPATCH_SECRET`; delivery records retry/failure attempts and cancellation states.
- 2026-08-04 - Existing evidence confirms exactly one isolated staging Discord interaction through receipt, canonical practice block, provider-scoped delivered outbox event, and one delivery attempt. Exact replay and required negative cases remain unverified.
- 2026-08-04 - `EDGE_FUNCTION_MANIFEST.md` still classes the Discord Functions as test-only, `RELEASE_BOUNDARY.md` excludes interactive Discord delivery, and the only checked scheduler is `configure_discord_test_worker_schedule`; no production configuration, customer activation, or release evidence was inspected or changed.
- 2026-08-04 - Source candidate adds target-scoped `integration_delivery_attempts.delivery_target_id`, a delivered event/channel uniqueness guard, deterministic 24-character Discord nonces with `enforce_nonce`, and skip-on-delivered retry behaviour. A provider success whose audit insert fails remains retryable instead of being reported delivered without evidence.
- 2026-08-04 - Migration `20260804143000_discord_production_delivery_controls.sql` is source-only and unapplied. On any later approved application it pauses both existing Discord cron jobs, retires the test-only activation function, and exposes only revoked, non-API `security.configure_discord_production_worker_schedule()` / `security.disable_discord_production_worker_schedule()` operator paths. It creates or changes no secret.
- 2026-08-04 - Manifest, release boundary, and Discord support runbook now agree that the candidate remains test-only. The support handoff records per-target evidence interpretation, bounded retry, global/workspace disable paths, retained cron history, redaction, and no-customer-claim gates.
- 2026-08-04 - Local validation passed: 11 focused Discord contracts; full 247-test suite; ESLint with zero warnings; TypeScript; production Vite build; bundle budget; and scoped `git diff --check`. Supabase CLI migration lint/reset was unavailable because this checkout has no Supabase CLI package. No hosted database, Function, secret, provider, customer, or outbound-message mutation was performed.
- 2026-08-04 - Core source phase is complete and handed to QA and Release Auditor for independent source review. Hosted QA remains blocked until Theo separately approves the exact migration application and Function deployment scope.
- **Highest evidence achieved:** Hosted verified (isolated staging positive path only)

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
