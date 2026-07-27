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

## Retired with HTTP 410 tombstones

- Legacy billing: `check-subscription`, `cancel-subscription`, `sync-subscription`.
- Deployment helpers: `create-github-repo`, `deploy-to-netlify`, `deploy-to-vercel`.
- Legacy Solo Queue: `sync-soloq-data`.
- Old monitoring and placeholder analytics: `team-roster`, `check-team-schedule`, `end-game-tracking`, `start-game-monitoring`, `update-live-game`, `test-riot-connection`, `end-game-monitoring`, `auto-draft-detection`, `champion-pool-analysis`, `draft-intelligence`, `game-analytics`, `import-draft-data`, `get-active-scrims`.
- Legacy mail dispatch: `send-auth-email`, `send-notification-email`.
- Roadmap-preview Discord delivery: `discord-install`, `discord-channels`, `discord-schedule-reminders`, `discord-dispatch`.

User-triggered tombstones require JWT verification and return a stable `endpoint_retired` response. They remain deployed temporarily so stale callers fail explicitly and can be identified in logs. Reconcile the legacy `sync-subscription` source directory with its retired deployment before the final release tag.
