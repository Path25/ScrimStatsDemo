# WO-2026-017 - Add tenant-safe workspace identity customization

- **ID reservation:** [WO-2026-017 in the work-order index](../WORK_ORDER_INDEX.md)
- **Status:** In Progress
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
| Tenant-safe logo storage | Migration and local Storage-policy contract; hosted two-tenant checks | Local automated / hosted | Implemented locally; hosted checks outstanding |
| Manager identity workflow | Local component contract; authenticated browser checks | Local automated / hosted | Implemented locally; hosted checks outstanding |
| Reliable fallback | Local rendering and failure-path contract; browser evidence | Local automated / hosted | Implemented locally; hosted checks outstanding |

### Final verdict

- **Verdict:** HOLD
- **Rationale:** The private bucket, tenant-path policies, owner/admin controls, signed reads, and initials fallback are implemented and locally validated. The migration is applied and its bucket/policy configuration is hosted-verified; authenticated tenant-isolation and browser verification remain outstanding.

### Outstanding checks

| Check | Owner | Required evidence to close | Status |
|---|---|---|---|
| Approve implementation scope | Theo | Theo implementation approval, 2026-07-30 | Closed |
| Local static validation | Core Features Developer | TypeScript, ESLint, full test suite, and production build | Passed 2026-07-30 |
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
- 2026-07-30 - Theo approved local implementation. Hosted migration and release remain separate decisions.
- 2026-07-30 - Theo approved application of the workspace-logo Storage migration. It was applied to the linked Supabase project as `20260730124701_workspace_logo_storage`.

## Implementation and review evidence

- Source inspection: tenant settings already expose `logo_url` and dashboard `TeamMark` renders it; Settings has no upload control and the existing Storage bucket is for user avatars, not tenant logos.
- Added `supabase/migrations/20260730124701_workspace_logo_storage.sql`: private `workspace-logos` bucket, 2 MB JPEG/PNG/WebP limits, one fixed object path per tenant, tenant-member read and owner/admin insert/update/delete policies.
- Added `src/lib/workspace-logo.ts`: opaque settings path, file validation, and fixed per-tenant path helpers. SVG is intentionally excluded.
- Changed `src/contexts/TenantContext.tsx`: resolves managed logo paths to member-authorised one-hour signed URLs and refreshes before they expire; legacy `logo_url` remains only as an existing-data fallback until a workspace saves or removes its logo.
- Changed `src/hooks/useWorkspaceAdministration.ts`, `src/components/workspace/WorkspaceIdentityPanel.tsx`, and `src/pages/Settings.tsx`: manager-only preview/upload/replace/remove workflow; settings update errors retain the existing managed asset where possible; removal falls back to initials even if asset cleanup needs retrying.
- Changed `src/components/layout/DashboardLayout.tsx`: image load failure now falls back to workspace initials in the sidebar and switcher.
- Added `scripts/workspace-identity-contract.test.mjs`: local policy, role, file-constraint, signed-read, and fallback checks passed 2/2.
- Dependency restoration: stopped the user-approved, verified local Vite/esbuild processes, then ran `npm ci --ignore-scripts`. npm reported 15 existing dependency-audit findings; no dependency upgrade or `npm audit fix` was applied.
- Local validation: focused workspace-identity contract 2/2 passed; full suite 181/181 passed; ESLint zero warnings; TypeScript passed; production build and bundle budget passed; `git diff --check` passed.
- **Highest evidence achieved:** Local automated validation.

### Hosted migration evidence - 2026-07-30

- Applied to Supabase project `tvcgjehreaayfazlhvps`; hosted migration record: `20260730124701_workspace_logo_storage`.
- Hosted inspection confirms `workspace-logos` is private, has a 2,097,152-byte limit, and permits only JPEG, PNG, and WebP MIME types.
- Hosted inspection confirms the four expected `authenticated` Storage policies: member read; owner/admin insert, update (with `USING` and `WITH CHECK`), and delete.
- The security-advisor scan contains existing project-wide RLS and `SECURITY DEFINER` notices. It did not identify a new advisory finding for the workspace-logo bucket/policies; those existing notices are outside WO-017 scope.

## QA handoff

**Exact work order:** WO-2026-017 - Add tenant-safe workspace identity customization.

1. Confirm applied migration `20260730124701_workspace_logo_storage.sql` and `workspace-logos` is private with the expected size and MIME restrictions.
2. In tenant A as owner/admin, upload PNG, JPEG, and WebP files below 2 MB; replace and remove the logo. Confirm sidebar and switcher update, and initials return after removal or failed image load.
3. In tenant A as member/viewer, confirm the logo can be read but upload, replacement, removal, and direct settings mutation are denied.
4. In tenant B, attempt direct read/write/update/delete of tenant A's `tenant-a-id/logo` object and signed URL creation. Expect denial in every case.
5. Attempt SVG, GIF, zero-byte, oversized, malformed-path, and upload-failure cases. Confirm clear error state and retention of the prior safe logo or initials fallback.

The hosted migration is applied. No deployment, production data change, plan change, or external communication is approved by this handoff.

## Independent QA audit - 2026-07-30

### 1. Release verdict: HOLD

The deployed Storage boundary is correctly private and tenant-scoped, but the replacement recovery path fails an explicit acceptance criterion. No authenticated browser or live object-operation matrix has been supplied, so release readiness is also unproven.

### 2. What was verified

- `node --test scripts/workspace-identity-contract.test.mjs` passed 2/2 locally.
- Hosted project `tvcgjehreaayfazlhvps` records migration `20260730124701_workspace_logo_storage`; `workspace-logos` is private, RLS is enabled for `storage.objects`, the limit is 2,097,152 bytes, and only JPEG, PNG, and WebP are allowed.
- Live Storage policy inspection confirms member read and owner/admin-only insert, update (`USING` and `WITH CHECK`), and delete. Each policy binds the object to the authenticated user's own `<tenant-id>/logo` path. The tenant settings update policy is also owner/admin-only with both `USING` and `WITH CHECK`.
- Source review confirms managed-logo reads use one-hour signed URLs; the sidebar and workspace switcher share image-error initials fallback; SVG, zero-byte, and oversized client-side selections are rejected.
- Security advisor output contains existing project-wide RLS and `SECURITY DEFINER` notices, but no new workspace-logo bucket/policy finding.

### 3. Blocking issues

- **Replacement recovery violates the acceptance criterion.** `saveWorkspaceLogo` uses `upload(path, file, { upsert: true })` at the fixed existing `<tenant-id>/logo` path before it writes `workspace_logo_path` to tenant settings. When a managed logo already exists, a subsequent tenant-settings error does not restore the previous object (`hadManagedLogo` skips cleanup). The user receives an error, but the old asset has already been overwritten; after a refresh or signed-URL cache expiry the new image can appear despite the failed operation. This does not retain the prior safe logo or an intentional initials fallback.

### 4. Important risks

- No authenticated hosted owner/admin/member/cross-tenant Storage operation has been run. Policy text and a private bucket do not prove Storage API enforcement, signed-URL creation, overwrite, or delete behaviour under real browser sessions.
- No staged browser evidence covers file validation, replacement/removal, failed image load, sidebar/switcher consistency, or mobile layout.

### 5. Unverified but required checks

- After the recovery correction: owner/admin upload, replace, remove, and settings-write-failure recovery; member write denial; tenant-B read/write/update/delete and signed-URL denial for tenant-A's object.
- PNG/JPEG/WebP success; SVG/GIF/zero-byte/over-2-MB rejection; simulated upload and settings failures; desktop and mobile identity rendering.

### 6. Suggested fixes or next validation steps

1. Core Features Developer must make replacement recoverable. Prefer a tenant-scoped versioned object reference: upload a new constrained tenant-path object, commit the new safe reference only after successful settings update, then clean up the prior object. Preserve the previous reference/object if either stage fails. Update Storage path policies and contract tests accordingly. A client-only delete attempt after overwriting the fixed path is not adequate recovery.
2. Theo must approve any follow-on hosted migration or policy change before it is applied, because this changes Storage/RLS behaviour.
3. Supply two isolated tenant sessions (owner/admin and member) for the authenticated Storage and browser matrix. Do not create test artifacts until Theo approves temporary test-logo creation and cleanup.

## Recovery correction in progress - 2026-07-30

Theo approved the recovery correction and a follow-on Storage/RLS migration on 2026-07-30. The corrected flow uses a new constrained versioned tenant object path for every upload, commits `workspace_logo_path` only after that upload succeeds, removes the new object if the settings write fails, and removes the prior referenced object only after the settings write commits. The legacy fixed `<tenant-id>/logo` path remains readable and deletable until each existing workspace replaces or removes its logo. Hosted migration application and authenticated browser verification remain separate approval/evidence gates.

### Local implementation and validation evidence

- **Changed areas:** `src/lib/workspace-logo.ts`, `src/hooks/useWorkspaceAdministration.ts`, `scripts/workspace-identity-contract.test.mjs`, and migration `supabase/migrations/20260730150313_workspace_logo_recovery.sql`.
- **Recovery behavior:** New objects use `<tenant-id>/logo/<UUID>` with `upsert: false`. A settings-write failure removes only the newly uploaded object, retaining the prior reference and object. A successful write removes the previously referenced object afterwards; if that cleanup fails, the saved new logo remains referenced and the user receives an explicit support warning.
- **Storage/RLS behavior proposed:** Versioned objects require an exact tenant first folder, a literal `logo` second folder, and a UUID object name. Member reads and staff deletes also retain the old fixed `<tenant-id>/logo` allowance only for legacy assets. New fixed-path uploads or updates are not permitted.
- **Local checks passed (2026-07-30):** `tsc --noEmit`; `eslint . --max-warnings 0`; full `node --experimental-strip-types --test scripts/*.test.*` suite (182/182); focused workspace identity contract (3/3); production Vite build; bundle budget; and `git diff --check`.
- **Local environment note:** `npm run typecheck` initially failed because the shell's globally resolved npm installation is missing, not because of a project failure. Direct project binaries were used for the successful validation above.

### Updated QA handoff

**Exact work order:** WO-2026-017 - Add tenant-safe workspace identity customization.

1. Confirm applied migration `20260730150313_workspace_logo_recovery.sql`. It replaces the previous update policy with the versioned-path insert/delete/read policies while keeping the bucket private, MIME-limited, and size-limited.
2. As tenant A owner/admin, upload a valid logo, then simulate a tenant-settings update failure during replacement. Confirm the existing referenced object and rendered logo remain unchanged; verify the newly uploaded versioned object is removed.
3. As tenant A owner/admin, complete a replacement and removal. Confirm the new path is referenced only after the settings write and the prior fixed or versioned path is removed after success. Record the explicit cleanup-warning behavior if deletion is deliberately denied.
4. As tenant A member and tenant B owner/admin/member, attempt direct versioned-path read, signed-URL creation, insert, delete, and tenant-settings mutation. Confirm only same-tenant members may read and only same-tenant owners/admins may write/delete.
5. Repeat PNG/JPEG/WebP, invalid SVG/GIF/zero-byte/over-2-MB, failed-image fallback, and desktop/mobile Settings/sidebar/switcher checks. Use isolated non-customer accounts and approved temporary artifacts only.

**Hosted migration evidence (2026-07-30):** Supabase project `tvcgjehreaayfazlhvps` records `20260730150313_workspace_logo_recovery`. Read-only inspection confirms `workspace-logos` remains private, has the 2,097,152-byte JPEG/PNG/WebP constraints, and now has exactly the member-read, staff-insert, and staff-delete versioned-path policies. No deployment or authenticated hosted verification has been performed for this correction.

**Advisor review (2026-07-30):** The Supabase security advisor returned 52 existing project-wide notices; none reference `workspace-logos` or `workspace_logo` policy objects. Existing RLS-without-policy and `SECURITY DEFINER` notices remain outside this work order's scoped Storage correction.
