import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260730124701_workspace_logo_storage.sql");
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

test("workspace logo browser flow uses safe paths, signed reads, and fallback rendering", () => {
  assert.match(logoLib, /workspace_logo_path/);
  assert.match(logoLib, /image\/jpeg/);
  assert.match(logoLib, /image\/png/);
  assert.match(logoLib, /image\/webp/);
  assert.match(logoLib, /SVG and other file types are not accepted/);
  assert.match(administration, /\.upload\(path, file, \{ upsert: true/);
  assert.match(administration, /delete settings\.logo_url/);
  assert.match(administration, /\.remove\(\[path\]\)/);
  assert.match(tenantContext, /createSignedUrl\(logoPath, 60 \* 60\)/);
  assert.match(identityPanel, /accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(identityPanel, /Replace logo/);
  assert.match(identityPanel, /Remove logo/);
  assert.match(identityPanel, /only owners and admins can change it/);
  assert.match(dashboard, /onError=\{\(\) => setImageFailed\(true\)\}/);
});
