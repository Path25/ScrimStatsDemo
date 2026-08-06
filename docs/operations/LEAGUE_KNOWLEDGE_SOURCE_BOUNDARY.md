# League knowledge, patch, and learning-resource source boundary

**Work order:** [WO-2026-035](../agent-work-orders/proposed/WO-2026-035-league-knowledge-source-boundary.md)  
**Decision status:** Internal research complete; no source is approved for production integration, customer publication, or paid entitlement.  
**Reviewed:** 2026-08-03  
**Owner:** Technical Reporting Analyst, with PM/Marketing/QA review required before any implementation work order.

## Decision

The smallest safe future experience is a manually curated, dated set of **outbound links** to official patch notes and explicitly named learning resources. It may show only the source title, publisher, URL, patch/version or publication date, curation date, and an honest `unavailable` or `stale` state. It must not copy patch prose, scrape pages, download or store VODs, ingest provider data, auto-generate tactical conclusions, or claim a performance outcome.

No code, credentials, provider activation, spend, external contact, ingestion, publishing, or customer claim is authorised by this register.

## Definitions

| State | Exact meaning |
|---|---|
| **Official fact** | A narrowly stated, versioned fact whose canonical URL is an official Riot source and whose source/version and retrieval date are retained. It is not staff advice. |
| **Curated editorial material** | A staff-selected external link with publisher, date, subject, curation date, and a clearly labelled staff recommendation. It is not an official fact and is not evidence that the resource improves performance. |
| **Current** | The source URL resolves, its stated version/date is recorded, and a named owner has checked it against the relevant official current patch on the same editorial cycle. For patch material, this check is required within 72 hours of a new official patch publication. |
| **Historical** | A retained reference whose version/date is explicit but is not labelled current. Historical material must not be used for present-patch tactical guidance. |
| **Stale** | A source previously marked current that has not passed the required cycle check. Hide tactical framing and label it stale; do not silently serve it as current. |
| **Unavailable** | No approved, fresh, attributable source exists, or a source cannot be accessed lawfully/reliably. Show no substitute fact or inferred advice. |

## Source register

| Category and candidate | Primary-source evidence and rights boundary | Permitted first use | Prohibited use | Freshness, storage, failure state | Owner, cost, and approval gate |
|---|---|---|---|---|---|
| Riot official patch notes | Riot’s developer policies require developers to keep current with policy changes and identify approved developer-tool obligations. The source page itself is the canonical patch record; this review does **not** establish a licence to reproduce its prose. | Manual outbound link with official source title, patch/version, publication date, and `official source` label. A separately authored staff note may only be introduced after PM/Marketing claim review. | Copying/substantially republishing notes; automated patch interpretation; scraping; an availability or performance claim. | Manual check at each official patch and within 72 hours of publication. Store only the URL, version/date, curation timestamp, and reviewer. If no current verification, mark unavailable/stale. | Analyst owns source check; no provider cost for a link. Theo + PM/Marketing approval required before customer surface or editorial summary. |
| Riot Data Dragon / Riot API game information | Riot states that products using developer tools must be registered/audited; use of Riot data is revocable, subject to limits, and paid access to game information has additional approval requirements. Riot permits use of named assets under its policy, but that is not an integration approval for ScrimStats. | **None in first release.** Keep as a future, versioned source candidate only. | API calls, key use, cached game data, derived tactical advice, paid gated data, asset use outside the applicable policy, or any implication of Riot endorsement. | No storage or refresh under this work order. State `unavailable — provider/source path not approved`. | External provider owner / Core Features Developer. Cost is unknown until a provider path exists. Requires Theo approval, product registration/audit as applicable, legal/PM review, and separate implementation approval. |
| Official top-tier match or VOD pages | The original official event/channel remains the source. YouTube permits embedding subject to its terms and creator embedding settings, but warns that API terms/policies apply and commercial video aggregation can be restricted. This is not a licence to host or reproduce video. | Manual outbound link only, with event/channel, date, and original URL. | Downloading, storing, clipping, rehosting, extracting frames/transcripts, scraping catalogues, auto-playing/embedding, or presenting gameplay as proprietary ScrimStats data. | Check link availability at curation and before a subsequent editorial cycle. Store only link metadata. Broken, removed, region/age-restricted, or unclear-rights content is `unavailable`. | PM/Marketing curate; no provider cost for a link. Theo approval needed before any customer surface. A future embed needs separate privacy, terms, and UX review. |
| Third-party learning articles, videos, coaching libraries, or tools | Each publisher’s terms, licence, creator permissions, and data practices are separate. No blanket permission exists from this review. | No customer feature. A future manual outbound link is possible only after the exact publisher/resource is reviewed and attributed. | Scraping, feed/API access, copying text/media/thumbnails, embedding, ranking claims, performance claims, or implying endorsement/partnership. | No retained content. Until a named resource passes source review, state `unavailable — third-party rights not reviewed`. | PM/Marketing proposes; Analyst records review; Theo approves the exact customer use. Cost unknown and must be approved before any paid provider. |
| Community wikis, statistics sites, and unverified social posts | Not authoritative for official patch facts and may have separate rights, incomplete provenance, and mutable content. | Internal discovery only; never the sole basis of a customer fact. | Customer fact claims, automatic ingestion, copying, or using community content to infer opponent tendencies. | No customer storage. If an official source cannot corroborate a fact, it is unavailable. | Not an approved source; no implementation owner. |

## Required provenance record for any future curated link

Each candidate must have: source category; canonical URL; publisher/rights holder as stated by the source; title; patch/version or publication date; retrieved and curator timestamps; attribution text; current/historical/stale/unavailable state; permitted transformation; storage decision; failure reason; reviewer; and Theo approval reference. Do not record customer identifiers, Riot credentials, raw game payloads, or copied source material in this record.

## Customer-claim boundary

- Allowed only after Theo/PM approval: `Official patch source`, `Curated external resource`, and `Unavailable or not yet checked`—each tied to its provenance record.
- Never claim: official partnership/endorsement, live patch coverage, comprehensive learning coverage, VOD availability, automated analysis, performance improvement, or paid-plan availability from this research.
- Riot’s visible non-endorsement boilerplate is required wherever a future Riot-data product use requires it under Riot policy; the legal wording must be rechecked at implementation time.

## PM and QA handoff

- **Evidence:** Riot’s current developer policy requires registration/audit for products using developer tools, policy currency, non-endorsement boilerplate, and transformative value for monetized products; Riot API terms reserve rights and can require prior written approval for paid access to game information. YouTube allows embeds subject to its terms, but embedding is creator-controlled and a video-aggregation model is not a safe default.
- **Severity:** High external-rights and customer-claim risk; no current customer harm because no source is activated.
- **User/business impact:** A source-backed learning or patch feature could be misleading, stale, unlicensed, or costly if it proceeds without this boundary.
- **Likely owner:** PM for product choice; Marketing for claims; Core Features Developer for any later integration; Theo for external/provider and release approvals.
- **Recommended next action:** PM selects whether to pursue the outbound-link-only first experience. If yes, nominate one exact official patch URL and one exact external resource for per-item review; otherwise leave all source-backed content unavailable.
- **Required verification:** PM/Marketing claim review; QA verifies version/date/attribution/stale/unavailable rendering using a non-customer fixture; Theo approves the exact customer surface. Any API, embed, provider, or paid source additionally needs its own terms/privacy/cost review and implementation work order.

## Primary sources reviewed

- [Riot Developer General Policies](https://developer.riotgames.com/policies/general) — reviewed 2026-08-03.
- [Riot Games API Terms](https://developer.riotgames.com/terms) — reviewed 2026-08-03.
- [YouTube embedding guidance](https://support.google.com/youtube/answer/171780) and [commercial-use guidance](https://support.google.com/youtube/answer/71011) — reviewed 2026-08-03.
