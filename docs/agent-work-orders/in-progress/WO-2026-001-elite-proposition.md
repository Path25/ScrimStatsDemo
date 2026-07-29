# WO-2026-001 - Define and deliver a credible Elite proposition

- **Status:** In progress
- **Owner:** Feature Development agent
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Problem and user impact

Elite is priced above Pro, but its stated differentiator is Discord automation that is not yet a complete customer workflow. Teams have no dependable, present-day reason to upgrade.

## Why now

Elite subscriptions are part of the near-term commercial goal. Selling a placeholder benefit risks a weak first impression and avoidable support burden.

## Scope

Deliver one immediate Elite job-to-be-done: an installed team Discord server receives selected schedule-change and practice-reminder prompts that link members back to ScrimStats. The integration must not relay scouting, review, private player, credential, or authorization content.

First assess and complete the existing `discord-install`, `discord-channels`, `discord-schedule-reminders`, and `discord-dispatch` workflow; keep it honestly labelled as unavailable or early access until its complete support path is verified. Keep discovery of additional Elite features separate from implementation and create a new work order only once a concrete customer outcome is selected.

## Explicit non-goals

- Building a broad new Elite feature suite or speculative additional Elite features.
- Changing prices or publishing marketing without explicit approval.
- Enabling Discord production delivery before its end-to-end workflow is verified.

## Acceptance criteria

- Elite's approved immediate outcome is limited to selected Discord schedule-change and practice-reminder delivery with links back to ScrimStats; it is available only when its complete customer and support path is verified, otherwise it is honestly labelled unavailable or early access.
- Billing, gates, workspace module state, and customer copy make the same promise.
- The support and failure path is documented for the approved outcome.

## Relevant files, workflows, or data areas

- `src/components/billing/BillingPanel.tsx`
- `src/lib/plan-entitlements.ts`
- `src/components/billing/PlanGate.tsx`
- `src/pages/Integrations.tsx` and `src/pages/Settings.tsx`
- `supabase/functions/discord-*`, `supabase/migrations/20260726171000_quarantine_discord_preview.sql`
- `scripts/billing-invitations-contract.test.mjs`

## Risks

- **Permissions / Supabase RLS:** Discord installation and channel configuration must remain tenant- and role-scoped.
- **Billing / entitlement:** UI, database, webhook, and server enforcement can diverge.
- **Email / customer communication:** Paid-plan claims may become inaccurate.
- **Production / data:** Accidentally enabling an incomplete Discord path could affect customer workspaces.

## Required validation

- Relevant contract tests, lint, typecheck, and production build.
- Authenticated owner/admin checks for gates and integration controls.
- Hosted verification of the approved Elite workflow and its unavailable/failure state.

## Role handoffs

| Role | State | Handoff |
| --- | --- | --- |
| Project Manager | Involved | Keep the Elite promise limited to the approved Discord scheduling outcome; reject speculative feature additions until separately scoped. |
| Feature Developer | Assigned | Audit and complete the existing installation, channel-selection, reminder, and dispatch path without enabling production delivery. |
| QA & Release Auditor | Pending | Verify tenant/role isolation, OAuth-state handling, channel subscription controls, event deduplication, delivery failure states, and hosted evidence before release. |
| Technical Reporting Analyst | Consulted | Define only safe operational delivery/reliability evidence; do not treat a queued reminder as customer receipt. |
| Lead Marketer & Growth | Consulted | Prepare no public claim until QA confirms a complete customer/support path; collect additional Elite feature ideas separately. |

## Release audit

### Acceptance-criteria traceability

| Criterion | Evidence required | Status |
| --- | --- | --- |
| One concrete Elite outcome | Founder decision and coherent gated customer copy | Defined; implementation outstanding |
| Tenant-safe Discord workflow | Contract, role, OAuth-state, channel and dispatch review | Outstanding |
| Support and failure path | Authenticated browser plus hosted success/failure evidence | Outstanding |
| Honest paid-plan promise | Billing/gate/integration copy and entitlement reconciliation | Outstanding |

### Final verdict

**READY FOR DEVELOPMENT** — Theo selected Discord schedule-change and practice-reminder delivery as Elite's immediate outcome. The existing source is preview/quarantined and has no end-to-end hosted evidence, so it must not be marketed or presented as generally available.

### Exact outstanding checks

- Audit current Discord deployment/configuration inventory and identify every missing customer-support-path step.
- Implement and validate the bounded workflow without enabling production delivery.
- Obtain Theo's separate approval for any external-provider activation, secret/configuration change, production deployment, marketing claim, or release.

### Theo approval record

| Decision | Required | Status | Record |
| --- | --- | --- | --- |
| Implement bounded Discord workflow | Yes | Approved | 2026-07-29 — Theo retained Discord as Elite's differentiator and approved work on the integration. |
| External-provider activation/configuration | Yes | Pending | Discord credentials, OAuth configuration, or production activation remain unapproved. |
| Production release or customer claim | Yes | Pending | Requires hosted end-to-end verification and Theo's explicit release approval. |

## Decision and approval record

- 2026-07-28 - Proposed from founder review; no implementation approval recorded.
- 2026-07-29 - Theo confirmed Discord remains the Elite differentiator during soft launch and approved work to complete the Discord integration. Broader Elite features remain discovery-only until separately defined and approved.

## Implementation and review evidence

- Existing source contains an intentionally quarantined/preview Discord installation, channel, scheduled-reminder, and dispatch path. Current workspace and billing copy still label Discord as planned or released later; no end-to-end hosted workflow is evidenced.
- **Highest evidence achieved:** Implemented source / proposed customer workflow. It is not browser, hosted, or production verified.

## Developer implementation update - 2026-07-29

- **Outcome:** Completed the local, bounded implementation for Elite Discord schedule prompts without enabling the provider. The customer-facing state remains unavailable until the complete support and delivery path is hosted-verified.
- **Server-side controls:** `discord-install`, `discord-channels`, and `discord-config` require an authenticated workspace owner/admin and current Elite tier. The OAuth callback rechecks Elite after state claim, preventing a pending installation from completing after downgrade. Configuration accepts only `schedule_created`, `schedule_changed`, `schedule_cancelled`, and `practice_reminder`, and requires at least one selected event. The reminder scheduler and dispatcher recheck current Elite status; dispatcher cancels any event outside this approved scope rather than relaying it.
- **Function authentication contract:** Browser manager Functions retain JWT verification. The callback/service workers are deliberately configured with `verify_jwt = false` because Discord callbacks and secret-authenticated workers do not carry user JWTs; their own OAuth-state or dispatch-secret checks remain mandatory. This source/configuration change is local only and has not been deployed.
- **Customer copy:** Billing, Integrations, and the Discord preview now promise only selected schedule prompts when available. Availability reminders and Collector-readiness prompts were removed. The UI says `Unavailable until delivery is verified` rather than implying active access.
- **Support path:** `docs/operations/DISCORD_DELIVERY_SUPPORT.md` documents unavailable, connected, retrying, failed, and disconnected states, and prohibits recording Discord tokens in support notes.
- **Validation:** Discord contract tests 3/3; billing contracts 7/7; full suite 175/175; TypeScript passed; ESLint passed with zero warnings; production build and bundle budget passed. Local Playwright ran 33 desktop/tablet/mobile public/auth tests successfully; 15 authenticated-role tests were skipped because no local test session exists. The only non-failing output was the existing stale Browserslist-data warning.

## Exact QA handoff

1. Before any hosted test, confirm whether staging uses an isolated Supabase project and configure no Discord provider secret unless Theo separately approves it.
2. With isolated Elite owner/admin, Free/Pro owner/admin, and Elite member/viewer accounts, verify `discord-install`, `discord-channels`, and `discord-config` allow only Elite owner/admin and return denial for every other role/tier.
3. With approved provider test credentials only, verify one-time OAuth state expiry/replay rejection; selected text/announcement channel listing; each of the four supported events; idempotent queueing; dispatch retry/backoff and final failure; reconnect/disconnect; and downgrade behaviour after an installation exists.
4. Verify delivered messages contain only the bounded schedule fields and authenticated ScrimStats links—never scouting, review, player, credential, or authorisation content. Record provider response, event ID, tenant, role, and Function version without retaining tokens.
5. Keep the customer UI and public messaging unavailable until this evidence, support ownership, provider configuration approval, and separate release approval are recorded.

## Remaining release blockers

- No hosted Discord OAuth callback, channel list, queue, dispatch, retry, or tenant/role result has been verified.
- Discord OAuth credentials, bot token, dispatch secret, callback URL, worker schedule, Function deployment, and any customer delivery remain unapproved and inactive.
- The existing data model's `integration_events` outbox is shared; QA must confirm that cancelling events outside this Discord scope cannot affect any separately introduced provider before any production activation.

## QA release audit - 2026-07-29

### 1. Release verdict: HOLD

The production-side quarantine is working and the customer UI is honestly unavailable, but the proposed activation workflow has a server-side authorization defect and has no hosted authenticated or provider evidence. It is not ready to be enabled, marketed, or sold as an available Elite capability.

### 2. What was verified

- **Hosted quarantine:** In Supabase project `tvcgjehreaayfazlhvps`, active `discord-install`, `discord-channels`, `discord-schedule-reminders`, and `discord-dispatch` are each version 4 and return the managed-pilot `capability_preview` 410 response. `discord-config` is not deployed. Only migration `20260726170315_quarantine_discord_preview` is recorded. This means no current hosted endpoint can install, configure, queue, or deliver Discord content.
- **Honest browser/source copy:** The Elite integration preview is labelled `Unavailable`; Billing promises only `Discord schedule prompts when available`; Integrations retains the Elite feature lock. This meets the current no-false-availability requirement.
- **Local implementation and test:** The local Functions limit configured event types to schedule created/changed/cancelled and practice reminders, and the local support document covers unavailable, connected, retrying, failed, and disconnected states. `node --test scripts/discord-elite-contract.test.mjs` passed 3/3 on 2026-07-29.
- **Database exposure baseline:** The Discord installation, channel-subscription, and OAuth-state tables have RLS enabled. They have no general browser-facing policy; the local Functions use the server client, so authenticated runtime checks remain the authorization boundary to prove after deployment.

### 3. Blocking issues

- **Callback does not recheck the initiator's current workspace-manager role.** `discord-install` POST correctly establishes owner/admin membership before issuing state, but the GET OAuth callback consumes that state and writes `discord_installations` after checking only `subscription_tier === 'elite'`. If the initiator loses owner/admin membership during the ten-minute state window, their callback can still mutate the tenant's installation. This violates the project rule that every tenant mutation enforce current membership and required role below the browser. Return to Developer: before any deployment, recheck `managerMembership(oauthState.user_id, oauthState.tenant_id)` immediately before the callback writes/activates the installation; add a negative contract test for role removal after state issuance.
- **No hosted workflow exists.** Current deployed 410 preview functions are not the local implementation. OAuth, configuration, reminder queueing, dispatch, retries, disconnect, downgrade, and support diagnostics are all unproved in the target environment.

### 4. Important risks

- `discord-config` is local-only while the other deployed preview endpoint configurations still require JWT. Any activation deployment must deploy the complete, matched Function set and preserve the intentional no-JWT callback/worker controls only where their state/secret verification is present.
- The shared `integration_events` outbox and cancellation behaviour have not been exercised alongside another provider. A dispatcher scope error could affect unrelated future integration events.

### 5. Unverified but required checks

- Isolated Elite owner/admin allow and Elite member/viewer plus Free/Pro manager denial for install, channel list, and configuration.
- OAuth state expiry, replay, tenant/role removal after start, failed token exchange, and downgrade before callback completion.
- Approved provider-test credentials: selected text/announcement channel filtering; each permitted event; deduplication; retry/backoff/final failure; disconnect/reconnect; message minimisation; and no private scouting/review/player/credential/authorisation content.
- Worker secret verification, deployment configuration, target-project isolation, operational support ownership, and the shared-outbox regression.

### 6. Suggested fixes or next validation steps

1. Developer fixes the callback current-role recheck and adds the regression test; return a precise staging deployment handoff.
2. Theo explicitly approves isolated Discord test credentials/configuration and confirms whether staging is isolated from production before any provider activation.
3. QA then runs the exact authenticated and provider matrix above. Only after it passes may Theo consider enabling the capability or approving an Elite customer claim.

## Developer remediation - 2026-07-29

### Approved correction completed locally

- **OAuth role revalidation:** after claiming the one-time OAuth state and immediately before any Discord installation write, `discord-install` now checks `managerMembership(oauthState.user_id, oauthState.tenant_id)` as well as the current Elite tier. A manager removed during the ten-minute OAuth window is redirected as unavailable and cannot mutate the tenant installation.
- **Provider-scoped outbox:** `20260729162640_discord_provider_scoped_outbox.sql` adds the non-null `integration_events.provider` discriminator (defaulting legacy Discord schedule events to `discord`) and a service-role-only `claim_integration_events_for_provider(text, integer)` RPC. `discord-dispatch` calls that RPC with `discord`; it can no longer claim or cancel events belonging to another provider. The reminder worker explicitly writes `provider: "discord"`.
- **Regression coverage:** `scripts/discord-elite-contract.test.mjs` now asserts the callback's current-role recheck, explicit reminder provider, provider-specific claim RPC, row lock, and service-role-only grant.

### Validation evidence

- `node --test scripts/discord-elite-contract.test.mjs`: **4/4 passed** (2026-07-29).
- TypeScript: **passed** (`tsc --noEmit`).
- ESLint: **passed with zero warnings**.
- Full local test suite: **176/176 passed**.
- Production build and bundle budget: **passed**. The only non-failing output was the pre-existing stale Browserslist-data warning.
- `git diff --check`: **passed**.
- The repository's local `node_modules` has no Supabase CLI binary, so `supabase migration new --help` could not run. The migration source was created with the next chronological repository timestamp instead; no database validation or hosted application occurred.

### Exact QA handoff (post-remediation)

1. Review `20260729162640_discord_provider_scoped_outbox.sql`, particularly the legacy-event default and service-role-only RPC grant.
2. After a separately approved isolated staging migration and complete matched Function deployment, repeat the QA role-removal case: start OAuth as Elite owner/admin, remove that role before callback completion, and confirm no `discord_installations` mutation occurs.
3. Seed or introduce a non-Discord provider event in the shared outbox and invoke the Discord dispatcher; verify it remains unclaimed and unchanged while a Discord event is processed.
4. Continue the pre-existing authenticated tier/role, OAuth replay/expiry, channel, retry, failure, disconnect, downgrade, and message-minimisation matrix. Do not enable customer-facing availability or marketing until the entire hosted evidence set passes.

## Hosted staging implementation update - 2026-07-29

Theo approved applying this change to the Supabase project that backs staging, acknowledging that it is the production database. No provider credentials, OAuth configuration, customer message, billing change, or customer-facing availability change was made.

### Applied and deployed evidence

- **Migration:** `discord_provider_scoped_outbox` is recorded remotely as `20260729162640` (the managed migration API assigned this timestamp). The local source was renamed to `20260729162640_discord_provider_scoped_outbox.sql` to match and avoid migration-history drift.
- **Schema / authorization check:** `integration_events.provider` is non-null with default `discord`; the provider-scoped claim definition includes `event.provider = p_provider`; `anon` and `authenticated` cannot execute it, while `service_role` can.
- **Functions deployed and active:** `discord-install` v5 (`verify_jwt: true`), `discord-channels` v5 (`true`), `discord-config` v1 (`true`), `discord-schedule-reminders` v5 (`false` with dispatch-secret verification), and `discord-dispatch` v5 (`false` with dispatch-secret verification).
- **Disconnect repair:** before deployment, the local `discord-config` disconnect action was corrected to write the valid persisted status `revoked` and to stop updating a non-existent subscription timestamp column. The updated focused contract suite passed 4/4 and `git diff --check` passed.
- **Advisor review:** the hosted security advisor retains pre-existing informational `rls_enabled_no_policy` findings, including server-only Discord OAuth state. No new function-execution exposure was identified by the migration privilege check.

### Exact QA handoff after deployment

1. Use only an isolated Elite owner/admin test workspace. Confirm Free/Pro and Elite non-manager calls to install, channels, and config are denied; confirm an Elite owner/admin can call the authenticated controls once test provider configuration is separately approved.
2. Start OAuth as an Elite owner/admin, remove that user's owner/admin role before callback completion, and verify the callback redirects unavailable without creating or changing `discord_installations`.
3. Insert or arrange a non-Discord provider event alongside a Discord event in the shared outbox; invoke the secret-authenticated dispatcher and prove only the Discord event is claimed or changed.
4. With separately approved test provider credentials, exercise OAuth expiry/replay, channel filtering, all four supported event types, deduplication, retry/backoff/final failure, disconnect/reconnect, downgrade after installation, and message minimisation. Record no tokens.
5. Keep the browser state and public copy unavailable until this hosted workflow evidence, support ownership, and a separate release decision are recorded.

## QA re-audit - 2026-07-29

### 1. Release verdict: HOLD

The hosted remediation is present, and the customer-facing preview remains honest, but this is not releasable as an Elite capability. A direct server-side release-state bypass remains, and the complete provider workflow is intentionally untested and unapproved.

### 2. What was verified

- **Hosted deployment:** Production-backed staging records migration `20260729162640_discord_provider_scoped_outbox`. Active Functions are `discord-install` v5, `discord-channels` v5, `discord-config` v1, `discord-schedule-reminders` v5, and `discord-dispatch` v5. The manager endpoints require JWT; the worker endpoints have JWT verification disabled only with their in-function dispatch-secret checks.
- **Hosted authorization remediation:** Deployed `discord-install` rechecks both current Elite tier and `managerMembership(oauthState.user_id, oauthState.tenant_id)` after the one-time OAuth state is claimed and before it writes `discord_installations`. The previous callback role-removal defect is fixed in the deployed source.
- **Hosted data boundary:** RLS is enabled on Discord installations, OAuth states, and channel subscriptions. Manager-only authenticated SELECT policies exist for installations/subscriptions; OAuth state remains server-only. The provider-claim RPC is not executable by `anon` or `authenticated`, and is executable by `service_role` only.
- **Honest customer state:** `tenant_feature_access` has Discord only in `planned` release state. Integrations requires `modules.discord.state === "live"` before rendering controls, otherwise it displays `Unavailable until delivery is verified`. Billing says only `Discord schedule prompts when available`. The targeted local Discord contract suite passed 4/4.

### 3. Blocking issues

- **Server release-state bypass:** None of `discord-install`, `discord-channels`, `discord-config`, `discord-schedule-reminders`, or `discord-dispatch` checks `tenant_feature_access.release_state`/`is_enabled`. They rely only on Elite tier, manager role (where applicable), installation state, and provider secrets. Therefore, once Discord credentials are configured, an Elite manager can directly invoke `discord-install` while the module remains `planned` and the browser says unavailable. This breaks the agreed gate/copy/module-state contract and makes the planned state presentation-only. Return to Developer: add a shared server-side `discordEntitled` helper requiring Elite plus a live/enabled Discord module, use it in every user, scheduler, and dispatcher path, and add direct-invocation regression coverage for planned/disabled state.
- **No complete hosted customer/support path:** No approved Discord provider credentials, OAuth callback configuration, bot permissions, worker schedule, authenticating test workspace, or end-to-end message delivery evidence exists. The capability must remain unavailable and must not be marketed, sold, or enabled.

### 4. Important risks

- Two tenant module records are `planned` but `is_enabled = true`. Integrations currently remains unavailable because it checks `planned`, but this makes the missing server-side release-state check more consequential and should be reconciled as part of the fix.
- The provider-scoped outbox migration is deployed and its privilege boundary is correct, but no non-Discord event has been placed beside a Discord event and exercised through the hosted dispatcher. Cross-provider isolation is still source/configuration evidence only.

### 5. Unverified but required checks

- Direct Free/Pro and Elite member/viewer denial; Elite owner/admin allowance; OAuth expiry/replay; manager removal after start; downgrade; channel filtering; supported-event queueing/deduplication; retry/backoff/final failure; reconnect/disconnect; and message minimisation.
- Provider callback, bot/channel permission, dispatch-secret, worker schedule, support ownership, and delivery diagnostics in the actual target environment.

### 6. Suggested fixes or next validation steps

1. Developer implements and tests server-side module release-state enforcement before provider configuration is considered.
2. Theo approves dedicated Discord test credentials, callback URL, bot permissions, worker schedule, and the narrow production-backed test-workspace scope; no customer workspace or public Discord server should be used.
3. QA runs the full authenticated/provider matrix, including a non-Discord outbox regression. Only then can Theo approve changing Discord from `planned` to `live`, enabling customer delivery, or making an Elite availability claim.

## Developer release-state correction - 2026-07-29

### Approved local implementation

- Added shared server-side `discordEntitled(tenantId)` in `supabase/functions/_shared/collector.ts`. It returns true only when the tenant is Elite **and** its `tenant_feature_access` record is `module_key = 'discord'`, `release_state = 'live'`, and `is_enabled = true`.
- Applied that single entitlement decision in `discord-install` (start and OAuth completion), `discord-channels`, `discord-config`, `discord-schedule-reminders`, and `discord-dispatch`.
- Planned or disabled Discord is now denied below the browser. For workers, a previously queued Discord event is cancelled as unavailable rather than delivered when the module is no longer released/enabled.
- Extended `scripts/discord-elite-contract.test.mjs` to require the shared guard in every path and assert its Elite/live/enabled predicates.

### Validation evidence

- Focused Discord contract suite: **4/4 passed**.
- Full local suite: **176/176 passed**.
- TypeScript and ESLint: **passed**.
- Production build and bundle budget: **passed**. The only non-failing output was the existing stale Browserslist-data warning.
- `git diff --check`: **passed**.

### Deployment and QA handoff

This correction is local only. No migration is needed; no Function was redeployed; no provider credential, callback, worker schedule, billing setting, customer message, or module data was changed.

1. After Theo separately approves deployment, deploy the five matched Discord Functions together so all entry points use the same guard.
2. In the production-backed staging project, directly invoke each Function as an Elite owner/admin while Discord is `planned`, then while it is `live` but disabled. Confirm the user paths deny and the workers do not queue/deliver.
3. Only after those release-state tests pass should QA continue with the existing role, OAuth, outbox-isolation, and approved provider-credential matrix. Do not set Discord live/enabled for customer workspaces or change public copy without a separate release decision.
