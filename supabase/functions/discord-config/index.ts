import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { authenticatedUser, collectorCorsHeaders, discordEntitled, json, managerMembership, serviceClient } from "../_shared/collector.ts";
import { discordDeliveryHealthState } from "../_shared/discord-health.ts";

const allowedEvents = ["schedule_created", "schedule_changed", "schedule_cancelled", "practice_reminder"] as const;
const isAllowedEvent = (value: string): value is typeof allowedEvents[number] => allowedEvents.includes(value as typeof allowedEvents[number]);

async function discordManager(userId: string, tenantId: string) {
  if (!(await managerMembership(userId, tenantId))) return false;
  return discordEntitled(tenantId);
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: collectorCorsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const user = await authenticatedUser(request);
  if (!user) return json({ error: "Authentication required." }, 401);
  const body = await request.json().catch(() => ({}));
  const tenantId = typeof body.tenant_id === "string" ? body.tenant_id : "";
  if (!tenantId || !(await discordManager(user.id, tenantId))) return json({ error: "Discord automation is unavailable for this workspace." }, 403);
  const db = serviceClient(); const action = String(body.action || "status");
  const { data: installation, error: installationError } = await db.from("discord_installations").select("id, guild_id, guild_name, status, installed_at").eq("tenant_id", tenantId).maybeSingle();
  if (installationError) return json({ error: "Discord connection status could not be checked." }, 500);
  if (action === "status") {
    const [{ data: subscriptions, error: subscriptionsError }, { data: permittedRoles, error: rolesError }, { data: latestEvent, error: eventError }] = await Promise.all([
      db.from("discord_channel_subscriptions").select("channel_id, channel_name, event_type, enabled").eq("tenant_id", tenantId).eq("enabled", true),
      db.from("discord_permitted_roles").select("role_id, role_name").eq("tenant_id", tenantId).order("role_name"),
      db.from("integration_events")
        .select("id, status, attempt_count, available_at, delivered_at, created_at")
        .eq("tenant_id", tenantId)
        .eq("provider", "discord")
        .in("event_type", [...allowedEvents])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (subscriptionsError || rolesError || eventError) return json({ error: "Discord delivery status could not be checked." }, 500);

    const { data: latestAttempt, error: attemptError } = latestEvent
      ? await db.from("integration_delivery_attempts")
        .select("outcome, attempted_at")
        .eq("tenant_id", tenantId)
        .eq("event_id", latestEvent.id)
        .eq("provider", "discord")
        .order("attempted_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      : { data: null, error: null };
    if (attemptError) return json({ error: "Discord delivery status could not be checked." }, 500);

    const activeSubscriptions = subscriptions || [];
    const healthState = discordDeliveryHealthState(installation?.status || null, activeSubscriptions.length, latestEvent || null);
    return json({
      installation: installation && installation.status === "active" ? installation : null,
      subscriptions: activeSubscriptions,
      permitted_roles: permittedRoles || [],
      release_state: "pilot_access",
      delivery_health: {
        state: healthState,
        event_status: latestEvent?.status || null,
        attempt_count: latestEvent?.attempt_count || 0,
        next_attempt_at: healthState === "retrying" ? latestEvent?.available_at || null : null,
        last_delivered_at: latestEvent?.delivered_at || null,
        last_attempt_outcome: latestAttempt?.outcome || null,
        last_attempted_at: latestAttempt?.attempted_at || null,
      },
    });
  }
  if (!installation || installation.status !== "active") return json({ error: "No active Discord installation." }, 404);
  if (action === "set_permitted_roles") {
    const roles = Array.isArray(body.roles)
      ? body.roles.filter((role): role is { id: string; name?: string } => Boolean(role) && typeof role.id === "string" && (typeof role.name === "string" || typeof role.name === "undefined"))
      : [];
    const { data, error } = await db.rpc("replace_discord_permitted_roles", {
      p_tenant_id: tenantId,
      p_actor_user_id: user.id,
      p_roles: roles.map((role) => ({ id: role.id, name: typeof role.name === "string" ? role.name.slice(0, 100) : null })),
    });
    if (error) return json({ error: "Discord command roles could not be saved." }, 400);
    return json({ permitted_roles: data || [] });
  }
  if (action === "configure") {
    const channelId = typeof body.channel_id === "string" ? body.channel_id : "";
    const channelName = typeof body.channel_name === "string" ? body.channel_name.slice(0, 100) : "";
    const events = Array.isArray(body.event_types) ? body.event_types.filter((value): value is string => typeof value === "string").filter(isAllowedEvent) : [];
    if (!channelId || !channelName || events.length === 0 || events.length !== (Array.isArray(body.event_types) ? body.event_types.length : 0)) return json({ error: "Select a channel and one or more supported schedule events." }, 400);
    await db.from("discord_channel_subscriptions").delete().eq("tenant_id", tenantId).eq("channel_id", channelId);
    const { error } = await db.from("discord_channel_subscriptions").insert(events.map((eventType) => ({ tenant_id: tenantId, installation_id: installation.id, channel_id: channelId, channel_name: channelName, event_type: eventType, enabled: true })));
    if (error) return json({ error: "Discord channel configuration could not be saved." }, 500);
    return json({ success: true });
  }
  if (action === "disconnect") {
    await db.from("discord_installations").update({ status: "revoked", updated_at: new Date().toISOString() }).eq("id", installation.id);
    await db.from("discord_channel_subscriptions").update({ enabled: false }).eq("tenant_id", tenantId);
    return json({ success: true });
  }
  return json({ error: "Unsupported action." }, 400);
});
