import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("invitations permit current Supabase browser headers and survive email delivery failure", () => {
  const source = read("supabase/functions/team-invitations/index.ts");
  assert.match(source, /x-supabase-api-version/);
  assert.match(source, /Invitation created, but email delivery is not configured/);
  assert.match(source, /action === "revoke"/);
  assert.doesNotMatch(source, /!url \|\| !serviceKey \|\| !resendKey/);
  assert.match(source, /http:\/\/localhost:8080/);
});

test("checkout is tenant-owned and maps the confirmed live Pro and Elite prices", () => {
  const source = read("supabase/functions/create-checkout/index.ts");
  assert.match(source, /pro: "price_1RWKZBCiOpn9NlRMoQBkc8Yv"/);
  assert.match(source, /elite: "price_1RWKZeCiOpn9NlRMYfi1hMeJ"/);
  assert.match(source, /tenant_id/);
  assert.match(source, /\["owner", "admin"\]/);
  assert.match(source, /idempotencyKey: `checkout-\$\{tenant\.id\}-\$\{input\.plan\}-\$\{prices\[input\.plan\]\}/);
  assert.match(source, /developmentOrigins/);
});

test("Stripe webhook verifies signatures and records idempotent events", () => {
  const source = read("supabase/functions/stripe-webhook/index.ts");
  assert.match(source, /constructEventAsync/);
  assert.match(source, /stripe_webhook_events/);
  assert.match(source, /subscription_tier/);
  assert.match(source, /Invalid Stripe signature/);
  assert.match(source, /pro: "price_1RWKZBCiOpn9NlRMoQBkc8Yv"/);
  assert.match(source, /elite: "price_1RWKZeCiOpn9NlRMYfi1hMeJ"/);
});

test("Solo Queue is available on Free while paid product routes retain their plan gates", () => {
  const source = read("src/App.tsx");
  assert.match(source, /path="\/soloq" element={<SoloQTracker\s*\/>}/);
  assert.doesNotMatch(source, /path="\/soloq" element={<PlanGate/);
  assert.match(source, /minimum="pro" feature="team analytics"/);
  assert.match(source, /minimum="pro" feature="collector capture"/);
  assert.match(source, /path="\/integrations" element={<Integrations/);
  assert.doesNotMatch(source, /path="\/integrations" element={<PlanGate/);
  assert.match(read("src/pages/Settings.tsx"), /<BillingPanel \/>/);
});

test("Integrations keeps credentials visible while presenting unavailable automation clearly", () => {
  const source = read("src/pages/Integrations.tsx");
  const settings = read("src/pages/Settings.tsx");
  assert.match(source, /<RiotApiIntegration canManage={canManageIntegrations}/);
  assert.match(source, /hasDesktopAccess/);
  assert.match(source, /hasEliteAccess/);
  assert.match(source, /Discord automation is an Elite capability/);
  assert.match(source, /Game Capture is included with Pro/);
  assert.match(source, /label="Pro feature"/);
  assert.match(source, /label="Elite feature"/);
  assert.match(source, /backdrop-blur/);
  assert.match(settings, /Connection, block selection, and capture status/);
  assert.match(settings, /Game Capture is included with Pro/);
});

test("billing presents the exact configured monthly prices", () => {
  const source = read("src/components/billing/BillingPanel.tsx");
  assert.match(source, /id: "pro", price: "\$9\.99"/);
  assert.match(source, /id: "elite", price: "\$19\.99"/);
  assert.match(source, /Scrim blocks, coaching actions, and Solo Queue/);
  assert.doesNotMatch(source, /Solo Queue and team analytics/);
});

test("Solo Queue entitlement is live for every plan and reconciles existing workspaces", () => {
  const migration = read("supabase/migrations/20260801111044_enable_free_soloq_entitlement.sql");
  assert.match(migration, /\(new\.id, 'soloq', 'live', true, now\(\)\)/);
  assert.match(migration, /select tenant\.id, 'soloq', 'live', true, now\(\)\s+from public\.tenants tenant/s);
  assert.match(migration, /on conflict \(tenant_id, module_key\) do update\s+set release_state = excluded\.release_state,\s+is_enabled = excluded\.is_enabled/s);
  assert.match(migration, /security definer set search_path = ''/);
  assert.match(migration, /revoke all on function public\.sync_tenant_plan_entitlements\(\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.sync_tenant_plan_entitlements\(\) to service_role/);
});

test("billing permits only production and explicit local development origins", () => {
  for (const path of ["supabase/functions/create-checkout/index.ts", "supabase/functions/customer-portal/index.ts"]) {
    const source = read(path);
    assert.match(source, /http:\/\/localhost:8080/);
    assert.match(source, /origin === productionOrigin \|\| developmentOrigins\.has\(origin\)/);
    assert.doesNotMatch(source, /Access-Control-Allow-Origin": "\*"/);
  }
});
