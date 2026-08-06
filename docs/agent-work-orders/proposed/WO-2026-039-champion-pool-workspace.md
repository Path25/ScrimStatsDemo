# WO-2026-039 - Build the Champion Pool Workspace

- **ID reservation:** [WO-2026-039 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Backlog
- **Assigned owner:** Core Features Developer
- **Size:** L
- **Risk:** High
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** Draft workspace routes/components, champion-pool domain/query/RPCs, player/role data, approved champion visual assets, Draft permissions/plan gates, tenant-scoped tables/RLS/functions, generated Supabase types, contracts, and operational docs.
- **Dependencies:** WO-2026-036 must reach a non-overlapping Core handoff before this begins; reviewed data/RLS/entitlement design; controlled Draft-eligible and ineligible role/tenant fixtures; Theo implementation approval. Migration application, deployment, customer activation, or plan/billing change requires separate approval.
- **Collision risk:** Shared Draft, champion-pool, player-role, Scouting/playbook, action, entitlement, and Supabase work. Do not run beside WO-2026-036 implementation, a broad Draft refactor, champion-catalogue/provider integration, or a change to Draft availability.

## Problem and user impact

Current Draft records champion-pool declarations as isolated player/champion rows with comfort and priority values. Staff cannot rapidly see the team pool as one spatial draft canvas, record declared pairings, or distinguish reliable blind/counter/conditional use without spreadsheets or informal notes.

## Why now

Champion pools are a natural staff workflow between roster management, Draft, and match preparation. A purpose-built canvas makes the existing structured declarations operationally useful while retaining an evidence-led, staff-owned approach.

## Scope

- Add a desktop-first **Champion Pool Workspace** inside the existing Draft area, retaining the existing Draft availability boundary unless Theo separately approves a plan change.
- Provide three sheets over one canonical tenant-scoped champion-pool record set:
  1. **Champion Pools:** a pan-and-zoom canvas with anchored role/player boards; draggable champion cards carry a staff-declared `S+`, `S`, `A`, `B`, or `C` tier.
  2. **Strong With:** staff-declared two-champion pairings between existing roster pool entries, with context, date/patch label where supplied, and staff note.
  3. **Draft Profiles:** staff labels for `B1`, `R5`, and `Conditional`; a condition is staff-authored reasoning such as `If Syndra is banned`, not a rule engine or recommendation.
- Preserve existing comfort `/10` and priority `/5` fields separately. Never infer a tier, draft profile, condition, or synergy from those values or external data.
- Provide a compact champion inspector for staff notes, declared tier, Draft-profile labels, declared conditions, and linked staff pairings.
- Staff roles edit; permitted non-staff roles receive a bounded read-only projection. The Core design must state exact role and field visibility before migration review.
- Support desktop editing. Initial mobile support is viewing and inspection only; dense canvas drag-and-drop editing is deferred.

## Explicit non-goals

- No automated champion recommendations, pairing scores, win/prediction claims, draft simulation, or rule engine.
- No Riot/API/provider activation, external champion-data ingestion, scraping, source-backed patch claims, VOD hosting, external learning resources, or provider credentials.
- No new plan/price/billing boundary, organisation-wide pools, cross-tenant intelligence, real-time collaborative cursors, comments, or full mobile canvas editing.
- No automatic historical match-plan snapshot; a later Draft-plan integration may capture a pool snapshot for a series.
- Do not replace or refactor the active WO-2026-036 opponent-preparation playbook workflow.

## Acceptance criteria

- An authorised staff user can create/update declared champion cards, move them between `S+` through `C` within their permitted role/player board, and retain the resulting canonical state after refresh.
- The role/player boards are readable and usable on desktop through pan/zoom and drag interactions; they do not require freeform drawing or arbitrary role-container placement.
- Staff can record a two-champion `Strong With` pairing and a `B1`, `R5`, or explicit `Conditional` draft profile using existing tenant-owned roster pool entries only.
- A visible `insufficient`/`not recorded` state appears where no staff declaration exists. The UI does not label a pairing or condition as factual, statistically strong, current, or recommended.
- Existing comfort/priority values remain intact and are not silently mapped to tiers or draft profiles.
- Authorised non-staff users can view only their permitted projection; Free/ineligible users, direct mutation attempts, and other tenants are denied below the browser layer.
- Existing Draft journeys, existing champion-pool entry path, and current plan availability remain intact.
- **Required evidence level:** local contracts, authenticated desktop/mobile browser checks, direct role/tenant/entitlement checks, migration/RLS/function/advisor review where needed, and hosted verification before any release claim.

## Relevant files, workflows, or data areas

- `src/pages/Draft.tsx`, Draft workspace components/hooks, `champion_pools`, player/role data, Draft plan gates, role capabilities, and tenant helpers.
- Existing champion visual-asset infrastructure; use approved existing product assets and retain a usable text fallback.
- `supabase/migrations/20260726153000_draft_workspace_completion.sql`, `supabase/migrations/20260726160000_draft_revisions_and_editing.sql`, related Draft migrations/RPCs, and `src/integrations/supabase/types.ts` (generated only after approved migration application).
- WO-2026-036, WO-2026-035 (parked; external source boundary), and `docs/operations/MESSAGE_LEDGER.md`.

## Risks

- **Permissions / Supabase RLS:** High. Champion pools and pairings are sensitive strategy. Every tenant-owned record/RPC must enforce membership, role, tenant predicate, and staff/non-staff field shaping; updates require `USING` and `WITH CHECK` where policies are used.
- **Billing / entitlement:** High. Preserve the existing Draft availability boundary and enforce it below the browser layer. Do not introduce a new Free/Pro/Elite claim or gate without Theo approval.
- **Email / customer communication:** Not applicable; no outbound notification, customer message, or public product claim is in scope.
- **Production / data:** High. New strategy records require a forward-only migration, recovery path, no destructive conversion of existing pool data, and explicit approval before hosted application.

## Required validation

- Focused champion-pool/canvas, pairing, Draft-profile, role-visibility, and plan-gate contracts; zero-warning ESLint, TypeScript, production build, and bundle budget.
- Migration/RLS/grant/function security and Advisor review for every database/function change. Reuse tenant membership/role helpers; do not decide access from user-editable metadata.
- Isolated browser matrix: Draft-eligible staff editor, permitted non-staff reader, Free/ineligible user, Pro/Draft-eligible control as applicable, and second tenant. Verify desktop editing and mobile read-only inspection separately.
- Verify existing pool comfort/priority preservation, no external request/provider credential exposure, no cross-tenant records, and no modification to existing Draft-plan or WO-2026-036 journeys.
- Hosted verification and Theo's separate release approval before any customer-availability statement.

## QA scenario / reproducible test steps

1. Prepare controlled non-customer tenant A with a Draft-eligible staff editor, permitted reader, existing player/champion-pool declarations, and tenant B. Prepare an ineligible plan/role control.
2. On desktop, create/update declared pool cards across two role boards; drag one card between tiers, refresh, and confirm tier, comfort, and priority retain distinct values.
3. Add one staff-declared two-champion pairing, one B1 label, one R5 label, and one Conditional label with staff-authored reasoning. Confirm missing evidence is honest and no external source/recommendation statement appears.
4. Repeat as read-only role, ineligible plan, and tenant B; verify direct/browser mutations/read access are denied or shaped appropriately. Inspect mobile view/inspector behaviour only.
5. Record deployed revision, screenshots, role/tenant/plan results, RLS/function/advisor evidence, console output, and recovery evidence without customer data or copied external content.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Preserve three-sheet scope, tier boundary, and sequencing behind WO-036. | This work order |
| Developer - Fast Lane | Not applicable | Shared Draft data, permissions, and database work is not S/Low isolated work. | N/A |
| Core Features Developer | Involved | Design/implement tenant-safe canonical records, canvas, role projection, and preserved Draft boundary. | Commit/PR and validation handoff |
| QA and Release Auditor | Involved | Run role/tenant/plan/browser and recovery evidence matrix. | QA evidence pack and verdict |
| Technical Reporting Analyst | Consulted | Confirm no unsupported performance/source claim or derived metric enters canvas. | Metrics/claim review |
| Lead Marketer and Growth | Consulted | Confirm claim boundary before any future public positioning. | Message Ledger review |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Canonical tier canvas and preservation | Contract, browser, and record evidence | Local / Hosted | Outstanding |
| Pairing and Draft-profile declaration boundary | Contract and browser evidence | Local / Hosted | Outstanding |
| Role, tenant, and plan protection | RLS/function/browser matrix | Hosted | Outstanding |
| No Draft regression or unsupported claim | QA comparison and Message Ledger review | Browser / Hosted | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The product definition is approved, but implementation is sequenced behind active Core Draft work. No schema, customer surface, entitlement, hosted evidence, or release approval exists.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Complete non-overlapping WO-2026-036 Core handoff | Core / PM | Handoff and collision review | Open |
| Approve implementation | Theo | Written implementation approval | Open |
| Design/implementation | Core Features Developer | Commit and local validation | Open |
| Hosted role/tenant/plan QA | QA and Release Auditor | Evidence pack and verdict | Open |
| Release approval | Theo | Separate approval after hosted QA | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Product definition | Yes | Approved | 2026-08-03 | Theo approved the Champion Pool Workspace concept and three-sheet v1 direction. |
| Implementation | Yes | Pending | - | Shared Draft, role, entitlement, and Supabase data change. |
| Release | Yes | Pending | - | Separate after hosted QA. |

## Decision and approval record

- 2026-08-03 - Theo requested exploration of an open-canvas Champion Pool Workspace: role-based pool tiers, declared pairings, B1/R5/conditional profiles, and staff-owned context.
- 2026-08-03 - Founder and PM agreed the v1 shape: Champion Pools, Strong With, and Draft Profiles sheets over one canonical pool; card tiers are staff-declared; conditions are staff-authored; Draft-plan snapshots and automation are deferred.
- 2026-08-03 - PM sequenced this after active WO-2026-036 to avoid overlapping Core changes to Draft, Scouting, permissions, and shared data.

## Implementation and review evidence

- Existing Draft records canonical player/champion/role entries plus declared comfort `/10` and priority `/5`, but presents them as rows and a single-entry dialog rather than a spatial workspace.
- Existing Draft and WO-2026-036 provide related shared surfaces; no conclusion is made that they are a suitable schema without Core's reviewed design.
- The visual concept is product exploration only. It creates no customer claim, provider/asset right, plan entitlement, or implementation evidence.
- **Highest evidence achieved:** Founder-approved product definition; no implementation.
