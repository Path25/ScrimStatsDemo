import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";
import { discordEntitled } from "../_shared/collector.ts";
import {
  discordDeliveryNonce,
  discordEventMessage,
  type DiscordIntegrationEvent,
  supportedDiscordEventTypes,
} from "../_shared/discord-delivery.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseDispatchRequest(rawBody: string) {
  if (!rawBody.trim()) return { qaRunId: null as string | null };

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return null;
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const record = body as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "qa_run_id")) return null;
  if (!("qa_run_id" in record)) return { qaRunId: null as string | null };
  if (typeof record.qa_run_id !== "string" || !UUID_PATTERN.test(record.qa_run_id)) return null;

  return { qaRunId: record.qa_run_id };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });

  const dispatchSecret = Deno.env.get("DISCORD_DISPATCH_SECRET");
  const suppliedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!dispatchSecret || suppliedSecret !== dispatchSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const dispatchRequest = parseDispatchRequest(await request.text());
  if (!dispatchRequest) {
    return Response.json({ error: "Invalid dispatch request" }, { status: 400, headers: corsHeaders });
  }
  const qaRunId = dispatchRequest.qaRunId;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? (() => {
    try {
      return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default ?? null;
    } catch {
      return null;
    }
  })();
  const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
  const appUrl = (Deno.env.get("SCRIMSTATS_APP_URL") || "").replace(/\/$/, "");
  if (!supabaseUrl || !serviceKey || !botToken || !appUrl) {
    console.error("Discord delivery is not configured", {
      missing: [
        !supabaseUrl && "SUPABASE_URL",
        !serviceKey && "SUPABASE_SERVICE_ROLE_KEY_or_SUPABASE_SECRET_KEYS.default",
        !botToken && "DISCORD_BOT_TOKEN",
        !appUrl && "SCRIMSTATS_APP_URL",
      ].filter(Boolean),
    });
    return Response.json({ error: "Discord delivery is not configured" }, { status: 503, headers: corsHeaders });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: events, error } = qaRunId
    ? await admin.rpc("claim_discord_qa_dispatch_event", { p_run_id: qaRunId })
    : await admin.rpc("claim_integration_events_for_provider", {
        p_provider: "discord",
        p_limit: 25,
      });
  if (error) return Response.json({ error: "Unable to read the delivery outbox" }, { status: 500, headers: corsHeaders });
  if (qaRunId && events?.length !== 1) {
    return Response.json({ error: "QA dispatch run is unavailable" }, { status: 409, headers: corsHeaders });
  }

  let delivered = 0;
  for (const event of (events || []) as DiscordIntegrationEvent[]) {
    if (!supportedDiscordEventTypes.has(event.event_type)) {
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
      const { data: deliveredAttempt, error: deliveredAttemptError } = await admin
        .from("integration_delivery_attempts")
        .select("id")
        .eq("tenant_id", event.tenant_id)
        .eq("event_id", event.id)
        .eq("provider", "discord")
        .eq("delivery_target_id", subscription.channel_id)
        .eq("outcome", "delivered")
        .limit(1)
        .maybeSingle();

      if (deliveredAttemptError) {
        failed = true;
        await admin.from("integration_delivery_attempts").insert({
          tenant_id: event.tenant_id,
          event_id: event.id,
          provider: "discord",
          delivery_target_id: subscription.channel_id,
          outcome: event.attempt_count >= 4 ? "failed" : "retry",
          error_message: "Unable to inspect prior Discord delivery evidence",
        });
        continue;
      }
      if (deliveredAttempt) continue;

      const nonce = await discordDeliveryNonce(event.id, subscription.channel_id);
      const response = await fetch(`https://discord.com/api/v10/channels/${subscription.channel_id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...discordEventMessage(event, appUrl),
          nonce,
          enforce_nonce: true,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        const { error: deliveredEvidenceError } = await admin.from("integration_delivery_attempts").insert({
          tenant_id: event.tenant_id,
          event_id: event.id,
          provider: "discord",
          delivery_target_id: subscription.channel_id,
          outcome: "delivered",
          provider_reference: typeof body.id === "string" ? body.id : null,
        });
        if (deliveredEvidenceError && deliveredEvidenceError.code !== "23505") {
          failed = true;
          console.error("Unable to record Discord delivery evidence", {
            delivery_correlation: nonce,
            code: deliveredEvidenceError.code,
          });
        }
      } else {
        failed = true;
        await admin.from("integration_delivery_attempts").insert({
          tenant_id: event.tenant_id,
          event_id: event.id,
          provider: "discord",
          delivery_target_id: subscription.channel_id,
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

  let qaEvidence: "not_applicable" | "recorded" | "failed" = "not_applicable";
  if (qaRunId) {
    qaEvidence = "failed";
    const qaEvent = (events as DiscordIntegrationEvent[])[0];
    const { data: statusRow, error: statusError } = await admin
      .from("integration_events")
      .select("status")
      .eq("id", qaEvent.id)
      .eq("tenant_id", qaEvent.tenant_id)
      .maybeSingle();
    const finalStatus = typeof statusRow?.status === "string" ? statusRow.status : null;
    if (!statusError && finalStatus && ["pending", "failed", "delivered", "cancelled"].includes(finalStatus)) {
      const { data: completed, error: completionError } = await admin.rpc("complete_discord_qa_dispatch_run", {
        p_run_id: qaRunId,
        p_event_id: qaEvent.id,
        p_result_status: finalStatus,
        p_function_version: Deno.env.get("DENO_DEPLOYMENT_ID") ?? "source-local",
      });
      if (!completionError && completed === true) qaEvidence = "recorded";
    }

    console.info("Discord exact-event QA result", {
      run_id: qaRunId,
      event_id: qaEvent.id,
      result_status: finalStatus ?? "unavailable",
      evidence_write: qaEvidence,
      function_version: Deno.env.get("DENO_DEPLOYMENT_ID") ?? "source-local",
      execution_id: Deno.env.get("SB_EXECUTION_ID") ?? "unknown",
    });
  }

  return Response.json(
    { processed: events?.length || 0, delivered, ...(qaRunId ? { qa_evidence: qaEvidence } : {}) },
    { headers: corsHeaders },
  );
});
