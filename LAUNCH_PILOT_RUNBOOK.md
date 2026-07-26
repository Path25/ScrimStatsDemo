# ScrimStats managed-pilot runbook

This runbook is the operational release boundary for the first paid pilot: one
competitive roster and its staff per workspace. The pilot is managed; it does
not use public sign-up, self-service billing, or automated tenant creation.

## Admit a pilot team

1. Review the access request and verify the named organisation, primary owner,
   League region, roster size, and capture host.
2. Create the tenant and owner invitation through the controlled admin workflow.
   Do not create a workspace from the browser or by granting a user a role
   directly in the database.
3. With the owner, add the five roster profiles, each player's Riot ID, tag
   line, region, and primary role. Confirm the collector-ready count is 5/5.
4. Invite staff with the least-privileged role required: owner/admin for
   operations, member/viewer for published preparation and review.
5. Create one controlled practice block, pair the trusted Windows capture host,
   and complete a short game or manual-entry rehearsal before the first live
   scrim.

## Readiness gate

- The roster, calendar, and first scrim block are visible only in the new
  tenant-safe workspace.
- The collector is paired to the intended tenant and shows its scheduled block.
- A manual game and a collector game both retain their different provenance.
- Unmatched or ambiguous captured participants are reconciled before their
  game is used in team analytics.
- Owner, admin, member, viewer, and revoked accounts have completed their
  access journeys in two isolated test tenants.

## Support and recovery

- Treat missing capture data as unavailable; never recreate or estimate it.
- The collector keeps its selected block, capture session, dedupe IDs, queued
  events, captured events, and last snapshot in Windows encrypted storage.
  Restart it and allow it to resume before asking a team to re-pair.
- Revoke a lost capture device before issuing a new pairing code.
- Collect the exported local diagnostics file for capture failures. Do not ask
  a player to share Riot credentials or browser session data.
- Keep Discord, advanced analytics, and future integrations as labelled
  roadmap previews until their full delivery, failure, and support paths pass.

## Promotion gate

Run the root production build, root contract and golden tests, collector build
and tests, Supabase lint/security review, and role-based browser journeys.
Admit the next pilot only after all failures from the current pilot have a
documented owner and recovery outcome.
