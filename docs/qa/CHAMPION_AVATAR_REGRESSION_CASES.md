# Champion avatar regression cases

Evidence pack for WO-2026-019 and the later shared remediation in WO-2026-016.

## Evidence boundary

- This pack is a non-customer, version-controlled QA handoff. It contains no tenant, player, game, credential, or provider-account data.
- Fast Lane only inspected the shared implementation. No `ChampionAvatar`, catalogue hook, Collector, or workspace-caller source was changed.
- Source observations below are not a substitute for authenticated browser/network evidence. The browser capture remains pending until an isolated non-production workspace session is available.

## Consumer inventory

The current `ChampionAvatar` consumers found by source inspection are:

| Surface | Source path | Champion input | Capture target |
|---|---|---|---|
| Draft | `src/components/draft/DraftSequenceBoard.tsx` | `action.champion_name` and current catalogue `champion.name` | `/draft` |
| Solo Queue | `src/components/soloq/SoloQMatchRow.tsx` | `participant.championName` and `match.champion_name` | `/soloq` |
| Scouting | `src/components/scouting/OpponentSoloQDialog.tsx` | `match.champion_name` | `/scouting`, then the opponent Solo Queue dialog |

The shared implementation under test is `src/components/scrims/ChampionAvatar.tsx`. The current catalogue source is `src/hooks/useChampionCatalog.ts`.

## Regression cases

Each case must be captured in an isolated authenticated workspace with non-customer representative data. Record the rendered state, all image request URLs and statuses, console output, and the exact surface. Do not record tenant IDs, player names, game IDs, credentials, or raw API payloads.

### CA-01 — Current catalogue baseline

- **Input:** `Ahri`.
- **Surface:** Draft champion picker and selected draft action (`/draft`).
- **Why this case:** A normal catalogue name exercises the default image path and gives the later fix a stable baseline. Confirm that `Ahri` is present in the current `useChampionCatalog` response at capture time; do not treat this fixture as a permanent patch-version claim.
- **Source-observed request:** Current code starts at `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Ahri.png`.
- **Expected safe outcome:** A loaded icon with accessible alt text `Ahri`, or the intentional named fallback; never a broken-image glyph or page-blocking error.
- **Browser/network observation:** Pending isolated authenticated capture.
- **Reproduction:** Open `/draft`, load the champion picker, select `Ahri`, and inspect the picker plus the selected-action row. Record request status and console output.

### CA-02 — Special-name mapping

- **Input:** `Nunu & Willump`.
- **Surface:** Draft champion picker (`/draft`).
- **Why this case:** The current mapping removes the ampersand and maps the normalized value to the Data Dragon `Nunu` asset.
- **Source-observed request:** Current code maps this input to `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Nunu.png`.
- **Expected safe outcome:** The Nunu icon renders while the visible label and alt text preserve `Nunu & Willump`; no broken image or identity substitution.
- **Browser/network observation:** Pending isolated authenticated capture.
- **Reproduction:** Open `/draft`, select `Nunu & Willump` from the catalogue, and inspect the rendered icon, accessible name, request URL/status, and console output.

### CA-03 — Missing and unknown input

- **Inputs:** `None` and `Unknown Champion`.
- **Surface:** A draft action row, or another existing `ChampionAvatar` consumer that can be viewed with non-customer representative data.
- **Why these cases:** `None` exercises the explicit missing-value branch; `Unknown Champion` exercises an unrecognised name that still produces an image request before fallback.
- **Source-observed behaviour:** `None` returns no image URL and renders the neutral `User` fallback. An unknown non-empty value produces a Data Dragon URL, then reaches the initials fallback after image failures.
- **Expected safe outcome:** Missing input shows the neutral accessible fallback; unknown input shows an intentional named/initials fallback and never a broken image or fabricated champion identity.
- **Browser/network observation:** Pending isolated authenticated capture.
- **Reproduction:** View the named input in the selected consumer, record the rendered fallback, any request URL/status, and console output. Capture both values separately.

### CA-04 — Bounded image failure

- **Input:** `Ahri` with the image request intentionally forced to fail in the browser (for example, a 404/blocked response for the first image URL).
- **Surface:** Draft selected-action row (`/draft`); repeat one representative case in Solo Queue or Scouting after the first capture.
- **Why this case:** It verifies that a CDN failure does not leave a broken image or block the surrounding workspace.
- **Source-observed retry chain:** Current code attempts Data Dragon versions `14.1.1`, `13.24.1`, and `13.1.1`, then reaches initials fallback when no custom fallback applies. It currently logs retry warnings and a final error; record the actual console result without treating it as a pass.
- **Expected safe outcome:** The workspace remains usable, the image settles on an intentional accessible fallback, retries stop at a bounded point, and no tenant/player/customer payload is sent to the asset host.
- **Browser/network observation:** Pending isolated authenticated capture.
- **Reproduction:** Open `/draft`, force the named image request to fail, wait for the fallback to settle, and record every request URL/status, final rendered state, console output, and whether the surrounding surface remains interactive. Refresh/cache-clear and repeat once.

## Core handoff

- **Shared implementation path:** `src/components/scrims/ChampionAvatar.tsx`.
- **Catalogue path:** `src/hooks/useChampionCatalog.ts`.
- **Confirmed callers:** `src/components/draft/DraftSequenceBoard.tsx`, `src/components/soloq/SoloQMatchRow.tsx`, and `src/components/scouting/OpponentSoloQDialog.tsx`.
- **Boundary:** Fast Lane changed no source implementation, Collector mapping, data records, provider configuration, or workspace caller.
- **Core follow-up:** Use the named cases and captured request/fallback evidence to implement WO-2026-016's shared strategy. The parent must not be moved to release-ready based on this source-only pack.

## QA acceptance checklist

- [ ] CA-01, CA-02, CA-03, and CA-04 have browser-rendered evidence from an isolated authenticated workspace.
- [ ] Each case includes request URL/status, final rendered state, console result, and exact surface.
- [ ] The forced-failure case proves bounded retries, intentional fallback, and a usable surrounding page.
- [ ] Screenshots/notes contain no tenant, player, game, credential, or customer identifiers.
- [ ] QA reproduces at least one selected case and accepts the Core handoff.

**Current evidence level:** Source reviewed; browser/network capture pending.
