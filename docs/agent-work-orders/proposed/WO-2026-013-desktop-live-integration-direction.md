# WO-2026-013 - Select a safe desktop live-integration direction without Riot API access

- **ID reservation:** [WO-2026-013 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Proposed
- **Owner:** Feature Development agent
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Problem and user impact

The meeting identifies desktop/live integration as strategic infrastructure, while official Riot API access is unavailable. ScrimStats has a bounded Windows Collector, but its route, pairing, lifecycle enforcement, reliability, distribution, and customer value have not yet been proven as a dependable live workflow. Building toward Overwolf or new live features without a selected technical direction risks time, security, and a weak paid experience.

## Why now

Live integration can be a durable Pro differentiator, but it should follow a documented feasibility and product-value decision—not an assumed platform migration. The next technical decision must also respect WO-009's outstanding entitlement and lifecycle verification.

## Scope

- Produce an evidence-backed options paper covering: hardening the existing Windows Collector, a bounded Overwolf investigation, and explicitly excluded/unsafe approaches.
- For each option, assess customer job, data source, permissions, Riot/League and platform-policy dependency, anti-cheat/privacy risk, engineering complexity, operational support burden, cost, and evidence needed.
- Define the minimum dependable desktop beta: install/pair, explicit arm/disarm, capture/import result, clear failure/recovery state, entitlement enforcement, and support path.
- Recommend one next direction and a staged validation plan. Any Overwolf application, SDK use, account setup, external-provider activation, or desktop distribution is a separately approved action.

## Explicit non-goals

- Do not build or submit an Overwolf app, activate a provider, create accounts, spend money, or distribute/sign a desktop build.
- Do not bypass Riot/League policy, collect credentials, scrape protected data, or weaken Collector privacy/security boundaries.
- Do not treat a desktop shell or local capture test as live-integration proof.

## Acceptance criteria

- A decision document compares viable options with explicit assumptions, risks, dependencies, and evidence gaps.
- The minimum desktop beta has a precise definition of done and customer-support failure path.
- A single recommended direction is approved by Theo and ProComps before feature implementation begins.
- The recommendation does not depend on browser-exposed secrets, user credentials, unsafe automation, or unverified third-party permissions.

## Relevant files, workflows, or data areas

- `collector/`, `src/pages/CollectorWorkspace.tsx`, `src/lib/collectorBridge.ts`
- `supabase/functions/collector-pairing/`, `collector-pair/`, `collector-status/`, `collector-ingest/`
- `docs/launch/RELEASE_BOUNDARY.md`, `docs/operations/PILOT_RUNBOOK.md`
- `docs/agent-work-orders/in-progress/WO-2026-009-collector-server-entitlement-enforcement.md`

## Risks

- **Permissions / Supabase RLS:** Collector/device tokens must remain tenant-scoped and server-enforced; live capabilities cannot rely on browser gates.
- **Billing / entitlement:** Desktop value remains Pro-gated; do not alter plan rules while researching options.
- **Email / customer communication:** Do not claim Overwolf support or live integration publicly.
- **Production / data:** Desktop distribution, provider accounts, telemetry, native credentials, and external activation require explicit approval.

## Required validation

- Source and architecture review of current Collector lifecycle, secrets, and entitlement boundary.
- Review applicable official platform policy/documentation before proposing an Overwolf direction.
- Threat-model the selected approach for credential, tenant, device-token, and data-retention exposure.
- Theo/ProComps review and approval before any implementation, provider activation, or distribution.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Prevent a platform-driven roadmap from bypassing paid-core readiness. | WO-009 |
| Feature Developer | Involved | Produce technical options and current-Collector assessment; no implementation. | Collector source |
| QA and Release Auditor | Involved | Define safety/reliability evidence required for a desktop beta. | Release Boundary |
| Technical Reporting Analyst | Consulted | Define safe lifecycle/reliability measures, not invasive telemetry. | Metrics Dictionary |
| Lead Marketer and Growth | Consulted | Translate only an approved, verified outcome into positioning. | No public claim yet |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Options comparison | Reviewed decision document | Proposed | Outstanding |
| Desktop beta definition | Reviewed support/recovery contract | Proposed | Outstanding |
| Safe recommended direction | Theo/ProComps approval | Proposed | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** This is decision discovery. Existing Collector evidence does not justify Overwolf work or an expanded live-integration build.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Current Collector readiness reconciliation | Feature Developer / QA | WO-009 evidence | Open |
| Platform-policy and feasibility review | Feature Developer | Options document | Open |
| Select direction | Theo / ProComps | Recorded approval | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Research/options paper | Yes | Pending | — | No account creation, SDK activation, or implementation. |
| Implementation/release | Yes | Pending | — | Requires separate selected-direction approval. |

## Decision and approval record

- 2026-07-29 - ProComps meeting identified desktop/live integration as strategic after Riot API rejection. No Overwolf direction, technical implementation, or external activation was approved.

## Implementation and review evidence

- Existing Collector source and prior review establish a bounded Windows workflow; WO-009 still has hosted direct-path, device, lifecycle, and tenant-isolation checks outstanding.
- **Highest evidence achieved:** Proposed
