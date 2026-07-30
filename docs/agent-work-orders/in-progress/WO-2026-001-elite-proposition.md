# WO-2026-001 - Define and deliver a credible Elite proposition

- **Status:** Ready for QA
- **Assigned owner:** Core Features Developer
- **Size:** L
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing and QA scenario

- **Area / files likely affected:** Discord Edge Functions, `BillingPanel`, `plan-entitlements`, Integrations, Settings, Discord migrations and billing contract tests.
- **Dependencies:** Theo's bounded Discord implementation approval is recorded. WO-2026-009 is Done. Provider activation/configuration and release approval remain separate.
- **Collision risk:** Do not concurrently change Discord integrations, plan gates, billing copy, or Settings/Integrations entitlement states in either developer lane.
- **QA scenario / test steps:** (1) Use two isolated tenant owners, one Elite and one non-Elite, with a safe Discord test server. (2) Configure only approved schedule-change/reminder channels as Elite. (3) Trigger one schedule change and reminder, then simulate a delivery/configuration failure. (4) Verify tenant/role denial, no private review/scouting data in payloads, idempotency, honest unavailable/failure states, and hosted evidence.

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
| Core Features Developer | Assigned | Correct server-side Discord release-state enforcement and direct-invocation regression coverage without enabling provider delivery. |
| QA & Release Auditor | Pending | Re-audit the direct planned/disabled denial after the developer handoff, then retain the full hosted/provider matrix for a later approved test. |
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
- 2026-07-29 - Sequenced behind WO-2026-009 to avoid concurrent changes to shared plan, billing, Settings, and Integrations surfaces.

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

## Return to development - 2026-07-30

Theo returned this work order to development after the QA finding below. The Core Features Developer must:

1. Add one shared server-side Discord entitlement helper that requires the caller's workspace to be both Elite and explicitly live/enabled for the Discord module.
2. Use that helper in `discord-install`, `discord-channels`, `discord-config`, `discord-schedule-reminders`, and `discord-dispatch`; direct invocation must not bypass the planned/disabled customer state.
3. Add focused regression coverage proving planned and disabled module states deny each user, scheduler, and dispatcher path, while the existing authorised Elite-manager path remains available only when the module is live/enabled.
4. Preserve existing tenant/manager checks, OAuth role revalidation, provider-scoped outbox behaviour, and no-JWT callback/worker secret checks. Do not configure provider credentials, alter OAuth configuration, deploy, enable customer delivery, or change customer claims.

The developer handoff must include changed files, targeted test output, typecheck, zero-warning lint, production build, and reproducible QA steps. It returns to QA only after that evidence is recorded.
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

## Hosted release-state deployment - 2026-07-30

Theo approved the production-backed staging Function deployment. No migration, credential, OAuth configuration, worker schedule, module-state data, billing change, customer message, or customer-facing availability change was made.

- **Deployed revisions:** `discord-install` v6, `discord-channels` v6, `discord-config` v2, `discord-schedule-reminders` v6, and `discord-dispatch` v6.
- **Hosted source check:** all five active deployed Functions contain the shared `discordEntitled` guard. Browser-manager Functions retain `verify_jwt: true`; reminder and dispatch workers retain `verify_jwt: false` with their in-function dispatch-secret check.
- **Validation:** focused Discord contract suite passed 4/4 before deployment. The deployment API initially rejected the two worker uploads because their newly imported shared file was omitted from the bundle; no worker revision was created. Both were immediately redeployed with the same reviewed shared dependency and are now active at v6.
- **QA status:** Ready for QA, not release-ready. The customer UI remains unavailable while Discord is planned. QA must first prove direct planned/disabled module denial in the deployed environment, then run the pre-existing tenant/role, OAuth, provider, outbox-isolation, retry, and message-minimisation matrix.

## Independent QA deployment review - 2026-07-30

### 1. Release verdict: HOLD

The release-state remediation is now deployed and the Discord capability remains honestly unavailable. That is sufficient to protect the planned state by design, but not to release, sell, or enable Discord schedule prompts as an Elite capability.

### 2. What was verified

- **Hosted Functions:** Direct hosted-source retrieval confirms `discord-install` v6, `discord-channels` v6, `discord-config` v2, `discord-schedule-reminders` v6, and `discord-dispatch` v6 all contain `discordEntitled`. `discord-install` v6 also contains the current manager-role recheck immediately before the OAuth installation write. The user endpoints retain JWT verification; the two worker endpoints retain their in-function dispatch-secret check.
- **Hosted database boundary:** Migration `20260729162640` is applied; `integration_events.provider` exists; all three Discord tables have RLS enabled; and `claim_integration_events_for_provider(text, integer)` is executable by `service_role` only, not `anon` or `authenticated`.
- **Release-state control:** All 108 current Discord feature records remain `planned` (106 disabled and 2 enabled). Because the guard requires Elite plus `release_state = 'live'` plus `is_enabled = true`, the two planned-but-enabled records remain denied below the browser rather than relying on the UI lock.
- **Local regression coverage:** `node --test scripts/discord-elite-contract.test.mjs` passed 4/4, covering the shared entitlement guard, callback manager recheck, supported event scope, provider-specific claim path, and worker configuration.

### 3. Blocking issues

- **No authenticated behavioural proof:** QA has not invoked the deployed functions as an Elite owner/admin with Discord planned, or as Free/Pro and Elite member/viewer roles. The deployed source is strong configuration evidence but does not prove live request authentication, tenant isolation, or response behaviour.
- **No complete customer/support path:** Discord test credentials, OAuth callback configuration, bot/channel permissions, worker scheduling, and a safe test Discord server remain unapproved and untested. No capability may be labelled available, marketed, sold as active, or enabled for a customer workspace.

### 4. Important risks

- Provider-scoped outbox isolation is structurally deployed but has not been exercised with a non-Discord event beside a Discord event. Runtime proof is still required before provider activation.
- Browser availability, error, and responsive states were not rechecked: the available browser connector could not initialise because its required runtime file is absent. This is an evidence gap, not a product failure.

### 5. Unverified but required checks

- Direct deployed planned and live-disabled denial for every user and worker path; Free/Pro and Elite non-manager denial; Elite owner/admin allow only after approved test-provider configuration.
- OAuth expiry, replay, role removal, token-exchange failure, downgrade, channel filtering, all four allowed event types, deduplication, retry/failure, disconnect/reconnect, and message minimisation.
- Shared-outbox non-Discord regression, dispatch-secret handling, support ownership, and hosted browser unavailable/error/responsive states.

### 6. Suggested next validation steps

1. Theo approves a narrow non-customer test scope: isolated Elite owner/admin plus non-Elite and non-manager accounts, and direct planned/live-disabled endpoint checks. No provider credential is required for the denial matrix.
2. Separately approve Discord test credentials, callback URL, bot permissions, worker schedule, and a safe test server before OAuth/delivery testing. Keep all customer modules `planned` until the full hosted matrix passes.
3. Restore the browser QA connector or provide a signed-in staging browser session, then QA will verify unavailable/loading/error/responsive presentation without claiming provider activation.

## QA test-entitlement setup - 2026-07-30

- Theo explicitly approved a manual, non-Stripe Elite test entitlement for one identified non-customer workspace in the shared production-backed Supabase project.
- QA set the workspace to `elite` / `active`, cleared its prior cancellation lifecycle fields, and set its Discord module to `live` and enabled. Read-back verification confirmed those exact values.
- This is a reversible QA entitlement only. It does not create a Stripe subscription, payment, customer claim, provider credential, OAuth configuration, worker schedule, or Discord delivery approval. Restore Free/planned/disabled after the agreed test matrix unless Theo records a different decision.

## QA browser-session attempt - 2026-07-30

- Theo reported an Elite staging session was signed in. The QA browser binding had no claimable user tab and a new staging `/integrations` tab remained at `Opening workspace…`; it did not inherit an authenticated workspace session. No Discord endpoint was invoked, no module state changed, and no provider/OAuth action was attempted.
- This is an evidence-transport limitation only. It does not alter the existing deployed-function, RLS, or release-state verification, and it does not satisfy the outstanding authenticated behavioural matrix.

## QA recheck - 2026-07-29 (release-state correction)

### 1. Release verdict: HOLD

The reported release-state fix passes local review, but it is not deployed. The active production-backed staging Functions remain the earlier v5/v1 set and still lack the shared guard; therefore the previously recorded server-side bypass remains live.

### 2. What was verified

- **Local implementation:** `discordEntitled(tenantId)` requires Elite tier plus `tenant_feature_access` Discord `release_state = 'live'` and `is_enabled = true`. All five paths import/use it: installation start and callback, channel list, configuration, reminder scheduler, and dispatcher.
- **Local contract evidence:** `node --test scripts/discord-elite-contract.test.mjs` passed 4/4, including released-state predicates and coverage of all entry points.
- **Hosted comparison:** Active `discord-install` v5 and `discord-dispatch` v5 still use only Elite-tier checks. Their deployed shared helper contains no `discordEntitled` function. No deployment record is present for the correction.

### 3. Blocking issues

- **Not deployed:** The direct server-side bypass is still present in the target project. A local passing test does not protect the hosted Function revision.
- **No provider workflow evidence:** OAuth, channel selection, queueing, dispatch, retry/failure, disconnect, downgrade, and content minimisation remain unverified and provider activation is still unapproved.

### 4. Important risks

- The current database contains planned Discord module records, including enabled ones. Until the matched deployment lands, an Elite manager can bypass the unavailable UI through the hosted Function once credentials exist.

### 5. Unverified but required checks

- After deployment, test planned and live-disabled denial for every user and worker path before any module is set live/enabled.
- Then complete the existing authenticated role, OAuth, cross-provider outbox, and approved provider-test matrix.

### 6. Suggested fixes or next validation steps

1. Theo approves deployment of the five matched Discord Function revisions only; do not add Discord credentials, callback configuration, worker schedules, or change module data in this deployment.
2. Developer deploys and records the new revisions; QA verifies the deployed source/version and exercises planned/live-disabled denial with a non-customer test workspace.
3. Retain HOLD until the provider activation and complete customer/support-path checks are separately approved and passed.

## QA authenticated staging recheck - 2026-07-30

### Result: Pass with follow-up (safe unavailable state only)

- **Authenticated scope:** Staging `/integrations` was reviewed as the `OnceUponATeam` Elite workspace owner. No integration action, OAuth action, credential change, data mutation, or endpoint invocation was performed.
- **Customer-safe presentation:** The Discord section states **`Discord delivery`** and **`Unavailable`**, explains that installation and channel controls remain unavailable until the complete delivery path is verified, and exposes no Discord install or channel-control action. This matches the current approved non-release state.
- **Responsive/error check:** At a 390 x 844 viewport, the unavailable text and non-interactive Discord state remain present and readable. The staged browser console contained no warnings or errors during this read-only review.
- **Follow-up / UX ambiguity:** The surrounding Discord assistant card also carries a generic **`Available`** badge while its actual delivery state is **`Unavailable`**. It did not expose access or controls in this check, so this is not a release bypass; however, it should be reconciled before customer-facing Discord positioning to avoid a misleading availability signal.
- **Release effect:** This closes the prior browser-state evidence gap only. It does not prove direct deployed denial for the planned/live-disabled matrix, role/tenant isolation, or any OAuth/provider/delivery path. The overall verdict remains **HOLD**.

## Proposed completion plan - 2026-07-30 (pending Theo approval)

### Finding

The current delivery path is an outbound Discord bot integration implemented through Supabase Edge Functions; it does not require a separate always-on bot process. It is incomplete because the customer UI is deliberately a non-interactive preview, no Discord provider credentials or worker schedule are configured, and the release manifest still labels the Discord Functions as retired while the QA handoff records deployed v6/v2 revisions. The manifest/deployment conflict must be reconciled before any release decision.

### Required delivery sequence

1. **PM / Core Features Developer:** Re-open this high-risk work order for Core Features Developer work. Reconcile the Edge Function manifest with the actual intended active functions; implement the real owner/admin integration controls (status, begin install, callback result, selected channel/event configuration, disconnect, loading, empty, and failure states). Do not add private data or a second Discord workspace.
2. **Developer / secure configuration:** Keep all provider values server-side. Configure `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, and a generated `DISCORD_DISPATCH_SECRET` only in the target Supabase secret/Vault path; configure the reminder and dispatch jobs using the existing Vault-backed `pg_cron`/`pg_net` pattern. Do not place any value in `VITE_*`, source, migration text, work-order evidence, or chat.
3. **The staging test boundary:** Use a newly created, organisation-owned Discord test application and a private test Discord server with a non-customer Elite workspace. This staging site shares the production database, so no customer guild, customer workspace, or production Discord credential may be used for testing.
4. **QA evidence:** First exercise direct denial for planned/live-disabled and Free/Pro/non-manager roles. Then, only on the approved test tenant/server, prove install, channel selection, a schedule change, a cancellation, one reminder, delivery failure/retry, disconnect, downgrade, outbox-provider isolation, and no private content or mentions in messages.
5. **Release:** After all hosted evidence passes, correct the contradictory availability badge/copy, publish support/recovery guidance, enable only the approved test tenant for a monitored soft launch, and obtain Theo's separate release approval before any customer module is changed to live/enabled or any Elite availability claim is published.

### Approval still required

- Theo must approve creation/configuration of the external Discord application, Supabase secret/Vault changes, cron scheduling, the non-customer test server/workspace scope, and any subsequent production/customer activation. This document is a plan only; none of those actions has been performed.

## Provider-test preparation handoff - 2026-07-30

- **Theo-completed external setup:** An organisation-owned final `ScrimStats` Discord application now has the Supabase `discord-install` callback registered. Its bot is public; OAuth2 Code Grant and all privileged Gateway Intents are disabled. Theo also created a private non-customer Discord test server/channel and has an account with server-management access.
- **QA test entitlement:** The non-customer `clash` workspace is temporarily `elite` / `active` by Theo's explicit approval. This is a non-Stripe override only: it has no Stripe customer/subscription, and its Discord module release state was not changed.
- **Developer handoff:** Build and deploy the actual owner/admin integration controls and worker scheduling before any invitation or credential activation. The current `DiscordScheduleIntegration` remains intentionally non-interactive even for a live Elite module. Reconcile `docs/launch/EDGE_FUNCTION_MANIFEST.md` with the intended active Discord Functions. Use server-side secret/Vault configuration only; never request or record credential values in a work order or chat.
- **Next QA gate:** After the developer records deployed revision, secret/cron configuration evidence without values, and reproducible test steps, QA will approve a test-tenant-only module `live`/enabled change, perform the full hosted matrix, and require an explicit Theo production/customer release decision.

## Developer implementation update - 2026-07-30 (owner controls and test-worker preparation)

- **Changed areas:** `src/hooks/useDiscordIntegration.ts`, `src/components/integrations/DiscordScheduleIntegration.tsx`, `src/pages/Integrations.tsx`, `docs/launch/EDGE_FUNCTION_MANIFEST.md`, `scripts/discord-elite-contract.test.mjs`, and `supabase/migrations/20260730173144_discord_test_worker_schedule.sql`.
- **Owner/admin controls:** The live/enabled Elite UI now reads status through `discord-config`, begins OAuth through `discord-install`, loads server-filtered channels through `discord-channels`, saves only the four approved schedule prompt types through `discord-config`, and disconnects through the same server-enforced Function. No direct browser table/RPC mutation or provider credential exposure was added.
- **Customer safety:** The controls remain unreachable unless the existing browser gate permits an Elite owner/admin with a live/enabled Discord module; all Function paths independently enforce the same entitlement. The generic module badge now uses the actual enabled state, avoiding an `Available` signal for disabled modules.
- **Worker preparation:** The new migration creates an operator-only, `SECURITY DEFINER` schedule helper with an empty search path. It reads only existing Vault values at invocation, refuses to run without `discord_dispatch_secret`, and has no execute grant to `public`, `anon`, or `authenticated`. The migration does not create secrets or schedule any jobs when applied.
- **Manifest:** Discord Functions are recorded as test-only delivery Functions rather than retired tombstones, matching the deployed-function inventory while preserving the no-customer-release boundary.
- **Local validation:** focused Discord contracts 6/6; TypeScript passed; ESLint passed with zero warnings; full suite 185/185; production build and bundle budget passed; `git diff --check` passed. The build emitted the pre-existing stale Browserslist-data warning only.

### Exact QA handoff (post-owner-controls implementation)

1. After Theo separately approves deployment, confirm the deployed frontend revision includes the owner/admin controls and that all five Discord Functions remain on the reviewed guarded revisions. Keep every customer Discord module planned/disabled.
2. Before any provider configuration, verify planned and live-disabled direct Function denial for Free/Pro owners, Elite members/viewers, and Elite owners/admins. Verify the UI never exposes controls in these states.
3. After Theo separately approves the isolated test-only secret/Vault configuration, worker scheduling, and test-tenant module state, run `select public.configure_discord_test_worker_schedule()` only as an approved operator. Record job names and schedule state without recording any secret values.
4. On the approved non-customer Elite test workspace/server, perform install, callback state expiry/replay/role-removal, channel filtering, selected-event configuration, schedule create/change/cancel, reminder, retry/failure, disconnect, downgrade, provider-outbox isolation, and message-minimisation checks.
5. Confirm desktop and mobile control states, loading/error/empty states, and no Discord token, guild credential, review, scouting, player, or authorization information appears in browser-visible payloads or messages.

**Remaining release gate:** No migration application, Function/frontend deployment, secret/Vault configuration, cron job, OAuth action, Discord message, module-state mutation, or provider verification was performed by this implementation update.

## Hosted migration update - 2026-07-30

- **Applied migration:** `20260730173144_discord_test_worker_schedule` is present in the hosted Supabase migration history. The local migration filename was aligned to that recorded version.
- **Hosted verification:** `public.configure_discord_test_worker_schedule()` exists as `SECURITY DEFINER` with an empty search path; execution is denied to `anon` and `authenticated` and retained for `service_role`. No Discord reminder or dispatch cron job exists after migration application (`0`).
- **Security review:** The Supabase security advisor reported no new warning for this helper. Pre-existing project-wide advisor findings remain outside this work order; none were changed or suppressed.
- **Boundary preserved:** The migration added no Vault values, did not invoke the helper, schedule a job, send a Discord message, change OAuth configuration, or change any tenant feature state.

## Test-tenant release-state verification - 2026-07-30

- **Theo-approved data change:** Only the non-customer `clash` workspace Discord module was changed from `planned` to `live`; `is_enabled` remained `true`. No customer workspace was changed.
- **Hosted browser evidence:** Signed in as the `clash` owner on `https://staging.scrimstats.gg/integrations`, the integration panel progressed from its loading state to exactly one visible `Connect Discord` control. This confirms the deployed owner/admin control path is reachable for the approved Elite test tenant.
- **Responsive evidence:** At a 390px mobile viewport, the `Connect Discord` control remained visible and fully within the viewport (left `76.7px`, right `242.7px`, viewport width `390px`).
- **Boundary preserved:** The button was not pressed. No OAuth request, provider credential, secret/Vault change, cron invocation, Discord message, or tenant other than `clash` was affected.

## Test-worker configuration check - 2026-07-30

- **Theo approval recorded:** Theo approved isolated secret/Vault configuration and worker scheduling for the non-customer `clash` test path.
- **Read-only prerequisite check:** Vault contains `project_url` and `publishable_key`; `discord_dispatch_secret` is not present.
- **Safe stop:** This session does not have a Supabase Edge Function secret-management capability. Creating only a Vault value would leave the two worker Functions without the matching `DISCORD_DISPATCH_SECRET` and cause unauthorized scheduled calls. The schedule helper was therefore not invoked.
- **No side effects:** No credential was generated or exposed; no Vault or Edge Function secret changed; no cron job, OAuth action, or Discord message was created.

## Test-worker scheduling - 2026-07-30

- **Prerequisite evidence:** After Theo configured the server-side secret pair, the Vault name `discord_dispatch_secret` was confirmed present without reading its value.
- **Approved scheduler invocation:** `public.configure_discord_test_worker_schedule()` completed successfully.
- **Hosted schedule evidence:** Active job `scrimstats-discord-dispatch` runs every minute (`* * * * *`, job `5`) and active job `scrimstats-discord-reminders` runs every 15 minutes (`*/15 * * * *`, job `4`). Stored command text was deliberately not queried because it can contain the dispatch credential.
- **Boundary preserved:** No OAuth installation, channel configuration, test event, Discord message, or customer-tenant module change was performed. Edge Function secret equality and first worker HTTP result remain for the controlled provider QA.

## OAuth callback QA finding - 2026-07-30

- **Reproduction:** Theo completed the approved Discord test-server authorization flow for the `clash` workspace. The redirect reached the hosted `discord-install` callback but returned `UNAUTHORIZED_NO_AUTH_HEADER`; no installation was created and the one-time state remains unconsumed.
- **Cause:** Hosted `discord-install` has platform `verify_jwt = true`. Discord cannot supply a Supabase user JWT on the provider callback, so the platform rejects the GET before the Function can validate its one-time OAuth state.
- **Required correction:** Set only `[functions.discord-install] verify_jwt = false` and deploy the reviewed Function. The existing Function continues to require a valid user via `authenticatedUser()` for POST install starts; GET callbacks remain protected by the state hash, expiry, single-use claim, renewed entitlement, and renewed manager-role checks.
- **Release boundary:** This requires Theo approval for the Function configuration/deployment correction. Do not retry the existing callback; its provider code is one-time use.

## OAuth callback correction and hosted deployment - 2026-07-30

- **Theo approval:** Theo explicitly approved the narrow callback configuration correction and `discord-install` deployment.
- **Change:** `[functions.discord-install] verify_jwt` is now `false` in `supabase/config.toml`. The corresponding contract test now asserts the callback-safe configuration.
- **Why this remains protected:** Supabase's platform JWT gate is disabled only so Discord's unauthenticated provider redirect can reach the handler. The POST install-start path still authenticates the user and checks manager membership plus Elite/live/enabled entitlement. The GET callback still requires a hashed, unexpired, single-use state and repeats the entitlement and manager-role checks before creating an installation.
- **Hosted deployment evidence:** `discord-install` deployed successfully to project `tvcgjehreaayfazlhvps` as active version `8`, with hosted `verify_jwt=false`. The hosted revision was read back after deployment.
- **Local validation:** `node --test scripts/discord-elite-contract.test.mjs` passed 6/6; `tsc --noEmit` passed; `git diff --check` passed (line-ending notices only).
- **Fresh-provider test required:** The earlier Discord authorization code must not be replayed. Start a new install from the `clash` test workspace, then have Theo confirm the final Discord server-add action for the private test server. Verify the resulting installation via the authenticated status endpoint before sending or scheduling any message.

## OAuth provider-install verification and redirect finding - 2026-07-30

- **Provider result:** Theo completed a fresh, approved authorization for the private test server. The hosted database now contains one `active` Discord installation for the non-customer `clash` workspace, associated with the test guild `ScrimStats Integration Test`. No channel subscription, configuration, test event, or Discord message was created.
- **Callback evidence:** Hosted `discord-install` version `8` received the new install-start POST with `200`, then the Discord callback GET with `500`. The state was successfully claimed and the installation was persisted before the failure, so this is not a failed provider authorization.
- **Remaining defect:** `appRedirect()` constructs a relative redirect whenever `SCRIMSTATS_APP_URL` is unset. `Response.redirect()` requires an absolute URL, producing the generic `Internal Server Error` after a successful installation. The application did not return the user to the integrations screen.
- **Required decision before correction:** Configure an appropriate server-side app URL for this environment, or implement a state-bound return URL so one shared Supabase project can safely return users to the originating approved app host. The latter is safer for staging/production coexistence but requires a schema migration, Function revision, and separate Theo approval. Do not set a staging-only URL as a permanent shared-backend default without that decision.

## State-bound OAuth return correction - 2026-07-30

- **Theo approval:** Theo explicitly approved the state-bound callback correction, hosted migration, and `discord-install` deployment.
- **Changed files:** `supabase/migrations/20260730181840_discord_oauth_return_url.sql`, `supabase/functions/discord-install/index.ts`, and `scripts/discord-elite-contract.test.mjs`.
- **Security design:** New OAuth states store an allowlisted originating app origin (`scrimstats.gg`, `www`, staging, or approved localhost) in the already service-role-only `discord_oauth_states` table. The callback uses that persisted value, never an untrusted callback parameter. Unknown request origins fall back to the production app origin. Existing user authentication, one-time state hashing/expiry/claim, renewed entitlement, and manager-role checks are unchanged.
- **Hosted database evidence:** Migration `20260730181840_discord_oauth_return_url` is in hosted history. `discord_oauth_states.return_url` is non-null with a production-origin default and a database allowlist constraint.
- **Hosted Function evidence:** `discord-install` version `9` is active with `verify_jwt=false`; it includes the state-bound redirect revision.
- **Browser verification:** The authenticated `clash` owner now sees `Discord delivery — Connected`, the private test server name, `Disconnect`, and the bounded channel/prompt controls on staging. No channel was loaded, no subscription was saved, and no Discord message was sent.
- **Validation:** Discord contract tests 6/6, ESLint zero warnings, TypeScript, production Vite build, and `git diff --check` passed. The build emitted only the pre-existing stale Browserslist-data notice. A full `npm` validation was unavailable because the system npm shim is broken; an attempted alternate package-manager invocation moved package folders into `node_modules/.ignored` before failing network access. All moved folders were restored locally without deletion before the successful direct-tool validation.
- **Advisor review:** No new issue was introduced by this additive, service-role-only column. The advisor continues to report pre-existing project-wide RLS-without-policy informational findings (including this intentionally service-role-only state table) and unrelated `SECURITY DEFINER`/Auth warnings; none were suppressed or changed.

### Exact QA handoff (post-return correction)

1. From the authenticated non-customer `clash` Elite owner workspace on staging, begin a new Discord install and complete the private-server provider authorization. Confirm the callback returns to `https://staging.scrimstats.gg/integrations?discord=connected` rather than an error page.
2. Confirm the installation remains active via `discord-config` status and that the staging screen shows `Connected` plus the expected test server name.
3. Test an expired/replayed state and an unsupported Origin without changing any customer tenant. Confirm neither permits installation and both use a safe absolute redirect.
4. Retain the existing provider QA boundary: do not load channels, save prompt subscriptions, create a schedule event, or send a Discord message unless those specific actions are separately approved.

## Approved slash-command scheduling extension - 2026-07-30

- **Theo approval:** Theo approved this WO extension and confirmed that Discord-originated scheduling must use a slash command, not native Discord Scheduled Events.
- **Outcome / users:** An explicitly delegated Discord staff member can create a ScrimStats practice block with `/scrim`. Coaches and managers who work in ScrimStats receive the same canonical block; configured Discord channels receive the existing selected create/change/cancel notices from that canonical record.
- **Size / risk / owner:** M / High / Core Features Developer. The public Discord interaction endpoint is an external-provider and authorization boundary.
- **Authorisation policy:** A workspace owner/admin must configure one or more permitted Discord roles for the installed guild. The interaction must have a valid Discord Ed25519 signature, target the installed guild, and include one of those roles. Browser state, user-editable metadata, and arbitrary guild users are never trusted.
- **Duplicate and conflict policy:** Persist a provider interaction receipt for idempotency; the same interaction can create at most one block. Reject an overlapping active practice block and return a clear ephemeral response rather than silently creating a duplicate. ScrimStats remains the canonical schedule; the existing provider-scoped outbox controls outbound notices.
- **Likely affected areas:** a secure `discord-interactions` Edge Function; server-side Discord role discovery/configuration; interaction receipt and role-access tables/functions/RLS; canonical schedule creation path; Discord integration settings UI; Edge Function manifest; contract tests and QA runbook.
- **Acceptance criteria:** signed PING validation; signed `/scrim` only creates a block for an enabled Elite/live Discord workspace and authorised configured role; invalid signature, wrong guild, missing role, replay, overlap, Free/Pro, disabled/revoked, and non-manager configuration paths deny safely; a successful block reaches the canonical ScrimStats calendar and queues only the opted-in outbound notice; no duplicate block or provider delivery is produced for a single interaction.
- **QA scenario:** Use the isolated `clash` workspace/private test server. Configure one permitted test role, invoke a valid `/scrim`, verify one canonical block and one queued outbound event, replay it, exercise an overlap and unauthorised role, then verify configured create/change/cancel delivery without customer data or customer guilds.
- **Required provider handoff:** After deployment, Theo must set the Discord application's Interactions Endpoint URL to the deployed Function and set the server-only `DISCORD_PUBLIC_KEY` value from Discord Developer Portal. The endpoint must verify the signature and return PONG before Discord accepts it. Command registration and the first provider command invocation remain separate, approved external actions.

## Independent QA re-audit - 2026-07-30

### 1. Release verdict: HOLD

The isolated test path is now materially further forward: the guarded Functions, test-only scheduler, OAuth callback, return routing, and one non-customer installation are hosted. It is not ready for customer release or an Elite availability claim because no selected channel, delivery event, message, failure/retry, role-denial, or outbox-isolation behaviour has been independently exercised.

### 2. What was verified

- **Hosted revisions and migrations:** `discord-install` is active at v9 with platform JWT verification disabled for the provider callback; the other current Discord Function paths retain their reviewed guarded configuration. Migrations `20260730173144_discord_test_worker_schedule` and `20260730181840_discord_oauth_return_url` are present in hosted history.
- **Hosted security boundary:** `configure_discord_test_worker_schedule()` is `SECURITY DEFINER` with an empty search path; `anon` and `authenticated` cannot execute it, while `service_role` can. The approved test worker jobs are active: dispatch every minute and reminders every 15 minutes.
- **Test-tenant state:** Only the non-customer `clash` workspace is Elite, Discord `live`/enabled, and has an active Discord installation. It has **zero** enabled channel subscriptions and **zero** Discord outbox events, so this review caused no message delivery.
- **Source and local regression:** The owner/admin UI uses Functions rather than direct database mutation. The focused Discord contract suite passed 6/6 in this review. Billing retains the qualified copy, `Discord schedule prompts when available`, and the release manifest now correctly identifies Discord as test-only rather than retired.
- **Support path exists:** `docs/operations/DISCORD_DELIVERY_SUPPORT.md` defines unavailable, connected, retrying, failed, and disconnected support states without asking support staff to handle Discord tokens.

### 3. Blocking issues

- **No end-to-end delivery proof:** QA has not approved or performed loading the test channels, saving a subscription, generating a schedule/reminder event, dispatching a message, or proving provider receipt. The current installation alone is not a completed customer workflow.
- **No authenticated negative-path proof:** The latest provider configuration has not been exercised for Free/Pro, Elite member/viewer, planned, live-disabled, OAuth expiry/replay, post-start role removal, downgrade, or cross-tenant behaviour.

### 4. Important risks

- **State-contract mismatch:** The UI renders `Connected` whenever an installation exists, but the support runbook defines `Connected` as an installation with one or more selected channel subscriptions. The current `clash` test tenant has an active installation and zero subscriptions, reproducing this mismatch. Return to Developer: distinguish `Server connected — delivery not configured` from `Delivery active`, update the support copy/contract test, and retest loading/empty/error states.
- **Current browser evidence unavailable to this re-audit:** No claimable authenticated staging browser tab was available. Prior handoff browser evidence is retained, but this re-audit did not independently repeat it.

### 5. Unverified but required checks

- Approved test-server channel listing, selection save, all four allowed event types, exactly one successful message, no private data or mentions, deduplication, retry/backoff/final failure, disconnect, and downgrade cancellation.
- Direct Function denial for all non-entitled/non-manager/module-state combinations; provider-scoped outbox isolation with a non-Discord event; worker HTTP results and dispatch-secret rejection.
- Desktop/mobile loading, empty, error, connected-but-unconfigured, and active-delivery presentation after the status wording correction.

### 6. Suggested next validation steps

1. Developer resolves the connected-versus-configured status mismatch and supplies a deployed revision plus focused regression evidence.
2. Theo explicitly approves one bounded test: load the private test-server channels, select only `#scrimstats-test`, subscribe to one schedule event, create one disposable test schedule change, and allow one dispatch. QA will then verify the message and immediately remove the subscription/test event.
3. Approve a separate controlled failure/retry exercise and role/module denial matrix. Keep every customer Discord module planned/disabled until both matrices pass and Theo makes a customer-release decision.

## Independent QA scope recheck - 2026-07-30 (slash-command extension)

### 1. Release verdict: HOLD

The new `/scrim` requirement expands WO-001 from outbound notifications to a public, signed Discord-to-ScrimStats mutation path. It is specified but not implemented or deployed. The existing outbound test path also retains its previously recorded delivery and negative-path evidence gaps.

### 2. What was verified

- The work order contains a bounded authorization, idempotency, conflict, and tenant-entitlement contract for `/scrim`.
- Hosted Edge Function inventory has no `discord-interactions` Function. Repository search found no corresponding handler, interaction-receipt table/migration, Discord-role access data model, or command-configuration UI.
- The existing Discord UI still renders `Connected` from installation presence alone; the previously recorded connected-versus-configured mismatch is not corrected.

### 3. Blocking issues

- **Slash-command workflow unimplemented:** No signed PING, Ed25519 verification, Discord public-key secret, role mapping, replay receipt, canonical schedule creation, overlap protection, command registration, or provider endpoint exists. The new accepted scope cannot be released, tested as a complete workflow, or claimed available.
- **Outbound delivery remains unproven:** The isolated installation has no subscribed channel or queued event, so no actual delivery/failure/retry proof exists.

### 4. Important risks

- **Dispatch-board drift:** The board still says Discord hosting/configuration is gated even though the work order records hosted v9, active test jobs, and a test installation. It also does not describe the new high-risk slash-command work. PM should refresh the dispatch note before assigning further work.
- **Status wording unresolved:** Do not use `Connected` as proof that delivery is active until a selected subscription exists.

### 5. Unverified but required checks

- All existing outbound test, role, module-state, retry, and cross-provider checks remain required.
- After implementation: valid/invalid Discord signatures, PING, wrong guild, unauthorised role, replay, overlap, Free/Pro, revoked/disabled module, canonical record creation, and exactly-once outbound queueing.

### 6. Suggested next validation steps

1. PM keeps WO-001 with Core Features Developer and updates the assignment board to show the slash-command scope and the outstanding connected-state correction.
2. Developer implements the bounded interaction path with migrations, RLS/grants, contract coverage, and a complete hosted handoff; no external endpoint or key is configured yet.
3. Theo then separately approves setting `DISCORD_PUBLIC_KEY`, the Discord Interactions Endpoint URL, command registration, and one private-server command invocation. QA will review the PING/signature boundary before allowing a test `/scrim` mutation.

## Scope partition and final developer handoff - 2026-07-30

WO-001 remains the bounded outbound Discord delivery proposition. The separate inbound `/scrim` slash-command feature is now [WO-2026-025](../proposed/WO-2026-025-discord-slash-command-scheduling.md) and must not receive implementation work under this order.

The approved worker-schedule and OAuth-return migrations are already hosted, and the guarded owner/admin controls, test worker jobs, state-bound callback, and isolated installation are evidenced above. They are not a current developer blocker.

The only remaining development item in WO-001 is to correct the status contract identified by QA: show **`Server connected — delivery not configured`** when an installation exists with zero enabled channel subscriptions, and show **`Delivery active`** only once at least one selected subscription exists. Update the relevant support copy and focused contract coverage, preserving all existing tenant, entitlement, and provider controls. Do not add slash-command code, migrations, provider configuration, delivery events, or customer-facing availability changes in this work order.

After this focused change, record its local validation and return WO-001 to QA for the previously approved isolated outbound delivery matrix. Do not continue expanding this work order.

## Connected-versus-configured status correction - 2026-07-30

- **Scope completed:** Only the QA-returned status contract was changed; no `/scrim` work, migration, provider configuration, delivery event, or customer-module change was made.
- **Presentation:** An installed server with zero enabled subscriptions now shows `Server connected` and explains that delivery is not configured. `Delivery active` appears only once at least one enabled subscription exists. `Setup required` remains the uninstalled state.
- **Support contract:** The support runbook now names the three distinct states: setup required/unavailable, server connected but delivery not configured, and delivery active.
- **Focused regression coverage:** The Discord contract test asserts the subscription-derived state, both customer-visible labels, and the matching support language.
- **Validation evidence:** `node --test scripts/discord-elite-contract.test.mjs` passed 6/6 and `git diff --check` passed. TypeScript and ESLint could not be rerun because their local package entrypoints are missing from `node_modules`; this is an environment dependency fault, not a passing result.
- **QA handoff:** On staging with `clash` (active installation, zero subscriptions), confirm `Server connected` and the delivery-not-configured explanation at desktop and 390px mobile. Then, only under the already-approved isolated outbound matrix, save one enabled subscription and confirm the label transitions to `Delivery active`; do not send a message unless separately approved.

## Independent QA recheck - 2026-07-30 (status correction)

### 1. Release verdict: HOLD

The status-contract correction passes source and focused local contract review, but no staging deployment/revision or authenticated browser result is recorded. The underlying outbound provider workflow remains intentionally unexercised. This is **Pass with follow-up** for the local correction, not a release pass.

### 2. What was verified

- `DiscordScheduleIntegration` now derives `deliveryConfigured` from enabled subscription count and displays `Setup required`, `Server connected`, or `Delivery active` accordingly.
- The installed-but-unconfigured explanatory copy is present, and `DISCORD_DELIVERY_SUPPORT.md` now defines the same three distinct states.
- `node --test scripts/discord-elite-contract.test.mjs` passed **6/6** independently in this review; the test explicitly covers both labels and the subscription-derived state. `git diff --check` reported no content errors (line-ending notices only).
- The slash-command expansion is correctly partitioned into WO-2026-025; it is not treated as implemented under WO-001.

### 3. Blocking issues

- **Hosted correction unverified:** The developer handoff records no staging frontend deployment or authenticated browser proof for the new labels. Local source cannot establish what the `clash` owner currently sees.
- **No delivery proof:** No channel subscription, test schedule event, dispatch, Discord message, failure/retry, or provider receipt has been approved or exercised.

### 4. Important risks

- TypeScript and ESLint were not rerun because local package entrypoints are missing. The focused Node contract test passes, but full local validation is incomplete.

### 5. Unverified but required checks

- Staging desktop and 390px view: `clash` with zero subscriptions must show `Server connected` plus the no-delivery explanation; after one enabled subscription it must show `Delivery active`.
- Existing owner/admin, Free/Pro, member/viewer, planned/disabled, OAuth replay/expiry, cross-tenant, worker, outbox-isolation, retry/failure, disconnect, downgrade, and message-minimisation matrix.

### 6. Suggested next validation steps

1. Developer deploys the focused UI/support correction to staging and records the deployment revision; restore TypeScript/ESLint dependencies and provide their results.
2. Theo approves the exact bounded test mutation: load only the private test-server channels, select `#scrimstats-test`, enable exactly one schedule event, and save. QA will verify the `Delivery active` transition; no message will be sent in that step.
3. Obtain separate approval before creating one disposable schedule event and allowing the worker to dispatch one message, then immediately remove the subscription/event and return `clash` to Free when the matrix completes.

## Independent QA recheck - 2026-07-30 (deployed-status handoff)

### 1. Release verdict: HOLD

The status correction is now claimed deployed and the local source is coherent, but independent hosted/browser proof could not be obtained in this session. More importantly, the isolated test workspace has no delivery subscription or Discord event. The correction is a **Pass with follow-up**; WO-001 is not release-ready.

### 2. What was verified

- **Current test state:** `clash` remains Elite with Discord live/enabled and an active test-server installation; it has **zero** enabled channel subscriptions and **zero** Discord outbox events. This review created no external effect.
- **Source/contract:** The current component derives its three statuses from the installation and enabled-subscription state. The matching support guidance is present. Focused Discord contracts passed **6/6**; independent ESLint and TypeScript checks passed with zero reported failures.
- **Scope boundary:** WO-2026-025 now owns the unimplemented inbound slash-command work, so it is no longer incorrectly treated as an outstanding WO-001 implementation item.

### 3. Blocking issues

- **No customer outcome proof:** No selected channel, saved subscription, scheduled change/reminder, queued event, dispatched message, provider receipt, retry/failure, or disconnect/downgrade behaviour has been tested.
- **Hosted visual check not independently reproduced:** The connected Vercel account exposes no projects for deployment inspection, and no authenticated staging browser tab was available to this review. The developer's branch/browser record is useful handoff evidence but is not independent proof.

### 4. Important risks

- The production build could not be conclusively recorded in this review: its sandboxed run was denied filesystem access; the approved retry began successfully but did not return a final completion result. Treat the developer's claimed build as unverified pending a reproducible completed result.

### 5. Unverified but required checks

- Authenticated staging desktop/mobile confirmation of the zero-subscription state.
- The existing full entitlement/role/module/OAuth/provider/worker/outbox/failure matrix, including actual message minimisation and receipt.

### 6. Suggested next validation steps

1. Provide an authenticated `clash` staging session or accessible staging deployment record so QA can independently confirm the zero-subscription state at desktop and 390px.
2. Theo approves the already-defined subscription-only mutation before QA loads channels and selects one test prompt; retain the separate approval for any message dispatch.
3. Do not mark WO-001 Done or make an Elite availability claim until the provider delivery and negative-path matrix passes.

## Independent QA recheck - 2026-07-30 (configured delivery)

### 1. Release verdict: HOLD

The deployed status correction now passes authenticated staging review, but the configured outbound path is failing before it can claim or deliver events. This is a reproducible hosted defect, not an absence-of-error pass.

### 2. What was verified

- **Authenticated staging:** As `fridayxiiiempire@gmail.com`, owner of the isolated `clash` Elite workspace, `/integrations` displayed the private `ScrimStats Integration Test` server, four enabled prompt types, and the exact **`Delivery active`** label. Desktop and 390px mobile layouts were readable; the browser recorded no console errors or warnings.
- **Hosted configuration state:** The database contained four enabled subscriptions (created, changed, cancelled, and reminder) for the test installation. Two approved test outbox records were pending: `schedule_created` and `practice_reminder`.
- **Scheduler reachability:** The dispatch and reminder cron jobs ran successfully every minute/15 minutes respectively. `pg_net` responses prove the dispatcher endpoint was invoked rather than merely scheduled.
- **Regression evidence:** Independent ESLint and TypeScript checks passed; `scripts/discord-elite-contract.test.mjs` passed 6/6. The separate `/scrim` scope remains correctly assigned to WO-2026-025.

### 3. Blocking issues

- **Hosted outbound delivery is not configured:** Repeated dispatcher invocations returned HTTP **503** with `Discord delivery is not configured` (for example 19:13 through 19:22 UTC). The two test events remain unclaimed/pending with no delivery attempt or provider receipt. The `discord-dispatch` function returns that response when one or more of `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DISCORD_BOT_TOKEN`, or `SCRIMSTATS_APP_URL` is unavailable in its hosted environment. The exact missing variable cannot be determined safely from the response.

### 4. Important risks

- The UI truthfully says **Delivery active** because subscriptions are configured, but a customer would reasonably interpret that as messages are deliverable. Until the hosted worker configuration is repaired, the state is operationally misleading and events will accumulate.
- Existing queued test events may be delivered once the configuration is corrected. Do not make the configuration change until Theo decides whether those two isolated test messages may be sent, or whether the queue should instead be safely cancelled under separate approval.

### 5. Unverified but required checks

- After configuration is repaired: confirm the worker claims both existing approved test events, records delivery attempts, and receives Discord provider message IDs; then verify the message content is minimised, has no mentions, and links only to the isolated test workspace.
- Execute the previously required negative path: one provider rejection/retry, disconnect, entitlement downgrade/module disable, Free/Pro and non-manager denials, and tenant/outbox isolation. Confirm the `Delivery active` label changes appropriately when the last subscription is removed.

### 6. Suggested fixes or next validation steps

1. **Theo approval required:** approve the secret/configuration change and state whether the two queued isolated test events may dispatch after repair. Do not expose any value in code, chat, or `VITE_*` variables.
2. **Core Features Developer:** in the Supabase project, compare the deployed `discord-dispatch` environment against its required server-side variables and set the missing value(s), especially the intended canonical `SCRIMSTATS_APP_URL`; retain the existing bot token and dispatch secret securely. Record only variable *names* and the deployment revision, never values.
3. **QA:** once the developer supplies that handoff, rerun the isolated worker trace and provider-receipt test. WO-001 remains `Ready for QA`/`HOLD`; it must not be marked Done or made customer-available yet.

## Independent QA re-review - 2026-07-30 (hosted delivery)

### 1. Release verdict: HOLD

WO-001 remains on HOLD. The visible staging configuration is healthy, but the hosted delivery worker is still unable to process its queued isolated test events.

### 2. What was verified

- Authenticated staging `/integrations` as the `clash` owner shows `DELIVERY ACTIVE`, the private test server, four selected prompt types, and the customer-facing statement that delivery is tracked separately. No console errors were observed.
- The two existing isolated Discord events (`schedule_created` and `practice_reminder`) remain `pending`, with `attempt_count = 0`, no delivery timestamp, and no provider attempt record.
- Fresh worker evidence at 19:34 UTC shows the scheduled dispatcher endpoint was invoked and returned HTTP 503 with `Discord delivery is not configured`. The failure remains reproducible, not historical.

### 3. Blocking issues

- **Outbound Discord delivery remains unconfigured in the deployed Edge Function.** Since the function rejects before claiming the outbox, neither a real message nor its retry/receipt behaviour can be verified. UI configuration alone is not release evidence.

### 4. Important risks

- The UI does not falsely claim a provider receipt, but retaining `Delivery active` while all worker calls return 503 can still mislead an Elite customer about operational availability.

### 5. Unverified but required checks

- A successful isolated worker run: outbox claim, Discord API receipt/message ID, delivered status, payload minimisation, and no mentions.
- One controlled failure/retry plus disconnect, downgrade/module-disable, Free/Pro, non-manager, and cross-tenant/outbox isolation checks.

### 6. Suggested fixes or next validation steps

1. **Theo:** approve the configuration repair and decide whether the two queued isolated test messages may dispatch once it is live, or must be cancelled under a separate data-change approval.
2. **Core Features Developer:** reconcile the deployed `discord-dispatch` server-side environment against its required variables, including the canonical application URL; record names/revision only and never secret values.
3. **QA:** rerun this trace immediately after the developer handoff. Do not mark WO-001 Done, or enable/publish Elite Discord availability, before the required provider and negative-path evidence exists.

## Independent QA re-review - 2026-07-30 (delivery recovered)

### 1. Release verdict: CONDITIONAL

The hosted configuration blocker is resolved and the isolated outbound happy path is now independently proven. WO-001 is not yet READY because required failure, denial, and tenant-isolation validation remains unverified.

### 2. What was verified

- **Authenticated staging UI:** `/integrations` as the `clash` owner still shows the private test server, four enabled schedule prompt types, `DELIVERY ACTIVE`, and the disclosure that message delivery is tracked separately. The browser had no console errors.
- **Worker recovery:** At 19:38 UTC the scheduled dispatcher returned `processed: 2, delivered: 2`; its next run returned `processed: 0, delivered: 0`. The preceding 503 configuration failure therefore no longer prevents execution.
- **End-to-end receipt evidence:** The queued `schedule_created` and `practice_reminder` events are both now `delivered`, have no delivery error, and each has a distinct persisted Discord provider message reference. This proves worker claim, dispatch, and provider acceptance for the isolated test tenant.

### 3. Blocking issues

- None currently reproduced for the narrowly tested isolated happy path.

### 4. Important risks

- A successful message receipt is not proof of safe behaviour when delivery fails, an installation is disconnected, entitlement is downgraded/disabled, or a caller lacks the required workspace role.

### 5. Unverified but required checks

- Controlled Discord rejection and retry/backoff outcome.
- Disconnect behaviour, Elite-to-non-Elite/module-disabled revocation, Free/Pro and non-manager direct-function denials.
- Cross-tenant channel/outbox isolation and payload minimisation/absence of mentions, confirmed against the delivered test messages.

### 6. Suggested fixes or next validation steps

1. Keep WO-001 `Ready for QA` with a **Conditional** release recommendation; do not make it generally customer-available yet.
2. Theo approves one bounded negative-path session on the isolated test tenant (failure/retry, disconnect, then restore) so QA can complete the remaining release checks without involving customer data.
3. After those checks pass, obtain Theo's separate release approval before changing any customer module state or public Elite claim.

## Independent QA failure - 2026-07-30 (delivered-message presentation)

### 1. Release verdict: HOLD

The isolated delivery transport works, but the actual customer-visible messages fail the required quality and clarity bar. This returns WO-001 to Core Features Developer; it is not a release candidate.

### 2. What was verified

- Discord accepted and displayed the two isolated test messages. The supplied customer-view screenshot is consistent with the persisted delivery receipts.
- The active deployed `discord-dispatch` function (version 9) directly constructs the message from raw `match_date` and `scheduled_time` strings. It also contains the literal mojibaked separator `Â·`.
- The message link is `https://staging.scrimstats.gg/scrims/<id>` and Discord renders its unfurl as **`Overview - Vercel`** with Vercel artwork, not ScrimStats branding.

### 3. Blocking issues

- **Unreadable scheduling content:** Messages display duplicate raw ISO timestamps and the visible `Â·` encoding error, e.g. `2026-07-30T19:30:00+00:00 at 2026-07-30T19:30:00+00:00`. This is not an acceptable end-user practice prompt.
- **Incorrect third-party link preview:** Discord presents a Vercel-branded preview for a ScrimStats workflow link. This violates the promised polished ScrimStats customer journey and makes the destination look untrusted.

### 4. Important risks

- A public Discord unfurl must not reveal private opponent, schedule, roster, review, or tenant data to a recipient who is not authenticated to the workspace. A branded generic preview is sufficient; do not solve this by placing private scrim data in Open Graph metadata.

### 5. Unverified but required checks

- A newly generated isolated test message, after the correction, has one human-readable and recipient-localised schedule time, no encoding artefacts, and no duplicate date/time.
- A fresh Discord unfurl of the staging scrim route shows a ScrimStats title and image (not Vercel). Existing Discord preview caches may require a fresh disposable test URL/message for proof.
- Existing delivery, retry, disconnect, entitlement, role, and tenant-isolation checks remain required.

### 6. Required developer handoff

1. **Format time in the dispatcher:** derive one value from the valid scheduled timestamp; use a Discord timestamp token such as `<t:UNIX:F>` so each recipient sees it in their locale. If parsing fails, show an honest `Time to be confirmed` state. Do not concatenate `match_date` and `scheduled_time`, and remove the mojibaked character.
2. **Repair the unfurl at the deployment boundary:** ensure the exact staging scrim URL fetched by Discord returns ScrimStats Open Graph title, image, and canonical metadata; the generic preview must reveal no tenant-owned data. Do not merely suppress the card or rely on an existing Discord cache.
3. Add focused formatter and hosted preview contract coverage, deploy to staging, and record a fresh isolated message plus Discord preview screenshot. No customer tenant may be used.

## Independent QA re-review - 2026-07-30 (formatter recovery and embed decision)

### 1. Release verdict: HOLD

The timestamp/encoding correction is now deployed and a new isolated event was delivered successfully. WO-001 remains on HOLD only for the incorrect Vercel unfurl and the already-outstanding negative-path matrix.

### 2. What was verified

- Deployed `discord-dispatch` is now version 10. It uses one parsed scheduled instant, emits a recipient-localised Discord timestamp token, removes the malformed separator, and uses `Time to be confirmed` for invalid input.
- A fresh isolated `schedule_created` event was created at 20:17 UTC and delivered at 20:18 UTC with a persisted Discord provider receipt. This corroborates that the new deployed formatter, rather than only local source, was used for a real delivery.
- The reported Vercel embed remains a valid defect. The added `?source=discord` parameter is not a reliable remedy; Discord continues to show the Vercel preview.

### 3. Blocking issues

- **Incorrect public preview remains:** the Discord card still presents Vercel branding for a ScrimStats workspace link.

### 4. QA recommendation

For this private operational message, suppress the Discord link embed rather than introducing a public, dynamic scrim preview. The message already identifies ScrimStats via the bot identity and link text; suppressing embeds is deterministic, avoids Vercel branding, and prevents a crawler-facing page from ever exposing tenant-owned context.

### 5. Required developer handoff

1. Add Discord's documented suppress-embeds message flag to outbound schedule messages while preserving the visible authenticated workspace link and `allowed_mentions: { parse: [] }`.
2. Add a focused contract test that asserts the flag is present and one hosted isolated delivery screenshot proving no preview card is rendered.
3. Do not replace the card with dynamic Open Graph content in this work order. Any future public preview/SEO work requires a separate privacy review and work order.

### 6. Remaining release checks

- After the suppressed-preview proof: controlled provider rejection/retry, disconnect, entitlement downgrade/module-disable, Free/Pro and non-manager denials, and cross-tenant/outbox isolation.
- Theo retains final release approval before any customer workspace availability change or public Elite claim.

## Status-correction deployment and QA handoff - 2026-07-30

- **Approved scope preserved:** Only the connected-versus-configured UI/status correction, matching support copy, and a focused regression test were released. No `/scrim` implementation, migration, Discord credential/configuration, subscription mutation, dispatch, customer communication, or module-state change was made.
- **Staging revision:** Commit `95f294b` (`Clarify Discord delivery status`) was pushed to `origin/codex/Staging`, the existing staging deployment branch.
- **Local validation:** After `npm ci` restored the local dependency tree, ESLint passed with zero warnings, TypeScript passed, `node --test scripts/discord-elite-contract.test.mjs` passed 6/6, `node --test scripts/discord-status-contract.test.mjs` passed 1/1, the production Vite build passed, bundle budgets passed, and `git diff --check` found no content errors. The shell's bare `npm` shim still targets a missing global npm path; checks were run through the repaired Node/npm runtime instead.
- **Hosted browser evidence:** On authenticated `https://staging.scrimstats.gg/integrations` as the `clash` owner, the installed `ScrimStats Integration Test` server with zero subscriptions displayed the exact badge `Server connected — delivery not configured` and the explanatory copy. At a 390px viewport, the single badge was visible and fully within the viewport (left 61.1px, right 343.3px of 390px).
- **QA handoff:** Recheck the same `clash` workspace at desktop and 390px. It must show `Server connected — delivery not configured` while no subscription is enabled. Do not create a subscription, send a Discord message, or exercise `/scrim` under this handoff. The separate, already-recorded outbound delivery matrix and all authorization/provider checks remain release gates.

## Dispatcher environment compatibility repair - 2026-07-30

- **Theo approval:** Theo approved repair of the isolated `discord-dispatch` hosted configuration path and allowed the two already-queued isolated test events to dispatch after repair.
- **Cause addressed:** The dispatcher and shared server client previously accepted only the legacy `SUPABASE_SERVICE_ROLE_KEY`. They now preserve that value when present and otherwise accept the platform-provided `SUPABASE_SECRET_KEYS.default` server key. The public HTTP response remains generic; missing variable names are logged only server-side without values.
- **Hosted deployment:** `discord-dispatch` version **8** is active in Supabase project `tvcgjehreaayfazlhvps`, with its existing `verify_jwt=false` custom dispatch-secret protection unchanged. Source revision `724a9d4` (`Harden Discord dispatch environment lookup`) was pushed to `origin/codex/Staging`.
- **Validation:** `node --test scripts/discord-dispatch-env-contract.test.mjs scripts/discord-elite-contract.test.mjs` passed 7/7; ESLint and TypeScript passed; `git diff --check` reported no content errors.
- **Hosted result so far:** The two isolated events remain pending with attempt count zero. The first post-deploy `pg_net` response timed out without a body; no provider delivery attempt or Discord message is evidenced. No secret values were read or changed.
- **QA handoff:** Wait for and capture the first completed `discord-dispatch` v8 invocation. Verify either (a) both isolated events become delivered with two `integration_delivery_attempts` records and provider references, or (b) the safe server-side missing-variable diagnostic identifies the remaining configuration name for an approved secret-only correction. Do not mark WO-001 Done until delivery, minimised message content, and the agreed negative-path matrix are independently verified.

## Hosted isolated delivery evidence - 2026-07-30

- **Configuration outcome:** After Theo set the server-only `SCRIMSTATS_APP_URL` for staging, the existing worker path processed the two explicitly approved isolated events. No secret value was read or recorded.
- **Delivered evidence:** At 19:38 UTC, one `schedule_created` event and one `practice_reminder` event both transitioned to `delivered`, each with attempt count zero and a delivery timestamp. `integration_delivery_attempts` contains exactly two `delivered` records for Discord; both have provider references and neither is null.
- **Boundary preserved:** This verifies only the approved private test-server events. It does not establish customer availability, message-content review, failure/retry, disconnect, entitlement/role denial, tenant isolation, or slash-command behaviour.
- **QA handoff:** Independently inspect the two test-server messages for minimal content, no mentions, and isolated ScrimStats links. Then execute the separately approved negative-path matrix before considering WO-001 for completion. Keep `/scrim` with WO-2026-025.

## Delivered-message presentation correction - 2026-07-30

- **Approved scope:** Theo approved the focused customer-visible Discord presentation correction and its staging deployment. The inbound `/scrim` work remains exclusively with WO-2026-025.
- **Changed area:** `discord-dispatch` now selects one valid schedule timestamp (`scheduled_time`, otherwise `match_date`) and emits Discord's recipient-local `<t:UNIX:F>` format. An unparsable or absent value truthfully renders **`Time to be confirmed`**. The prior duplicated raw ISO values and mojibaked separator were removed.
- **Unfurl boundary:** New outbound scrim links include the disposable `?source=discord` query to avoid the prior Discord cache key. The exact staging scrim route was browser-inspected before deployment: its document title, canonical URL, Open Graph title, and Open Graph image are the generic ScrimStats values only; no tenant, opponent, roster, or schedule fields are in the crawler metadata.
- **Hosted deployment:** Supabase project `tvcgjehreaayfazlhvps` now has active `discord-dispatch` version **10**, retaining the existing custom dispatch-secret authentication (`verify_jwt=false`). The retrieved hosted source contains both the Discord timestamp formatter and cache-fresh query parameter.
- **Local validation:** `node --test scripts/discord-message-presentation-contract.test.mjs scripts/discord-dispatch-env-contract.test.mjs scripts/discord-elite-contract.test.mjs scripts/public-layout-contract.test.mjs` passed **17/17**; ESLint passed with zero warnings; TypeScript passed; production Vite build and bundle budget passed; and `git diff --check` passed after the final newline correction.
- **Intentionally not performed:** No new outbox event, schedule record, or Discord message was created. Those are an external/provider-facing staging mutation and require Theo's separate approval for one fresh disposable test event.
- **QA handoff:** After Theo approves one fresh, isolated private-server schedule prompt, confirm the delivered Discord message contains exactly one localised schedule time (or `Time to be confirmed`), no mojibake or duplicate timestamp, and no mentions. Capture a screenshot showing the new `?source=discord` link preview as generic ScrimStats branding rather than Vercel. This approval/test still does not cover the existing retry, disconnect, entitlement, role, or tenant-isolation release gates.

## Embed-suppression correction and QA handoff - 2026-07-30

- **Approved scope:** Theo approved the QA-recommended private-message repair: suppress the outbound Discord embed rather than introduce dynamic public scrim metadata. The authenticated workspace link and no-mentions policy remain intact.
- **Changed area:** `discord-dispatch` sets Discord's documented `SUPPRESS_EMBEDS` message flag (`1 << 2`) on every approved schedule prompt. The earlier cache-busting query parameter was removed because embed suppression is the deterministic privacy-preserving control.
- **Contract coverage:** `scripts/discord-message-presentation-contract.test.mjs` now asserts the suppress-embeds flag, the empty allowed-mentions parse list, the single localised timestamp formatter, and the honest time fallback.
- **Hosted deployment and delivery:** Supabase project `tvcgjehreaayfazlhvps` has active `discord-dispatch` version **11**. One Theo-approved dummy `schedule_changed` event for the isolated `clash` Elite test tenant was queued after deployment and delivered on the next scheduled worker run with attempt count zero, no error, and a persisted Discord provider receipt.
- **Visual boundary:** No private Discord browser session is available in this workspace, so the receipt proves provider acceptance but does not itself prove the rendered absence of a card. Do not treat it as a screenshot substitute.
- **QA handoff:** In the isolated private test channel, capture the new delivered message. It must retain the visible ScrimStats link, have no rich preview card, one localised schedule time, no mojibake, and no mentions. Keep the existing retry, disconnect, entitlement, role, and tenant-isolation matrix as separate release gates. `/scrim` remains with WO-2026-025.

## Independent QA recheck - 2026-07-30 (message presentation passed)

### 1. Release verdict: CONDITIONAL

The isolated Discord happy path now passes. The release remains conditional because negative-path and cross-tenant evidence has not been exercised; those checks need reversible actions in the shared production database and private Discord test server.

### 2. What was verified

- **Customer-view evidence:** Theo manually confirmed the latest isolated Discord message has a readable time and correct presentation.
- **Deployed implementation:** Active `discord-dispatch` version 11 uses one Discord-localised timestamp, no malformed characters, `allowed_mentions: { parse: [] }`, and Discord's suppress-embeds flag.
- **Hosted delivery:** Fresh `schedule_changed` and `schedule_created` events were delivered at 20:41 and 20:49 UTC with zero attempts/errors and distinct provider message receipts.
- **Independent local regression:** 17 focused Discord/presentation/public-layout contracts passed, as did ESLint with zero warnings and TypeScript.
- **Server enforcement source/contract:** The dispatcher retains its dispatch-secret check and server-side Elite plus live/enabled module check. The focused contract suite covers provider-scoped outbox claims and owner-bound integration controls.

### 3. Blocking issues

- None reproduced for the isolated happy path.

### 4. Important risks

- The happy path does not prove safe recovery or revocation. It must not be treated as proof that delivery stops correctly on disconnect/downgrade or that a Discord/provider failure is recorded and retried correctly.

### 5. Unverified but required checks

- Provider failure and retry/backoff using the isolated test channel only.
- Disconnect and reconnect of the isolated installation; confirm no delivery after disconnect.
- Elite/module revocation and Free/Pro/non-manager direct-function denials.
- Cross-tenant channel/outbox isolation.

### 6. Exact approval needed to complete QA

Theo must explicitly approve a reversible, isolated negative-path session: temporarily deny the bot Send Messages permission in the private test channel, create one disposable test event, observe retry evidence, restore the permission, then disconnect/reconnect the isolated installation. A separate explicit production-data approval is required before temporarily changing the test tenant's entitlement/module state. No customer tenant, customer Discord server, or customer message is in scope.
