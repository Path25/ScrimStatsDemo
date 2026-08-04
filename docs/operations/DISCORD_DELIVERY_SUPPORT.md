# Discord delivery support path

## Scope before activation

Elite Discord automation is limited to selected schedule-change and practice-reminder prompts linking back to ScrimStats. It must never relay scouting, review, player, credential, or authorization content.

## Honest states

- **Unavailable:** Discord credentials, callback configuration, worker scheduling, or bot permissions are not configured. Do not present delivery as available.
- **Server connected — delivery not configured:** An Elite owner or admin completed installation, but no supported channel subscription is enabled. No Discord delivery can occur until a channel and prompt type are selected.
- **Delivery active:** An Elite owner or admin completed installation and selected one or more supported channel subscriptions.
- **Retrying:** A Discord delivery attempt failed and is queued with backoff. This is not delivery confirmation.
- **Failed:** Five dispatch attempts failed. Retain the delivery-attempt evidence and direct the workspace to reconnect or select a valid channel.
- **Disconnected:** Subscription delivery is disabled. Historical delivery evidence is retained.

## Support triage

1. Confirm the workspace is Elite and the requester is an owner or admin.
2. Confirm the installation is active and the selected channel still exists and permits the bot to post.
3. Inspect `integration_delivery_attempts` and `integration_events`; do not request or record Discord tokens in support notes.
4. Reconnect or reconfigure the channel only with workspace-manager approval.

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

## Release and customer-claim boundary

Until WO-2026-040 completes independent hosted QA, a non-customer production smoke, a named consented pilot, and Theo's separate release approval, Discord remains test-only and excluded from the customer release boundary. Do not describe it as generally available or production-ready.
