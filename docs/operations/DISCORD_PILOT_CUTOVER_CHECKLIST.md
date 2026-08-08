# Discord pilot-access production cutover checklist

## Status and boundary

This is the WO-2026-040 Phase 1 source-only planning package. It does not approve or perform a customer-visible wording change, production deployment, Discord application change, secret or Vault change, worker activation, provider request, smoke, customer enablement, or public claim.

The proposed outcome is manual **Pilot access** for named, consenting Elite workspaces only. It is not general availability, a reliability claim, or permission to enable Discord for every Elite workspace. Existing server-side Elite, live/enabled module, tenant, owner/admin, guild, role, supported-event, and idempotency boundaries remain mandatory.

## Users and supported pilot outcome

- A named Elite workspace owner or admin connects the workspace's approved Discord server.
- That manager chooses one permitted delivery channel, the supported schedule prompt types, and permitted staff roles.
- The workspace sees truthful setup, connected, configured, queued/retrying, failed, delivered, and disconnected states.
- Selected schedule prompts link teammates back to ScrimStats. Scouting, review, player, credential, and authorization content never enters Discord delivery.
- Pilot support can disable one workspace or both global workers without deleting receipts, events, attempts, or operator history.

The first pilot cutover is schedule-delivery only. The deployed `/scrim` path remains server-gated and outside the customer promise unless Theo separately includes command registration and pilot use in an exact provider-action approval.

## Required named owners

| Responsibility | Owner for cutover preparation | Required confirmation before hosted action |
|---|---|---|
| Release and customer-claim approval | Theo | Exact candidate, wording, production target, smoke and pilot workspace |
| Source candidate and source rollback | Core Features Developer | Tested commit and evidence-preserving rollback commit |
| Hosted execution, monitoring and global disable | QA and Release Auditor | Exact window, before-counts, stop conditions and operator access |
| Incident escalation and customer communication approval | Theo | Named support route and approved recipient-specific wording |
| Pilot workspace action | Named consenting owner/admin | Workspace, server and channel confirmed without identifiers in general evidence |

If any owner or support route is unavailable, stop before deployment or activation.

## Current source and hosted baseline to reconcile

Re-read every value at cutover time; this table is the reviewed Phase G-B baseline, not proof of the future production candidate.

| Path | Reviewed baseline | Authentication boundary |
|---|---|---|
| `discord-install` | Hosted v15 | `verify_jwt=false` only for the OAuth callback; POST authenticates the user, and callback state is hashed, expiring, single-use, entitlement-rechecked and manager-role-rechecked |
| `discord-channels` | Hosted v13 | Gateway JWT plus owner/admin and Elite/live/enabled checks |
| `discord-config` | Hosted v11, SHA-256 `3a880bb7950d7b4cced745bb35cc3bf85b5e302099559dafccbc05866e9fc5e4` | Gateway JWT plus owner/admin and Elite/live/enabled checks; delivery-health reads are tenant-scoped and bounded |
| `discord-roles` | Hosted v5 | Gateway JWT plus owner/admin and Elite/live/enabled checks |
| `discord-interactions` | Hosted v13, SHA-256 `0346de39082a99ecc2a8aa874e58608d1316d405120e71cb71b4b9028e456fdb` | `verify_jwt=false`; raw-body Ed25519 verification occurs before parsing or lookup |
| `discord-schedule-reminders` | Hosted v13 | `verify_jwt=false`; exact dispatch-secret authentication inside the Function |
| `discord-dispatch` | Hosted v18, SHA-256 `f8706beefeb5d1e0becae4cd9609376c78f990b5ad14eafeda4bc65f71a990b2` | `verify_jwt=false`; exact dispatch-secret authentication inside the Function |
| `discord-qa-nonce` | Hosted v1 | Test-only control with gateway JWT and dispatch-secret checks; not a pilot dependency |

Before cutover, record the exact tested Git commit, production frontend deployment ID, Function versions and retrieved-source hashes. A hostname response, timestamp, build, or branch name alone is insufficient revision evidence. A mismatch is a stop condition.

## Configuration-name and provider-boundary preflight

Record names and redacted presence only. Never record values.

### Supabase Edge Function configuration names

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_PUBLIC_KEY`
- `DISCORD_DISPATCH_SECRET`
- `SCRIMSTATS_APP_URL`
- Supabase-managed URL, anon/publishable, and service-role/secret-key environment names used by the reviewed Functions

### Vault names used by the worker scheduler

- `project_url`
- `publishable_key`
- `discord_dispatch_secret`

### Discord application checks

- OAuth redirect URI exactly matches the deployed `discord-install` callback.
- Interactions Endpoint URL exactly matches the deployed `discord-interactions` Function.
- The production browser return origin is `https://scrimstats.gg`; `https://www.scrimstats.gg` remains an approved return origin.
- OAuth scopes remain only `bot applications.commands`; privileged Gateway Intents remain unnecessary.
- Bot permissions remain bounded to the reviewed scheduling workflow. A server/channel permission failure stops the smoke; do not broaden unrelated guild permissions.
- The `/scrim` command's registration/pilot status is recorded explicitly as included or excluded. The default for this candidate is excluded.

Any missing name, endpoint mismatch, unexpected intent, or broader permission request requires a new exact configuration approval.

## Exact proposed source and copy diff

Theo approved this wording for the Stage 1 local source candidate on 2026-08-08. That approval does not authorise deployment or any later cutover stage.

| File or contract | Current source | Proposed pilot candidate |
|---|---|---|
| `src/pages/Integrations.tsx` | Badge `Test only` | Badge `Pilot access`, with an explicit neutral/awaiting text class so a live module does not imply general availability |
| `src/components/integrations/DiscordScheduleIntegration.tsx` | `Configured - test only` | `Configured - pilot access` |
| `src/components/integrations/DiscordScheduleIntegration.tsx` | `Schedule prompts are configured, but customer delivery is not released.` | `Schedule prompts are configured for this approved pilot workspace. Delivery status is tracked separately.` |
| `src/components/integrations/DiscordScheduleIntegration.tsx` | `Test-only configuration. Discord is not available to customer workspaces until hosted QA, a consented pilot, and Theo's separate release approval are complete.` | `Pilot access. Discord delivery is available only to named Elite pilot workspaces. This is not general availability.` |
| `src/components/integrations/DiscordScheduleIntegration.tsx` | `Schedule prompts are saved for controlled testing in your selected channels.` | `Schedule prompts are saved for this workspace's approved pilot channels.` |
| `src/components/integrations/DiscordScheduleIntegration.tsx` | `Server connected - choose a channel and prompts to prepare this workspace for controlled testing.` | `Server connected - choose a channel and prompts for this approved pilot workspace.` |
| `src/components/integrations/DiscordScheduleIntegration.tsx` | Prompt count says `configured for controlled testing` | Prompt count says `configured for pilot access` |
| `supabase/functions/discord-config/index.ts` and `src/hooks/useDiscordIntegration.ts` | Safe response state `test_only` | Safe response state `pilot_access`; authorization continues to use server-side role, Elite and module checks rather than this display field |
| `/scrim` role copy | Says the command remains unavailable until release approval | Keep the command unavailable for the schedule-delivery pilot unless a later exact approval includes command registration and pilot use |
| `docs/operations/DISCORD_DELIVERY_SUPPORT.md` | Test-only support boundary | Named-pilot admission, monitoring, incident and exit boundary; expressly prohibit general-availability claims |
| `docs/launch/EDGE_FUNCTION_MANIFEST.md` | Test-only Discord section | Pilot-candidate section with exact production versions/hashes recorded after deployment, while QA controls remain test-only |
| `docs/launch/RELEASE_BOUNDARY.md` | Interactive Discord excluded | Include manual named Elite pilot access only; continue excluding broad/general Discord availability |
| `docs/operations/MESSAGE_LEDGER.md` | No Elite/Discord customer claim authorised | Add only the approved one-to-one pilot statement after Theo approves exact wording and named recipients |
| Discord contracts | Require `Test only` | Require `Pilot access`, neutral presentation, named-pilot limitation, server authorization and retained HOLD on general availability |

The proposed customer wording is intentionally setup-focused and evidence-limited. It must not promise delivery speed, rendered-message appearance, uninterrupted reliability, performance improvement, broad Elite availability, or a support response-time SLA.

## Approval and cutover stages

Each stage requires its own recorded approval. Approval of one stage does not authorise the next.

### Stage 1 - source candidate

- Apply only the approved source/copy diff.
- Keep plan entitlements and database schema unchanged.
- Add/update focused contracts for the display state, neutral badge, owner/admin path, member/viewer and Free/Pro/non-live denials, support wording, manifest and release boundary.
- Run focused contracts, the complete repository test suite, ESLint with zero warnings, TypeScript, production build, bundle budget and `git diff --check`.
- Return the exact commit and proposed production deployment set for approval.

### Stage 2 - inert production deployment

- Deploy only changed reviewed Functions and the exact tested frontend revision.
- Do not activate workers, change the Discord application, change configuration, enable a pilot workspace or create an event.
- Retrieve deployed Function sources and verify authentication settings and hashes.
- Record the immutable frontend deployment ID and exact Git commit.
- Confirm both Discord workers and every QA control remain inactive.

### Stage 3 - provider/configuration reconciliation

- Read configuration-name presence and provider endpoints only.
- If an endpoint, redirect, secret/configuration name, application permission or command registration must change, stop and obtain a new exact approval naming that change.
- Re-run owner/admin and denial paths without saving workspace configuration unless the exact pilot fixture/configuration change is approved.

### Stage 4 - one-event non-customer production smoke

- Name the existing non-customer fixture, exact workspace owner, execution/monitoring operator, rollback owner and time window in the approval.
- Confirm zero claimable unrelated Discord events, zero active QA controls, inactive workers and before-counts for scrims, receipts, events and attempts across the fixture and all-project queue.
- Use one uniquely labelled practice block scheduled outside the reminder window so the normal schedule-created path produces exactly one claimable prompt and the reminder worker produces none.
- Activate only the two reviewed global workers through `security.configure_discord_production_worker_schedule()`.
- Require exactly one canonical schedule event, one delivered attempt and one provider receipt for the approved target, with no unrelated tenant delta or duplicate claim.
- Immediately invoke `security.disable_discord_production_worker_schedule()` after evidence capture, whether the delivery succeeds or fails.
- Retain the practice block, event, attempt and receipt as evidence. Any cleanup that creates a cancellation event requires its own plan while workers are inactive.

### Stage 5 - named Elite pilot admission

- Name the consenting workspace, owner/admin, server/channel boundary, pilot window, support contact, monitoring operator, rollback owner and exit criteria.
- Enable only that workspace's live Discord module and approved configuration.
- Reconfirm Free, Pro, member, viewer, non-live and unrelated-tenant denials.
- Keep onboarding manual and recipient-specific. Do not publish availability or enable every Elite workspace.

## Smoke monitoring and evidence

Record only safe evidence:

- tested commit and immutable deployment IDs;
- Function names, versions, authentication modes and retrieved-source hashes;
- configuration-name presence without values;
- redacted Function request/execution IDs and timestamps;
- worker active/inactive state and cron run outcome;
- tenant-safe before/after counts, event status, attempt count/outcome and receipt presence;
- workspace/global disable results and preserved historical evidence.

Do not record tenant, guild, channel or role identifiers, provider references, payloads, interaction bodies/signatures, tokens, secret values, or customer-private content in general evidence.

## Stop conditions

Stop and disable both workers immediately if any of these occur:

- candidate revision, Function source/hash or authentication mode does not match;
- a required configuration name or provider endpoint is absent or unexpected;
- workers or QA controls are active before the approved window;
- any unrelated event is claimable, any unrelated tenant count changes, or the dispatcher claims more than the one approved event;
- the approved event duplicates, reaches an unexpected channel, lacks its evidence write, or produces more than one provider request/receipt;
- a role, tier, module, tenant, guild or supported-event denial fails closed incorrectly;
- Discord returns an authorization/permission failure or the worker cannot be disabled;
- monitoring, support or rollback ownership becomes unavailable.

Retain all resulting events, attempts, receipts and cron history. Do not delete or relabel failed evidence to obtain a pass.

## Disable and rollback order

1. Invoke `security.disable_discord_production_worker_schedule()` and verify both named jobs are inactive.
2. Disable the affected workspace only by revoking its installation or disabling its live Discord module, using the smallest action appropriate to the incident.
3. Preserve all receipts, events, attempts, OAuth state history and operator/cron evidence.
4. Roll the frontend back to the immutable pre-pilot deployment recorded before cutover.
5. Redeploy only changed Functions from their exact pre-pilot commits; for Phase G-B display/status rollback, use the reviewed `discord-config` v11 source identity above rather than reconstructing source from memory.
6. Restore a Discord application endpoint, redirect or permission only when the cutover changed it and the rollback value was captured under the same exact approval.
7. Re-run tenant, role, tier and module denials before reopening the pilot.
8. Follow `INCIDENT_RECOVERY.md`; Theo separately approves any customer communication or `/status` publication.

Database history and delivery evidence are not rolled back destructively. Credential rotation is a separate security action requiring Theo's approval.

## QA handoff and decision record

QA must independently classify each result as source-verified, deployed-revision-verified, authenticated-browser-verified, provider-receipt-verified, or unverified. A provider receipt proves the API delivery path only, not Discord rendering or broad reliability.

The release verdict remains **HOLD** until every hosted stage required for pilot admission is separately approved and verified. A successful non-customer smoke permits only a later decision on manual named-pilot onboarding; it does not establish general availability.

## Stage 1 decision record - 2026-08-08

- Theo approved only the reviewed Stage 1 local source candidate.
- Customer-visible source now uses `Pilot access` with a neutral/awaiting badge treatment, and the safe `discord-config` response metadata uses `pilot_access`.
- The existing server-side owner/admin, Elite, tenant, live-module, and enabled-module checks are unchanged. Plan entitlements and database schema are unchanged.
- `/scrim` remains unavailable for this schedule-delivery pilot unless separately approved.
- Supporting support, manifest, release-boundary, message-ledger, and contract changes are part of the local candidate.
- No commit, push, deployment, provider/configuration change, secret change, worker activation, smoke, fixture mutation, pilot admission, customer communication, or general-availability claim is authorised by this record.
