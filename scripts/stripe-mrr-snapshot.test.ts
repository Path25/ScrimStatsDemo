import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { aggregateActiveSubscriptionMrr, completedLondonBusinessDate, type StripeSubscriptionForMrr } from "../supabase/functions/_shared/stripe-mrr.ts";

const subscription = (price: StripeSubscriptionForMrr["items"]["data"][number]["price"], quantity = 1): StripeSubscriptionForMrr => ({
  status: "active",
  items: { data: [{ price, quantity }] },
});

test("MRR snapshot normalizes monthly and annual active paid subscriptions by currency", () => {
  const aggregates = aggregateActiveSubscriptionMrr([
    subscription({ currency: "usd", unit_amount: 999, recurring: { interval: "month" } }),
    subscription({ currency: "usd", unit_amount: 12000, recurring: { interval: "year" } }),
    subscription({ currency: "gbp", unit_amount: 3000, recurring: { interval: "month", interval_count: 3 } }, 2),
  ]);
  assert.deepEqual(aggregates, [
    { currency: "gbp", active_paid_subscription_count: 1, normalized_monthly_recurring_amount_minor: 2000 },
    { currency: "usd", active_paid_subscription_count: 2, normalized_monthly_recurring_amount_minor: 1999 },
  ]);
});

test("MRR snapshot excludes non-active, free, one-time, and unsupported recurring subscription items", () => {
  const aggregates = aggregateActiveSubscriptionMrr([
    { status: "trialing", items: { data: [{ price: { currency: "usd", unit_amount: 999, recurring: { interval: "month" } } }] } },
    subscription({ currency: "usd", unit_amount: 0, recurring: { interval: "month" } }),
    subscription({ currency: "usd", unit_amount: 999, recurring: null }),
    subscription({ currency: "usd", unit_amount: 999, recurring: { interval: "week" } }),
  ]);
  assert.deepEqual(aggregates, []);
});

test("MRR snapshot rejects an active subscription containing recurring prices in multiple currencies", () => {
  assert.throws(() => aggregateActiveSubscriptionMrr([{
    status: "active",
    items: { data: [
      { price: { currency: "usd", unit_amount: 999, recurring: { interval: "month" } } },
      { price: { currency: "gbp", unit_amount: 999, recurring: { interval: "month" } } },
    ] },
  }]), /multiple_currencies/);
});

test("MRR snapshot derives the latest completed London day across daylight-saving time", () => {
  assert.equal(completedLondonBusinessDate(new Date("2026-01-15T00:30:00.000Z")), "2026-01-14");
  assert.equal(completedLondonBusinessDate(new Date("2026-07-15T00:30:00.000Z")), "2026-07-14");
});

test("MRR worker is server-only and source keeps the snapshot append-only", () => {
  const functionSource = readFileSync(new URL("../supabase/functions/stripe-mrr-snapshot/index.ts", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../supabase/migrations/20260731151435_daily_stripe_mrr_snapshots.sql", import.meta.url), "utf8");
  const correction = readFileSync(new URL("../supabase/migrations/20260731160000_revoke_mrr_snapshot_mutation_privileges.sql", import.meta.url), "utf8");
  const config = readFileSync(new URL("../supabase/config.toml", import.meta.url), "utf8");
  assert.match(functionSource, /verify_stripe_mrr_snapshot_worker_secret/);
  assert.match(functionSource, /snapshot_already_exists/);
  assert.match(functionSource, /priorCurrencies/);
  assert.doesNotMatch(functionSource, /\.update\(.*stripe_mrr_daily_snapshots/s);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table public\.stripe_mrr_daily_snapshots from public, anon, authenticated/);
  assert.match(migration, /grant select, insert on table public\.stripe_mrr_daily_snapshots to service_role/);
  assert.match(correction, /revoke all on table public\.stripe_mrr_daily_snapshots from service_role/);
  assert.match(correction, /grant select, insert on table public\.stripe_mrr_daily_snapshots to service_role/);
  assert.doesNotMatch(migration, /grant .*authenticated/i);
  assert.match(migration, /configure_stripe_mrr_snapshot_cron/);
  assert.match(migration, /verify_stripe_mrr_snapshot_worker_secret/);
  assert.match(migration, /'30 0 \* \* \*'/);
  assert.match(migration, /stripe_mrr_snapshot_worker_secret/);
  assert.match(config, /\[functions\.stripe-mrr-snapshot\]\s+verify_jwt = false/);
});
