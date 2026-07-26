import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@18.4.0";
import { createClient } from "npm:@supabase/supabase-js@2.110.0";

const productionOrigin = Deno.env.get("APP_ORIGIN") || "https://scrimstats.gg";
const developmentOrigins = new Set(["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:5173", "http://127.0.0.1:5173"]);
const requestOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  return origin && (origin === productionOrigin || developmentOrigins.has(origin)) ? origin : productionOrigin;
};
const corsFor = (request: Request) => ({ "Access-Control-Allow-Origin": requestOrigin(request), "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version", "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" });

Deno.serve(async (request) => {
  const origin = requestOrigin(request);
  const cors = corsFor(request);
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });
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
