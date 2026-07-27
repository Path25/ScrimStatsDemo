# Security and performance advisor review

Advisor findings are classified against active dashboard queries and server workflows. A warning is not removed solely to make the count smaller.

## Required before public launch

- Enable leaked-password protection in Supabase Auth.
- Require JWT for user-triggered Edge Functions and a validated worker secret or signature for cron, collector ingest, and webhooks.
- Retire billing, deployment helper, placeholder analytics, legacy Solo Queue, and old monitoring functions with no active caller.
- Review each exposed `SECURITY DEFINER` function. Retain it only for a narrowly validated server or invitation workflow and revoke broad execution.
- Pair every new RLS policy with explicit Data API grants.

## Performance policy

- Resolve active-query missing indexes and repeated RLS initialization work.
- Document intentionally retained indexes with the query or constraint they support.
- Do not drop an index merely because the advisor reports it unused; production workload evidence is required.

Record the dated live-advisor export and resolution owner here before each pilot promotion.

## Live review — 27 July 2026

Security Advisor reports 50 notices:

- 23 informational RLS-without-policy notices are intentional deny-by-default tables. They are server/worker-owned, operator-private, or retained legacy evidence; the authenticated role has no row policy path.
- 26 authenticated `SECURITY DEFINER` notices are retained transactional workflows or RLS membership helpers. Each must continue to validate the authenticated user and tenant/role before privileged work, with execution grants kept narrow.
- One project-level warning remains an operator action: enable leaked-password protection. The previous OTP-lifetime and vulnerable-Postgres warnings are resolved; the project is running PostgreSQL 17.6.1.147.

Performance Advisor reports 216 notices:

- Eight foreign-key findings require workload-based classification. Most belong to legacy or compatibility storage; active paths should receive indexes when query evidence supports them.
- Active tenant, membership, profile, roster, calendar, invitation, notification-preference, and coaching-action RLS policies were consolidated. Remaining auth-init and multiple-policy warnings belong to legacy `live_game_data`, `game_drafts`, `external_draft_tools`, `subscribers`, and `contact_submissions` paths outside the active release boundary.
- 188 unused-index notices are retained pending real production workload evidence. Newly added indexes will naturally appear unused before traffic reaches them.

Recent controlled checks returned only successful Edge Function and Data API responses. Re-check logs after the authenticated launch journeys and every production deployment.
