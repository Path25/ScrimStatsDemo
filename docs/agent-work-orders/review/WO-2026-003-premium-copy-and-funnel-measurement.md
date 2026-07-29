# WO-2026-003 - Protect premium copy and establish funnel measurement

- **Status:** Review
- **Owner:** QA and Release Auditor
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Problem and user impact

Customer-visible encoding corruption undermines ScrimStats' premium quality bar. The business also needs reliable evidence from registration through activation and paid conversion rather than registration counts alone.

## Why now

First impressions and commercial acquisition are the stated primary blockers, while the 30-day objective depends on real subscriptions.

## Scope

Remove customer-visible encoding defects, expand copy-integrity checks, define privacy-preserving funnel milestones, and surface an approved founder scorecard from authoritative data.

## Explicit non-goals

- A marketing campaign or customer outreach.
- Collecting Riot credentials, player records, game payloads, IP addresses, or free-form tracking metadata.
- Publishing or changing public claims without approval.

## Acceptance criteria

- Customer-facing source and rendered screens contain no encoding corruption.
- Copy-integrity checks cover public, authentication, billing, and workspace customer surfaces.
- Funnel definitions are documented and derive from authoritative server-side events.
- The scorecard distinguishes unavailable data from measured values.

## Relevant files, workflows, or data areas

- `src/pages/Landing.tsx`, `src/components/billing/BillingPanel.tsx`, `src/components/integrations/RiotApiIntegration.tsx`, `index.html`
- `scripts/premium-copy-integrity.test.mjs`, `scripts/funnel-instrumentation-contract.test.mjs`
- `supabase/migrations/20260728103000_premium_copy_and_funnel_instrumentation.sql`
- `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`

## Risks

- **Permissions / Supabase RLS:** Funnel events and scorecard functions must remain service-only unless a separately authorized role is designed.
- **Billing / entitlement:** Paid-upgrade events must reconcile with Stripe rather than infer revenue from plan labels.
- **Email / customer communication:** Copy changes can affect transactional emails and public claims.
- **Production / data:** Analytics must be privacy-preserving, release-safe, and not backfill or mutate customer records unexpectedly.

## Required validation

- Targeted copy and funnel contract tests, lint, typecheck, production build, and browser checks.
- Migration/RLS/function review and Supabase advisor check.
- Hosted verification using a dedicated test workspace, with no sensitive event payload retained.

## Decision and approval record

- 2026-07-28 - Proposed from founder review.
- 2026-07-28 - Theo approved implementation: "I approve WO-003, it is safe to implement." Hosted migration application, deployment, production-data changes, billing changes, and customer communications remain unapproved.
- 2026-07-28 - Theo approved the canonical activation definition: first scheduled practice block plus first completed recorded game.
- 2026-07-28 - Theo approved application of the reviewed additive funnel migration to production. No production test-data creation, billing changes, or customer communications are approved by this decision.
- 2026-07-28 - Theo approved isolated non-customer hosted test-workspace verification for the reviewed migration and funnel workflow. This does not authorise customer-data changes, billing changes, customer communications, or a production release beyond the separately recorded migration decision.

## Implementation decision

- Activation is defined as a workspace having both its first scheduled block and first recorded game.
- A paid upgrade is recorded only after the workspace subscription transitions from Free to an `active` Pro or Elite subscription. Checkout intent, failed payment, and past-due state do not count.
- Funnel milestones are first-party, append-only, service-only events derived from authoritative database writes. They retain no email, IP address, device identifier, Riot credential, player record, game payload, or free-form tracking metadata.

## Implementation and review evidence

- Added `supabase/migrations/20260728103000_premium_copy_and_funnel_instrumentation.sql` with service-only funnel storage, RLS, idempotent triggers, and `get_founder_funnel_scorecard`.
- Added `scripts/premium-copy-integrity.test.mjs` covering `src/`, `public/`, `index.html`, Auth templates, and the shared transactional-email renderer.
- Added `scripts/funnel-instrumentation-contract.test.mjs` covering milestone sources, privacy bounds, idempotency, RLS, and service-only scorecard access.
- Local verification on 2026-07-28: 164/164 tests passed; TypeScript passed; ESLint passed with zero warnings; production build and bundle budget passed; desktop, 768px tablet, and 390px mobile public-route checks passed with no horizontal overflow or error overlay.
- Source inspection found no stored mojibake in the named customer surfaces; the observed terminal rendering issue was not a source-encoding defect. The new integrity test protects against a real regression.
- **Highest evidence achieved:** Browser verified

## Review and release blockers

- The migration was applied to production as `20260728154602` (`premium_copy_and_funnel_instrumentation`) on 2026-07-28. This is schema/deployment evidence, not workflow evidence.
- QA production review confirmed `workspace_funnel_events` has RLS enabled, no `anon` or `authenticated` table privileges, and `get_founder_funnel_scorecard` executable only by `service_role`. All five intended triggers are enabled.
- QA production review found no retained funnel events yet. No account/workspace/schedule/game/upgrade workflow can therefore be inferred as exercised after migration application.
- **Important:** the table is not truly append-only for the service role: it retains DELETE, UPDATE, TRUNCATE, REFERENCES, and TRIGGER privileges in addition to SELECT and INSERT. Theo must explicitly approve a corrective production migration before those privileges are narrowed.
- Supabase Advisor reports `workspace_funnel_events` as RLS-enabled-with-no-policy. This is expected for the current service-only design because browser roles have no table grants; it is not evidence of browser access. The advisor also contains pre-existing project-wide findings that are outside this work order.
- QA must still verify, in the approved isolated non-customer workspace, registration, workspace creation, first schedule, first completed recorded game, activation, active paid upgrade, retry idempotency, service-only scorecard access, and browser-role denial before release approval.

## QA audit update - 2026-07-28

- **Verdict:** HOLD
- **Verified:** Production migration presence; trigger enablement; RLS; browser-role denial for the table and scorecard function; no post-migration events in the aggregate ledger.
- **Blocking:** No isolated hosted workflow has exercised the milestone triggers or scorecard. The scorecard has no implemented authenticated founder surface, so it cannot yet distinguish unavailable data from measured values for its intended operator.
- **Important:** Service-role write privileges contradict the claimed append-only ledger. Correct by migration only after Theo's explicit production approval.
- **Accepted by Theo:** Hosted paid-upgrade / Stripe lifecycle verification is accepted for this work order on 2026-07-28 because Theo confirmed that the Stripe system had been completed and verified previously. This exception applies only to WO-2026-003; it does not resolve or change the separate Stripe-to-entitlement reconciliation HOLD in WO-2026-008.
- **Unverified:** Registration, workspace creation, first schedule, first completed recorded game, activation, retries/idempotency in hosted use, browser responsive states for a scorecard surface, and any hosted deployment that exposes a founder scorecard safely.
