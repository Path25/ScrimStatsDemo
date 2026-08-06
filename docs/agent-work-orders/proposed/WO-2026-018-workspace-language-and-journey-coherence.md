# WO-2026-018 - Audit and improve League-native client language, copy, and encoding quality

- **ID reservation:** [WO-2026-018 registry row](../WORK_ORDER_INDEX.md)
- **Status:** In Progress
- **Assigned owner:** PM
- **Size:** M
- **Risk:** Low
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** Customer-visible authenticated and public product copy, empty/unavailable/upgrade states, Settings, Integrations, Overview, analytics gate, product-copy inventory, and follow-on work orders. Historical work orders, handoffs, code comments, test fixtures, and internal/operator documentation are evidence, not bulk-edit targets.
- **Dependencies:** PM audit findings and Theo approval for each resulting customer-facing copy/UX package; plan or entitlement claims require supporting evidence.
- **Collision risk:** Do not make broad copy changes during active work affecting the same routes, plan gates, Integrations, or workspace entry. Split isolated copy/encoding corrections from shared component, entitlement, state, or workflow changes; do not assign overlapping changes to both development lanes.

## Problem and user impact

The workspace can mix operational language with implementation terms such as "ScrimStats account", "workspace", "capture profile", and feature/module states. Some customer-visible text can appear to address Theo or an internal operator instead of the coach, manager, player, or organisation owner using the product. In addition, mojibake—visible encoding corruption such as `Ã`, `Â`, or malformed quote/dash characters—undermines trust immediately. These defects make the platform feel less League-native, less bespoke, and harder to act on.

## Why now

Premium sales readiness depends on coaches and managers understanding an immediate team-operations path without a guided call. Clear League-native language and clean text are a prerequisite for a polished first impression, before expanding features.

## Scope

- Audit customer-visible public and authenticated journeys: first workspace, roster, availability, first block, game capture/import, review, analytics, scouting, Draft, Integrations, Settings, and paid/unavailable states.
- Identify wording that should use familiar League team-operations terms, address the relevant team user directly, explain the operational next step, or retain technical terminology only where it affects safety, permissions, billing, or support.
- Perform a targeted source scan and browser review for customer-visible mojibake and malformed Unicode. Record the exact route/component/string and distinguish a live defect from internal historical evidence.
- Identify feature states that are confusing, redundant, contradictory, or inaccessible without purpose; propose keep, simplify, defer, or remove decisions backed by usage/evidence.
- Produce a ranked, route-and-string-specific backlog. Any customer-facing text/code changes become separately approved, non-overlapping developer work orders.

## Explicit non-goals

- Do not mass-rewrite copy, remove modules, change permissions, alter billing language, or publish marketing claims.
- Do not replace precise League terminology with generic esports/SaaS language, or turn honest unavailable/planned states into promotional wording.
- Do not hide data limitations or bulk-normalise historical/internal technical text merely because it contains encoding artefacts.
- Do not use fabricated examples or generic SaaS language.

## Acceptance criteria

- A journey map identifies the first meaningful action and success state for coach/manager, player/viewer, and owner contexts.
- Every finding is classified as isolated copy/encoding, UX/state, shared component, feature-purpose, entitlement/billing, security-sensitive, or public-marketing.
- Every encoding finding records the visible customer surface, exact corrupted string, intended character, source of truth, and a regression-test route where practical.
- The backlog is ranked by Pro conversion, frequency, trust risk, and implementation cost.
- No recommendation weakens evidence transparency, tenant safety, or paid-access truthfulness.

## Relevant files, workflows, or data areas

- `src/pages/Overview.tsx`, `Settings.tsx`, `Integrations.tsx`, `Analytics.tsx`, `CollectorWorkspace.tsx`, and customer-visible route/component copy discovered by the inventory.
- `src/components/layout/DashboardLayout.tsx`, workspace state and header components.
- Current work-order release audits, `docs/launch/RELEASE_BOUNDARY.md`, `docs/operations/PILOT_RUNBOOK.md`, and `docs/operations/MESSAGE_LEDGER.md`.

## Risks

- **Permissions / Supabase RLS:** Copy must not imply a role can perform an action it is not authorised to perform.
- **Billing / entitlement:** Upgrade/gating language must match the authoritative server-side contract and release evidence.
- **Email / customer communication:** In-workspace and public-page changes are customer-facing and require review before release; no outbound communication is in scope.
- **Production / data:** No data change; do not remove recovery/support detail that users need.

## Required validation

- Targeted customer-visible source scan for mojibake and malformed Unicode, followed by browser verification of every corrected route/state.
- Authenticated role-by-role journey review, starting with owner/manager and a Free/Pro comparison.
- Cross-check every paid, availability, or safety-related phrase against plan, RLS, Message Ledger, and release evidence.
- Theo approves each grouped implementation package before code or customer-facing changes begin.

## QA scenario / reproducible test steps

1. Inventory customer-visible text from the key journeys for an owner/manager, player/viewer, and Free/Pro workspace.
2. Record every unclear, founder/internal-facing, non-League-native, or mojibake string with its route, component, state, intended audience, and proposed wording.
3. Check the proposal against actual role, entitlement, availability, and support evidence; retain precise technical wording where necessary.
4. For each isolated correction, create a narrowly scoped developer work order with a source test and browser route. Route shared, entitlement, workflow, or public-claim work separately.
5. QA verifies the corrected route in the relevant authenticated state and confirms that no malformed character or incorrect role/plan promise remains.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Own audit, prioritisation, and follow-on work-order creation. | This work order. |
| Developer – Fast Lane | Involved | May implement only S/Low isolated copy/encoding corrections after a separate approved work order. | Commit/PR and focused test. |
| Core Features Developer | Involved | Handles shared components, entitlement/plan, workflow, or integration wording changes only after a separate approved work order. | Commit/PR and validation handoff. |
| QA and Release Auditor | Involved | Check role/entitlement truthfulness and visible state accuracy. | Browser/hosted evidence as applicable. |
| Technical Reporting Analyst | Consulted | Flag reporting/data terminology that must remain precise. | Metrics Dictionary. |
| Lead Marketer and Growth | Involved | Review customer-facing language for premium clarity without turning it into unsupported marketing. | Message Ledger review. |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Journey and client-language inventory | Source and authenticated journey review | Source / Browser | Outstanding |
| Mojibake/encoding inventory | Exact string, intended character, route/component, and regression path | Source / Browser | Outstanding |
| Classified backlog | PM/QA/Marketing review | Outstanding | Outstanding |
| Safe implementation packages | Theo-approved follow-on WOs | Outstanding | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Theo has approved the read-only audit; no customer-visible correction has yet been implemented or browser-verified.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Audit core journeys and visible text | Project Manager / QA | Dated route-and-string findings | Open |
| Prioritise trust/conversion backlog | Project Manager | Ranked implementation packages | Open |
| Approve implementation packages | Theo | Follow-on work orders | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Audit | Yes | Approved | 2026-08-04 | Focus on League-team terminology, client-facing wording, and visible encoding defects. Read-only audit and work-order creation only. |
| Customer-facing implementation | Yes | Pending | 2026-08-04 | Separate approval per grouped package. |

## Decision and approval record

- 2026-07-29 - Founder requested review of product-facing wording, feature purpose, and overall workspace experience.
- 2026-08-04 - Theo reopened and prioritised the audit: use League of Legends team language, remove client-visible founder/internal wording, and identify visible mojibake/encoding defects. Implementation remains separately approval-gated and must be routed by actual affected area/risk.

## Implementation and review evidence

- Prior browser evidence: the authenticated staging Overview used honest empty states and clear scheduling calls to action, but source/browser review showed product terminology and generic upgrade language in key workspace surfaces.
- 2026-08-04 - PM audit reopened. Initial evidence confirms uncorrected mojibake in historical/internal evidence, which is not itself proof of a live defect; customer-visible route/component inventory is now required.
- **Highest evidence achieved:** Browser verified for Free Overview and analytics gate; source reviewed for core workspace surfaces. The renewed client-language/encoding inventory is in progress.
