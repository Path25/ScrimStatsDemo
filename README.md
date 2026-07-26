# ScrimStats by ProComps

ScrimStats is a League of Legends team-operations workspace for planning scrims, tracking players, reviewing games, and organising coaching work.

## Managed-pilot scope

The web dashboard covers tenant-safe team access, roster and availability, calendar and reminders, scrim review, coaching actions, Solo Queue, analytics, scouting, Draft, notifications, and managed-pilot operations. Public marketing and authenticated workspace routes are separate. Live workspace screens never fall back to sample team data: unavailable data is shown as unavailable.

Native collector development is outside this release boundary. The existing collector pairing, health, and review evidence surfaces remain supported in the web dashboard.

## Invited-team collector beta

`collector/` is the Windows Electron companion for invited teams. A coach, manager, or owner creates a one-time pairing code in the Scrim Block, then a designated host pairs the app, selects the scheduled scrim, and leaves it running. The app reads only the local League Game Client API and uploads the final review package after the game; it never asks a player for a Riot API key or exposes live telemetry to the browser.

The package is built with `npm --prefix collector run dist:win`. Before a pilot, apply the collector migration and deploy `collector-pairing`, `collector-pair`, `collector-status`, `collector-ingest`, and the retired `receive-game-stats` tombstone together. Do not publish the setup executable at `/downloads/ScrimStats-Collector-Setup.exe` until it has been signed and released through the invited-team channel.

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

Set these values in the Vercel project rather than committing a local `.env` file:

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<server-only-secret>
```

`SUPABASE_SECRET_KEY` is used only by `/api/request-access`; it must never be exposed to browser code. Apply `supabase/migrations/20260724113000_production_access_hardening.sql` before enabling the public request-access form. The migration disables public tenant creation and makes access requests server-only.

## Data and credentials

Provider credentials must stay server-side. The browser should receive connection status only, never a Riot, GRID, or service-role key. Riot personal keys are suitable for private testing; a production integration requires an approved production-key route.
