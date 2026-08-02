# WO-2026-006 - Establish authoritative reporting connections and reliability telemetry

- **Status:** In Progress
- **Assigned owner:** PM
- **Size:** M
- **Risk:** Medium
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing and QA scenario

- **Area / files likely affected:** Metrics Dictionary, reporting baselines, error reporting, Collector signals, Stripe/Vercel/Supabase source connections and operational docs.
- **Dependencies:** Existing least-privilege application access; any billable telemetry, migration, configuration, or provider connection requires Theo approval.
- **Collision risk:** Do not duplicate or redefine funnel/billing metrics while WO-2026-003, WO-2026-008, or WO-2026-010 evidence is being reconciled.
- **QA scenario / test steps:** (1) Select a declared Europe/London reporting period. (2) Reconcile each reported value to a read-only source dashboard/query/export. (3) Confirm unavailable values name their missing source. (4) Verify no secrets, tenant identifiers, customer payment details, or unapproved event fields enter the baseline; record source, query date, and discrepancy.

## Problem and user impact

ScrimStats cannot currently produce measured growth, activation, retention, MRR, website-performance, or service-health reporting because its production Supabase, Stripe, Vercel, and Collector-distribution sources are not connected to the reporting workflow. The local codebase has operational records, but no authoritative production baseline. Browser client-error intake is hosted and has received an event, but its release attribution is currently labelled `local`, so it cannot reliably correlate a customer error to a deployment or provide a release-level error rate.

Without trustworthy visibility, acquisition/activation failures, failed imports, paid-plan friction, and service degradation can remain undetected until a pilot team reports them.

## Why now

Client growth, active teams, and MRR are the stated commercial priorities. The existing Data Source Map keeps these metrics unavailable rather than estimated; this work converts the highest-value data sources into a secure, evidence-backed reporting baseline.

## Scope

### Phase 1 - read-only connections and baseline (no product code change)

- Grant project-scoped Supabase Read-Only access to the ScrimStats production project, or provide aggregate-only exports if the plan does not support that role.
- Grant Stripe View Only access for the production account; do not create, expose, or share API keys.
- Grant Vercel read-only access sufficient to inspect deployments, Web Analytics, Speed Insights, and logs. If the team plan's viewer role cannot access logs, provide time-bounded log exports rather than a higher-privilege account.
- Grant GitHub Read access to the Collector-release repository for release and download context.
- Produce a dated baseline for the currently sourceable workspace, activity, Collector, billing-ledger, and deployment/log measures; label every remaining gap unavailable.

### Phase 2 - approval-gated instrumentation and reliability work

- Add privacy-preserving website visit, acquisition source, signup-start, Collector-download-click, and approved feature-activation events.
- Maintain the hosted client-error receiver as a bounded, access-controlled intake path. Release-attribution remediation and Scouting fault investigation are tracked separately in `WO-2026-007`.
- Add a controlled Collector lifecycle signal for launch/pairing/capture outcomes. Do not claim an installer download proves installation.
- Enable and integrate Vercel Web Analytics and Speed Insights for this Vite/React application, with an agreed event budget and cost limit.
- Reconcile authoritative Stripe subscription state with tenant entitlement state and document the price-to-plan mapping.
- Align any final funnel ledger with `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`. The untracked `20260728103000_premium_copy_and_funnel_instrumentation.sql` must be reviewed as a proposed migration; it must not be applied without Theo approval.

## Explicit non-goals

- Publishing marketing claims, contacting customers, changing pricing, or altering subscription/entitlement behaviour.
- Sending PII, Riot credentials, collector credentials, IP addresses, player records, game payloads, or free-form event payloads to analytics.
- Backfilling historical product events that were never recorded.
- Deploying a migration, enabling a paid external-provider add-on, or changing production configuration without Theo's explicit approval.

## Acceptance criteria

- A documented, dated baseline exists for every sourceable metric; all other metrics remain explicitly unavailable with their missing dependency.
- Supabase, Stripe, Vercel, and GitHub access is least-privilege, project/account scoped, and uses no shared secrets or service-role keys.
- The client-error route retains hosted evidence of bounded, safe receipt; any release-attribution or Scouting fault remediation is reconciled with `WO-2026-007`.
- Acquisition, signup, activation, paid conversion, Collector lifecycle, errors, and web-performance definitions reconcile with the Metrics Dictionary.
- The installed instrumentation records only approved, privacy-bounded fields and has tested unavailable/failure states.
- A Project Manager handoff is produced for any material error-rate, failed-import, auth, service, or data-reconciliation regression.

## Relevant files, workflows, or data areas

- `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`
- `src/lib/error-reporting.ts`
- `src/pages/CollectorWorkspace.tsx`
- `collector/src/collector-service.ts`
- `supabase/functions/collector-ingest/index.ts`, `collector-status/index.ts`, `stripe-webhook/index.ts`
- `supabase/migrations/20260728103000_premium_copy_and_funnel_instrumentation.sql` (proposed/unapplied)
- `scripts/funnel-instrumentation-contract.test.mjs`
- `README.md`, `docs/operations/INCIDENT_RECOVERY.md`

## Risks

- **Permissions / Supabase RLS:** Reporting queries and any scorecard RPC must not expose cross-tenant data or bypass tenant boundaries. Review any `SECURITY DEFINER` function and run advisors before a migration is applied.
- **Billing / entitlement:** Stripe is authoritative for MRR and subscription lifecycle; tenant plan fields and webhook ledger must be reconciled rather than treated as revenue evidence.
- **Email / customer communication:** Not applicable in Phase 1. Event/copy changes in Phase 2 must not alter customer messages without approval.
- **Production / data:** Read-only access can expose sensitive operational data; no secrets may be shared. Analytics settings and Vercel packages can create usage costs and require explicit approval.

## Required validation

- Read-only access audit: role, scope, project/account selection, and no secret exposure.
- Baseline queries/exports reconciled against source dashboards for a declared period.
- For any implementation: targeted contract tests, zero-warning lint, typecheck, production build, and browser checks.
- For database/function work: migration/RLS/function review, Supabase advisor check, and hosted validation with an isolated test workspace.
- For Vercel analytics/performance: verify the deployed client emits the expected request/event without sensitive fields; verify cost guardrails.
- For Stripe: verify test-mode lifecycle and reconcile Stripe events with ScrimStats tenant state before production claims.

## Decision and approval record

- 2026-07-28 - Proposed by Analytics and Technical Reporting. Theo approval is required before granting external access, enabling billable monitoring/analytics, applying migrations, or deploying telemetry.
- 2026-07-28 - Theo assigned the Project Manager to review and advance this work order. Read-only source access and all implementation/release boundaries remain approval-gated.
- 2026-07-28 - Theo confirmed that relevant agents now have application access. The access blocker is cleared; the Project Manager must still produce the dated, reconciled baseline required by this work order before it can be completed.

## Prepared Phase 1 access and baseline packet

The read-only Supabase and Stripe evidence recorded in `WO-2026-008` establishes a first commercial baseline, but it is not a persistent reporting connection or a complete operational baseline. Reuse its redacted classifications and Stripe-derived MRR; do not treat tenant plan labels as revenue.

To complete Phase 1 without sharing secrets, the Project Manager needs one of the following for each remaining source:

| Source | Least-privilege input | Required output |
|---|---|---|
| Supabase | Existing read-only access or an approved aggregate export | Dated workspace, activity, Collector, webhook-ledger, Auth/API/Edge-log, and advisor baseline |
| Stripe | Existing view-only access or approved aggregate export | Subscription-state, MRR, cancellation, price-map, and webhook-delivery reconciliation |
| Vercel | Viewer/log/analytics access or time-bounded redacted exports | Deployment revision, Runtime Error, Web Analytics, Speed Insights, and availability baseline |
| GitHub Releases | Read access or release/download export | Collector version and download context, explicitly not installation or capture evidence |

No service-role key, Stripe secret, provider credential, customer payment detail, or unredacted tenant/customer identifier is required in a work order. When access or exports are available, produce a dated baseline using the definitions in `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`, label every unavailable metric with its missing dependency, and hand material regressions to the Project Manager through that document's handoff format.

## Implementation and review evidence

- Initial Project Manager review, 2026-07-28: the Metrics Dictionary records production Supabase, Stripe, Vercel, and GitHub reporting connections as pending. No production values can be reported as measured until a least-privilege source is connected and queried.
- WO-2026-008 subsequently established a redacted, read-only Supabase/Stripe reconciliation with a historical USD 19.98 Stripe MRR snapshot; paid workspace entitlement records remained unreconciled. This is valid commercial evidence only for that dated snapshot, not current MRR; Vercel, GitHub, full operational health, and persistent reporting access remain outstanding.
- Source review confirms `src/lib/error-reporting.ts` sends browser errors to `POST /api/client-error` and `api/client-error.ts` is the repository receiver. Vercel Runtime Errors confirms hosted receipt of one Scouting error on 2026-07-27. The receiver is operational for bounded error intake; its `VITE_APP_REVISION || "local"` fallback prevents reliable release attribution and is tracked in `WO-2026-007`.
- The privacy-bounded funnel migration and contract tests exist under WO-2026-003, but its migration is not hosted-verified and must not be treated as a production source.
- Completion blockers: Theo or the relevant account owner must grant the Phase 1 read-only access described in Scope, or provide approved aggregate exports. Do not provide or share service-role, Stripe secret, provider, or other production secrets. Phase 2 instrumentation, configuration, migration, and cost-bearing changes remain explicitly approval-gated.
- **Highest evidence achieved:** Proposed
