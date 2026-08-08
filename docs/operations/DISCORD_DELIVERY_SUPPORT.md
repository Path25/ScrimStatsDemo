# Discord delivery support path

## Scope before activation

Elite Discord automation is limited to selected schedule-change and practice-reminder prompts linking back to ScrimStats. It must never relay scouting, review, player, credential, or authorization content.

## Honest pilot states

- **Unavailable:** Discord credentials, callback configuration, worker scheduling, or bot permissions are not configured. Do not present delivery as available.
- **Setup required:** No active installation exists for this workspace.
- **Connected - prompts off:** An Elite owner or admin completed installation, but no supported channel subscription is enabled.
- **Configured - pilot access:** One or more supported subscriptions are saved for a named, approved Elite pilot workspace. This is configuration evidence, not delivery confirmation or a general-availability claim.
- **Queued - awaiting delivery:** A tenant-scoped event exists but has no provider receipt. This is not delivery confirmation.
- **Retrying delivery:** A Discord delivery attempt failed and is queued with bounded backoff. This is not delivery confirmation.
- **Delivery needs attention:** Five dispatch attempts failed. Retain the delivery-attempt evidence and review the connection or channel before any separately approved retry.
- **Last delivery recorded:** The latest tenant-scoped event has a provider receipt. This proves the API delivery path only, not rendered-message appearance or general reliability.
- **Disconnected:** Subscription delivery is disabled. Historical delivery evidence is retained.

Every configured pilot state must also show **Pilot access** and remain limited to a named, approved Elite pilot workspace. Do not use `Available` or `Delivery active`, and do not infer pilot admission from an Elite plan or a live module alone.

## Pilot admission and exit

- Admit only a named, consenting Elite workspace after Theo approves its owner/admin, Discord server and channel boundary, pilot window, support contact, monitoring operator, rollback owner, and exit criteria.
- Confirm the workspace remains Elite with a live and enabled Discord module; owner/admin management and member/viewer denial continue to be enforced by the authenticated Functions.
- Record installation, configuration, delivery-health, and provider-receipt evidence separately. A saved channel is not delivery evidence, and a receipt does not prove rendered appearance or broad reliability.
- Exit a single workspace by revoking its Discord installation or disabling its live Discord module. Use the global worker stop for cross-workspace or provider incidents.
- Keep `/scrim` unavailable for this schedule-delivery pilot unless a later exact approval includes command registration and pilot use.

## Support triage

1. Confirm the workspace is Elite and the requester is an owner or admin.
2. Confirm the installation is active and the selected channel still exists and permits the bot to post.
3. Inspect `integration_delivery_attempts` and `integration_events`; do not request or record Discord tokens in support notes.
4. Reconnect or reconfigure the channel only with workspace-manager approval.

## Operator and evidence handoff

- **Approval and global-stop authority:** Theo, or a specifically named delegate in the exact hosted-action approval.
- **Hosted execution and monitoring operator:** QA and Release Auditor, once the exact fixture, time window, before-counts, worker action, and stop conditions are approved.
- **Workspace action owner:** The named non-customer fixture owner/admin for pre-pilot evidence; a later customer pilot must name its own consenting owner.
- Record only tenant-safe counts, event status, attempt count/outcome, redacted Function request ID, Function version, worker active/inactive state, configuration-name presence, and timestamps. Do not record provider references, tenant/guild/channel/role identifiers, payloads, interaction signatures, or secret values in general support evidence.
- Before any activation, record per-tenant receipt, scrim, event, and attempt counts plus the all-project open queue. After disabling, repeat those counts and confirm no unrelated tenant changed.

## Production worker controls

The source-tracked production worker path is a release candidate, not an activation claim. Applying `20260804143000_discord_production_delivery_controls.sql` pauses both Discord cron jobs by default. It creates no Vault secret and sends no provider request.

An authorised operator may invoke `security.configure_discord_production_worker_schedule()` only after Theo approves the exact hosted migration, deployed Function revisions, provider configuration, non-customer fixture, and monitoring owner. The routine reads only these existing Vault names: `project_url`, `publishable_key`, and `discord_dispatch_secret`. Record names and redacted presence only, never values.

Use `security.disable_discord_production_worker_schedule()` for the immediate global stop. It marks both jobs inactive rather than deleting them, preserving their definitions and `cron.job_run_details` history. Disabling a single workspace remains a separate owner/admin action: revoke its Discord installation or disable its live Discord module. Neither path deletes receipts, outbox rows, or delivery attempts.

## Retry and evidence review

1. Start from the affected tenant and event identifier. Confirm the event type is within the schedule-only scope.
2. Inspect `integration_delivery_attempts` by `tenant_id`, `event_id`, `provider`, and `delivery_target_id`. A `delivered` attempt is provider-receipt evidence for that channel; it is not rendered-message evidence.
3. Confirm already delivered channels are not called again. Dispatch uses a deterministic Discord nonce with provider nonce enforcement and a database uniqueness guard for delivered event/channel pairs.
4. For `retry`, check the bounded outbox attempt count and `available_at`; do not manually duplicate or delete the event. At five attempts the event becomes `failed` and retained evidence must be reviewed before any recovery.
5. For worker incidents, disable the production schedule, retain redacted Function request IDs and cron run history, and follow `INCIDENT_RECOVERY.md`. Re-enable only after the cause is corrected and the same approval boundary is restored.

For a signed `/scrim` rejection, correlate the Function invocation with the redacted `Discord scrim request rejected` entry. Record only its `reason`, PostgreSQL/PostgREST `code`, Function version, and execution ID. Never copy the interaction body, signature, timestamp, tenant or guild identifier, role identifiers, or secret values into support evidence. Provider responses remain generic for authorization failures; internal reason codes exist only to distinguish input, installation, role/module, constraint, overlap, and unavailable-RPC paths safely.

## Release and customer-claim boundary

Phase F completed one bounded non-customer smoke after retaining its earlier 403 retry evidence. That receipt does not complete multi-workspace support, a customer pilot, or broad release evidence. The Stage 1 source candidate uses **Pilot access** wording, but it is not deployed or admitted to a customer workspace by that source change. Only named, consenting Elite pilot workspaces may later be admitted through the separately approved cutover stages. Do not describe Discord as generally available, broadly available to Elite, or production-ready.
