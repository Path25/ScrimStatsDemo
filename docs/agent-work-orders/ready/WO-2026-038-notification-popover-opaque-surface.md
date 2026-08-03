# WO-2026-038 - Restore an opaque notifications popover surface

- **ID reservation:** [WO-2026-038 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Ready for QA
- **Assigned owner:** QA and Release Auditor
- **Size:** S
- **Risk:** Low
- **Priority:** High
- **Autonomy class:** Safe to implement

## Delivery routing

- **Area / files likely affected:** Notification trigger/popover styling in `src/components/notifications/NotificationInbox.tsx`; `src/components/layout/DashboardLayout.tsx` is an integration/mounting boundary only. Add a focused notification source-contract test only if the existing workspace-contract pattern can be reused without broad test infrastructure work.
- **Dependencies:** A controlled authenticated workspace for browser verification; WO-2026-030 provides the current workspace-menu surface standard.
- **Collision risk:** Do not alter notification data, read state, polling, tenant selection, auth, `TenantContext`, `src/components/ui/dropdown-menu.tsx`, or the workspace-switcher menu. The portal renders outside `.workspace-shell`, so the local popover correction must use an explicit safe surface treatment rather than changing the shared primitive. If this proves impossible, stop and create a Core-routed follow-up instead of broadening this order.

## Problem and user impact

Opening the top-right notifications icon on staging shows notification content without an opaque background. Like the earlier workspace selector regression, the content blends into or visually overlaps the surrounding dashboard, making notifications feel unfinished and harder to read.

## Why now

This is a contained premium-quality regression in a frequent dashboard control. The workspace selector has an established opaque, bordered, layered treatment that the notifications surface should match without changing behaviour.

## Scope

- Diagnose and correct only the notification popover's background, border, contrast, shadow, and stacking so it is readable above the dashboard at desktop and mobile widths.
- Preserve current notification content, unread/read behaviour, empty state, click handling, focus/keyboard behaviour, and data requests.
- Follow the established dark workspace visual system and the contained menu-surface approach proved under WO-2026-030.

## Explicit non-goals

- No notification schema, fetch/query, polling, read-state, user preference, email, push, or provider change.
- No shared dropdown/popover refactor unless a local contained correction is demonstrably impossible; do not modify it under this work order.
- No tenant, auth, billing, entitlement, Supabase, configuration, migration, deployment, or production-data change.

## Acceptance criteria

- Opening notifications renders an opaque, bounded, readable popover above adjacent dashboard/navigation content at desktop and mobile viewport widths.
- Notification entries, unread/read visual state, empty state, activation, Escape dismissal, and keyboard focus retain existing behaviour with no console errors.
- The workspace selector remains visually and behaviourally unchanged.
- **Required evidence level:** targeted local validation and authenticated staging browser verification. Production readiness is not established by this work order.

## Relevant files, workflows, or data areas

- `src/components/notifications/NotificationInbox.tsx` (primary correction surface)
- `src/components/layout/DashboardLayout.tsx` (mounting/integration boundary; inspect only unless a local integration defect is demonstrated)
- `src/components/ui/dropdown-menu.tsx` (read-only portal diagnosis; do not modify)
- WO-2026-030 workspace-switcher menu-surface evidence

## Risks

- **Permissions / Supabase RLS:** Not applicable; notification data access must remain unchanged.
- **Billing / entitlement:** Not applicable.
- **Email / customer communication:** Not applicable; in-app presentation only.
- **Production / data:** No data or configuration change is in scope. Hosted deployment/release remains separately approval-gated.

## Required validation

- Run an affected focused contract/source test if one exists; otherwise record why lint/typecheck/build coverage is appropriate.
- Run zero-warning ESLint, TypeScript, and production build for the touched UI.
- Authenticated browser verification at desktop and 390x844 mobile: open the notification popover, inspect readability/layering, exercise an entry or truthful empty state, and dismiss with Escape.
- Confirm the workspace selector remains unchanged in the same candidate; retain screenshots, viewport sizes, revision, and console output without tenant or notification content disclosure.

## QA scenario / reproducible test steps

1. Use a controlled non-customer authenticated workspace with either a safe notification fixture or the truthful empty-notifications state.
2. Open the top-right notifications trigger at desktop width and then at 390x844 mobile with the navigation state relevant to the issue.
3. Confirm an opaque background, visible boundary, readable foreground, and correct layering above dashboard content; interact with the existing entry/empty state without changing notification behaviour.
4. Verify Escape dismissal and no browser console warnings/errors; open the workspace selector and confirm its current opaque surface remains unchanged.
5. Record screenshots, viewport sizes, deployed revision, and result without exposing notification or tenant data.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Keep scope contained to visual presentation. | This work order |
| Developer - Fast Lane | Involved | Apply isolated popover-surface correction and local validation. | Commit/PR and validation output |
| Core Features Developer | Not applicable | No shared data, auth, tenant, or integration change is authorised. | N/A |
| QA and Release Auditor | Involved | Verify authenticated desktop/mobile visual and behavioural regression matrix. | Screenshots and browser evidence |
| Technical Reporting Analyst | Not applicable | No data-source or metric change. | N/A |
| Lead Marketer and Growth | Not applicable | Authenticated visual polish only; no public claim. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Opaque, layered notification popover | `NotificationInbox.tsx` supplies an explicit portalled surface, border, shadow, and `z-[60]`; candidate `6d644ac` is deployed. Authenticated staging screenshots remain required. | Local / Hosted deployment | Local pass and deployed; hosted browser open |
| Existing notification and keyboard behaviour | Notification entries, read handlers, navigation, and dropdown primitives are unchanged; local type/lint/build checks pass. Authenticated desktop/mobile interaction and console evidence remain required. | Local / Hosted | Local pass; hosted open |
| Workspace-selector regression boundary | `DashboardLayout.tsx`, `TenantContext`, and the workspace-selector path are unchanged. Same-candidate browser comparison remains required. | Local / Hosted | Local pass; hosted open |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Exact candidate `6d644ac` is deployed to staging, but authenticated desktop/mobile browser evidence, Escape/entry-or-empty behaviour, and the same-candidate workspace-selector comparison remain open before QA or release closure.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Isolated correction and local validation | Developer - Fast Lane | Source diff, focused contract test, lint, TypeScript, production build, and bundle-budget output | Closed |
| Authenticated staging browser matrix | QA and Release Auditor | Screenshots, revision, console result on exact candidate `6d644ac` | Open |
| Deployment/release decision | Theo | Separate explicit approval for release after QA | Staging candidate complete; release open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | No | Approved | 2026-08-03 | Theo requested this contained S/Low visual-fix work order. |
| Staging candidate exposure | Yes | Approved and completed | 2026-08-03 | Theo approved pushing `6d644ac` to `codex/Staging`; Vercel reports the exact candidate `READY` and aliased to staging. This does not approve production release. |
| Release | Yes | Pending | - | Separate hosted deployment/release approval remains required. |

## Decision and approval record

- 2026-08-03 - Theo reported the top-right notifications popover has no visible background on staging, similar to the prior workspace-selector surface regression.
- 2026-08-03 - PM routed the issue to Developer - Fast Lane as a contained visual correction. Any confirmed shared-primitive cause must be re-scoped to Core Features Developer.
- 2026-08-03 - Fast Lane review confirmed `NotificationInbox.tsx` owns the popover styling and `DashboardLayout.tsx` only mounts it. The shared dropdown portal renders outside `.workspace-shell`, where scoped workspace variables can be unset. This order is corrected to require a local explicit surface treatment and to prohibit shared-primitive modification; no files changed during review.
- 2026-08-03 - Theo approved implementation. Fast Lane applied the local portal-safe surface correction and focused source-contract assertions; notification data, read state, keyboard handlers, tenant context, workspace selector, and shared dropdown primitive were not changed. The item is handed to QA for authenticated staging verification.
- 2026-08-03 - Theo approved staging candidate exposure for WO-038. Fast Lane cannot deploy directly under the lane rules; the approved deployment owner must expose the reviewed patch and provide its immutable revision before QA can rerun the matrix. Production release remains pending.

## Implementation and review evidence

- User report is the current behavioural evidence. Fast Lane source review identifies `NotificationInbox.tsx` as the styling owner; the deployed computed styles remain unverified.
- WO-2026-030 establishes a visual reference only; it does not prove the notification popover shares its cause or fix.
- `NotificationInbox.tsx` now applies the workspace surface variables at the portalled content root, plus explicit `#111a23` background, visible border, shadow, and `z-[60]` stacking. Existing notification rendering and handlers remain unchanged.
- `scripts/workspace-console-contract.test.mjs` asserts the notification surface contract. `DashboardLayout.tsx`, `TenantContext`, and `src/components/ui/dropdown-menu.tsx` remain untouched for this order.
- Local validation passed: workspace contract (6 tests), touched-file and full ESLint with zero warnings, TypeScript, Vite production build, bundle budget, and `git diff --check`.
- No staging deployment or production/configuration/data change was performed. Authenticated staging screenshots, viewport sizes, candidate revision, and console output are still required from QA on the patched candidate.
- **Highest evidence achieved:** Exact application candidate deployed to staging; authenticated browser verification remains outstanding.

### QA audit - 2026-08-03

- **Release verdict:** HOLD. This is not a release or production decision; it is a QA hold until the reviewed local revision is available in staging.
- **What was verified:** Source inspection confirms an isolated `NotificationInbox.tsx` change only: portal-safe workspace variables, `bg-[#111a23]`, a visible border, `shadow-xl`, and `z-[60]`; `DashboardLayout.tsx`, `TenantContext`, the shared dropdown primitive, notification data/read handlers, and workspace selection are outside the diff. `node --test scripts/workspace-console-contract.test.mjs` passed 6/6 and `git diff --check` returned no whitespace errors. In an authenticated non-customer owner workspace on staging, the current notifications menu opened with one QA-fixture entry, Escape hid it, and the captured console had no warnings/errors.
- **Blocking:** The current staging menu's computed background is `rgba(0, 0, 0, 0)` and its computed `z-index` is `50`. This is the pre-fix implementation, not the reviewed local candidate, so the required desktop and 390x844 patched-candidate checks cannot be credited.
- **Important:** The staged QA-fixture notification body visibly renders a malformed `Â·` separator. This observation is outside the contained styling diff and must be triaged separately; do not treat the focused source contract as evidence that notification text encoding is sound.
- **Unverified:** Exact deployed revision, patched desktop visual result, 390x844 mobile visual result, entry activation/read behaviour on the patched candidate, and the same-candidate workspace-selector comparison.
- **Required next action:** The approved deployment owner must expose the exact reviewed patch in a staging candidate and provide its immutable revision. Theo has approved staging exposure; production release remains separate. QA will then repeat the desktop/mobile, entry-or-empty, Escape, console, and workspace-selector matrix without altering notification data.

### QA recheck - 2026-08-03

- Fast Lane returned the item to QA, but supplied no immutable staging revision or deployment evidence.
- QA reopened the authenticated non-customer owner workspace on the current staging URL and measured the open notification menu again: `background: rgba(0, 0, 0, 0)` and `z-index: 50`. This remains the pre-fix surface, not the local `#111a23` / `z-[60]` candidate.
- The browser console again contained no warnings or errors. A programmatic Escape attempt did not provide a reliable dismissal observation on this pre-fix candidate, so keyboard behaviour remains unverified rather than failed.
- **Disposition:** Keep status **Blocked**. The approved deployment owner must provide the deployed immutable revision before QA repeats the required hosted matrix.

### Core deployment handoff - 2026-08-03

- Theo explicitly approved pushing candidate `6d644aceced946e9d08877fd8c61b0cb4fd5f571` to `codex/Staging` and triggering the staging frontend deployment.
- Vercel deployment `dpl_FyNLWAMgRCxXRS9g1gXRtLmUFibJ` reports `READY`, source `git`, branch `codex/Staging`, commit `6d644aceced946e9d08877fd8c61b0cb4fd5f571`, and aliases `staging.scrimstats.gg` without an alias error.
- The hosted build produced entry asset `index-EcxpGt-o.js`, transformed 3,359 modules, completed successfully, and passed the bundle budget. The existing non-blocking `@vercel/node` type-resolution warning for `api/client-error.ts` remains outside WO-038.
- Local validation before push: focused workspace contract 6/6, repository tests 233/233, zero-warning ESLint, TypeScript, production build, bundle budget, and scoped `git diff --check` passed.
- The Core review strengthened the focused notification contract to assert the notification component's own `#111a23` background, border, shadow, `z-[60]`, and portal-safe variables. No shared primitive, workspace selector, notification data/read behavior, Supabase, configuration, or hosted data changed.
- The earlier pre-fix QA observations remain valid historical evidence but no longer block candidate exposure. QA must now repeat the desktop, 390x844 mobile, entry-or-empty, Escape, console, and unchanged-workspace-selector matrix against the recorded candidate. The malformed notification separator remains separately triaged and is not claimed fixed.
