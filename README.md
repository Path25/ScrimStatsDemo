# ScrimStats by ProComps

ScrimStats is a League of Legends team-operations workspace for planning scrims, tracking players, reviewing games, and organising coaching work.

## Product scope

The web dashboard covers tenant-safe team access, roster and availability, calendar and reminders, scrim review, coaching actions, Solo Queue, analytics, scouting, Draft, and notifications. Public marketing and authenticated workspace routes are separate. Live workspace screens never fall back to sample team data: unavailable data is shown as unavailable.

The desktop app opens the authenticated workplace dashboard and adds native custom-game capture across League champion select, the live Game Client API, and the post-game client payload. Replay annotation remains a later desktop extension and is not part of the current capture boundary.

## Game Capture for Windows

`collector/` is the Windows Electron app for Pro and Elite teams. It displays the same authenticated workplace dashboard as the web app. A coach, manager, or owner creates a one-time pairing code, then a designated host pairs the app, selects the scheduled scrim block, and explicitly arms recording. The native process automatically captures each game in that block while armed, using loopback-only League client APIs, and uploads the final review package after the game. League client credentials remain memory-only and are never logged, persisted, or uploaded. It never asks a player for a Riot API key or exposes live telemetry to the browser.

The package is built with `npm --prefix collector run dist:win`. Before a pilot, apply the collector migration and deploy `collector-pairing`, `collector-pair`, `collector-status`, `collector-ingest`, and the retired `receive-game-stats` tombstone together. The current invited-team beta may be distributed unsigned only while the workspace shows the Unknown publisher warning, exact version, and SHA-256 checksum. Once a signed installer is hosted, set `VITE_GAME_CAPTURE_DOWNLOAD_URL` to replace the beta release URL and remove the unsigned warning.

## Tech stack

- React, TypeScript, Vite, Tailwind, and shadcn/ui
- Supabase for authentication, tenant data, storage, and edge functions
- TanStack Query for server-state caching

## Local development

```sh
npm install
npm run dev
```

Use the release checks before handing a build to a pilot team:

```sh
npm run verify
npm run test:e2e
```

Operational, security, and release notes live under [`docs/`](docs/).

## Deployment environment

Set these public values in the Vercel project rather than committing a local `.env` file:

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_GAME_CAPTURE_DOWNLOAD_URL=https://<signed-installer-url>
```

Public sign-up uses Supabase Auth email confirmation, then creates one Free workspace through the constrained `create_self_service_workspace` RPC. Apply the current migrations and deploy the Auth email templates in `supabase/templates/` before enabling sign-up on the production domain. Stripe, notification, collector, Riot, GRID, and Discord credentials are Supabase Edge Function secrets and must never be prefixed with `VITE_` or exposed to browser code.

## Data and credentials

Provider credentials must stay server-side. The browser should receive connection status only, never a Riot, GRID, or service-role key. Riot personal keys are suitable for private testing; a production integration requires an approved production-key route.
