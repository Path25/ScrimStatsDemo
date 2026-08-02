# Edge Function release manifest

## Active dashboard and capture functions

- `team-invitations`
- `pilot-ops`
- `notification-worker` (worker-secret authenticated)
- `collector-pairing`
- `collector-status`
- `collector-ingest` (device-token authenticated)
- `soloq-sync-v2` (JWT for staff refresh, worker secret for scheduled jobs)
- `riot-integration`
- `opponent-soloq-sync`
- `leaguepedia-draft-import`
- `grid-api`
- `grid-auto-monitoring`
- `create-checkout`
- `customer-portal`
- `stripe-webhook` (Stripe-signature authenticated)
- `stripe-mrr-snapshot` (Vault-backed worker-secret authenticated; reporting aggregate only)

## Test-only Discord delivery functions

- `discord-install`, `discord-channels`, `discord-config`, `discord-roles` (workspace owner/admin JWT required)
- `discord-schedule-reminders`, `discord-dispatch` (dispatch-secret authenticated workers)

`discord-interactions` is source-only until a separately approved private-server configuration. It accepts no browser JWT: Discord Ed25519 signature verification is mandatory before parsing or lookup, and its only intended command is the server-gated `/scrim` practice-block workflow.

These Functions are deployed for the isolated Discord test workflow only. They remain server-gated by Elite plus a `live` and enabled Discord module; no customer workspace is enabled until the separate QA and release gates pass.

## Retired with HTTP 410 tombstones

- Legacy billing: `check-subscription`, `cancel-subscription`, `sync-subscription`.
- Deployment helpers: `create-github-repo`, `deploy-to-netlify`, `deploy-to-vercel`.
- Legacy Solo Queue: `sync-soloq-data`.
- Old monitoring and placeholder analytics: `team-roster`, `check-team-schedule`, `end-game-tracking`, `start-game-monitoring`, `update-live-game`, `test-riot-connection`, `end-game-monitoring`, `auto-draft-detection`, `champion-pool-analysis`, `draft-intelligence`, `game-analytics`, `import-draft-data`, `get-active-scrims`.
- Legacy mail dispatch: `send-auth-email`, `send-notification-email`.

User-triggered tombstones require JWT verification and return a stable `endpoint_retired` response. They remain deployed temporarily so stale callers fail explicitly and can be identified in logs. Reconcile the legacy `sync-subscription` source directory with its retired deployment before the final release tag.
