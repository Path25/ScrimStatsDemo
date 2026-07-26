# Managed pilot runbook

## Admission checklist

1. Confirm the operator is present in `platform_operators`.
2. Provision one workspace and its initial owner through `/ops`.
3. Confirm timezone, enabled modules, workspace Riot credential, and capture profile.
4. Send and verify owner, admin, member, and viewer invitations.
5. Complete one rehearsal: availability, scheduling, reminders, review, coaching action, and publication.
6. Confirm collector web state is honest for paired, offline, revoked, and unavailable cases.
7. Review notification delivery failures and recent API, Auth, and Edge logs.

## Pilot support

- Record issues as support cases and attach the visible support reference.
- Use operator notes for internal context; do not place credentials or Riot payloads in notes.
- Escalate security, cross-tenant, data-loss, and invitation-account mismatches immediately.
- Do not delete an Auth user to revoke workspace access. Revoke membership and archive/unlink the roster record.

## Release verification

- Run `npm run verify` and the configured authenticated Playwright journeys.
- Run Supabase database tests/lint and review Security and Performance Advisors.
- Confirm `collector-status`, invitation delivery, notification worker, and pilot operations functions are deployed from the tested revision.
- Confirm public metadata, assets, routes, and build revision on `scrimstats.gg`.
