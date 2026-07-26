import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@18.4.0";
import { createClient } from "npm:@supabase/supabase-js@2.110.0";

const origin = Deno.env.get("APP_ORIGIN") || "https://scrimstats.gg";
const cors = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version", "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" };
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const prices = { pro: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY"), elite: Deno.env.get("STRIPE_PRICE_ELITE_MONTHLY") } as const;
    if (!stripeKey || !url || !serviceKey || !prices.pro || !prices.elite) return respond({ error: "Billing is not configured" }, 503);

    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return respond({ error: "Authentication required" }, 401);
    const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await service.auth.getUser(authorization.slice(7));
    if (authError || !auth.user?.email) return respond({ error: "Session is invalid" }, 401);

    const input = await request.json() as { tenant_id?: string; plan?: "pro" | "elite" };
    if (!input.tenant_id || !input.plan || !["pro", "elite"].includes(input.plan)) return respond({ error: "A valid workspace and paid plan are required" }, 400);
    const { data: membership } = await service.from("tenant_users").select("role").eq("tenant_id", input.tenant_id).eq("user_id", auth.user.id).maybeSingle();
    if (!membership || !["owner", "admin"].includes(membership.role)) return respond({ error: "Owner or admin access is required" }, 403);

    const { data: tenant, error: tenantError } = await service.from("tenants").select("id,name,stripe_customer_id,stripe_subscription_id").eq("id", input.tenant_id).single();
    if (tenantError || !tenant) return respond({ error: "Workspace is unavailable" }, 404);
    if (tenant.stripe_subscription_id) return respond({ error: "Use the billing portal to change an existing subscription", portal_required: true }, 409);

    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });
    let customerId = tenant.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: auth.user.email, name: tenant.name, metadata: { tenant_id: tenant.id } }, { idempotencyKey: `tenant-customer-${tenant.id}` });
      customerId = customer.id;
      const { error } = await service.from("tenants").update({ stripe_customer_id: customerId, billing_updated_at: new Date().toISOString() }).eq("id", tenant.id);
      if (error) throw error;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: prices[input.plan]!, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: tenant.id,
      success_url: `${origin}/settings?billing=success`,
      cancel_url: `${origin}/settings?billing=cancelled`,
      metadata: { tenant_id: tenant.id, plan: input.plan, purchaser_user_id: auth.user.id },
      subscription_data: { metadata: { tenant_id: tenant.id, plan: input.plan } },
    }, { idempotencyKey: `checkout-${tenant.id}-${input.plan}-${new Date().toISOString().slice(0, 13)}` });
    return respond({ url: session.url });
  } catch (error) {
    console.error(JSON.stringify({ event: "billing.checkout.failed", message: error instanceof Error ? error.message : String(error) }));
    return respond({ error: "Checkout could not be started" }, 500);
  }
});
