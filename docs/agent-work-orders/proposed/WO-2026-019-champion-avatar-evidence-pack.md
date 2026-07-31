# WO-2026-019 - Create champion-avatar reproduction evidence and regression fixtures

- **ID reservation:** [WO-2026-019 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Done
- **Assigned owner:** Developer – Fast Lane
- **Size:** S
- **Risk:** Low
- **Priority:** High
- **Autonomy class:** Safe to implement

## Delivery routing and QA scenario

- **Area / files likely affected:** New regression-case document/fixture under `docs/qa/` or `scripts/fixtures/`; browser/network evidence only. Do not change `ChampionAvatar`, catalogue hooks, collectors, or workspace callers.
- **Dependencies:** Existing local or approved isolated staging workspace with representative champion records. No production data or provider-account access is needed.
- **Collision risk:** This work must not edit the shared avatar/catalogue implementation. Core Features Developer may begin WO-2026-016 only after this handoff is complete.
- **QA scenario / test steps:** (1) Use named current, special-name, unknown, and missing/failed-image cases. (2) Capture the rendered state, request URL/status, console result, and workspace surface for each. (3) Check the evidence pack has no tenant, player, credential, or customer data. (4) QA confirms the named cases are reproducible before Core uses them as regression fixtures.

## Problem and user impact

WO-2026-016 identifies a credible stale Data Dragon version/fallback issue, but its shared implementation should not be changed on assumption alone. Core needs a small, reproducible evidence pack so the eventual fix addresses the real missing-icon cases and remains protected against regression.

## Why now

Champion icons are visibly unreliable, and the Founder wants the Fast Lane to accelerate the contained discovery/test work while preserving a single Core owner for the shared component fix.

## Scope

- Reproduce and record a small representative set of champion-avatar failures or fallbacks across the affected workspace surfaces.
- Create a version-controlled, non-sensitive regression-case pack naming the champion input, expected outcome, surface, and observed network/fallback result.
- Identify the smallest Core handoff: exact source path, named cases, current outcome, and expected outcome.

## Explicit non-goals

- Do not edit `ChampionAvatar.tsx`, catalogue hooks, Data Dragon version logic, or any champion-consuming workspace component.
- Do not add a knowingly failing production test, alter customer/team/game records, change Collector mapping, or activate a provider.
- Do not claim the icon defect is fixed or production-ready.

## Acceptance criteria

- A version-controlled evidence pack contains at least one current-name, one special-name, one unknown/missing-name, and one image-failure case, each with an expected safe outcome.
- Each case identifies the exact input, surface, rendered result, request/fallback behaviour, and reproduction steps without exposing tenant or player data.
- The Core handoff identifies the exact shared implementation paths and states that no source implementation was changed by Fast Lane.
- QA can reproduce a selected case from the pack and confirms it is sufficient to validate WO-2026-016's later remediation.

## Relevant files, workflows, or data areas

- New `docs/qa/CHAMPION_AVATAR_REGRESSION_CASES.md` or a reviewed fixture under `scripts/fixtures/`
- `src/components/scrims/ChampionAvatar.tsx` (read-only evidence reference)
- `src/hooks/useChampionCatalog.ts` (read-only evidence reference)
- Draft, Solo Queue, and Scouting browser surfaces
- Parent: WO-2026-016

## Risks

- **Permissions / Supabase RLS:** Not applicable; do not record tenant, player, or game identifiers in the evidence pack.
- **Billing / entitlement:** Not applicable.
- **Email / customer communication:** Not applicable.
- **Production / data:** Low. Use local or isolated non-customer data only; no production writes, provider activation, or deployment.

## Required validation

- Peer-check that the evidence pack contains the defined cases and redacts sensitive context.
- Browser/network capture for the named cases; no customer data in screenshots or notes.
- If a fixture/test file is added, run its focused check plus TypeScript/lint only when source tooling is affected.
- QA reproduces at least one case before the parent moves back to Ready for Development.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| PM | Involved | Preserve the narrow split and move WO-2026-016 only after the evidence handoff. | This work order |
| Developer – Fast Lane | Involved | Create evidence pack and fixture only; no shared-component edit. | Commit/PR and handoff |
| Core Features Developer | Involved | Review the pack, then own the shared remediation under WO-2026-016. | Parent work order |
| QA | Involved | Reproduce selected case and accept/reject handoff sufficiency. | QA note |
| Analyst | Not applicable | No reporting change. | N/A |
| Marketing | Not applicable | No external claim. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Named evidence pack | [CHAMPION_AVATAR_REGRESSION_CASES.md](../../qa/CHAMPION_AVATAR_REGRESSION_CASES.md); source inventory and redaction boundary recorded | Local | Pass |
| Reproducible QA case | Authenticated browser/network evidence for CA-01 through CA-04 | Browser | Outstanding |
| Core handoff | Evidence pack names shared paths and records that Fast Lane changed no source implementation | Local | Pass |

### Final verdict

- **Verdict:** CONDITIONAL
- **Rationale:** Fast Lane completed the non-sensitive evidence pack without touching shared source. QA's authenticated staging review reproduced the real fixed-version failure and accepted the handoff as sufficient for Core to begin WO-2026-016. CA-03/CA-04 and cross-surface checks remain required, but are post-remediation validation under WO-2026-016 rather than remaining Fast Lane work.

### Outstanding checks (initial assignment snapshot)

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Create and review evidence pack | Developer – Fast Lane | Version-controlled pack | Open |
| Reproduce selected case | QA | Browser/network evidence | Open |
| Accept Core handoff | PM / Core Features Developer | Exact implementation boundary | Open |

### Outstanding checks (implementation update)

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Browser/network capture for CA-01 through CA-04 | Developer - Fast Lane / QA | Authenticated isolated-workspace rendered state, request/status log, and console result | Open - requires isolated session |
| Reproduce selected case | QA | Browser/network evidence from the pack | Open |
| Accept Core handoff | PM / Core Features Developer | Review the evidence pack and confirm the shared implementation boundary | Open |

### Closeout - 2026-07-31

The two earlier outstanding-check snapshots are historical. QA's authenticated staging review confirmed the evidence pack is sufficient to hand the defect to Core: current catalogue champions `Ambessa` and `K'Sante` fall back under the fixed 14.1.1 Data Dragon path, while `Ahri` and `Nunu & Willump` render from that historical path. No further Fast Lane implementation is authorised or needed under this work order.

The following checks transfer to WO-2026-016 after the shared remediation: CA-03 unknown/missing fallback, CA-04 forced image failure, and the Draft/Solo Queue/Scouting cross-surface matrix. They must remain release blockers for the parent work order.

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | No | Approved | 2026-07-30 | Founder explicitly requested the Fast Lane split. |
| Release | No | N/A | 2026-07-30 | No customer-facing change or release is in scope. |

## Decision and approval record

- 2026-07-30 - Theo directed the Fast Lane evidence/fixture split from WO-2026-016. The shared implementation remains Core-owned.
- 2026-07-31 - PM reconciled QA's authenticated staging outcome. WO-2026-019 is complete as the evidence/fixture handoff; Core Features Developer owns the verified shared-component defect in WO-2026-016.

## Implementation and review evidence

- 2026-07-30 - Developer - Fast Lane created `docs/qa/CHAMPION_AVATAR_REGRESSION_CASES.md` with four named cases, exact current consumer paths, source-observed request/fallback behaviour, redaction rules, and the Core handoff boundary. No shared implementation, Collector mapping, data record, provider configuration, or workspace caller was changed.
- 2026-07-30 - Focused evidence-pack structure and redaction checks passed. TypeScript, lint, build, and production/browser acceptance checks were not run because this change adds documentation only and the authenticated browser session is unavailable.
- 2026-07-30 - Local browser check reached the public app successfully, but `/draft` redirected to `/sign-in`; no authenticated local test session or seeded representative workspace was available. Browser/network observations remain explicitly pending rather than inferred.
- 2026-07-31 - QA authenticated staging review recorded a real current-catalogue failure: `Ambessa` and `K'Sante` appeared as initial fallbacks because `ChampionAvatar` is pinned to historical Data Dragon version 14.1.1. `Ahri` and `Nunu & Willump` rendered successfully from that historical path; no console errors were captured in the checked Draft journey.
- **Highest evidence achieved:** Browser verified for the scoped reproduction/handoff; no product fix is implemented.
