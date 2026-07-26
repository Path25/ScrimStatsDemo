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
    if (!stripeKey || !url || !serviceKey) return respond({ error: "Billing is not configured" }, 503);
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return respond({ error: "Authentication required" }, 401);
    const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await service.auth.getUser(authorization.slice(7));
    if (authError || !auth.user) return respond({ error: "Session is invalid" }, 401);
    const input = await request.json() as { tenant_id?: string };
    if (!input.tenant_id) return respond({ error: "Workspace is required" }, 400);
    const { data: membership } = await service.from("tenant_users").select("role").eq("tenant_id", input.tenant_id).eq("user_id", auth.user.id).maybeSingle();
    if (!membership || !["owner", "admin"].includes(membership.role)) return respond({ error: "Owner or admin access is required" }, 403);
    const { data: tenant } = await service.from("tenants").select("stripe_customer_id").eq("id", input.tenant_id).single();
    if (!tenant?.stripe_customer_id) return respond({ error: "This workspace does not have a paid billing account" }, 404);
    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });
    const session = await stripe.billingPortal.sessions.create({ customer: tenant.stripe_customer_id, return_url: `${origin}/settings?billing=portal` });
    return respond({ url: session.url });
  } catch (error) {
    console.error(JSON.stringify({ event: "billing.portal.failed", message: error instanceof Error ? error.message : String(error) }));
    return respond({ error: "Billing portal could not be opened" }, 500);
  }
});
