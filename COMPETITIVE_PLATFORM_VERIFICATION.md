# Competitive Platform Verification

Checkpoint: 24 July 2026

## Hosted Supabase rollout

Applied successfully to project `tvcgjehreaayfazlhvps`:

```text
invited_team_collector_beta
production_access_hardening
competitive_platform_foundation
enable_competitive_modules_by_default
competitive_workflow_rpcs
legacy_privileged_api_lockdown
residual_anon_helper_lockdown
competitive_workflow_completion
```

Post-migration checks:

- 107 of 107 tenants have feature-access records.
- 642 module records are enabled: six per tenant.
- Scouting, preparation, draft, analytics, and integration contracts exist.
- Anonymous `SECURITY DEFINER` execution warnings are cleared.
- Unrestricted mailing-list and subscriber inserts are cleared.

## Rollback-only RLS checks

The following checks ran inside transactions that ended with `ROLLBACK`. No
verification records were retained.

- Owner read: six own feature rows and zero rows from an unrelated tenant.
- Owner write: own-tenant opponent creation succeeded.
- Cross-tenant write: rejected with SQLSTATE `42501`.
- Cross-tenant composite reference: rejected with SQLSTATE `23503`.
- Member write: rejected with SQLSTATE `42501`.
- Viewer write: rejected with SQLSTATE `42501`.
- Member/viewer private scouting evidence: zero visible rows.
- Member/viewer draft briefs: zero visible rows.
- Member/viewer published brief: one visible row.
- Revoked membership: zero feature and brief rows.
- Filtered analytics RPC: returned the required sample, filter, provenance, and
  exclusion contract.
- Transactional brief creation: one brief and one selected evidence link were
  created together.

## Edge Function deployment

Deployed and active:

```text
discord-install
discord-channels
discord-schedule-reminders
discord-dispatch
```

They remain inert until Discord and dispatch secrets are configured.
`discord-install` uses authenticated membership checks for installation start
and hashed, expiring, single-use state for its public OAuth callback.
`discord-schedule-reminders` and `discord-dispatch` require the private dispatch
secret.

## Remaining hosted-project actions

Supabase Security Advisor still reports project-level actions:

- Reduce email OTP expiry below one hour.
- Enable leaked-password protection.
- Upgrade the hosted Postgres version to the latest patched release.

Authenticated `SECURITY DEFINER` notices remain for permission-checked mutation
RPCs and RLS helpers. They are intentional and each retains explicit internal
role checks or is required by an RLS policy.

## Remaining product verification

- Run real authenticated browser journeys with a controlled owner, admin,
  member, viewer, and revoked account.
- Deploy and configure the Discord Edge Functions before delivery testing.
- Verify collector capture and post-game review against a controlled practice
  block.
- Complete repository-wide legacy-code removal or lint cleanup; active
  replacement modules already pass focused lint.
