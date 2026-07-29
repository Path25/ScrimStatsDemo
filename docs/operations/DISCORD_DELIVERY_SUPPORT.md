# Discord delivery support path

## Scope before activation

Elite Discord automation is limited to selected schedule-change and practice-reminder prompts linking back to ScrimStats. It must never relay scouting, review, player, credential, or authorization content.

## Honest states

- **Unavailable:** Discord credentials, callback configuration, worker scheduling, or bot permissions are not configured. Do not present delivery as available.
- **Connected:** An Elite owner or admin completed installation and selected one or more supported channel subscriptions.
- **Retrying:** A Discord delivery attempt failed and is queued with backoff. This is not delivery confirmation.
- **Failed:** Five dispatch attempts failed. Retain the delivery-attempt evidence and direct the workspace to reconnect or select a valid channel.
- **Disconnected:** Subscription delivery is disabled. Historical delivery evidence is retained.

## Support triage

1. Confirm the workspace is Elite and the requester is an owner or admin.
2. Confirm the installation is active and the selected channel still exists and permits the bot to post.
3. Inspect `integration_delivery_attempts` and `integration_events`; do not request or record Discord tokens in support notes.
4. Reconnect or reconfigure the channel only with workspace-manager approval.
