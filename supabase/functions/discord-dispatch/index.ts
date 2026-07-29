import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";
import { discordEntitled } from "../_shared/collector.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

type IntegrationEvent = {
  id: string;
  tenant_id: string;
  event_type: string;
  aggregate_id: string | null;
  payload: Record<string, unknown>;
  attempt_count: number;
};

const supportedEventTypes = new Set(["schedule_created", "schedule_changed", "schedule_cancelled", "practice_reminder"]);

function eventMessage(event: IntegrationEvent, appUrl: string) {
  const opponent = typeof event.payload.opponent_name === "string" ? event.payload.opponent_name : "opponent";
  const date = typeof event.payload.match_date === "string" ? event.payload.match_date : "date pending";
  const time = typeof event.payload.scheduled_time === "string" ? ` at ${event.payload.scheduled_time}` : "";
  const link = event.aggregate_id ? `${appUrl}/scrims/${event.aggregate_id}` : `${appUrl}/scrims`;
  const title =
    event.event_type === "schedule_created"
      ? "Practice block scheduled"
      : event.event_type === "schedule_cancelled"
        ? "Practice block cancelled"
        : event.event_type === "schedule_changed"
          ? "Practice block updated"
        : event.event_type === "practice_reminder"
          ? "Practice block coming up"
          : "Practice block updated";
  return {
    content: `**${title}**\nvs ${opponent} · ${date}${time}\n${link}`,
    allowed_mentions: { parse: [] },
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });

  const dispatchSecret = Deno.env.get("DISCORD_DISPATCH_SECRET");
  const suppliedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!dispatchSecret || suppliedSecret !== dispatchSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
  const appUrl = (Deno.env.get("SCRIMSTATS_APP_URL") || "").replace(/\/$/, "");
  if (!supabaseUrl || !serviceKey || !botToken || !appUrl) {
    return Response.json({ error: "Discord delivery is not configured" }, { status: 503, headers: corsHeaders });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: events, error } = await admin.rpc("claim_integration_events_for_provider", {
    p_provider: "discord",
    p_limit: 25,
  });
  if (error) return Response.json({ error: "Unable to read the delivery outbox" }, { status: 500, headers: corsHeaders });

  let delivered = 0;
  for (const event of (events || []) as IntegrationEvent[]) {
    if (!supportedEventTypes.has(event.event_type)) {
      await admin.from("integration_events").update({ status: "cancelled", last_error: "Event is outside the approved Discord schedule scope" }).eq("id", event.id);
      continue;
    }
    if (!(await discordEntitled(event.tenant_id))) {
      await admin.from("integration_events").update({ status: "cancelled", last_error: "Discord automation is unavailable for this workspace" }).eq("id", event.id);
      continue;
    }
    const { data: subscriptions } = await admin
      .from("discord_channel_subscriptions")
      .select("channel_id, discord_installations!inner(status)")
      .eq("tenant_id", event.tenant_id)
      .eq("event_type", event.event_type)
      .eq("enabled", true)
      .eq("discord_installations.status", "active");

    if (!subscriptions?.length) {
      await admin
        .from("integration_events")
        .update({ status: "cancelled", last_error: "No active subscribed channel" })
        .eq("id", event.id);
      continue;
    }
    let failed = false;
    for (const subscription of subscriptions) {
      const response = await fetch(`https://discord.com/api/v10/channels/${subscription.channel_id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventMessage(event, appUrl)),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        await admin.from("integration_delivery_attempts").insert({
          tenant_id: event.tenant_id,
          event_id: event.id,
          provider: "discord",
          outcome: "delivered",
          provider_reference: typeof body.id === "string" ? body.id : null,
        });
      } else {
        failed = true;
        await admin.from("integration_delivery_attempts").insert({
          tenant_id: event.tenant_id,
          event_id: event.id,
          provider: "discord",
          outcome: event.attempt_count >= 4 ? "failed" : "retry",
          error_message: `Discord returned ${response.status}`,
        });
      }
    }

    if (failed) {
      const attempts = event.attempt_count + 1;
      await admin
        .from("integration_events")
        .update({
          status: attempts >= 5 ? "failed" : "pending",
          attempt_count: attempts,
          last_error: "One or more Discord deliveries failed",
          available_at: new Date(Date.now() + Math.min(60, 2 ** attempts) * 60_000).toISOString(),
        })
        .eq("id", event.id);
    } else {
      delivered += 1;
      await admin
        .from("integration_events")
        .update({ status: "delivered", delivered_at: new Date().toISOString(), last_error: null })
        .eq("id", event.id);
    }
  }

  return Response.json({ processed: events?.length || 0, delivered }, { headers: corsHeaders });
});
