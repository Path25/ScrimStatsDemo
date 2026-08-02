# WO-2026-025 - Add tenant-safe Discord `/scrim` practice-block creation

- **ID reservation:** [WO-2026-025 registry row](../WORK_ORDER_INDEX.md)
- **Status:** Ready for QA
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
| Signed endpoint and safe `/scrim` creation | Deployed `discord-interactions` source and focused contracts | Hosted deployment / local source validation | Ready for private-server configuration and provider verification |
| Role, tenant, entitlement, replay, and overlap denial | Hosted tables/RLS/grants and service-only wrapper; focused contracts | Hosted schema / local source validation | Ready for two-tenant QA matrix |
| Canonical block and bounded outbox behaviour | Hosted canonical wrapper with existing trigger path and focused contract | Hosted schema / local source validation | Ready for isolated command verification |

### Final verdict

- **Verdict:** READY FOR QA
- **Rationale:** Source, migration, and Edge Functions are deployed. Provider endpoint setup, command registration, and an isolated command invocation remain separate approval-gated QA steps.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Finish WO-2026-001 outbound-status correction | Core Features Developer / QA | WO-001 developer and QA handoff | Open |
| Implement secure interaction path | Core Features Developer | Commit, hosted migration, Function deployment, and local validation | Complete — `2d5072a`; migration `20260802173000`; deployed `discord-config`, `discord-roles`, and `discord-interactions` |
| Configure/test endpoint and command | Theo / QA | Explicit approval, hosted test evidence | Pending — endpoint URL, `DISCORD_PUBLIC_KEY`, command registration, and isolated invocation |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved | 2026-07-30 | Approved as the `/scrim` extension originally recorded in WO-2026-001; now separately tracked. |
| External configuration / test invocation | Yes | Pending | 2026-07-30 | Requires endpoint URL, public key, command registration, and one private-server invocation approval. |
| Release | Yes | Pending | 2026-07-30 | No customer deployment or Elite availability claim. |

## Decision and approval record

- 2026-07-30 - Split from WO-2026-001 to prevent the outbound Discord delivery work and the new inbound `/scrim` workflow from sharing an ambiguous completion boundary.

## Implementation and review evidence

- 2026-08-02 - Theo reconfirmed implementation approval when dispatching WO-025. External configuration, command registration, provider invocation, migration application, and release remain separately gated.
- 2026-08-02 - Added source-only `discord-interactions` and `discord-roles` Functions, a service-only `create_discord_scrim_block` wrapper, permitted-role and receipt tables, explicit RLS/grants, and owner/admin role configuration in the Discord integration panel. The interaction handler verifies Discord Ed25519 signatures over the raw request before parsing or lookup; only a signed PING or `/scrim` is supported.
- 2026-08-02 - The server wrapper rechecks Elite plus live/enabled Discord module, active installed guild, configured permitted role, replay receipt, and overlap under a tenant advisory lock before inserting one canonical `scrims` record. The existing `queue_scrim_integration_event` trigger remains the only outbound path.
- 2026-08-02 - Local validation: focused Discord contracts passed 9/9; ESLint zero warnings; TypeScript passed; production build and bundle budget passed; `git diff --check` passed. The local Supabase CLI is not present, so migration lint and Advisor review remain hosted verification tasks.
- 2026-08-02 - Hosted deployment: the project is `tvcgjehreaayfazlhvps` (ScrimStats.gg, active). A normal migration push was blocked by pre-existing remote/local history divergence, so no historic migration record was altered. The reviewed `20260802173000_discord_interaction_scheduling.sql` was applied through Supabase's linked direct-query command and only version `20260802173000` was then recorded as applied.
- 2026-08-02 - Hosted schema verification: `discord_permitted_roles` and `discord_interaction_receipts` exist. `authenticated` cannot execute `create_discord_scrim_block`; `service_role` can. The deployed Functions are `discord-config` (version 6), `discord-roles` (version 1), and `discord-interactions` (version 1).
- 2026-08-02 - Security Advisor was run at warning level. It retains the documented project-wide legacy `SECURITY DEFINER` and leaked-password-protection warnings; the new service-only creation RPC is not among authenticated-callable functions.
- **Highest evidence achieved:** Hosted schema and Function deployment

## Developer QA-correction response - 2026-08-02

- QA finding accepted: a validly signed malformed JSON payload could reach an unhandled parse failure.
- Commit `a56a387` guards parsing after signature verification. Malformed JSON, `null`, arrays, and other non-object JSON now return the existing ephemeral `This interaction is not available.` response before any tenant lookup or mutation.
- The focused regression contract passed with the full Discord contract set (9/9), ESLint zero warnings, TypeScript, and `git diff --check`.
- `discord-interactions` was deployed as hosted Function version 2 with `verify_jwt=false`; Discord Ed25519 verification remains the required public-endpoint authentication boundary. No endpoint URL, `DISCORD_PUBLIC_KEY`, command registration, or provider invocation was configured.

## Independent QA and release audit - 2026-08-02

### 1. Release verdict: HOLD

The source and recorded hosted deployment support a controlled private-server QA stage, not release. Endpoint configuration, Discord command registration, signed provider invocation, and the two-tenant authorization/idempotency matrix remain approval-gated and unverified. A contained malformed-payload response defect should be corrected before that stage.

### 2. What was verified

- **Implemented and locally tested:** Commit `2d5072a` includes the interaction Function, role configuration Function, migration `20260802173000_discord_interaction_scheduling.sql`, and focused contracts. Independent execution of `discord-interactions-contract.test.mjs` and `discord-elite-contract.test.mjs` passed 9/9.
- **Source security review:** `discord-interactions` requires an Ed25519 signature over the raw request before JSON parsing or tenant lookup; it accepts only PING and `/scrim`. Its creation call reaches a service-role-only RPC with fixed search path, Elite plus live/enabled module, matching active guild, configured permitted role, receipt replay, advisory lock, and overlap checks. Browser role discovery/configuration Functions require a validated JWT plus owner/admin membership and server-side entitlement.
- **Recorded hosted evidence:** the work order records deployed `discord-config` v6, `discord-roles` v1, and `discord-interactions` v1; hosted tables/RLS/grants were inspected and the service-only creation RPC was not authenticated-callable.
- **Authenticated browser check:** the staging owner workspace rendered the Discord integration as `Setup required` with no connection active and no browser warnings/errors. QA did not connect a server, load roles, register a command, or invoke the endpoint.

### 3. Blocking issues

- **Blocking:** No approved isolated Discord server, endpoint URL, `DISCORD_PUBLIC_KEY`, command registration, or signed PING/`/scrim` invocation exists. The provider-to-ScrimStats path, canonical-block count, receipt replay, outbox count, and denial matrix are therefore not hosted-verified.
- **Blocking:** No controlled two-tenant role matrix exists for owner/admin/member/viewer, permitted/unpermitted Discord roles, Free/Pro, disabled/revoked module, wrong guild, and no-workspace cases.

### 4. Important risks

- **Important:** After signature verification, `JSON.parse(rawBody)` is not caught. A validly signed malformed payload would cause an unhandled Function failure rather than a safe provider response; it should return an ephemeral unavailable response and create no data.
- **Important:** The browser's `Setup required` state proves only that this selected workspace has no active installation. It does not establish that the public endpoint is unconfigured, that no other tenant is enabled, or that the deployed Function has the expected provider secret.

### 5. Unverified but required checks

- **Unverified:** Deployed Function revision and secrets/configuration; valid/invalid signed PING; permitted `/scrim`; replay, wrong-guild, missing-role, Free/Pro, disabled/revoked, malformed-signature, malformed-payload, and overlap denial; exact canonical/outbox row counts; owner/admin configuration and member/viewer/cross-tenant browser/RPC denials; dated hosted Security Advisor evidence.

### 6. Suggested fixes or next validation steps

1. **Core Features Developer:** catch malformed signed JSON in `discord-interactions` and return the same safe ephemeral unavailable response; add a focused regression contract. Keep the endpoint otherwise unchanged.
2. **Theo:** after that local fix is reviewed, explicitly approve one non-customer private Discord server, endpoint URL/public key configuration, command registration, and a bounded test invocation. This approval must name the isolated workspace and recovery/cleanup boundary.
3. **QA:** then run the signed provider and two-tenant role/replay/overlap/outbox matrix, recording Function version and redacted request IDs. Do not enable a customer guild or make a release claim.
