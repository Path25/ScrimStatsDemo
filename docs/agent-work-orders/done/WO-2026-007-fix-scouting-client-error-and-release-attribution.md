# WO-2026-007 - Fix the Scouting client error and restore release attribution

- **Status:** Done (conditional; production review pending)
- **Owner:** ScrimStats Feature Development agent
- **Priority:** Medium
- **Autonomy class:** Needs Theo's approval before implementation

## Problem and user impact

Vercel Runtime Errors for the production ScrimStats project recorded one browser error on 2026-07-27:

- Route: `/scouting`
- Error: `TypeError: Cannot read properties of undefined (reading 'default')`
- Affected users: 1
- Delivery path: `/api/client-error`
- Reported release: `local`

The deployed client-error receiver is working, but the `local` release label prevents reliable correlation of a customer error to its deployed commit. The Scouting route may fail for a user or a data state not covered by current checks.

## Why now

Scouting is a paid workflow and customer-facing errors undermine product trust. This is also the first hosted evidence that the client-error reporting path is active, so its correlation data should be made operationally useful.

## Scope

- Reproduce the Scouting route failure using the recorded route and a safe representative state.
- Identify the undefined import/value and add a regression test.
- Ensure production builds set a safe, non-sensitive release identifier that maps client errors to a deployment/commit.
- Verify client-error payloads remain limited to approved safe fields and correlation IDs.

## Explicit non-goals

- Altering customer Scouting data or customer permissions during diagnosis.
- Adding PII, credentials, gameplay payloads, or free-form data to error reports.
- Deploying the fix without Theo approval.

## Acceptance criteria

- The `/scouting` TypeError is reproduced or its triggering state is precisely explained from hosted evidence.
- A regression test covers the fault path.
- Production error events carry an identifiable deployment/commit release value instead of `local`.
- Hosted verification confirms the error receiver records safe, searchable correlation data and no recurrence occurs in the checked period.

## Relevant files, workflows, or data areas

- `src/lib/error-reporting.ts`
- Scouting route/components and their data hooks
- Vercel project `scrim-stats-demo-ibki`, deployment `dpl_7bysfNcGvFiSH7ujbUtvWVbMS4JU`
- `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md`

## Risks

- **Permissions / Supabase RLS:** Reproduction must use a safe account and preserve tenant boundaries.
- **Billing / entitlement:** Scouting is a paid capability; gates must not be weakened to reproduce the issue.
- **Email / customer communication:** Not applicable.
- **Production / data:** Release-attribution configuration and deployment require Theo approval.

## Required validation

- Targeted regression test, zero-warning lint, typecheck, and production build.
- Browser verification of Scouting at relevant plan/role boundaries.
- Hosted check of the deployed error event, route behavior, and release correlation.

## Decision and approval record

- 2026-07-28 - Proposed by Analytics and Technical Reporting from Vercel Runtime Errors: one `/scouting` TypeError on 2026-07-27, one affected user, release labelled `local`. No implementation or release approval recorded.
- 2026-07-28 - Theo approved implementation. Hosted deployment, production-data changes, and configuration changes remain subject to release approval.

## Implementation and review evidence

- **Implementation (local only):**
  - Confirmed the current `Scouting` page has a default export and is loaded through the Pro-gated lazy route. Added a contract test to protect that route/import shape.
  - Replaced the browser-controlled `VITE_APP_REVISION || "local"` fallback with a build-time identifier. It prefers an explicit build revision, then Vercel's commit SHA, then deployment ID. Production builds without any identifier use the deliberately visible `unattributed-production` value instead of incorrectly reporting `local`.
  - Removed the free-form error-boundary component stack from the client error event. The receiver continues to log only its approved, whitelisted fields.
- **Investigation result:** An authenticated Pro owner loaded staging `/scouting` successfully on 2026-07-28 with no visible error or browser-console error. The historic hosted failure was therefore not reproduced, and its user/data-specific trigger cannot be precisely established from the available local and staging evidence.
- **Validation:**
  - Targeted contracts: 12 passed, 0 failed.
  - Full automated suite: 168 passed, 0 failed.
  - TypeScript: `tsc --noEmit` passed.
  - ESLint: passed with `--max-warnings 0`.
  - Production build: passed.
  - Vercel-style local build with a temporary `VERCEL_GIT_COMMIT_SHA`: passed; the emitted client bundle contained `wo-2026-007-release-check`.
- **Highest evidence achieved:** Locally tested. The current staging Scouting route was browser verified, but this new attribution code has not been deployed or hosted-verified.

## QA Auditor handoff

1. Before an approved deployment, verify the Vercel project exposes system environment variables to the production build/runtime, or set an approved explicit `VITE_APP_REVISION` at build time. No secret is required for this value.
2. After the approved deployment, use an isolated authenticated Pro workspace to load `/scouting` and confirm its network/error event includes the deployed commit or deployment ID, never `local` or `unattributed-production`.
3. Inspect the receiver/runtime log record and confirm it contains only the allowlisted reference, release, route, error name/message, and timestamp fields. Confirm no component stack, user identity, gameplay data, or credential material is present.
4. Check Vercel Runtime Errors for the agreed observation period and record whether the historical `undefined.default` Scouting signature recurs. If it does, preserve the event/deployment reference and capture the exact safe state needed to reproduce it.

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| `/scouting` TypeError reproduced or triggering state precisely explained | Authenticated staging owner loaded `/scouting` successfully on 2026-07-28; historic trigger remains unknown. | Hosted staging | Waived by Theo: risk accepted, not reproduced or explained. |
| Regression test covers the fault path | `scripts/scouting-error-attribution-contract.test.mjs` asserts the lazy default-export route shape; full suite passed 168/168. | Local | Conditional: route shape covered, historic fault path not proven. |
| Production events carry an identifiable release value | Build-time precedence is implemented and local production build passed. No production event has been inspected. | Local | Outstanding: no production evidence. |
| Hosted receiver logs safe, searchable correlation data and no recurrence occurs in the checked period | Staging `/scouting` loaded with no browser-console errors. No controlled event, receiver record, or observation period evidence exists. | Hosted staging | Outstanding: waived for staging completion; required before production release. |

### Final verdict

- **Verdict:** CONDITIONAL
- **Rationale:** Staging Scouting loaded successfully for the audited authenticated workspace and local validation passed (targeted contract, 168-test suite, TypeScript, zero-warning ESLint, and production build). The original production trigger remains unknown, and telemetry/release attribution has not been verified in a hosted error event. Theo explicitly accepted those residual risks on 2026-07-28 and requested the implementation work order be closed pending final production review. This is not production-release approval.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Controlled staging error event and receiver record | Theo / QA Auditor | One staging `/api/client-error` log record with only allowlisted fields and an identifiable non-`local` release | Required before production review |
| Free-denied and Pro-allowed Scouting boundaries | Theo / QA Auditor | Isolated staging Free and Pro workspace browser evidence | Required before production review |
| Historic trigger or safe incident explanation | QA Auditor | Preserved production incident metadata and reproduction, or a precise hosted explanation | Risk accepted; still unresolved |
| Production deployment and recurrence observation | Theo / QA Auditor | Theo production approval, production release correlation, and agreed observation-period result | Required before production release |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved | 2026-07-28 | Recorded in the original decision record. |
| Risk acceptance / staging completion | Yes | Approved | 2026-07-28 | Theo accepted the unknown historic trigger and outstanding hosted telemetry verification, and requested work-order closure pending final production review. |
| Production release | Yes | Not approved | — | Final review remains required before any production promotion. |
