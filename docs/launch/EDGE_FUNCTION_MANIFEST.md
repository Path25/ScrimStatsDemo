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
- `discord-qa-nonce` (source-only; explicit gateway JWT plus dispatch-secret authentication)

`discord-interactions` v13 is deployed with intentional `verify_jwt=false`: Discord Ed25519 signature verification is mandatory before parsing or lookup, and its only intended command is the server-gated `/scrim` practice-block workflow. Its private WO-040 exact-replay control is inert unless a database operator separately arms one tenant-bound run for at most fifteen minutes; browser and service roles cannot arm it.

The deployed Functions in this section are available only for the isolated Discord test workflow; `discord-qa-nonce` remains source-only and undeployed. They remain server-gated by Elite plus a `live` and enabled Discord module; no customer workspace is enabled until the separate QA and release gates pass.

WO-2026-040 delivery controls from candidate `e268298` remain hosted in the shared Supabase project: migration history records `20260804134309_discord_production_delivery_controls`, and the Discord workers remain inactive. The exact-replay migration is hosted as `20260805134134_discord_qa_replay_controls`. Timing-correction commit `dd354f8` is deployed as `discord-interactions` v13, SHA `0346de39082a99ecc2a8aa874e58608d1316d405120e71cb71b4b9028e456fdb`; retrieved entrypoint and shared helper match the committed candidate. One earlier v12 replay run is terminal and zero runs are active. This is not a new provider invocation or customer activation. Arming a private replay run, submitting a Discord interaction, re-enabling workers, smoke/pilot work, and release each retain their recorded separate approval gates.

WO-2026-040 Phase C exact-event isolation is hosted from commit `8986e82`: migration `20260805191357_wo040_discord_qa_dispatch_controls` is applied and `discord-dispatch` v18 SHA `f8706beefeb5d1e0becae4cd9609376c78f990b5ad14eafeda4bc65f71a990b2` exactly matches the committed entrypoint/shared helper. The first permission test remains retained as one terminal `delivered` run. After the Discord permission correction, a fresh approved exact event produced five 403 attempts without provider references, observed the enforced 2/4/8/16-minute backoffs, and reached terminal `failed` at attempt count 5. All five replacement runs completed; zero runs are active, two other retained events remain untouched, and both workers remain inactive. No worker/customer/configuration/smoke/pilot/release action is approved. The pre-Phase-C global dispatcher source at `e268298` remains the bounded Function rollback candidate; destructive database rollback remains separately approval-gated and evidence-preserving.

WO-2026-040 Phase D source is committed at `1c05d7b`, with hosted migration identity reconciliation at `a0180f0`. Database controls are hosted as migration `20260806130646_wo040_discord_nonce_qa_controls`; `discord-qa-nonce` v1 uses explicit `verify_jwt=true`, SHA `85e9ed3099fd304b88e56754f9e148bfd10fb460011e9facff39bfa29c85dacf`, and exact committed entrypoint/shared sources. `discord-dispatch` remains unchanged at v18. No Phase D run, fixture, provider request, permission/configuration change, or recovery rehearsal has occurred. Every provider-facing step retains separate Theo approval, both workers remain inactive, and the release verdict remains HOLD.

## Retired with HTTP 410 tombstones

- Legacy billing: `check-subscription`, `cancel-subscription`, `sync-subscription`.
- Deployment helpers: `create-github-repo`, `deploy-to-netlify`, `deploy-to-vercel`.
- Legacy Solo Queue: `sync-soloq-data`.
- Old monitoring and placeholder analytics: `team-roster`, `check-team-schedule`, `end-game-tracking`, `start-game-monitoring`, `update-live-game`, `test-riot-connection`, `end-game-monitoring`, `auto-draft-detection`, `champion-pool-analysis`, `draft-intelligence`, `game-analytics`, `import-draft-data`, `get-active-scrims`.
- Legacy mail dispatch: `send-auth-email`, `send-notification-email`.

User-triggered tombstones require JWT verification and return a stable `endpoint_retired` response. They remain deployed temporarily so stale callers fail explicitly and can be identified in logs. Reconcile the legacy `sync-subscription` source directory with its retired deployment before the final release tag.
