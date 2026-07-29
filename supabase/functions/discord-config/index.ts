import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { authenticatedUser, collectorCorsHeaders, json, managerMembership, serviceClient } from "../_shared/collector.ts";

const allowedEvents = ["schedule_created", "schedule_cancelled", "practice_reminder"] as const;
const isAllowedEvent = (value: string): value is typeof allowedEvents[number] => allowedEvents.includes(value as typeof allowedEvents[number]);

async function eliteManager(userId: string, tenantId: string) {
  if (!(await managerMembership(userId, tenantId))) return false;
  const { data } = await serviceClient().from("tenants").select("subscription_tier").eq("id", tenantId).maybeSingle();
  return data?.subscription_tier === "elite";
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: collectorCorsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const user = await authenticatedUser(request);
  if (!user) return json({ error: "Authentication required." }, 401);
  const body = await request.json().catch(() => ({}));
  const tenantId = typeof body.tenant_id === "string" ? body.tenant_id : "";
  if (!tenantId || !(await eliteManager(user.id, tenantId))) return json({ error: "Discord automation is available to Elite workspace owners and admins." }, 403);
  const db = serviceClient(); const action = String(body.action || "status");
  const { data: installation } = await db.from("discord_installations").select("id, guild_id, guild_name, status, installed_at").eq("tenant_id", tenantId).maybeSingle();
  if (action === "status") {
    const { data: subscriptions } = await db.from("discord_channel_subscriptions").select("channel_id, channel_name, event_type, enabled").eq("tenant_id", tenantId).eq("enabled", true);
    return json({ installation: installation && installation.status === "active" ? installation : null, subscriptions: subscriptions || [] });
  }
  if (!installation || installation.status !== "active") return json({ error: "No active Discord installation." }, 404);
  if (action === "configure") {
    const channelId = typeof body.channel_id === "string" ? body.channel_id : "";
    const channelName = typeof body.channel_name === "string" ? body.channel_name.slice(0, 100) : "";
    const events = Array.isArray(body.event_types) ? body.event_types.filter((value): value is string => typeof value === "string").filter(isAllowedEvent) : [];
    if (!channelId || !channelName || events.length !== (Array.isArray(body.event_types) ? body.event_types.length : 0)) return json({ error: "Select a channel and supported schedule events." }, 400);
    await db.from("discord_channel_subscriptions").delete().eq("tenant_id", tenantId).eq("channel_id", channelId);
    const { error } = await db.from("discord_channel_subscriptions").insert(events.map((eventType) => ({ tenant_id: tenantId, installation_id: installation.id, channel_id: channelId, channel_name: channelName, event_type: eventType, enabled: true })));
    if (error) return json({ error: "Discord channel configuration could not be saved." }, 500);
    return json({ success: true });
  }
  if (action === "disconnect") {
    await db.from("discord_installations").update({ status: "disconnected", updated_at: new Date().toISOString() }).eq("id", installation.id);
    await db.from("discord_channel_subscriptions").update({ enabled: false, updated_at: new Date().toISOString() }).eq("tenant_id", tenantId);
    return json({ success: true });
  }
  return json({ error: "Unsupported action." }, 400);
});
