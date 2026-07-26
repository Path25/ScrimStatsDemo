# ScrimStats: Dashboard-First Completion Plan

Checkpoint: 25 July 2026

ScrimStats is not launch-ready. The public experience and authenticated design
system are established, but the remaining work must pass the gates below before
the existing client is replaced.

## Implemented in this checkpoint

### Operations foundation

- Canonical UTC `starts_at` and `ends_at` scrim scheduling with workspace
  timezone conversion inside permission-checked PostgreSQL RPCs.
- Real calendar event create, edit, reschedule, delete, desktop month/week, and
  mobile agenda paths.
- Roster profile editing, Riot ID and tagline, region, one primary role,
  champion pool, archive/reactivation, and retained history.
- Tenant-safe captured-participant identity fields for Collector review.
  Roster management remains a direct coach/manager workflow and does not expose
  capture-reconciliation work.
- Overview briefing for the next practice block, roster readiness, preparation,
  collector state, unresolved evidence, recent results, and coverage.
- Workspace membership, invitation, password, timezone, notification, and
  collector settings.
- Optional roster-linked invitations that atomically connect accepted
  memberships to an existing player profile, with cancellation and
  access-revocation reconciliation.

### Intelligence and analytics contracts

- Opponent create, edit, search, archive, restore, roster observations, evidence
  timeline, tendencies, and preparation brief creation.
- Opponent-player edit/archive/restore plus non-destructive evidence revision
  with a tenant-consistent supersession chain.
- A visual side-aware draft board with champion assets, ordered actions, roles,
  branches, rationale, and contingencies.
- Database trigger rules for duplicate champions, role conflicts, side limits,
  action/phase consistency, and complete publication.
- Deterministic champion, matchup, duo, composition-identity, and improvement
  calculations with denominators, exclusions, provenance, taxonomy version, and
  small-sample rules.
- Advanced analytics surfaces remain explicitly unavailable until qualifying
  evidence exists. No value is estimated or substituted.
- A tenant-scoped Solo Queue tracker now stores one daily ranked snapshot and
  the latest 20 Solo/Duo games for configured roster identities. Staff can
  request a cooled-down refresh; all Riot requests and writes remain
  server-owned.
- Owners/admins can connect a tenant-managed Riot API credential from
  Integrations. Credential material is encrypted in Supabase Vault, never
  returned to the browser, and can be rotated without changing application
  configuration.
- Opponent roster identities now have a private Solo Queue view with daily rank
  history and the latest 20 Solo/Duo games. Refreshes use the tenant credential,
  remain staff-controlled, and never share intelligence across tenants.
- Staff can import attributed professional draft history through Leaguepedia's
  structured CargoQuery/MediaWiki data source. Imports retain the provider game
  and match IDs, source page, source revision, fetch time, patch, sides, picks,
  bans, and raw source record.
- Imported drafts can be selected as evidence for a preparation brief. Published
  brief snapshots preserve that evidence immutably, and revisions inherit the
  selection without mutating the published source.
- Planned opponent picks and bans can be compared factually with selected
  imported drafts. The comparison reports observed, unobserved, and additional
  champions without producing an adherence score, prediction, or recommendation.
- The live Team Analytics route now aggregates tenant-authorized champion picks,
  captured team bans, same-role matchups, every team champion pairing, priority
  Jungle-Mid and ADC-Support duos, and player contribution coverage.
- Every analytics row declares wins, losses, game count, small-sample state, date
  boundary, and collector/manual provenance. Completed games without a saved
  result are excluded explicitly; missing fields remain unavailable.

### Collector direction

- Electron loads the authenticated ScrimStats `/collector` workspace rather
  than maintaining a second dashboard.
- Renderer isolation, sandboxing, navigation allowlist, blocked untrusted
  popups, encrypted device credentials, tray behavior, and a narrow versioned
  preload bridge.
- Collector identity matching uses roster Riot IDs and can resolve either team
  side without assuming blue.
- Failed upload batches are retained, and captured events are preserved for the
  eventual event/snapshot contract.

## Gate 1: operations acceptance

The following additive migrations were applied to the current hosted project on
25 July 2026 after read-only preflight and hosted rollback dry runs:

- `20260725072313_operations_dashboard_foundation.sql`
- `20260725082441_roster_membership_linking.sql`
- `20260725083647_scouting_evidence_lifecycle.sql`

No tenant, scrim, player, participant, opponent, or scouting evidence rows were
deleted by these migrations.

Then verify with two controlled tenants:

1. Create, edit, reschedule, cancel, and delete practice blocks and calendar
   events in multiple timezones.
2. Create, edit, archive, and reactivate players.
3. Link invitations to roster identities and test revoked membership.
4. Confirm manually maintained roster identities remain independent from
   captured-participant reconciliation.
5. Exercise owner, admin, member, and viewer action visibility and server
   authorization.
6. Confirm mobile agenda and roster records at 390 px.

Exit gate: database lint, RLS tests, authenticated browser journeys, and no
legacy timestamp writes from active routes.

## Gate 2: intelligence completion

- Exercise opponent-player edit/archive and evidence supersession against the
  controlled test tenant.
- Validate roster and opponent Solo Queue refreshes against a controlled tenant,
  including expired development keys, rate limiting, cooldowns, and credential
  rotation. Tenant-managed credentials remain private-testing infrastructure;
  ScrimStats still needs Riot production approval for a public product.
- Exercise the attributed Leaguepedia import against the controlled tenant,
  including provider rate limits, exact team-name matching, database cooldowns,
  failed refresh recovery, and immutable brief evidence.
- Add fixture and game timestamp fields to evidence authoring.
- Add filters for category, date, confidence, source, and linked fixture.
- Replace champion-name text entry with a current versioned Data Dragon
  selector.
- Add server-side standard tournament sequence validation and factual comparison
  against captured drafts.
- Complete brief editing for priorities, risks, evidence ordering, fixture
  context, scenario selection, publication preview, immutable snapshots, and
  revision comparison.
- Verify immutable published snapshots and read-only member/viewer access.

Exit gate: owners/admins can maintain living private intelligence; every team
role can read only published preparation.

## Gate 3: analytics activation

- Exercise the live champion, matchup, duo, and player aggregation across two
  controlled tenants, every role, empty evidence, and filtered date/opponent/
  side/format boundaries.
- Store and version the champion-trait taxonomy.
- Add normalized collector event and snapshot tables with field-level coverage.
- Keep legacy/manual evidence separate from Collector v2.
- Activate composition identities after complete taxonomy coverage, then
  objective and time-snapshot panels only when their evidence contracts pass.

Exit gate: golden fixtures reproduce every displayed numerator, denominator,
exclusion, window, and provenance count.

## Gate 4: Collector v2

- Persist the local queue in durable encrypted storage and recover it after
  restart.
- Refresh roster and schedule context without requiring re-pairing.
- Capture participants, draft, items, runes, spells, objectives, ward/kill
  events, and normalized time snapshots where League client evidence supports
  them.
- Require post-game confirmation for ambiguous sides, unmatched players, and
  incomplete captures before analytics eligibility.
- Add idempotent uploads, device revocation, diagnostics export, signed Windows
  installer, and controlled updates.

Exit gate: blue/red, ambiguous, offline restart, duplicate upload, incomplete
game, recovery, and deep-linked review tests pass.

## Gate 5: integrations and platform operations

- Complete Discord OAuth installation, approved-channel selection, scheduled
  reminders, deduplication, retry visibility, and tenant-safe links.
- Build the platform-admin area for access requests, tenants, owner invitations,
  memberships, module state, collector health, and delivery failures.
- Add endpoint rate limits, structured errors, audit events, and recovery paths.
- Remove or secure remaining legacy monitoring, GRID, Riot, payment, and
  analytics Edge Functions.

## Final launch gate

- Repository-wide ESLint reaches zero errors. The active replacement routes are
  clean, but the legacy repository currently still fails this gate.
- Root and collector TypeScript, source contracts, analytics golden fixtures,
  collector tests, Supabase lint, Security Advisor, and production builds pass.
- Authenticated Playwright journeys pass at 1440 x 900, 1024 x 768, and
  390 x 844 for all roles and two isolated tenants.
- The replacement is shadow-tested against the existing client before cutover.

AI, payments, marketplace features, unvetted or cross-tenant scouting sources,
automated recommendations, and synchronized live drafting remain deferred.
