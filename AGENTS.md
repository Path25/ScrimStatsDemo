\# ScrimStats Engineering Guide



\## Product and quality bar



ScrimStats by ProComps is a premium League of Legends team-operations platform for competitive amateur, grassroots, collegiate, and developing professional teams. Its primary users are coaches and managers; players participate less frequently, while coaches, managers, and organisation owners may be buyers.



Build dependable workflows that replace fragmented spreadsheets, calendars, Discord channels, bots, and review notes. Prioritise team operations, practice/review, scouting, and player development.



Customer-facing work must feel bespoke, polished, concise, and operationally trustworthy. Preserve the established dark analyst-console visual system and use first-party brand assets. Do not use fabricated metrics, sample team data, placeholder claims, generic SaaS copy, or implementation language in live product screens.



\## Architecture and sources of truth



\- Web app: React, TypeScript, Vite, Tailwind, shadcn/ui.

\- Backend source of truth: Supabase Auth, Postgres, Storage, and Edge Functions.

\- `src/integrations/supabase/types.ts` is generated: do not edit it manually.

\- Live workspace screens must use tenant-scoped data and show unavailable states honestly; never fall back to mock team data.

\- Public marketing and authenticated workspace routes are separate.

\- The Windows Collector is a bounded capture workflow. League client credentials must remain memory-only and must never be logged, persisted, uploaded, or exposed to the browser.

\- Browser environment variables are public. Never expose service-role, Stripe, Riot, GRID, collector, Discord, worker, or provider credentials through `VITE\_\*` values.



\## Supabase, authentication, and tenant safety



\- Every tenant-owned read and mutation must enforce tenant membership and the required role below the browser layer.

\- Enable RLS on exposed tables. Use explicit `TO` roles and tenant/ownership predicates; `TO authenticated` alone is not authorization.

\- Updates require both `USING` and `WITH CHECK`.

\- Reuse established membership helpers such as `public.user\_belongs\_to\_tenant` and role helpers rather than inventing parallel access rules.

\- Treat `SECURITY DEFINER` as exceptional: use a fixed search path, validate authenticated user and tenant/role in the function, and revoke broad execution.

\- Never make authorization decisions from user-editable metadata.

\- Keep provider credentials server-side; browser UI may receive only safe connection status and key hints.



\## Plans, billing, and entitlements



Free covers core operations. Pro and Elite rules must remain coherent across browser gates, workspace module state, billing copy, checkout/webhook handling, and server-side enforcement.



When changing a plan or entitlement, update and test all affected:

\- `src/lib/plan-entitlements.ts`

\- route gates and feature previews

\- `BillingPanel`, Settings, and Integrations

\- database entitlement rules and Edge Functions

\- Stripe price mapping/webhook behaviour

\- relevant contract tests



Never claim a paid capability is available unless its complete customer and support path is implemented and verified.



\## Evidence and validation



Distinguish clearly between proposed, implemented, locally tested, browser verified, hosted verified, and production-ready. A passing build, static test, or signed-out route does not prove data wiring, authorization, billing, or hosted deployment health.



Before claiming work complete, run validation proportionate to risk:

\- affected unit/contract tests;

\- ESLint with zero warnings, TypeScript, production build, and bundle budget;

\- browser checks for changed public or workspace journeys;

\- authenticated role checks for authorization-sensitive work;

\- Supabase migration/RLS/function checks and advisor review for database or security changes;

\- hosted verification for deployments, billing, emails, Edge Functions, provider integrations, or production claims.



Do not delete historical evidence to resolve an issue. Preserve provenance and use recovery paths for access, roster, and scrim changes.

\## Development lanes and work-order routing

Every open work order must record its size (`S`, `M`, or `L`), risk (`Low`, `Medium`, or `High`), assigned owner, likely affected areas/files, dependencies, acceptance criteria, reproducible QA scenario, and one delivery status: `Backlog`, `Ready for Development`, `In Progress`, `Ready for QA`, `Blocked`, or `Done`.

`Developer – Fast Lane` receives only `S`, low-risk, isolated work: visual polish, copy, contained UX improvements or defects, and small tests/docs. `Core Features Developer` receives all `M`/`L`, medium/high-risk, integration, shared-component, data-flow, Collector, auth, billing, Supabase, migration, security, or entitlement work.

Do not assign both development lanes to overlapping features, shared files, or related refactors at the same time. A work order is `Ready for Development` only after acceptance criteria and QA scenario are complete. It is `Ready for QA` only after the developer records validation evidence and reproducible QA steps. The assignment board at `docs/agent-work-orders/DEVELOPER_ASSIGNMENT_BOARD.md` is the current dispatch view; the work order remains the source of truth.



\## Approval boundaries



Theo must explicitly approve before:

\- production deployment, migration application, production-data changes, secret/configuration changes, or credential rotation;

\- Stripe price, billing, entitlement, or checkout changes;

\- customer emails, marketing, public claims, outreach, or publishing;

\- external-provider activation or spending;

\- destructive operations or changes that weaken security, privacy, RLS, or tenant isolation.



\## Key references



\- Product and local setup: `README.md`

\- Release scope: `docs/launch/RELEASE\_BOUNDARY.md`

\- Edge Function deployment inventory: `docs/launch/EDGE\_FUNCTION\_MANIFEST.md`

\- Operations and pilot verification: `docs/operations/PILOT\_RUNBOOK.md`

\- Recovery procedure: `docs/operations/INCIDENT\_RECOVERY.md`

\- Reporting definitions and source status: `docs/operations/DATA\_SOURCE\_MAP\_AND\_METRICS\_DICTIONARY.md`

\- Security/advisor policy: `docs/security/ADVISOR\_REVIEW.md`

\- Schema history: `supabase/migrations/`

\- Auth and Edge Function configuration: `supabase/config.toml`

\- Transactional and Auth email sources: `supabase/functions/\_shared/email.ts`, `supabase/templates/`

