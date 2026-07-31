import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260730124701_workspace_logo_storage.sql");
const recoveryMigration = read("supabase/migrations/20260730150313_workspace_logo_recovery.sql");
const exactPathMigration = read("supabase/migrations/20260730152136_workspace_logo_exact_path.sql");
const logoLib = read("src/lib/workspace-logo.ts");
const administration = read("src/hooks/useWorkspaceAdministration.ts");
const tenantContext = read("src/contexts/TenantContext.tsx");
const identityPanel = read("src/components/workspace/WorkspaceIdentityPanel.tsx");
const dashboard = read("src/components/layout/DashboardLayout.tsx");

test("workspace logo storage is private, constrained, and tenant-isolated", () => {
  assert.match(migration, /'workspace-logos'/);
  assert.match(migration, /false,/);
  assert.match(migration, /2097152/);
  assert.match(migration, /'image\/jpeg', 'image\/png', 'image\/webp'/);
  assert.match(migration, /on storage\.objects for select to authenticated/);
  assert.match(migration, /membership\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /name = membership\.tenant_id::text \|\| '\/logo'/);
  assert.match(migration, /membership\.role in \('owner'::public\.tenant_role, 'admin'::public\.tenant_role\)/);
  assert.match(migration, /on storage\.objects for update to authenticated/);
  assert.match(migration, /with check \(/);
  assert.match(migration, /on storage\.objects for delete to authenticated/);
});

test("workspace logo recovery policies permit only legacy reads or constrained versioned paths", () => {
  assert.match(recoveryMigration, /drop policy if exists workspace_logos_staff_update/);
  assert.match(recoveryMigration, /\(storage\.foldername\(name\)\)\[1\] = membership\.tenant_id::text/);
  assert.match(recoveryMigration, /\(storage\.foldername\(name\)\)\[2\] = 'logo'/);
  assert.match(recoveryMigration, /storage\.filename\(name\) ~\* '\^\[0-9a-f\]\{8\}/);
  assert.match(recoveryMigration, /name = membership\.tenant_id::text \|\| '\/logo'/);
  assert.match(recoveryMigration, /on storage\.objects for insert to authenticated/);
  assert.match(recoveryMigration, /on storage\.objects for delete to authenticated/);
  assert.doesNotMatch(recoveryMigration, /create policy workspace_logos_staff_update/);
});

test("workspace logo policies reject nested versioned paths", () => {
  const folderCount = /cardinality\(storage\.foldername\(name\)\) = 2/g;
  assert.equal((exactPathMigration.match(folderCount) || []).length, 3);
  assert.match(exactPathMigration, /drop policy if exists workspace_logos_member_read/);
  assert.match(exactPathMigration, /drop policy if exists workspace_logos_staff_insert/);
  assert.match(exactPathMigration, /drop policy if exists workspace_logos_staff_delete/);
  assert.match(exactPathMigration, /storage\.filename\(name\) ~\* '\^\[0-9a-f\]\{8\}/);
});

test("workspace logo browser flow uses safe versioned paths, signed reads, and fallback rendering", () => {
  assert.match(logoLib, /workspace_logo_path/);
  assert.match(logoLib, /image\/jpeg/);
  assert.match(logoLib, /image\/png/);
  assert.match(logoLib, /image\/webp/);
  assert.match(logoLib, /SVG and other file types are not accepted/);
  assert.match(logoLib, /\$\{tenantId\}\/logo\/\$\{version\}/);
  assert.match(logoLib, /logo\\\/\[0-9a-f-\]\{36\}/);
  assert.match(administration, /const previousPath = workspaceLogoPathFromSettings\(tenant\.settings\)/);
  assert.match(administration, /\.upload\(path, file, \{ upsert: false/);
  assert.match(administration, /if \(settingsError\) \{\s+const \{ error: cleanupError \} = await supabase\.storage\.from\(workspaceLogoBucket\)\.remove\(\[path\]\)/s);
  assert.match(administration, /\.remove\(\[previousPath\]\)/);
  assert.match(administration, /Workspace logo saved, but the previous image could not be removed/);
  assert.match(administration, /delete settings\.logo_url/);
  assert.match(administration, /\.remove\(\[path\]\)/);
  assert.match(tenantContext, /createSignedUrl\(logoPath, 60 \* 60\)/);
  assert.match(identityPanel, /accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(identityPanel, /Replace logo/);
  assert.match(identityPanel, /Remove logo/);
  assert.match(identityPanel, /only owners and admins can change it/);
  assert.match(dashboard, /onError=\{\(\) => setImageFailed\(true\)\}/);
});
