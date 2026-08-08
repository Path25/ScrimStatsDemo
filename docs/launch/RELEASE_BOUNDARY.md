# Web dashboard release boundary

## Included

- Self-service Free workspace creation plus platform-operator provisioning and oversight.
- Invitation acceptance, password recovery, membership, and role-aware access.
- Roster, availability, calendar, reminders, scrim blocks, review, and coaching actions.
- Solo Queue, Team Analytics, Scouting, and Draft web workflows.
- In-app and email notification delivery state.
- Collector pairing, configuration, web health, and captured evidence presentation.
- Public signup, email confirmation, Free workspace creation, privacy, terms, support, status, and honest not-found pages.
- Workspace-scoped Free, Pro, and Elite checkout, subscription status, and Stripe billing-portal access.
- Approval-gated Discord schedule-delivery pilot access for individually named, consenting Elite workspaces, only after the WO-2026-040 deployment, provider, smoke, and pilot-admission gates are separately approved and verified.

## Excluded

- Native collector resilience, signing, packaging, and update delivery.
- Broad or general Discord availability, automatic access for every Elite workspace, and any reliability claim beyond the evidence recorded for a named pilot. A source-only pilot candidate is not customer availability.
- Discord `/scrim` command registration or pilot use unless separately approved; the schedule-delivery pilot does not include it.
- Unsupported analytics inferred from missing evidence.

## Preserved compatibility

- `/preparation` redirects to `/draft`.
- Historical migrations and immutable capture provenance remain intact.
- The internal `draft_preparation` module key remains unchanged.

## Cleanup evidence

The release dependency graph begins at the web entry point and includes static imports, lazy routes, route registration, direct test references, Edge Function invocations, and database-facing references. The cleanup removed 202 proven-unreachable TypeScript, TSX, and CSS files. Run `npm run release-boundary` to regenerate the current reachability report.

No database history or captured evidence is removed by this cleanup.
