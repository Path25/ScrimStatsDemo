# WO-2026-021 - Restore existing-account workspace creation and confirmation recovery

- **ID reservation:** [WO-2026-021 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Done
- **Assigned owner:** QA
- **Size:** M
- **Risk:** Medium
- **Priority:** High
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing

- **Area / files likely affected:** `SignUp`, `SignIn`, `ForgotPassword`, `CreateWorkspace`, AuthContext/router return path, signup contracts, and hosted Supabase Auth/email evidence.
- **Dependencies:** Theo implementation approval; controlled non-customer existing/unconfirmed test identities. SMTP/Auth configuration changes need separate approval.
- **Collision risk:** Public Auth/onboarding routes and Auth email settings. Do not overlap with an Auth listener/session refactor or email-configuration deployment.

## Problem and user impact

An existing email can submit the Free sign-up form, which then presents a confirmation-email success state even when no new confirmation is sent. The user cannot create a workspace. Existing accounts should sign in and, if membership-free, reach Create Workspace; users unable to sign in need a safe recovery route.

This is consistent with intentionally non-enumerating Supabase signup behaviour, but hosted Auth/email logs have not been inspected. It is a confirmed recovery-journey defect, not proof that SMTP is failing.

## Why now

It blocks self-service workspace creation at the first conversion step while claiming that an email was sent.

## Scope

- Make the post-sign-up state useful without revealing account existence: check mail, sign in if an account already exists, or use password recovery.
- Return a verified membership-free existing account to `/create-workspace` after sign-in.
- Preserve new-account confirmation redirect and the verified, single-workspace server boundary.
- Add diagnostic-safe states/tests for new, existing confirmed, existing unconfirmed, and delivery-failure responses.

## Explicit non-goals

- Do not disclose whether an address exists, expose Auth records, weaken rate limits, bypass `create_self_service_workspace`, alter memberships, or change SMTP/templates/secrets/redirect domains without approval.

## Acceptance criteria

- A confirmed existing account with no workspace can sign in and reliably reach Create Workspace.
- Sign-up completion never asserts delivery when account/delivery state is unknown; it offers safe next actions without enumeration.
- New confirmation, existing-unconfirmed recovery, and password recovery are distinct and truthful.
- Provisioning remains authenticated, confirmed, and membership-free; contracts and browser checks cover all four paths.

## Relevant files, workflows, or data areas

- `src/pages/SignUp.tsx`, `src/pages/SignIn.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/CreateWorkspace.tsx`
- `src/contexts/AuthContext.tsx`, `src/App.tsx`, router return-state handling
- `supabase/migrations/20260727111002_self_service_signup.sql`
- `supabase/config.toml`, `supabase/templates/confirmation.html`, `scripts/self-service-signup-contract.test.mjs`

## Risks

- **Permissions / Supabase RLS:** Retain authenticated/confirmed/no-membership server checks; do not place Auth user lookup in browser.
- **Billing / entitlement:** New workspace remains Free; no checkout/plan change.
- **Email / customer communication:** Auth emails are customer communications. Do not change configuration or send test mail to customer addresses.
- **Production / data:** Hosted testing may create controlled identities/send controlled messages only after approval.

## Required validation

- Signup/sign-in/recovery/create-workspace contracts; TypeScript, zero-warning ESLint, production build, bundle budget.
- Browser checks for fresh, existing-confirmed-no-workspace, existing-unconfirmed, recovery, and generic delivery-failure paths.
- Hosted Auth logs/configuration and controlled non-customer mailbox verification only with approval; no inference from local config.
- Security review for account-enumeration resistance and redirect allowlist.

## QA scenario / reproducible test steps

1. Use controlled non-customer accounts: fresh, confirmed/no-tenant, unconfirmed, and password-recovery.
2. Run sign-up, sign-in, and recovery in the approved redirect environment.
3. Verify generic copy, no account disclosure, correct post-sign-in Create Workspace route, and server rejection for unconfirmed/membership-bearing users.
4. Record browser state, Auth response/log classification, redirect URL, and controlled mailbox outcome separately.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| PM | Involved | Preserve recovery-first non-enumerating journey. | This work order |
| Developer – Fast Lane | Not applicable | Auth/session/redirect work is shared and security-sensitive. | N/A |
| Core Features Developer | Involved | Implement state/redirect changes and document Auth assumptions. | Commit/PR |
| QA | Involved | Run controlled account matrix and assess hosted evidence. | QA audit |
| Analyst | Consulted | Any event instrumentation needs a separate approval. | Metrics Dictionary |
| Marketing | Not applicable | No public claim/campaign. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Existing-account recovery | Controlled sign-in to Create Workspace | Hosted | Outstanding |
| Honest non-enumerating state | Static contract plus signed-out responsive layout | Local automated/browser | Implemented; hosted interaction outstanding |
| Delivery classification | Auth logs and controlled mailbox | Hosted | Outstanding |
| Provisioning boundary | RPC role/state checks | Hosted | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** Local client recovery states and routing are implemented and validated. Hosted Auth/email delivery and controlled-account behaviour remain unverified.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Theo implementation approval | Theo | Written approval | Complete |
| Controlled account matrix | Core Features Developer / QA | Reproducible hosted evidence | Open |
| Auth/email diagnosis | QA | Hosted logs/configuration classification | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Approved | 2026-07-30 | Local Auth/onboarding implementation only; no hosted Auth/email testing, configuration, or deployment approval. |
| Controlled hosted email test | Yes | Pending | - | Non-customer accounts only. |
| Production configuration/release | Yes | Pending | - | Separate approval. |

## Decision and approval record

- 2026-07-30 - Theo reported existing-account sign-up submits, no email arrives, and workspace creation cannot proceed. Recovery journey must be corrected; hosted delivery root cause is unverified.
- 2026-07-30 - Theo approved WO-2026-021 implementation. Scope remained local-only: no hosted Auth/email tests, configuration changes, migration, or deployment.

## Implementation and review evidence

- Changed `src/pages/SignUp.tsx`: replaced the confirmation-email delivery assertion with a non-enumerating state that directs a user to check mail for a new account, sign in for an existing account, or request recovery.
- Changed `src/components/auth/WorkspaceGate.tsx`: authenticated membership-free accounts now route to `/create-workspace`; tenant-loading failures and missing tenant state remain unavailable rather than being treated as eligible.
- Changed `src/pages/CreateWorkspace.tsx`: the existing server confirmation rejection is rendered as a clear recovery action without weakening the RPC boundary.
- Changed `src/pages/ForgotPassword.tsx`: recovery completion is non-enumerating and does not assert a delivery result.
- Changed `scripts/self-service-signup-contract.test.mjs`: added assertions for recovery copy, the membership-free route, error separation, and the confirmation-required recovery action.
- Source: `create_self_service_workspace` correctly requires authenticated, confirmed, membership-free user.
- Local config enables confirmations and `/create-workspace` redirect but does not prove hosted delivery.
- Local validation: self-service signup contract: 4/4 passed; full suite: 177/177 passed; ESLint: 0 warnings; TypeScript: passed; production build and bundle budget: passed.
- Local browser validation: `/sign-up` rendered at 1440x900 and 390x844 with the intended responsive layout. No Auth form was submitted.
- **Highest evidence achieved:** Local browser and automated validation.

## QA handoff

**Exact work order:** WO-2026-021 - Restore existing-account workspace creation and confirmation recovery.

1. With a controlled confirmed account that has no tenant membership, sign in and verify `/overview` redirects to `/create-workspace`; create exactly one workspace and verify a second creation attempt is rejected by the server.
2. With a controlled unconfirmed account, verify sign-up and recovery surfaces remain generic and do not disclose account existence. Attempt workspace creation only through the approved environment and confirm the server rejection presents the confirmation/recovery guidance.
3. With a fresh account, confirm the normal confirmation redirect leads to `/create-workspace` after email confirmation.
4. With a controlled recovery address, verify the recovery request/response copy does not claim delivery, then record mailbox and Auth-log evidence separately.
5. Verify no membership-bearing account is redirected into workspace creation, and preserve the existing invite `from` return path.

Do not test against customer accounts. Hosted mailbox/Auth-log verification, Auth configuration changes, and deployment need Theo's separate approval.

## QA kickoff - 2026-07-30

- **Outcome:** Blocked on approved controlled hosted-account access; not a local implementation failure.
- **Independent local evidence:** `node --test scripts/self-service-signup-contract.test.mjs` passed 4/4. Source review confirms the sign-up and recovery completion states are non-enumerating, membership-free accounts route to `/create-workspace`, and `create_self_service_workspace` still requires an authenticated, confirmed account with no existing membership before creating one Free owner workspace.
- **Exact blocker:** The work order has no approval for controlled hosted identities, mailbox observation, Auth-log inspection, or deployment. QA will not create Auth users, send recovery/confirmation mail, or test against customer accounts without it.
- **Required Theo approval to proceed:** Approve four controlled non-customer identities (fresh, confirmed/no-tenant, unconfirmed, and recovery) and their mailbox/Auth-log observation in the target environment. No SMTP/Auth configuration changes, customer email, customer account, or production release is included.

## Controlled-account preparation - 2026-07-30

- **Theo approval:** Recorded. Four founder-controlled addresses may be used for the hosted non-customer matrix, including mailbox and Auth-log observation. No configuration or customer-data authority was granted.
- **Read-only classification:** One approved account is confirmed with zero memberships and is suitable for the existing-account/no-workspace sign-in case. One is confirmed with existing memberships and is suitable for the membership-bearing denial case. One approved address has no Auth account and is suitable for the fresh/unconfirmed confirmation path.
- **Tooling block:** QA's approved public Auth API request failed in the local execution environment before reaching Supabase, and the available browser connector cannot initialise because its required runtime file is absent. No Auth user was created, no password was retained, and no confirmation or recovery email was sent by QA.
- **Immediate manual handoff:** Use the confirmed/no-workspace controlled account to sign in at staging and verify the redirect to `/create-workspace`. Use the non-existent controlled address to submit the normal staging sign-up form and inspect its confirmation mail. Tell QA when each is complete; QA can then inspect dated Auth logs and continue the server-boundary review.

## QA hosted-account results - 2026-07-30

- **Pass — confirmed, membership-free recovery:** The controlled confirmed account with zero memberships signed in on staging and reached `/create-workspace`. Supabase Auth records the successful password login. No workspace was created, so the one-workspace server rejection remains unexercised.
- **Pass — password recovery delivery:** Theo received the recovery email for the controlled existing account. This is hosted mailbox evidence that the recovery request path can deliver; the surface is generic and does not disclose account existence.
- **Pass — repeated-signup truthfulness:** Auth logs classify the attempted sign-up as `user_repeated_signup` for a separate existing, confirmed, membership-bearing controlled account. The generic post-sign-up state that advises checking mail, signing in, or requesting recovery was therefore truthful and non-enumerating. It does not claim that a new confirmation email was sent.
- **Unverified — fresh confirmation delivery:** The supplied new-address spelling was not the address used in the repeated-signup test. No fresh controlled account confirmation email has been verified. This is a remaining hosted check, not evidence that confirmation email delivery is broken.
- **New product request, out of scope:** Supporting a second workspace for an existing owner conflicts with this work order's present single-workspace server boundary. It requires a separate PM-scoped work order covering authorised multi-tenant creation, workspace selection/return path, invitation and billing ownership, RLS/tenant-isolation regressions, migration safety, and recovery. Do not weaken `create_self_service_workspace` within WO-021.

## Theo completion decision - 2026-07-30

- Theo confirms the fresh-account confirmation test was completed successfully with another controlled non-customer address. This is founder-provided hosted browser/mailbox evidence; no customer account or configuration change was used.
- **Outcome:** Marked `Done`. The original recovery defect is resolved: existing confirmed membership-free users reach Create Workspace; repeated signup is non-enumerating and truthful; and controlled recovery and fresh confirmation delivery were observed.
- **Scope boundary retained:** Multiple-workspace creation for an existing owner remains a separate product request and is not authorised or implemented by this completion decision.
