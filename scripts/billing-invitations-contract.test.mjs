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
});

test("checkout is tenant-owned and maps only server-configured Pro and Elite prices", () => {
  const source = read("supabase/functions/create-checkout/index.ts");
  assert.match(source, /STRIPE_PRICE_PRO_MONTHLY/);
  assert.match(source, /STRIPE_PRICE_ELITE_MONTHLY/);
  assert.match(source, /tenant_id/);
  assert.match(source, /\["owner", "admin"\]/);
  assert.doesNotMatch(source, /price_1[A-Za-z0-9]+/);
});

test("Stripe webhook verifies signatures and records idempotent events", () => {
  const source = read("supabase/functions/stripe-webhook/index.ts");
  assert.match(source, /constructEventAsync/);
  assert.match(source, /stripe_webhook_events/);
  assert.match(source, /subscription_tier/);
  assert.match(source, /Invalid Stripe signature/);
});

test("paid product routes have explicit plan gates", () => {
  const source = read("src/App.tsx");
  assert.match(source, /minimum="pro" feature="Solo Queue tracking"/);
  assert.match(source, /minimum="pro" feature="team analytics"/);
  assert.match(source, /minimum="elite" feature="collector capture"/);
  assert.match(read("src/pages/Settings.tsx"), /<BillingPanel \/>/);
});
