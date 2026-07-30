# WO-2026-017 - Add tenant-safe workspace identity customization

- **ID reservation:** [WO-2026-017 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** Ready for Development
- **Assigned owner:** Core Features Developer
- **Size:** L
- **Risk:** High
- **Priority:** Medium
- **Autonomy class:** Needs Theo's approval before implementation

## Delivery routing and QA scenario

- **Area / files likely affected:** Tenant Settings/administration, `TenantContext`, Dashboard layout/team mark, Supabase Storage bucket/policies, tenant settings schema/migration, and tests.
- **Dependencies:** Reviewed Storage/RLS design and isolated two-tenant test accounts. Production migration/release approval remains separate.
- **Collision risk:** Tenant Settings, Storage, RLS, and layout identity; do not overlap with other Settings, tenant schema, or Storage policy work.
- **QA scenario / test steps:** (1) In two isolated tenants, use a manager and non-manager per tenant. (2) Upload an allowed image, replace it, remove it, and attempt unsupported/oversized/malicious files. (3) Verify logo display in sidebar/switcher, recovery/error states, and cross-tenant read/write denial. (4) Inspect Storage policy/migration grants and run authenticated hosted checks before release.

## Problem and user impact

The dashboard already reads `settings.logo_url` and `primary_color` into its workspace shell, but managers have no safe product path to upload, apply, replace, or remove a team logo. Teams therefore see a generic initial rather than their identity, reducing ownership and the premium bespoke feel.

## Why now

Lightweight workspace identity makes a team operations product feel adopted rather than rented. It should follow paid-core reliability and must be tenant-safe; it is not a substitute for Pro value.

## Scope

- Define manager-only logo upload, preview, replace, remove, image constraints, and recovery behaviour in Workspace settings.
- Add a tenant-scoped Storage location and RLS that prevents cross-tenant read/write; preserve existing avatar handling.
- Save only a safe workspace logo reference in tenant settings and render it through the existing `TeamMark` shell with a clear initials fallback.
- Decide whether the existing primary-colour field is exposed now or deferred; do not add uncontrolled theming.

## Explicit non-goals

- Do not make workspace branding a paid entitlement, white-label product, or marketing claim.
- Do not alter another tenant's logo, existing avatar bucket policy, or use public write access.
- Do not enable arbitrary HTML, SVG script content, excessive file sizes, or unbounded image retention.

## Acceptance criteria

- A workspace owner/admin can upload, preview, replace, and remove a valid logo for only their tenant.
- Other tenants and non-manager roles cannot read or mutate the original asset or tenant logo reference outside their authorised workspace.
- Invalid type/size/upload failure states are clear; the workspace retains the previous safe logo or initials fallback.
- Dashboard sidebar, workspace switcher, and relevant identity surfaces use the selected logo consistently.

## Relevant files, workflows, or data areas

- `src/contexts/TenantContext.tsx`
- `src/components/layout/DashboardLayout.tsx`
- `src/pages/Settings.tsx`, `src/hooks/useWorkspaceAdministration.ts`
- `supabase/migrations/20260212000001_storage_buckets.sql`, `storage.objects`, tenant settings

## Risks

- **Permissions / Supabase RLS:** Storage path/policy must enforce tenant membership and manager write authority below the browser; public bucket assumptions are not sufficient.
- **Billing / entitlement:** Not a plan change; do not gate this feature by paid tier without a separate decision.
- **Email / customer communication:** Not applicable.
- **Production / data:** Storage migration/policy and existing tenant settings need review, recovery behaviour, and explicit production approval.

## Required validation

- Migration/RLS/storage-policy review, advisor review, and authenticated owner/admin/member/cross-tenant checks.
- File type/size/failure/replacement/removal browser checks, TypeScript, zero-warning ESLint, production build.
- Hosted verification only after Theo approves migration application/deployment.

## Role involvement and handoffs

| Role | Involvement | Required input or handoff | Evidence / link |
|---|---|---|---|
| Project Manager | Involved | Confirm scope stays premium identity, not white-label packaging. | This work order |
| Core Features Developer | Involved | Implement UI, Storage boundary, and safe rendering. | Settings/TenantContext |
| QA and Release Auditor | Involved | Verify RLS, tenant isolation, failure/recovery, and hosted behaviour. | Security audit |
| Technical Reporting Analyst | Not applicable | No reporting requirement. | N/A |
| Lead Marketer and Growth | Consulted | Ensure any visual use remains truthful and no new plan claim is made. | N/A |

## Release audit

### Acceptance-criteria traceability

| Acceptance criterion | Evidence | Evidence level | Result |
|---|---|---|---|
| Tenant-safe logo storage | RLS/policy and cross-tenant tests | Outstanding | Outstanding |
| Manager identity workflow | Authenticated browser checks | Outstanding | Outstanding |
| Reliable fallback | Failure/recovery browser evidence | Outstanding | Outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The read/render data model exists, but no tenant-safe upload workflow or Storage policy has been designed.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Approve implementation scope | Theo | Theo implementation approval, 2026-07-30 | Closed |
| Design Storage/RLS model | Feature Developer / QA | Reviewed migration/policy | Open |
| Hosted security verification | QA and Release Auditor | Role/tenant browser evidence | Open |

### Theo approval record

| Approval | Required? | Decision | Date | Notes |
|---|---|---|---|---|
| Implementation | Yes | Pending | — | Storage/RLS is security-sensitive. |
| Production migration/release | Yes | Pending | — | Separate approval required. |

**Current implementation record:** Approved by Theo on 2026-07-30. This supersedes the earlier pending implementation placeholder above; production migration/release remains pending.

## Decision and approval record

- 2026-07-29 - Founder requested workspace customisation, beginning with a custom team logo.
- 2026-07-30 - Theo approved implementation. Assign to Core Features Developer because the work includes tenant Storage, RLS, settings, and shared workspace identity.

## Implementation and review evidence

- Source inspection: tenant settings already expose `logo_url` and dashboard `TeamMark` renders it; Settings has no upload control and the existing Storage bucket is for user avatars, not tenant logos.
- **Highest evidence achieved:** Source reviewed.
