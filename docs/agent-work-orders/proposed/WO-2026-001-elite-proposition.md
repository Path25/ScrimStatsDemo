# WO-2026-001 - Define and deliver a credible Elite proposition

- **Status:** Proposed
- **Owner:** Unassigned
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Problem and user impact

Elite is priced above Pro, but its stated differentiator is Discord automation that is not yet a complete customer workflow. Teams have no dependable, present-day reason to upgrade.

## Why now

Elite subscriptions are part of the near-term commercial goal. Selling a placeholder benefit risks a weak first impression and avoidable support burden.

## Scope

Choose one immediate Elite job-to-be-done, then align the product contract, entitlement rules, customer copy, and support path with that decision.

## Explicit non-goals

- Building a broad new Elite feature suite.
- Changing prices or publishing marketing without explicit approval.
- Enabling Discord production delivery before its end-to-end workflow is verified.

## Acceptance criteria

- Elite has one approved, concrete customer outcome that is available or honestly labelled as early access.
- Billing, gates, workspace module state, and customer copy make the same promise.
- The support and failure path is documented for the approved outcome.

## Relevant files, workflows, or data areas

- `src/components/billing/BillingPanel.tsx`
- `src/lib/plan-entitlements.ts`
- `src/components/billing/PlanGate.tsx`
- `src/pages/Integrations.tsx` and `src/pages/Settings.tsx`
- `supabase/functions/discord-*`, `supabase/migrations/20260726171000_quarantine_discord_preview.sql`
- `scripts/billing-invitations-contract.test.mjs`

## Risks

- **Permissions / Supabase RLS:** Discord installation and channel configuration must remain tenant- and role-scoped.
- **Billing / entitlement:** UI, database, webhook, and server enforcement can diverge.
- **Email / customer communication:** Paid-plan claims may become inaccurate.
- **Production / data:** Accidentally enabling an incomplete Discord path could affect customer workspaces.

## Required validation

- Relevant contract tests, lint, typecheck, and production build.
- Authenticated owner/admin checks for gates and integration controls.
- Hosted verification of the approved Elite workflow and its unavailable/failure state.

## Decision and approval record

- 2026-07-28 - Proposed from founder review; no implementation approval recorded.

## Implementation and review evidence

- **Highest evidence achieved:** Proposed
