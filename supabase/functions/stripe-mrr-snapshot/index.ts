import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@18.4.0";
import { createClient } from "npm:@supabase/supabase-js@2.110.0";
import { aggregateActiveSubscriptionMrr, completedLondonBusinessDate } from "../_shared/stripe-mrr.ts";

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" },
});

const snapshotVersion = 1;

Deno.serve(async (request) => {
  if (request.method !== "POST") return json(405, { error: "method_not_allowed" });

  const suppliedSecret = request.headers.get("x-worker-secret") ?? "";
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!stripeKey || !url || !serviceKey) return json(503, { error: "snapshot_worker_not_configured" });

  const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const verification = suppliedSecret
    ? await service.rpc("verify_stripe_mrr_snapshot_worker_secret", { p_secret: suppliedSecret })
    : null;
  if (!verification || verification.error || verification.data !== true) return json(401, { error: "unauthorized" });

  let payload: { snapshot_date?: unknown } = {};
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }
  const businessDate = completedLondonBusinessDate();
  if (payload.snapshot_date !== undefined && payload.snapshot_date !== businessDate) {
    return json(400, { error: "snapshot_date_must_be_latest_completed_london_day" });
  }

  const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });
  const subscriptions: Stripe.Subscription[] = [];
  try {
    for await (const subscription of stripe.subscriptions.list({
      status: "active",
      limit: 100,
      expand: ["data.items.data.price"],
    })) subscriptions.push(subscription);
  } catch (error) {
    console.error(JSON.stringify({ event: "stripe_mrr_snapshot.stripe_read_failed", message: error instanceof Error ? error.message : "stripe_read_failed" }));
    return json(502, { error: "stripe_subscription_read_failed" });
  }

  let aggregates;
  try {
    aggregates = aggregateActiveSubscriptionMrr(subscriptions);
  } catch (error) {
    console.error(JSON.stringify({ event: "stripe_mrr_snapshot.aggregate_failed", message: error instanceof Error ? error.message : "aggregate_failed" }));
    return json(422, { error: "stripe_subscription_aggregate_invalid" });
  }

  const existing = await service
    .from("stripe_mrr_daily_snapshots")
    .select("currency")
    .eq("business_date", businessDate)
    .eq("snapshot_version", snapshotVersion)
    .limit(1);
  if (existing.error) return json(500, { error: "snapshot_lookup_failed" });
  if (existing.data.length > 0) return json(409, { error: "snapshot_already_exists" });

  const priorCurrencies = await service
    .from("stripe_mrr_daily_snapshots")
    .select("currency")
    .lt("business_date", businessDate)
    .eq("snapshot_version", snapshotVersion);
  if (priorCurrencies.error) return json(500, { error: "snapshot_currency_lookup_failed" });

  const currentCurrencies = new Set(aggregates.map((aggregate) => aggregate.currency));
  for (const currency of new Set(priorCurrencies.data.map((prior) => prior.currency))) {
    if (currentCurrencies.has(currency)) continue;
    aggregates.push({
      currency,
      active_paid_subscription_count: 0,
      normalized_monthly_recurring_amount_minor: 0,
    });
  }
  if (aggregates.length === 0) {
    aggregates.push({
      currency: "usd",
      active_paid_subscription_count: 0,
      normalized_monthly_recurring_amount_minor: 0,
    });
  }

  const rows = aggregates.map((aggregate) => ({
    business_date: businessDate,
    currency: aggregate.currency,
    snapshot_version: snapshotVersion,
    active_paid_subscription_count: aggregate.active_paid_subscription_count,
    normalized_monthly_recurring_amount_minor: aggregate.normalized_monthly_recurring_amount_minor,
    observed_at: new Date().toISOString(),
  }));
  const insert = await service.from("stripe_mrr_daily_snapshots").insert(rows);
  if (insert.error?.code === "23505") return json(409, { error: "snapshot_already_exists" });
  if (insert.error) return json(500, { error: "snapshot_write_failed" });

  console.log(JSON.stringify({ event: "stripe_mrr_snapshot.created", business_date: businessDate, currencies: rows.map((row) => row.currency), snapshot_version: snapshotVersion }));
  return json(201, { status: "created", business_date: businessDate, currencies: rows.map((row) => row.currency), snapshot_version: snapshotVersion });
});
