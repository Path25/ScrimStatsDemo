import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const app = read("src/App.tsx");
const landing = read("src/pages/Landing.tsx");
const signup = read("src/pages/SignUp.tsx");
const workspace = read("src/pages/CreateWorkspace.tsx");
const workspaceGate = read("src/components/auth/WorkspaceGate.tsx");
const workspaces = read("src/pages/Workspaces.tsx");
const settings = read("src/pages/Settings.tsx");
const tenantContext = read("src/contexts/TenantContext.tsx");
const forgotPassword = read("src/pages/ForgotPassword.tsx");
const migration = read("supabase/migrations/20260727111002_self_service_signup.sql");
const additionalWorkspaceMigration = read("supabase/migrations/20260802150008_owner_additional_workspaces.sql");
const supabaseConfig = read("supabase/config.toml");

test("public launch entry points lead to self-service signup", () => {
  assert.match(app, /path="\/sign-up" element={<SignUp/);
  assert.match(app, /path="\/create-workspace" element={<CreateWorkspace/);
  assert.match(app, /path="\/request-access" element={<Navigate to="\/sign-up"/);
  assert.match(landing, /to="\/sign-up">Start free/);
  assert.doesNotMatch(landing, /Request access/i);
});

test("signup creates an Auth account and offers non-enumerating recovery next steps", () => {
  assert.match(signup, /supabase\.auth\.signUp/);
  assert.match(signup, /emailRedirectTo: `\$\{window\.location\.origin\}\/create-workspace`/);
  assert.match(signup, /pending_team_name/);
  assert.match(signup, /data\.session/);
  assert.match(signup, /Check your inbox to confirm a new account/);
  assert.match(signup, /to="\/sign-in">Sign in/);
  assert.match(signup, /to="\/forgot-password">Request recovery link/);
  assert.doesNotMatch(signup, /Open the confirmation email sent to/);
  assert.match(forgotPassword, /if the account exists/);
  assert.match(forgotPassword, /If the address is associated with an account, look for a recovery email/);
  assert.match(signup, /Accept the Terms and Privacy Policy/);
  assert.doesNotMatch(signup, /service_role|SUPABASE_SECRET_KEY|request-access/);
  assert.match(supabaseConfig, /enable_confirmations = true/);
  assert.match(supabaseConfig, /https:\/\/scrimstats\.gg\/\*\*/);
});

test("membership-free accounts can create a workspace while failures remain unavailable", () => {
  assert.match(workspaceGate, /if \(hasNoTenant\) return <Navigate to="\/create-workspace" replace \/>;/);
  assert.match(workspaceGate, /if \(error \|\| !tenant\)/);
  assert.doesNotMatch(workspaceGate, /hasNoTenant \|\| error \|\| !tenant/);
  assert.match(workspace, /Confirm your email before creating a workspace/);
  assert.match(workspace, /to="\/forgot-password"/);
});

test("initial workspace provisioning is verified, single-use, Free, and owner-scoped", () => {
  assert.match(migration, /account\.email_confirmed_at is not null/);
  assert.match(migration, /membership\.user_id = v_user_id/);
  assert.match(migration, /'free'::public\.subscription_tier/);
  assert.match(migration, /'owner'::public\.tenant_role/);
  assert.match(migration, /pg_catalog\.pg_timezone_names/);
  assert.match(migration, /security definer[\s\S]+set search_path = ''/);
  assert.match(migration, /revoke all on function public\.create_self_service_workspace\(text, text\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.create_self_service_workspace\(text, text\) to authenticated/);
  assert.doesNotMatch(workspace, /create_tenant_with_owner|subscription_tier/);
});

test("additional workspace provisioning remains owner-only, Free, and independently selected", () => {
  assert.match(additionalWorkspaceMigration, /account\.email_confirmed_at is not null/);
  assert.match(additionalWorkspaceMigration, /membership\.role = 'owner'::public\.tenant_role/);
  assert.match(additionalWorkspaceMigration, /Only a workspace owner can create an additional workspace/);
  assert.match(additionalWorkspaceMigration, /'free'::public\.subscription_tier/);
  assert.match(additionalWorkspaceMigration, /'owner'::public\.tenant_role/);
  assert.match(additionalWorkspaceMigration, /security definer[\s\S]+set search_path = ''/);
  assert.match(additionalWorkspaceMigration, /revoke all on function public\.create_self_service_workspace\(text, text\) from public, anon, authenticated/);
  assert.match(additionalWorkspaceMigration, /grant execute on function public\.create_self_service_workspace\(text, text\) to authenticated/);
  assert.match(workspace, /canCreateAdditionalWorkspace/);
  assert.match(workspace, /refreshTenant\(createdWorkspace\.tenant_id\)/);
  assert.match(workspaces, /Create another workspace/);
  assert.match(settings, /Manage team workspaces/);
  assert.match(tenantContext, /refreshTenant: \(preferredTenantId\?: string\)/);
  assert.match(tenantContext, /const storedTenantId = preferredTenantId \|\| window\.localStorage\.getItem/);
  assert.match(tenantContext, /window\.localStorage\.setItem\(activeTenantStorageKey, preferredTenantId\)/);
  assert.match(workspaces, /isLoading: tenantLoading/);
  assert.match(workspaces, /if \(isLoading \|\| tenantLoading\)/);
});
