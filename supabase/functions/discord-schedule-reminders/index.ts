import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";
import { discordEntitled } from "../_shared/collector.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

type Subscription = {
  tenant_id: string;
  event_type: "practice_reminder";
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  const dispatchSecret = Deno.env.get("DISCORD_DISPATCH_SECRET");
  const suppliedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!dispatchSecret || suppliedSecret !== dispatchSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return Response.json({ error: "Reminder scheduling is not configured" }, { status: 503, headers: corsHeaders });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: subscriptions, error: subscriptionError } = await admin
    .from("discord_channel_subscriptions")
    .select("tenant_id, event_type, discord_installations!inner(status), tenants!inner(subscription_tier)")
    .eq("event_type", "practice_reminder")
    .eq("enabled", true)
    .eq("discord_installations.status", "active")
    .eq("tenants.subscription_tier", "elite");
  if (subscriptionError) {
    return Response.json({ error: "Unable to read reminder subscriptions" }, { status: 500, headers: corsHeaders });
  }

  const byTenant = new Map<string, Set<Subscription["event_type"]>>();
  for (const subscription of (subscriptions || []) as unknown as Subscription[]) {
    if (!(await discordEntitled(subscription.tenant_id))) continue;
    const events = byTenant.get(subscription.tenant_id) || new Set();
    events.add(subscription.event_type);
    byTenant.set(subscription.tenant_id, events);
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60_000);
  let queued = 0;

  for (const [tenantId, eventTypes] of byTenant) {
    const { data: scrims } = await admin
      .from("scrims")
      .select("id, opponent_name, match_date, scheduled_time, format, updated_at")
      .eq("tenant_id", tenantId)
      .in("status", ["scheduled", "confirmed", "upcoming"])
      .gte("match_date", now.toISOString())
      .lte("match_date", windowEnd.toISOString())
      .order("match_date");

    for (const scrim of scrims || []) {
      const reminderDay = new Date(scrim.match_date).toISOString().slice(0, 10);
      const payload = {
        scrim_id: scrim.id,
        opponent_name: scrim.opponent_name,
        match_date: scrim.match_date,
        scheduled_time: scrim.scheduled_time,
        format: scrim.format,
      };

      for (const eventType of eventTypes) {
        const { error } = await admin.from("integration_events").insert({
          tenant_id: tenantId,
          provider: "discord",
          event_type: eventType,
          aggregate_type: "scrim",
          aggregate_id: scrim.id,
          payload,
          dedupe_key: `${eventType}:${scrim.id}:${reminderDay}`,
        });
        if (!error || error.code === "23505") queued += error ? 0 : 1;
      }
    }
  }

  return Response.json({ tenants: byTenant.size, queued }, { headers: corsHeaders });
});
