# WO-2026-035 - Establish the League knowledge, patch, and learning-resource source boundary

- **ID reservation:** [WO-2026-035 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Ready for Development
- **Assigned owner:** Technical Reporting Analyst
- **Size:** M
- **Risk:** High
- **Priority:** Medium
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** Source register, rights/terms review, data dictionary, Message Ledger, future ingestion/design work orders, and resource curation policy; no provider connection in this order.
- **Dependencies:** Theo approval for research direction; provider/rights information supplied or independently reviewed; no external activation, spend, or publishing authority.
- **Collision risk:** Blocks provider-backed patches, official data, top-tier game examples, and learning-resource features. Do not implement ingestion, scraping, storage, or customer copy in parallel.

## Problem and user impact

Current official data, patch-note breakdowns, annotated top-tier games, and learning resources could make ScrimStats more useful between scrims. They can also create stale tactical advice, licensing/rights exposure, provider dependency, and misleading claims if source, update cadence, attribution, and customer availability are not explicit.

## Scope

- Define a source-by-source contract for official League data, patch notes, top-tier game examples, and curated learning resources: rights/terms, attribution, refresh cadence, provenance, storage, permitted transformation, failure state, owner, cost, and customer claim boundary.
- Recommend the smallest safe first release, preferably attributed links/summaries and curated resources rather than hosted VODs or unapproved automated ingestion.
- Define what counts as current, historical, unavailable, and editorial opinion.

## Explicit non-goals

- No Riot/GRID/other provider activation, API key, scraping, VOD download/storage, copyrighted-content republishing, automated patch interpretation, or public launch.
- No claim that top-tier examples or resources improve player performance.

## Acceptance criteria

- Every proposed source has documented rights/terms, attribution, data fields, refresh/cost/failure boundary, and approval owner.
- A recommendation identifies a safe first learning/patch experience and explicitly rejects unsupported sources.
- The Message Ledger and Metrics Dictionary distinguish official facts, curated editorial material, and unavailable data.

## Relevant files, workflows, or data areas

- `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`, `docs/operations/MESSAGE_LEDGER.md`, future provider integrations, Scouting, Draft, and WO-2026-036.

## Risks

- **Permissions / Supabase RLS:** Any future tenant preferences/bookmarks must be tenant-scoped; no data model is approved here.
- **Billing / entitlement:** Do not promise source access as an Elite benefit before source and delivery evidence exist.
- **Email / customer communication:** Public patch/resource claims need Theo/ProComps approval.
- **Production / data:** High external-provider, licensing, and cost risk; no credentials or activation without explicit approval.

## Required validation

- Primary-source terms/rights and freshness review; source-owner confirmation where required.
- PM/Marketing/QA review of planned claims and unavailable states.
- Theo approval before any implementation work order is created or dispatched.

## QA scenario / reproducible test steps

1. Select one candidate in each source category.
2. Record its terms, permitted use, attribution, cadence, cost, missing-data behaviour, and customer claim boundary.
3. Reject any candidate that requires unapproved credentials, has unclear rights, or cannot provide an honest stale/unavailable state.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Prioritise safe first experience. | This work order |
| Developer â€“ Fast Lane | Not applicable | Source/provider work is not isolated visual work. | N/A |
| Core Features Developer | Consulted | Identify future integration/data boundaries. | Design notes |
| QA and Release Auditor | Involved | Verify provenance and unavailable-state plan. | QA checklist |
| Technical Reporting Analyst | Involved | Own source contract and freshness definitions. | Source register |
| Lead Marketer and Growth | Involved | Review attribution and customer claims. | Message Ledger |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Approved source register | Primary-source review | Proposed | Outstanding |
| Safe first experience recommendation | Cross-role review | Proposed | Outstanding |
| Claim/provenance boundary | Ledger/dictionary update | Proposed | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** No source, rights, provider, or publishing path is approved.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Source/rights review | Analyst / PM | Source register | Open |
| External activation decision | Theo | Written approval or decline | Open |
| Claim review | Marketing / PM | Message Ledger | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Research/source review | Yes | Approved | 2026-08-03 | Research and internal source-boundary deliverable only; no credentials, external contact, provider activation, spend, ingestion, or publishing implied. |
| Implementation/release | Yes | Pending | — | Separate per approved source. |

## Decision and approval record

- 2026-08-02 - Founder proposed official data, patch notes, top-tier examples, and ready-made learning resources as future strong wins.
- 2026-08-03 - Theo approved the WO-035 source-boundary research. Any implementation or release remains separately approval-gated per source.

## Implementation and review evidence

- These are strategic candidates only. Existing provider/official-data readiness is not established as a customer path.
- **Highest evidence achieved:** Proposed.
