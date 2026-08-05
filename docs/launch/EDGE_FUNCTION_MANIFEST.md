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

`discord-interactions` v13 is deployed with intentional `verify_jwt=false`: Discord Ed25519 signature verification is mandatory before parsing or lookup, and its only intended command is the server-gated `/scrim` practice-block workflow. Its private WO-040 exact-replay control is inert unless a database operator separately arms one tenant-bound run for at most fifteen minutes; browser and service roles cannot arm it.

These Functions are deployed for the isolated Discord test workflow only. They remain server-gated by Elite plus a `live` and enabled Discord module; no customer workspace is enabled until the separate QA and release gates pass.

WO-2026-040 delivery controls from candidate `e268298` remain hosted in the shared Supabase project: migration history records `20260804134309_discord_production_delivery_controls`, and the Discord workers remain inactive. The exact-replay migration is hosted as `20260805134134_discord_qa_replay_controls`. Timing-correction commit `dd354f8` is deployed as `discord-interactions` v13, SHA `0346de39082a99ecc2a8aa874e58608d1316d405120e71cb71b4b9028e456fdb`; retrieved entrypoint and shared helper match the committed candidate. One earlier v12 replay run is terminal and zero runs are active. This is not a new provider invocation or customer activation. Arming a private replay run, submitting a Discord interaction, re-enabling workers, smoke/pilot work, and release each retain their recorded separate approval gates.

## Retired with HTTP 410 tombstones

- Legacy billing: `check-subscription`, `cancel-subscription`, `sync-subscription`.
- Deployment helpers: `create-github-repo`, `deploy-to-netlify`, `deploy-to-vercel`.
- Legacy Solo Queue: `sync-soloq-data`.
- Old monitoring and placeholder analytics: `team-roster`, `check-team-schedule`, `end-game-tracking`, `start-game-monitoring`, `update-live-game`, `test-riot-connection`, `end-game-monitoring`, `auto-draft-detection`, `champion-pool-analysis`, `draft-intelligence`, `game-analytics`, `import-draft-data`, `get-active-scrims`.
- Legacy mail dispatch: `send-auth-email`, `send-notification-email`.

User-triggered tombstones require JWT verification and return a stable `endpoint_retired` response. They remain deployed temporarily so stale callers fail explicitly and can be identified in logs. Reconcile the legacy `sync-subscription` source directory with its retired deployment before the final release tag.
