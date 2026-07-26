# Competitive Platform Rollout

This release keeps ScrimStats private, tenant-owned, and evidence-led. Every
module is visible by default so the replacement application can be tested as
one product. Release labels remain independent of access: Beta and Planned
surfaces must continue to describe their real maturity.

## 1. Database checkpoint

Apply:

```text
supabase/migrations/20260724170000_competitive_platform_foundation.sql
supabase/migrations/20260724180000_enable_competitive_modules_by_default.sql
supabase/migrations/20260724190000_competitive_workflow_rpcs.sql
supabase/migrations/20260724200000_residual_anon_helper_lockdown.sql
supabase/migrations/20260724201000_competitive_workflow_completion.sql
```

The migration is additive. It introduces tenant feature access, private
scouting evidence, preparation snapshots, draft scenarios, team-trend
aggregation, opponent links on scrims, and the integration outbox.

`20260724113000_production_access_hardening.sql` and
`20260724173000_legacy_privileged_api_lockdown.sql` were applied after the
replacement-client caller audit. Self-service workspace creation, unrestricted
mailing/subscriber inserts, and dormant browser-callable privileged RPCs are
closed.

The rollback-only production verification is recorded in
`COMPETITIVE_PLATFORM_VERIFICATION.md`.

## 2. Feature access

The migration defaults modules as follows:

| Module | State | Enabled |
| --- | --- | --- |
| Operations | Live | Yes |
| Team analytics | Beta | Yes |
| Scouting | Beta | Yes |
| Draft preparation | Planned | Yes |
| Desktop collector | Live | Yes |
| Discord | Planned | Yes |

The additive `20260724180000` migration enables missing and existing module
rows for every tenant. Discord remains safe before installation: the scheduling
trigger skips its outbox unless an approved installation and channel
subscription exist.

## 3. Permission checks

Use two independent controlled tenants and accounts representing owner, admin,
member, viewer, and revoked access.

- Owners/admins can maintain opponent evidence, living tendencies, briefs, and
  draft scenarios.
- Members/viewers cannot read living scouting evidence.
- Members/viewers can read only published or archived preparation snapshots and
  their published scenarios.
- Published briefs and scenarios cannot be edited in place; staff create a new
  revision.
- Cross-tenant opponent, evidence, brief, scenario, scrim, and event references
  must fail.

## 4. Analytics checks

Verify the team-trend RPC against known saved games:

- Only completed games with an explicit `win` or `loss` enter performance
  calculations.
- Incomplete completed games are returned as `excluded_games`.
- Collector and manual counts add up to the recorded-game denominator.
- Date filters, side splits, formats, opponents, and roster participation match
  the controlled source rows.
- Empty samples display insufficient evidence rather than a zero performance
  claim.

## 5. Discord preparation

Discord remains planned but is implemented for controlled delivery testing.
Deploy `discord-install`, `discord-channels`, `discord-schedule-reminders`, and
`discord-dispatch`, then configure Edge Function secrets only:

```text
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
DISCORD_DISPATCH_SECRET
DISCORD_BOT_TOKEN
SCRIMSTATS_APP_URL
```

Call `discord-schedule-reminders` from a scheduled server request, then call
`discord-dispatch`; both require `DISCORD_DISPATCH_SECRET`. Messages contain
scheduling context and authenticated ScrimStats links only. Scouting and review
content never enters Discord.

Legacy AI, Riot, GRID, SoloQ, and payment functions are no longer granted
explicit unauthenticated configuration in `supabase/config.toml`. Do not
redeploy those legacy directories; remove already-deployed copies from the
Supabase project after confirming no production client still calls them. Apply
the separate legacy-lockdown migration in the same audited maintenance window.

## 6. Promotion gate

Promote one module at a time only after:

- database lint and security advisors are clean;
- two-tenant RLS tests pass;
- owner/admin/member/viewer browser journeys pass;
- existing roster, scheduling, collector, and review flows remain healthy;
- no route displays mock records, unsupported metrics, or nonfunctional actions.
