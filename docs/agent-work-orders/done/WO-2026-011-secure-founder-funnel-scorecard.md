# WO-2026-011 — Build a secure founder funnel scorecard

## ID reservation

This work order reserves `WO-2026-011` in the [work-order index](../WORK_ORDER_INDEX.md). The next work order must use `WO-2026-012`.

## Status and ownership

| Field | Value |
| --- | --- |
| Status | Done (conditional; Theo risk acceptance) |
| Owner | QA and Release Auditor |
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

**AWAITING QA REVIEW** — the aggregate-only scorecard implementation is deployed in `pilot-ops` version 7. The frontend is available on staging through the committed `staging` branch, but authenticated staging browser verification is outstanding.

### Exact outstanding checks

- QA proves operator allow, workspace-role/unauthenticated denial, aggregate-only output, and all user-visible states.
- QA verifies desktop and mobile presentation, the fixed reporting-period behaviour, and no raw-data disclosure in the browser payload.
- Production release remains outside this staging handoff.

## Independent QA audit - 2026-07-29

### Release verdict: HOLD

- **Verified hosted:** `pilot-ops` v7 is active with JWT verification enabled. Its deployed `funnel_scorecard` action validates the bearer token, then checks the server-side `platform_operators` allowlist for an active row before calling the service-only aggregate RPC. It accepts only `last_30_days` and `last_90_days`, returns the documented instrumentation date, period metadata, and a fixed six-key non-negative aggregate response. The deployed source does not select funnel ledger records or return tenant/user/contact/gameplay/credential fields.
- **Verified local:** Founder-scorecard and funnel-ledger contract tests passed 4/4. The UI source contains the required empty, loading, unavailable, period-label, and responsive-grid states.
- **Verified security boundary:** Browser roles cannot read the funnel ledger or execute the underlying scorecard function; only `service_role` can execute it. `platform_operators` has RLS with no policies, so its browser-role grants do not yield rows or writes; its use by `pilot-ops` is through the service client.
- **Blocking:** The live `platform_operators` table contains **zero active operators**. Therefore no authorised user can reach the scorecard, and the required operator-allow, aggregate-response, empty-state, responsive, and production browser checks cannot be performed. A privileged operational surface with no active authorised operator is not release-ready.
- **Unverified:** Authenticated ordinary-workspace denial completed only to the staging UI's `Verifying operator access…` state before the browser handoff ended; it is not recorded as a pass. No authenticated operator browser session exists. No browser payload capture proves the live response contains only the safe aggregate fields.
- **Exact Theo/PM action required:** Theo must explicitly approve an active, named platform-operator assignment for a non-customer operator account (a production role/configuration change), or provide an already-active authorised operator session. Then QA must verify operator allow and aggregate-only output, sign in as a normal workspace owner/member to verify 403/permission-denied behaviour, and inspect desktop/mobile states and browser payload. Do not infer approval to add an operator from implementation/deployment approval.

## Operator assignment attempt - 2026-07-29

- **Approved action completed:** At Theo's explicit direction, QA added the currently signed-in dedicated TestWorkspace account as an active `platform_operators` entry in the connected Supabase project. Post-write verification confirmed one active operator and that the approved test account is active. No tenant role, billing state, or customer record was changed.
- **Blocking environment evidence:** The same authenticated account still received `Platform operator access required` at `https://staging.scrimstats.gg/ops`. The production allowlist assignment therefore does not reach the backend or deployed Function used by staging (or staging is serving an older incompatible deployment). This is a verified staging/production configuration or deployment mismatch, not an operator-role failure.
- **QA boundary:** The connected Vercel account exposes no projects, so QA cannot inspect staging deployment variables, identify its Supabase project, or safely mirror the allowlist assignment. PM/Developer must supply the staging Vercel project/deployment and Supabase project reference, then verify the staging `VITE_SUPABASE_URL`/Auth origin and `pilot-ops` version before asking QA to repeat the operator check.

## Root-cause confirmation - 2026-07-29

- **Blocking defect confirmed:** The active `pilot-ops` v7 Function has no CORS headers and rejects every non-POST request before authentication. A live preflight to `https://tvcgjehreaayfazlhvps.supabase.co/functions/v1/pilot-ops` with `Origin: https://staging.scrimstats.gg`, requested method `POST`, and the browser's `authorization`, `apikey`, `content-type`, and `x-client-info` headers returned `405 Method Not Allowed` with no `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, or `Access-Control-Allow-Headers` response headers.
- **Impact:** Cross-origin browser calls from staging never reach the JWT or `platform_operators` check. The generic UI message `Platform operator access required` incorrectly represents a transport/CORS failure as an authorisation denial. This explains why the approved active operator cannot enter `/ops` despite the same Supabase database.
- **Required developer remediation:** Add a restrictive shared CORS policy that permits only approved ScrimStats origins (including staging and production), return it on every JSON response, and return a successful `OPTIONS` response before authentication. Preserve `verify_jwt: true` and the existing server-side active-operator check. Add a hosted browser check that distinguishes CORS/network failure from the legitimate 401/403 operator-denial state, then return the work order to QA.

## QA recheck after CORS remediation - 2026-07-29

- **Pass:** Active `pilot-ops` v8 now returns `200` to an `OPTIONS` preflight from `https://staging.scrimstats.gg`, with that exact allowed origin, `POST, OPTIONS`, and the required browser headers. Its CORS allowlist is explicit rather than wildcarded.
- **Pass:** The approved active TestWorkspace operator successfully opened staging `/ops`. The protected Pilot Operations surface and Founder funnel rendered; the scorecard progressed from its loading state to `No events recorded since instrumentation began`, with no browser warnings or errors. This proves the operator allow path, cross-origin transport, instrumentation date, and truthful empty state.
- **Residual unverified checks:** ordinary workspace-owner/member and unauthenticated 401/403 browser checks; browser-network payload capture proving the live body is aggregate-only; period switch to `last_90_days`; error state; and mobile layout. These are follow-up QA checks, not evidence of a current failure.

### Updated QA release recommendation

**CONDITIONAL** — the prior CORS blocker is resolved and the operator path is hosted-verified. Do not mark the privileged scorecard fully release-ready until the listed negative-path, payload, period, error, and responsive checks are evidenced.

## Completion decision - 2026-07-29

- **Theo decision:** Accepted the documented residual QA risks and approved moving WO-2026-011 to Done.
- **Completion status:** Done (conditional). The scorecard remains an internal, allowlisted operational surface. The outstanding ordinary-user denial, aggregate-payload capture, alternate-period, error-state, and mobile-layout checks remain retained follow-up evidence; they were not silently treated as passed.

### Theo approval record

| Decision | Required | Status | Record |
| --- | --- | --- | --- |
| Operator audience and authorisation source | Yes | Approved | 2026-07-29 — review selected the existing active `platform_operators` allowlist, requested by Theo for developer assignment. |
| Implement privileged interface | Yes | Approved and implemented | 2026-07-29 — aggregate-only internal interface implemented locally. |
| Deployment/configuration changes | Yes | Approved and deployed | 2026-07-29 — Theo approved the updated `pilot-ops`; Supabase deployed active version 7 with JWT verification enabled. |
| Production release | Yes | Pending | — |

## Evidence and decision record

- **2026-07-28 — QA & Release Auditor:** WO-2026-003 has deployed the privacy-preserving ledger and service-only `get_founder_funnel_scorecard`; no approved founder-facing surface exists.
- **2026-07-28 — Project Manager:** Reserved this as a separate, high-priority privileged operational-interface proposal. No code, configuration, deployment, or production change has been made.
- **2026-07-29 — Project Manager review:** Existing source confirms `public.platform_operators` is a private active allowlist and `pilot-ops` validates the authenticated user against it below the browser layer before using its service client. This is the approved reuse boundary. The existing scorecard function is service-only and returns only populated keys, so implementation must add a protected aggregate-only response that includes fixed zero-count milestones and a verified instrumentation-start date.
- **2026-07-29 — Theo:** Requested developer assignment once the review found the work ready. Work order moved to Ready and assigned; implementation is limited to the reviewed aggregate-only internal interface. No migration application, configuration change, deployment, or production release is authorised by the assignment.
- **2026-07-29 — Feature Developer:** Implemented the `funnel_scorecard` action in the existing authenticated `pilot-ops` allowlist boundary. The response permits only `last_30_days` and `last_90_days`, includes the six canonical zero-filled aggregate milestones, period metadata, and instrumentation start `2026-07-28T15:46:02Z`; it does not return ledger records, tenant/user identifiers, contact data, gameplay data, or credentials. Added responsive operator-surface and contract coverage. Focused contracts, TypeScript, ESLint, full suite (169/169), and production build passed.
- **2026-07-29 — Theo:** Approved deployment of updated `pilot-ops`.
- **2026-07-29 — Feature Developer:** Deployed `pilot-ops` version 7 as ACTIVE with JWT verification enabled. Browser verification against `https://staging.scrimstats.gg/ops` was blocked by the execution environment's enterprise network policy; this is not evidence of access denial or a product defect.
