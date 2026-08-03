# WO-2026-030 - Restore an opaque workspace-switcher menu in the sidebar

- **ID reservation:** [WO-2026-030 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Blocked
- **Assigned owner:** Developer – Fast Lane
- **Size:** S
- **Risk:** Low
- **Priority:** High
- **Autonomy class:** Safe to implement

## Delivery routing

- **Area / files likely affected:** `src/components/layout/DashboardLayout.tsx`, `scripts/workspace-console-contract.test.mjs`; only inspect `src/components/ui/dropdown-menu.tsx` if the local component contract shows that a contained styling correction is necessary.
- **Dependencies:** A controlled non-customer account with membership in two workspaces for browser verification.
- **Collision risk:** Do not overlap with any active `DashboardLayout` refactor. Do not change `TenantContext`, tenant queries, workspace creation, local-storage selection, RLS, or tenant membership behaviour. WO-2026-023 remains separate high-risk multi-workspace creation work.

## Problem and user impact

When an existing user belongs to multiple workspaces and opens the sidebar workspace switcher, the listed workspaces have no visible opaque menu surface. The options visually overlap the navigation instead of reading as a deliberate menu, which undermines the premium workspace experience and can make switching feel unsafe.

## Why now

Multi-workspace membership is already supported for existing users. This is a contained, customer-visible regression in the current switcher and does not require the pending additional-workspace creation work.

## Scope

- Diagnose and correct the sidebar workspace-switcher menu's surface, stacking, border, and contrast so its options render above the sidebar navigation on the existing dark workspace theme.
- Preserve the existing workspace names, selected-workspace indicator, keyboard behaviour, and `chooseTenant` selection path.
- Add a focused regression test only if an existing component or source-contract test pattern supports it without broad test infrastructure work.

## Explicit non-goals

- Do not change how workspaces are created, loaded, authorised, stored, or selected.
- Do not redesign the sidebar, change plan/role messaging, or modify the shared dropdown primitive for unrelated menus unless a narrowly evidenced shared fix is required and separately approved.
- Do not make database, Supabase, Auth, RLS, billing, configuration, or production changes.

## Acceptance criteria

- With two or more memberships, opening the sidebar switcher displays an opaque, readable menu with a visible boundary that is layered above the navigation at desktop and mobile viewport widths.
- Each workspace option remains readable and selectable; the active workspace indicator remains visible.
- Selecting another permitted workspace retains the existing client-side selection behaviour and does not produce a console error or navigation overlap.
- A single-workspace user retains the current non-dropdown sidebar presentation.
- **Required evidence level:** targeted local validation and authenticated browser verification using a controlled multi-workspace account. Production readiness is not established by this work order.

## Relevant files, workflows, or data areas

- `src/components/layout/DashboardLayout.tsx`
- `src/components/ui/dropdown-menu.tsx` (inspection only unless a contained shared-style cause is demonstrated)
- `src/contexts/TenantContext.tsx` (behavioural boundary; do not modify)
- WO-2026-023 additional independent workspaces

## Risks

- **Permissions / Supabase RLS:** Not applicable; preserve the existing tenant-selection boundary without modification.
- **Billing / entitlement:** Not applicable.
- **Email / customer communication:** Not applicable.
- **Production / data:** No data or configuration change is in scope. A hosted deployment remains separately approval-gated.

## Required validation

- Run the affected component/source-contract test if one exists; otherwise record why only lint/typecheck/build coverage applies.
- Run ESLint with zero warnings, TypeScript, and production build for the touched UI.
- In a controlled authenticated account with two memberships, verify the open switcher at desktop and mobile widths, select each workspace once, and retain screenshots plus console output.
- Confirm the single-workspace sidebar remains unchanged.

## QA scenario / reproducible test steps

1. Use a non-customer account with membership in workspace A and workspace B; open an existing authenticated workspace route.
2. Open the sidebar workspace switcher at desktop width, then at a mobile width with the navigation open.
3. Confirm the menu has an opaque background, clear boundary, readable options, and sits above rather than blending into or overlapping the navigation.
4. Select workspace B, then workspace A; confirm the existing selected indicator updates and no console error occurs.
5. With the trigger focused, open the menu with Enter, select a workspace with the keyboard, and dismiss the menu with Escape.
6. Record screenshots, viewport sizes, build revision, and console result without exposing tenant identifiers; use a separate single-workspace control account for the regression check.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Maintain the contained visual scope and confirm no overlap with WO-2026-023. | This work order |
| Developer – Fast Lane | Involved | Apply the isolated menu-surface correction and record local validation. | Commit/PR and validation output |
| Core Features Developer | Not applicable | No shared data, auth, tenant, or integration work is authorised. | N/A |
| QA and Release Auditor | Involved | Verify the controlled multi-workspace browser matrix and regression boundary. | Screenshots and browser evidence |
| Technical Reporting Analyst | Not applicable | No metric or data-source change. | N/A |
| Lead Marketer and Growth | Not applicable | Authenticated visual polish only; no public claim or campaign impact. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Opaque, layered multi-workspace menu | Staging authenticated desktop/mobile screenshots and computed style report show `background-color: rgba(0, 0, 0, 0)` and `z-index: 50`; current staging candidate is pre-fix | Browser | Fail on current staging |
| Selection and active-state preservation | Staging controlled account switched A → B → A with active trigger updates and no console errors; keyboard Enter selection also passed | Browser | Pass |
| Single-workspace regression check | Single-workspace branch unchanged; browser control-account evidence still required | Local / Browser | Outstanding |
| Local UI quality checks | Workspace contract (6 tests), full ESLint, TypeScript, Vite build, and bundle budget | Local | Pass |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The local correction and validation are complete, and staging behavior checks pass, but the currently deployed staging build still has the transparent pre-fix menu surface. A patched staging candidate and single-workspace control-account check are still required.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Isolated visual correction | Developer – Fast Lane | Source diff, focused contract test, lint, TypeScript, build, and bundle-budget output | Closed |
| Patched staging candidate and visual browser matrix | Theo / QA and Release Auditor | Deploy or otherwise expose the local patch in staging, then repeat desktop/mobile surface checks and retain screenshots | Open |
| Single-workspace regression check | QA and Release Auditor | Control-account browser evidence showing the non-dropdown sidebar remains unchanged | Open |
| Deployment/release decision | Theo | Separate explicit approval if a hosted candidate is proposed | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | No | Approved | 2026-08-03 | Theo explicitly approved the contained S/Low visual correction; no tenant behaviour or data change. |
| Release | Yes | Pending | — | Separate hosted deployment/release approval remains required. |

## Decision and approval record

- 2026-08-02 - Theo reported that the existing sidebar switcher shows multiple workspaces without a visible menu background and overlaps the navigation. PM isolated the issue to `DashboardLayout` and routed it to Developer – Fast Lane.
- 2026-08-03 - Theo approved implementation. Developer – Fast Lane completed the isolated UI correction and local validation; staging behavior evidence is captured, while patched-candidate visual verification and the single-workspace regression remain open.

## Implementation and review evidence

- `DashboardLayout` now gives the portalled menu an explicit opaque `#111a23` surface, visible boundary, readable foreground, cyan active indicator, and `z-[60]` stacking level; `TenantContext` and `src/components/ui/dropdown-menu.tsx` are unchanged.
- `scripts/workspace-console-contract.test.mjs` asserts the local surface and stacking contract.
- Local validation passed: workspace contract (6 tests), full ESLint with zero warnings, TypeScript, Vite production build, and bundle budget.
- Staging browser verification on 2026-08-03 used the authenticated controlled multi-workspace account at `/overview`: desktop and 390x844 mobile screenshots captured the transparent menu and navigation overlap; computed menu style was transparent background, default border, and `z-index: 50`.
- The staging account successfully switched between two QA workspaces, retained the active trigger label, passed keyboard Enter selection and Escape dismissal, and produced no console errors. The initial workspace selection was restored before handoff.
- Evidence artifacts: `C:\Users\Theo\.codex\visualizations\2026\07\29\019faf19-f52e-74b0-ac28-8828910f821a\WO-2026-030-staging-desktop.png` and `C:\Users\Theo\.codex\visualizations\2026\07\29\019faf19-f52e-74b0-ac28-8828910f821a\WO-2026-030-staging-mobile.png`.
- The staging build still renders the old scoped `bg-[var(--workspace-surface-raised)]` class; the local patch is not deployed, so the visual acceptance criterion remains blocked.
- **Highest evidence achieved:** Browser verified (pre-fix staging behavior; patched candidate not yet browser verified).
