# WO-2026-025 - Add tenant-safe Discord `/scrim` practice-block creation

- **ID reservation:** [WO-2026-025 registry row](../WORK_ORDER_INDEX.md)
- **Status:** Backlog
- **Assigned owner:** Core Features Developer
- **Size:** L
- **Risk:** High
- **Priority:** Medium
- **Autonomy class:** Needs Theo's approval before release

## Delivery routing

- **Area / files likely affected:** A new `discord-interactions` Edge Function; Discord shared server helpers; Discord integration Settings/UI; canonical practice-block creation path; new interaction-receipt and Discord-role access tables/RLS/RPCs; `docs/launch/EDGE_FUNCTION_MANIFEST.md`; contract tests and QA runbook.
- **Dependencies:** WO-2026-001 closed conditionally on 2026-07-31 under Theo's accepted-risk decision; it is no longer a sequencing dependency. Reconfirm the dated implementation approval before dispatch because this is a separate L/high-risk inbound-provider feature. External configuration and release approvals remain separate.
- **Collision risk:** High. Do not overlap with any reopened Discord shared-helper, integration UI, module-gate, outbox, or Edge Function manifest work; coordinate with the WO-001 owner if that work order is reopened.

## Problem and user impact

The accepted Discord direction includes a staff member creating a canonical ScrimStats practice block through `/scrim`. No interaction endpoint, signature validation, guild-role mapping, idempotency receipt, or safe Discord-to-ScrimStats mutation path exists. Keeping it inside WO-2026-001 has mixed a new L/high-risk inbound provider feature with the outbound notification release audit, causing unclear completion criteria and repeated developer handoffs.

## Why now

The feature has founder approval but must not keep the outbound Discord reliability work open indefinitely. Splitting it establishes a bounded implementation/release path and lets WO-2026-001 return to QA on its original delivery outcome.

## Scope

- Build a signed Discord Interactions endpoint that returns PONG to valid PING requests and supports only the approved `/scrim` command.
- Require valid Discord Ed25519 verification, the installed guild, current Elite plus live/enabled Discord entitlement, and one configured permitted Discord role.
- Allow workspace owner/admins to configure permitted roles through a tenant-scoped, server-enforced workflow. Do not trust browser metadata or arbitrary Discord users.
- Persist provider interaction receipts for idempotency and create exactly one canonical practice block through the established server-side scheduling path.
- Reject duplicate interactions, wrong guilds, unauthorised roles, disabled/revoked workspaces, invalid signatures, and overlapping active practice blocks with safe ephemeral responses.
- Queue only the existing opted-in outbound notice from the resulting canonical block; do not create a separate scheduling source.

## Explicit non-goals

- Do not use native Discord Scheduled Events, free-form message commands, DMs, or arbitrary Discord guild users.
- Do not configure the Discord Interactions Endpoint URL, `DISCORD_PUBLIC_KEY`, command registration, provider credentials, customer modules, or customer guilds during implementation.
- Do not replace ScrimStats as the canonical schedule, alter billing/plan prices, or permit Free/Pro workspaces to use the command.
- Do not broaden the command beyond one practice-block create flow or add player/review/scouting content to Discord.

## Acceptance criteria

- A valid signed PING returns the protocol-correct PONG; invalid/missing signatures fail before any tenant or schedule lookup.
- A valid `/scrim` creates exactly one canonical practice block only for an Elite workspace with a live/enabled Discord module, installed matching guild, and a configured permitted Discord role.
- Replay, wrong guild, missing role, Free/Pro, disabled/revoked module, invalid signature, and schedule-overlap cases create no block and return safe ephemeral responses.
- The interaction receipt makes repeated delivery idempotent; a successful command creates no duplicate outbox event beyond the one canonical schedule notification permitted by current subscription settings.
- Owner/admin role configuration is tenant-scoped; non-manager and cross-tenant attempts fail below the browser layer.
- Required evidence: focused contracts, RLS/grants/function review, local tests, authenticated browser configuration checks, then approved isolated-hosted Discord interaction verification.

## Relevant files, workflows, or data areas

- Existing outbound baseline: `supabase/functions/discord-install/`, `discord-config/`, `discord-dispatch/`, `discord-schedule-reminders/`, `supabase/functions/_shared/collector.ts`
- Scheduling and integration UI: `src/pages/Integrations.tsx`, `src/components/integrations/DiscordScheduleIntegration.tsx`, canonical scrim/practice-block server workflow
- Database: `tenant_feature_access`, `discord_installations`, `integration_events`, new interaction receipts and role-access records, RLS policies and grants
- Evidence: `scripts/discord-elite-contract.test.mjs`, `docs/operations/DISCORD_DELIVERY_SUPPORT.md`, `docs/launch/EDGE_FUNCTION_MANIFEST.md`, `AGENTS.md`

## Risks

- **Permissions / Supabase RLS:** High. This is a public external-provider mutation endpoint. Signature verification, tenant/guild/role matching, idempotency, RLS, function grants, and server-side entitlement must all hold independently of browser UI.
- **Billing / entitlement:** High. Require Elite plus Discord `live` and enabled state below the browser; direct endpoint calls must not bypass it.
- **Email / customer communication:** Not applicable.
- **Production / data:** High. It writes canonical schedule data and may queue outbound messages. No endpoint/configuration/command registration/test invocation without Theo's explicit release-stage approvals.

## Required validation

- Focused contract tests for PING, Ed25519 signature rejection, entitlement, guild/role, replay, overlap, canonical creation, and outbox idempotency.
- A two-tenant test matrix with owner/admin/member/viewer and permitted/unpermitted Discord roles; direct endpoint and direct data/RPC mutation denial tests.
- ESLint with zero warnings, TypeScript, production build, migration/RLS/grant/function-security review, and Supabase Advisor review.
- After separate Theo approval: isolated test-server endpoint configuration, command registration, and hosted signed PING plus `/scrim` verification with a non-customer workspace only.

## QA scenario / reproducible test steps

1. Prepare isolated Elite/live/enabled tenant A with a private installed guild, one permitted Discord role, and a non-customer workspace; prepare tenant B and Free/Pro controls.
2. Send valid and invalid signed PING requests; then invoke `/scrim` as a permitted role for an unoccupied time.
3. Confirm one canonical practice block and at most one eligible outbound event. Replay the same interaction and confirm no additional block/event.
4. Exercise wrong guild, missing role, Free/Pro, disabled/revoked module, malformed signature, and overlap; confirm safe ephemeral denial and no mutation.
5. Verify owner/admin role configuration works only for their tenant and member/viewer/cross-tenant attempts fail. Record request IDs, function version, database counts, and browser/hosted evidence without credentials.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Maintain split from WO-2026-001 and enforce configuration/release gates. | This work order. |
| Developer – Fast Lane | Not applicable | L/high-risk external mutation, Supabase, and shared integration work. | N/A |
| Core Features Developer | Involved | Implement bounded endpoint, schema, RLS, and tests without provider activation. | PR/commit and validation handoff. |
| QA and Release Auditor | Involved | Independently audit signature, role, tenant, idempotency, and hosted command matrix. | Release audit evidence. |
| Technical Reporting Analyst | Not applicable | No reporting change beyond existing operational logs. | N/A |
| Lead Marketer and Growth | Not applicable | No public claim before hosted evidence and Theo release approval. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Signed endpoint and safe `/scrim` creation | Not implemented | Proposed | Outstanding |
| Role, tenant, entitlement, replay, and overlap denial | Not implemented | Proposed | Outstanding |
| Canonical block and bounded outbox behaviour | Not implemented | Proposed | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** This is a newly separated scope. No inbound interaction endpoint, data model, or hosted validation exists.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Finish WO-2026-001 outbound-status correction | Core Features Developer / QA | WO-001 developer and QA handoff | Open |
| Implement secure interaction path | Core Features Developer | PR/commit and local validation | Open |
| Configure/test endpoint and command | Theo / QA | Explicit approval, hosted test evidence | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved | 2026-07-30 | Approved as the `/scrim` extension originally recorded in WO-2026-001; now separately tracked. |
| External configuration / test invocation | Yes | Pending | 2026-07-30 | Requires endpoint URL, public key, command registration, and one private-server invocation approval. |
| Release | Yes | Pending | 2026-07-30 | No customer deployment or Elite availability claim. |

## Decision and approval record

- 2026-07-30 - Split from WO-2026-001 to prevent the outbound Discord delivery work and the new inbound `/scrim` workflow from sharing an ambiguous completion boundary.

## Implementation and review evidence

- WO-2026-001 QA verified no `discord-interactions` Function, interaction receipt table, Discord-role access model, or command-configuration UI currently exists.
- **Highest evidence achieved:** Proposed
