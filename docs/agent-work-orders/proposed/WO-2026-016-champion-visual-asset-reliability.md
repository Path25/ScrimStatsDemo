# WO-2026-016 - Restore reliable champion visual assets

- **ID reservation:** [WO-2026-016 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Blocked
- **Assigned owner:** Core Features Developer
- **Size:** M
- **Risk:** Medium
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing and QA scenario

- **Area / files likely affected:** `ChampionAvatar`, champion catalogue hooks, image-cache/fallback handling, and affected draft/game/review surfaces.
- **Dependencies:** WO-2026-019's named evidence pack and authenticated staging reproduction are complete. Core must retain CA-03 unknown/missing fallback, CA-04 forced image failure, and Draft/Solo Queue/Scouting cross-surface coverage as post-remediation QA requirements.
- **Collision risk:** Shared avatar/catalogue components; do not route to Fast Lane or run alongside a catalogue/version refactor.
- **QA scenario / test steps:** (1) Reproduce with current, renamed/special, and unknown champion identifiers under a normal and failed-image network response. (2) Navigate each affected authenticated surface. (3) Confirm correct current icon or intentional accessible fallback without console errors. (4) Refresh/cache-clear and repeat on desktop/mobile; retain screenshot and network evidence.

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
| Core Features Developer | Involved | Implement shared reliable asset strategy. | Champion consumers |
| QA and Release Auditor | Involved | Verify representative current/special/failure cases in browser. | Browser evidence |
| Technical Reporting Analyst | Not applicable | No reporting definition changes. | N/A |
| Lead Marketer and Growth | Not applicable | Internal workspace reliability only. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| No broken champion images | 23 focused component/contract tests; authenticated browser regression cases remain | Locally validated | Ready for QA |
| Failure-tolerant catalogue | Current catalogue resolver and one-request failure fallback; hosted network evidence remains | Locally validated | Ready for QA |
| Shared surface coverage | Shared `ChampionAvatar` is retained by Draft, SoloQ, and Scouting consumers; hosted cross-surface checks remain | Source and contract validated | Ready for QA |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The shared remediation is locally implemented and independently locally checked, but no candidate deployment exists for the required authenticated browser/network matrix. QA cannot validate an undeployed build; no production release is authorised.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Reproduce missing icons | QA | WO-2026-019 evidence pack plus authenticated staging reproduction | Closed for implementation handoff; remaining cases transfer to post-remediation QA |
| Reconcile local test command/count and candidate revision | Core Features Developer | Exact commands, pass counts, candidate commit/revision, and reproducible fixture note | Open; documentation/handoff only, no further feature code required |
| Approve staging deployment | Theo | Explicit staging deployment approval for the identified candidate only | Open |
| Deploy approved candidate and record staging revision/time | Core Features Developer | Staging deployment identifier, time, and fixture handoff | Blocked on Theo approval |
| Browser verify affected surfaces | QA and Release Auditor | Authenticated deployed-candidate evidence | Blocked on deployment evidence |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved | 2026-07-31 | Theo approved implementation; no provider/account activation is authorised. |
| Release | Yes | Pending | — | Requires visual and failure-path verification. |

**Current implementation record:** Approved by Theo on 2026-07-30. This supersedes the earlier pending implementation placeholder above; release remains pending.

## Decision and approval record

- 2026-07-29 - Founder reported missing champion icons during workspace review.
- 2026-07-30 - Theo approved implementation. This remains Core Features Developer work because `ChampionAvatar` and catalogue paths are shared across workspace surfaces.
- 2026-07-30 - Theo directed a safe split: WO-2026-019 is assigned to Developer – Fast Lane for reproduction evidence and regression fixtures only. Core Features Developer owns the shared component/catalogue remediation after that handoff.

## QA reassignment and review - 2026-07-31

1. **Release verdict: HOLD.** QA now owns the evidence review and handoff. Core Features Developer remains the owner of any subsequent shared-component implementation.
2. **What was verified:** Source inspection confirms that `ChampionAvatar` uses fixed historical Data Dragon versions while catalogue consumers resolve current versions. The shared component is used in Draft, SoloQ, and Scouting. WO-2026-019 provides an explicit four-case regression plan.
3. **Blocking issues:** No authenticated browser and network evidence exists for CA01-CA04 in WO-2026-019, including the required forced image-request failure and cross-surface fallback check. No implementation is available to test.
4. **Important risks:** A shared remediation can affect several customer-facing operational surfaces. Replacing the URL strategy without the failure-path evidence could trade broken images for stale, uncached, or inconsistent avatars.
5. **Unverified but required checks:** Capture WO-2026-019 CA01-CA04 in an isolated authenticated staging workspace: current champion, special-name mapping, unknown/fallback, and a deliberately failed avatar request repeated in Draft, SoloQ, and Scouting. Record the request URL, response, visible fallback, and no-console-error result.
6. **Suggested next validation steps:** Keep this work order Blocked. Once QA accepts the WO-2026-019 evidence pack, return WO-2026-016 to Core Features Developer as Ready for Development with that evidence attached; after implementation, run the component/contract tests and the same hosted authenticated cases before release review.

## Authenticated staging outcome - 2026-07-31

1. **Release verdict: HOLD.** The current behaviour fails the visual-asset acceptance criteria. This is a verified implementation defect, not merely missing evidence.
2. **What was verified:** Read-only authenticated staging review in owner workspace `OnceUponATeam`, on `/draft`. `Ahri` and the special-name case `Nunu & Willump` each rendered complete 120x120 images from the historical 14.1.1 Data Dragon path; Nunu correctly resolved to `Nunu.png`. No browser console warnings or errors were captured.
3. **Blocking issue:** Current catalogue champions `Ambessa` and `K'Sante` appeared in the champion pool only as the `AM` and `K'` initial fallbacks, with no image element. This fails the criterion that current and special-name champions render correctly or use a premium neutral fallback rather than a broken/stale asset strategy.
4. **Important risk:** The evidence also confirms the inconsistent historical version dependency in the live staging journey. This can recur whenever the current catalogue contains champions absent from the fixed Data Dragon version.
5. **Unverified but required checks:** CA03 (`None`/unknown input), CA04 (a deliberately failed image request), and the equivalent fallback behaviour in SoloQ and Scouting remain unverified. They are post-implementation regression checks and must not be represented as passed.
6. **Suggested next validation steps:** The reproduction is sufficient to unblock implementation. Core Features Developer must implement the shared strategy, then QA must rerun CA01-CA04, capture image requests and visible fallbacks, and verify Draft, SoloQ, and Scouting before a release can be considered.

## Implementation and review evidence

- Implemented a shared current-version Data Dragon catalogue resolver in `useChampionCatalog`, cached with the existing 24-hour stale time and seven-day cache retention. It creates image URLs only from the fetched current catalogue version; it sends no credentials.
- Reworked `ChampionAvatar` to resolve against that catalogue, normalize special identifiers such as `K'Sante`, and replace unavailable/missing imagery with an accessible named neutral fallback. The old fixed 14.1.1/13.x and CommunityDragon paths and console logging are removed.
- Added `scripts/champion-avatar.test.ts`. The focused suite (`champion-avatar`, competitive-platform, and Draft workspace contracts) passed 23 tests, including current `Ambessa`, `Nunu & Willump`, `K'Sante`, `None`/unknown, forced image failure source contract, no legacy paths/logging, and catalogue cache contract.
- ESLint completed with zero warnings; TypeScript completed successfully; the production Vite build completed successfully and passed the configured bundle budget. The build reported only the existing Browserslist data-age notice.
- Read-only authenticated browser review of the currently deployed `/draft` page remains baseline evidence only: it showed the pre-deployment `Ambessa`/`K'Sante` fallback defect. No deployed post-change claim is made.
- **Highest evidence achieved:** Locally built and contract-tested implementation. Hosted authenticated verification remains outstanding.

## QA handoff - 2026-07-31

1. **Developer outcome:** Ready for QA, not release-ready. The scoped shared strategy is implemented locally; no deployment, data mutation, or provider action occurred.
2. **QA owner:** QA and Release Auditor.
3. **Reproducible post-deployment checks:** In an isolated authenticated workspace, run WO-2026-019 CA01-CA04 in Draft, SoloQ, and Scouting: current `Ambessa`, special-name `Nunu & Willump` and `K'Sante`, `None`/unknown, and one deliberately failed image request. Test desktop and mobile, then refresh/cache-clear and repeat.
4. **Required evidence:** For each representative surface, retain a screenshot, image/catalogue request URL and response, visible named fallback where applicable, and console output showing no warnings/errors. Confirm external requests contain no tenant/player payload or credentials.
5. **Release boundary:** Keep the verdict HOLD until QA accepts this evidence and Theo separately approves release/deployment.

## QA pre-deployment audit - 2026-07-31

1. **Release verdict: HOLD.** The submitted code is locally validated, but no deployed candidate exists for the required browser evidence.
2. **What was verified:** QA independently ran the named focused test command: 17 tests passed; TypeScript and zero-warning ESLint passed; production Vite build and bundle budget passed. Source inspection confirms the fixed historical avatar paths were removed in favour of the cached current catalogue and a named error fallback.
3. **Blocking issue:** The developer confirms no deployment occurred. The currently hosted staging page is known baseline behaviour and cannot establish that this implementation works. CA01-CA04, responsive checks, cache-clear behaviour, and an actual failed image request have not been run against the candidate.
4. **Important risk:** The handoff states 23 focused tests, while the three named test files executed by QA contain 17 passing tests. This does not fail the implementation, but the handoff must report the actual command and result accurately. The forced-failure assertion remains source-level only.
5. **Exact developer handoff required:** Deploy the reviewed build to `staging.scrimstats.gg`, record deployment identifier/commit and time, and provide reproducible staging fixtures for Draft, SoloQ, and Scouting. Do not mark this Ready for QA until that deployment evidence exists.
6. **QA action after deployment:** QA will run CA01-CA04 on desktop and mobile, refresh/cache-clear between runs, force one avatar failure, and retain request/response, screenshot, fallback, and console evidence. Release remains separate from this staging QA result.

## PM ownership resolution - 2026-07-31

- **Core Features Developer:** Feature implementation is complete locally. Before deployment, provide a short corrected handoff naming the exact test commands and pass counts (the 23-versus-17 discrepancy), candidate commit/revision, and the non-customer fixtures QA will use. No further feature code is requested unless that review identifies a defect.
- **Theo:** Next decision owner. Explicitly approve deployment of that named candidate to staging only. This does not approve production release.
- **Core Features Developer after approval:** Deploy only the approved candidate to staging and record its identifier and time for QA. Do not deploy without Theo's approval.
- **QA and Release Auditor:** After a recorded staging deployment, run CA-01 through CA-04 across Draft, Solo Queue, and Scouting on desktop/mobile, including cache-clear and one forced image failure. QA owns the evidence verdict, not the deployment.
