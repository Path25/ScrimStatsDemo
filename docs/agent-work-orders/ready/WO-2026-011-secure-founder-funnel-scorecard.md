# WO-2026-011 — Build a secure founder funnel scorecard

## ID reservation

This work order reserves `WO-2026-011` in the [work-order index](../WORK_ORDER_INDEX.md). The next work order must use `WO-2026-012`.

## Status and ownership

| Field | Value |
| --- | --- |
| Status | Ready |
| Owner | Feature Development agent |
| Priority | High |
| Autonomy class | Needs Theo's approval before implementation |

## Problem and user impact

WO-2026-003 deployed a privacy-preserving funnel ledger and service-only aggregate function, `get_founder_funnel_scorecard`, but there is no approved founder-facing surface. An authorised operator cannot distinguish an honest zero-event reporting period from unavailable measurement, while ordinary customers must remain unable to access commercial-operational data.

## Why now

The ledger is deployed but inaccessible for its intended operational purpose. A small, truthful operator surface would make launch and growth decisions evidence-led, provided the privileged boundary is implemented below the browser layer and does not compromise tenant privacy.

## Scope

- Reuse the existing active `public.platform_operators` allowlist as the only authorised audience: ScrimStats/ProComps platform operators. Workspace owners, admins, members, and organisation owners are not platform operators by virtue of their tenant role.
- Reuse the existing authenticated `pilot-ops` Edge Function trust boundary (validated bearer token followed by an active `platform_operators` lookup) rather than adding a browser-only check or a second operator-role model.
- Build a protected internal operational scorecard that presents aggregate counts only for: registration, workspace creation, first scheduled block, first completed recorded game, activation, and first paid upgrade.
- Add a read-only `funnel_scorecard` action to the protected server-side path. It may call the service-only aggregate function with server credentials, but must never expose service-role credentials, direct ledger access, or event records to the browser.
- Return a fixed, aggregate-only response: a documented instrumentation start date, selected period start/end, and all six canonical milestone keys with non-negative counts (including zero-count milestones). Reject unsupported periods rather than accepting arbitrary browser-provided query shapes.
- Display the instrumentation start date and selected reporting period clearly.
- Implement honest loading, empty, unavailable/permission-denied, and error states, including the empty wording: “No events recorded since instrumentation began”.
- Add contract and authenticated browser coverage for operator access, workspace-role denial, aggregate-only output, and responsive state handling.

## Explicit non-goals

- Do not expose tenant IDs, user IDs, email addresses, IPs, player/game data, event-level records, or service-role credentials.
- Do not grant ordinary workspace owners, members, `anon`, or unauthenticated users access to the ledger, scorecard route, aggregate API, or server-side role.
- Do not fabricate conversion rates, funnel values, or revenue; do not infer Stripe revenue from tenant plan labels.
- Do not alter the funnel-event ledger, historic event data, billing/entitlement logic, Stripe configuration, or customer-facing marketing screens.
- Do not deploy, configure production roles/secrets, or release the interface without Theo's explicit approval.

## Acceptance criteria

- [ ] The documented platform-operator audience is the active `public.platform_operators` allowlist, enforced in the existing authenticated server-side `pilot-ops` path; client-side route guards are not the security boundary.
- [ ] The browser receives only aggregate milestone counts and safe reporting-period metadata—never IDs, contact data, IPs, gameplay data, raw events, or credentials.
- [ ] An authorised operator can view registration, workspace creation, first scheduled block, first completed recorded game, activation, and first paid upgrade aggregate counts for a clearly labelled supported reporting period.
- [ ] The server returns every canonical milestone with a count, including zeros, plus the verified instrumentation-start date so “no events recorded” is distinguishable from unavailable data.
- [ ] The UI clearly states the measurement start date and selected period and presents honest loading, empty, unavailable/permission-denied, and error states.
- [ ] The empty state uses “No events recorded since instrumentation began” when the selected period contains no measured events.
- [ ] Workspace owner/member, unauthenticated, and browser-direct attempts are denied below the browser layer.
- [ ] No displayed metric represents inferred Stripe revenue or a fabricated conversion result.
- [ ] Contract tests prove server-side role enforcement and aggregate-only response shape; authenticated browser checks prove operator allow and workspace-role denial, including responsive and state coverage.
- [ ] Production deployment and hosted verification happen only after Theo approves implementation, deployment/configuration, and release.

## Relevant files, workflows, or data areas

- `docs/agent-work-orders/review/WO-2026-003-premium-copy-and-funnel-measurement.md`
- `supabase/migrations/20260728103000_premium_copy_and_funnel_instrumentation.sql`
- `scripts/funnel-instrumentation-contract.test.mjs`
- `public.workspace_funnel_events` and `public.get_founder_funnel_scorecard`
- `public.platform_operators`, `supabase/functions/pilot-ops/index.ts`, `src/hooks/usePilotOperations.ts`, and `src/pages/PilotOperations.tsx`
- `src/integrations/supabase/`, route/auth guards, and any new server-side operational endpoint
- `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`
- `docs/security/ADVISOR_REVIEW.md`

## Risks

| Area | Risk and required control |
| --- | --- |
| Permissions / Supabase RLS | A browser-only check, user-editable metadata, or over-broad workspace role could expose privileged operational data. Reuse the active `platform_operators` allowlist inside the authenticated `pilot-ops` server path and keep ledger access service-only. |
| Reporting integrity | A misleading empty/unavailable state or revenue inference can produce poor commercial decisions. Preserve the source date, period context, and aggregate-only definitions. |
| Billing / entitlement | “First paid upgrade” must use the authoritative billing signal defined by the ledger, not tenant plan labels or inferred revenue. Do not change billing flows. |
| Email | None expected. |
| Production | New privileged operational surface and potentially role/configuration changes require Theo approval before implementation, deployment/configuration, and release. |

## Required validation

- Review the active `platform_operators` allowlist, effective grants, RLS/policies, `pilot-ops` function body, and browser payload to prove the security boundary is server-side.
- Run contract tests for operator allow, workspace-role/unauthenticated denial, and an aggregate-only response schema.
- Run affected unit/contract checks, ESLint with zero warnings, TypeScript, production build, and bundle budget.
- Perform authenticated browser checks for an authorised operator and an ordinary workspace owner/member; test loading, empty, unavailable/permission-denied, error, period labelling, and responsive layouts.
- Confirm the rendered scorecard does not expose raw events, identifiers, or credentials and does not imply revenue from plans.
- After Theo approves deployment/release: conduct hosted verification of operator allow, workspace-role denial, response shape, and production error/empty-state behaviour.

## Role handoffs

| Role | State | Handoff |
| --- | --- | --- |
| Project Manager | Complete for readiness | Review confirmed the existing active `platform_operators` allowlist and `pilot-ops` server path as the required trust boundary; guard against scope creep into customer analytics or billing changes. |
| Feature Developer | Assigned | Extend the existing protected path with a read-only aggregate-only scorecard action and a private operator surface; document the response schema and trust boundary. |
| QA & Release Auditor | Involved | Independently test operator allow, all denial paths, raw-data non-disclosure, responsive states, hosted deployment, and release evidence. |
| Technical Reporting Analyst | Involved | Validate milestone definitions, start-date/period labelling, and that paid-upgrade reporting does not infer revenue. |
| Lead Marketer & Growth | Consulted | Confirm the scorecard answers launch decisions without becoming customer-facing marketing. |

## Release audit

### Acceptance-criteria traceability

| Criterion | Evidence required | Status |
| --- | --- | --- |
| Platform-operator model is defined and server-enforced | Existing `platform_operators` allowlist and `pilot-ops` token/allowlist implementation inspected; denial tests still required | Design reviewed |
| Aggregate-only payload | Contract schema and browser/network inspection | Outstanding |
| Truthful operator UI states | Authenticated responsive browser evidence | Outstanding |
| Billing-safe paid-upgrade definition | Reporting-definition review | Outstanding |
| Hosted production safety | Approved deployment plus hosted operator/denial checks | Outstanding |

### Final verdict

**READY FOR DEVELOPMENT** — the underlying ledger and aggregate function are deployed, and the review selected the existing `platform_operators` allowlist plus authenticated `pilot-ops` Edge Function as the only acceptable trust boundary. No implementation, deployment, configuration, or production release evidence exists.

### Exact outstanding checks

- Feature Developer implements the reviewed server-side aggregate response and private operator surface.
- QA proves operator allow, workspace-role/unauthenticated denial, aggregate-only output, and all user-visible states.
- Theo approves any database migration, deployment/configuration change, and production release after review evidence is presented.
- Deploy only after approval, then collect hosted allow/deny and non-disclosure evidence.

### Theo approval record

| Decision | Required | Status | Record |
| --- | --- | --- | --- |
| Operator audience and authorisation source | Yes | Approved | 2026-07-29 — review selected the existing active `platform_operators` allowlist, requested by Theo for developer assignment. |
| Implement privileged interface | Yes | Approved | 2026-07-29 — Theo requested assignment once the review found it ready; approval covers the reviewed, aggregate-only internal interface only. |
| Deployment/configuration changes | Yes | Pending | — |
| Production release | Yes | Pending | — |

## Evidence and decision record

- **2026-07-28 — QA & Release Auditor:** WO-2026-003 has deployed the privacy-preserving ledger and service-only `get_founder_funnel_scorecard`; no approved founder-facing surface exists.
- **2026-07-28 — Project Manager:** Reserved this as a separate, high-priority privileged operational-interface proposal. No code, configuration, deployment, or production change has been made.
- **2026-07-29 — Project Manager review:** Existing source confirms `public.platform_operators` is a private active allowlist and `pilot-ops` validates the authenticated user against it below the browser layer before using its service client. This is the approved reuse boundary. The existing scorecard function is service-only and returns only populated keys, so implementation must add a protected aggregate-only response that includes fixed zero-count milestones and a verified instrumentation-start date.
- **2026-07-29 — Theo:** Requested developer assignment once the review found the work ready. Work order moved to Ready and assigned; implementation is limited to the reviewed aggregate-only internal interface. No migration application, configuration change, deployment, or production release is authorised by the assignment.
