# Security and performance advisor review

Advisor findings are classified against active dashboard queries and server workflows. A warning is not removed solely to make the count smaller.

## Required before paid pilot

- Enable leaked-password protection and reduce email OTP lifetime in Supabase Auth.
- Upgrade the project to a currently supported patched Postgres release.
- Require JWT for user-triggered Edge Functions and a validated worker secret or signature for cron, collector ingest, and webhooks.
- Retire billing, deployment helper, placeholder analytics, legacy Solo Queue, and old monitoring functions with no active caller.
- Review each exposed `SECURITY DEFINER` function. Retain it only for a narrowly validated server or invitation workflow and revoke broad execution.
- Pair every new RLS policy with explicit Data API grants.

## Performance policy

- Resolve active-query missing indexes and repeated RLS initialization work.
- Document intentionally retained indexes with the query or constraint they support.
- Do not drop an index merely because the advisor reports it unused; production workload evidence is required.

Record the dated live-advisor export and resolution owner here before each pilot promotion.

## Live review — 26 July 2026

Security Advisor now reports 46 notices:

- 23 informational RLS-without-policy notices are intentional deny-by-default tables. They are server/worker-owned, operator-private, or retained legacy evidence; the authenticated role has no row policy path.
- 20 authenticated `SECURITY DEFINER` notices are retained transactional workflows or RLS membership helpers. Each validates the authenticated user and tenant/role before privileged work. Five compatibility RPCs and two Discord RPCs with no active caller had browser execution revoked in this release.
- Three project-level warnings remain operator actions: reduce OTP lifetime, enable leaked-password protection, and upgrade the vulnerable Postgres release. These cannot be truthfully closed by an application migration.

Performance Advisor improved from 234 to 150 notices:

- Active foreign-key coverage was added across coaching actions, notifications, collector web state, roster, scouting, invitations, Riot integration, and pilot operations. The four remaining foreign-key notices belong to quarantined Discord, old monitoring, or retired subscriber storage.
- Active tenant, membership, profile, roster, calendar, invitation, notification-preference, and coaching-action RLS policies were consolidated. Remaining auth-init and multiple-policy warnings belong to legacy `live_game_data`, `game_drafts`, `external_draft_tools`, `subscribers`, and `contact_submissions` paths outside the active release boundary.
- 127 unused-index notices are retained pending real pilot workload evidence. Newly added foreign-key indexes will naturally appear unused before traffic reaches them.
