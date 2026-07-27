import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const app = read("src/App.tsx");
const landing = read("src/pages/Landing.tsx");
const signup = read("src/pages/SignUp.tsx");
const workspace = read("src/pages/CreateWorkspace.tsx");
const migration = read("supabase/migrations/20260727111002_self_service_signup.sql");
const supabaseConfig = read("supabase/config.toml");

test("public launch entry points lead to self-service signup", () => {
  assert.match(app, /path="\/sign-up" element={<SignUp/);
  assert.match(app, /path="\/create-workspace" element={<CreateWorkspace/);
  assert.match(app, /path="\/request-access" element={<Navigate to="\/sign-up"/);
  assert.match(landing, /to="\/sign-up">Start free/);
  assert.doesNotMatch(landing, /Request access/i);
});

test("signup creates an Auth account and supports confirmed and immediate sessions", () => {
  assert.match(signup, /supabase\.auth\.signUp/);
  assert.match(signup, /emailRedirectTo: `\$\{window\.location\.origin\}\/create-workspace`/);
  assert.match(signup, /pending_team_name/);
  assert.match(signup, /data\.session/);
  assert.match(signup, /We could not send your confirmation email/);
  assert.match(signup, /Accept the Terms and Privacy Policy/);
  assert.doesNotMatch(signup, /service_role|SUPABASE_SECRET_KEY|request-access/);
  assert.match(supabaseConfig, /enable_confirmations = true/);
  assert.match(supabaseConfig, /https:\/\/scrimstats\.gg\/\*\*/);
});

test("workspace provisioning is verified, single-use, Free, and owner-scoped", () => {
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
