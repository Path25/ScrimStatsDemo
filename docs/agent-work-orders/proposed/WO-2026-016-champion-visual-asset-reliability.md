# WO-2026-016 - Restore reliable champion visual assets

- **ID reservation:** [WO-2026-016 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Proposed
- **Owner:** Feature Development agent
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Problem and user impact

Missing champion icons immediately lower the perceived quality of a League-native product. The current `ChampionAvatar` component relies on fixed old Data Dragon versions and manual naming fallbacks, so new champions, renamed assets, and unavailable CDN assets can render missing/broken visuals.

## Why now

Champion recognition is central to scrim review, draft, analytics, and scouting. This is a high-visibility reliability issue that makes Pro capability feel less dependable than the surrounding premium shell.

## Scope

- Inventory every champion-image consumer and reproduce representative missing-icon cases, including recent champions and special-name mappings.
- Replace fixed-version URL assumptions with one current, cached, failure-tolerant catalogue/image strategy.
- Provide a premium neutral fallback that preserves champion name and never renders a broken image.
- Ensure the strategy works in scrims, analytics, draft, scouting, and Collector-derived game presentation without leaking credentials or requiring Riot API access.

## Explicit non-goals

- Do not collect Riot credentials, change live data ingestion, or rely on an unapproved third-party provider.
- Do not alter historical game/champion records or use placeholder champion identities.
- Do not redesign every champion-bearing surface beyond resolving visual-asset reliability.

## Acceptance criteria

- Known current and special-case champion names render a correct icon or an intentional named fallback, never a broken image.
- Asset-version refresh/failure behaviour is bounded, cached, and does not block page rendering.
- All champion-bearing workspace surfaces share the same reliable strategy or documented compatible adapter.
- Contract/component tests cover current catalogue, special names, CDN failure, and fallback state; browser evidence covers representative screens.

## Relevant files, workflows, or data areas

- `src/components/scrims/ChampionAvatar.tsx`
- `src/hooks/useChampionCatalog.ts`, `src/hooks/useItemCatalog.ts`
- `src/components/analytics/`, `src/pages/Draft.tsx`, `src/pages/ScoutingTeamReport.tsx`
- Collector champion catalogue/capture mapping under `collector/src/`

## Risks

- **Permissions / Supabase RLS:** Not applicable; client image metadata must not create cross-tenant data exposure.
- **Billing / entitlement:** Not applicable.
- **Email / customer communication:** Not applicable.
- **Production / data:** External static-asset availability/version drift can degrade pages; use graceful fallback and no secret-bearing requests.

## Required validation

- Component/contract tests for mappings and failures; TypeScript, zero-warning ESLint, production build.
- Browser checks on scrim, analytics, Draft, and Scouting with current and special-case champion records.
- Network review confirms no credentials or sensitive player/team payload is sent to image/catalogue services.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Keep scope on reliability rather than a broad visual redesign. | This work order |
| Feature Developer | Involved | Implement shared reliable asset strategy. | Champion consumers |
| QA and Release Auditor | Involved | Verify representative current/special/failure cases in browser. | Browser evidence |
| Technical Reporting Analyst | Not applicable | No reporting definition changes. | N/A |
| Lead Marketer and Growth | Not applicable | Internal workspace reliability only. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| No broken champion images | Component and browser cases | Outstanding | Outstanding |
| Failure-tolerant catalogue | Network and failure-path evidence | Outstanding | Outstanding |
| Shared surface coverage | Scrim/analytics/Draft/Scouting checks | Outstanding | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The fixed old-version strategy is a credible cause, but reproduction and remediation are not yet complete.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Reproduce missing icons | Feature Developer / QA | Named failing cases | Open |
| Implement shared fix | Feature Developer | Test/build evidence | Open |
| Browser verify affected surfaces | QA and Release Auditor | Authenticated browser evidence | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Pending | — | No provider/account activation is authorised. |
| Release | Yes | Pending | — | Requires visual and failure-path verification. |

## Decision and approval record

- 2026-07-29 - Founder reported missing champion icons during workspace review.

## Implementation and review evidence

- Source inspection: `ChampionAvatar` uses fixed 14.1.1/13.x Data Dragon URLs plus manual special cases, while other surfaces independently fetch current catalogue data. This inconsistency creates version and fallback drift.
- **Highest evidence achieved:** Source reviewed.
