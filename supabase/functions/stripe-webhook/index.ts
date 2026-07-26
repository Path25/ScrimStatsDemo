import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@18.4.0";
import { createClient } from "npm:@supabase/supabase-js@2.110.0";

const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function periodEnd(subscription: Stripe.Subscription) {
  const value = (subscription as unknown as { current_period_end?: number }).current_period_end
    || (subscription.items.data[0] as unknown as { current_period_end?: number } | undefined)?.current_period_end;
  return value ? new Date(value * 1000).toISOString() : null;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!stripeKey || !webhookSecret || !url || !serviceKey) return respond({ error: "Webhook is not configured" }, 503);

  const signature = request.headers.get("stripe-signature");
  if (!signature) return respond({ error: "Stripe signature is required" }, 400);
  const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await request.text(), signature, webhookSecret, undefined, Stripe.createSubtleCryptoProvider());
  } catch {
    return respond({ error: "Invalid Stripe signature" }, 400);
  }

  const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const inserted = await service.from("stripe_webhook_events").insert({ event_id: event.id, event_type: event.type, status: "processing" }).select("event_id").maybeSingle();
  if (inserted.error?.code === "23505") {
    const existing = await service.from("stripe_webhook_events").select("status").eq("event_id", event.id).single();
    if (existing.data?.status === "completed") return respond({ received: true, duplicate: true });
    const retry = await service.from("stripe_webhook_events").update({ status: "processing", error: null, processed_at: null }).eq("event_id", event.id);
    if (retry.error) return respond({ error: "Webhook event could not be retried" }, 500);
  }
  if (inserted.error && inserted.error.code !== "23505") return respond({ error: "Webhook event could not be reserved" }, 500);

  try {
    let tenantId: string | null = null;
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      tenantId = session.metadata?.tenant_id || session.client_reference_id || null;
      if (tenantId) {
        await service.from("tenants").update({
          stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
          subscription_status: "processing",
          billing_updated_at: new Date().toISOString(),
        }).eq("id", tenantId);
      }
    }

    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "customer.subscription.paused", "customer.subscription.resumed"].includes(event.type)) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      tenantId = subscription.metadata?.tenant_id || null;
      if (!tenantId) {
        const lookup = await service.from("tenants").select("id").eq("stripe_customer_id", customerId).maybeSingle();
        tenantId = lookup.data?.id || null;
      }
      if (!tenantId) throw new Error("Subscription is not linked to a workspace");
      const priceId = subscription.items.data[0]?.price.id || null;
      const proPrice = Deno.env.get("STRIPE_PRICE_PRO_MONTHLY");
      const elitePrice = Deno.env.get("STRIPE_PRICE_ELITE_MONTHLY");
      const active = ["active", "trialing", "past_due"].includes(subscription.status);
      const tier = active && priceId === elitePrice ? "elite" : active && priceId === proPrice ? "pro" : "free";
      if (active && tier === "free") throw new Error("Subscription price is not recognized");
      const { error } = await service.from("tenants").update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.status === "canceled" ? null : subscription.id,
        stripe_price_id: priceId,
        subscription_tier: tier,
        subscription_status: subscription.status,
        subscription_period_end: periodEnd(subscription),
        subscription_cancel_at_period_end: subscription.cancel_at_period_end,
        billing_updated_at: new Date().toISOString(),
      }).eq("id", tenantId);
      if (error) throw error;
    }

    await service.from("stripe_webhook_events").update({ status: "completed", tenant_id: tenantId, processed_at: new Date().toISOString(), error: null }).eq("event_id", event.id);
    console.log(JSON.stringify({ event: "billing.webhook.completed", stripe_event_id: event.id, stripe_event_type: event.type, tenant_id: tenantId }));
    return respond({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await service.from("stripe_webhook_events").update({ status: "failed", error: message.slice(0, 500), processed_at: new Date().toISOString() }).eq("event_id", event.id);
    console.error(JSON.stringify({ event: "billing.webhook.failed", stripe_event_id: event.id, stripe_event_type: event.type, message }));
    return respond({ error: "Webhook processing failed" }, 500);
  }
});
