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
  "Access-Control-Allow-Headers": "authorization, content-type, x-discord-dispatch-secret",
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseRequest(rawBody: string) {
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return null;
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  if (Object.keys(record).length !== 1 || typeof record.qa_nonce_run_id !== "string") return null;
  return UUID_PATTERN.test(record.qa_nonce_run_id) ? record.qa_nonce_run_id : null;
}

type ProbeClaim = {
  run_id: string;
  tenant_id: string;
  event_id: string;
  channel_id: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });

  const dispatchSecret = Deno.env.get("DISCORD_DISPATCH_SECRET");
  const suppliedSecret = request.headers.get("x-discord-dispatch-secret");
  if (!dispatchSecret || suppliedSecret !== dispatchSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const runId = parseRequest(await request.text());
  if (!runId) return Response.json({ error: "Invalid nonce probe request" }, { status: 400, headers: corsHeaders });

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
    return Response.json({ error: "Discord nonce verification is not configured" }, { status: 503, headers: corsHeaders });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const functionVersion = Deno.env.get("DENO_DEPLOYMENT_ID") ?? "source-local";
  const complete = async (
    outcome: "confirmed" | "provider_failed" | "mismatch" | "evidence_failed",
    firstStatus: number | null,
    secondStatus: number | null,
    sameProviderReference: boolean | null,
    evidenceRecorded: boolean,
  ) => admin.rpc("complete_discord_qa_nonce_probe", {
    p_run_id: runId,
    p_outcome: outcome,
    p_first_http_status: firstStatus,
    p_second_http_status: secondStatus,
    p_same_provider_reference: sameProviderReference,
    p_delivery_evidence_recorded: evidenceRecorded,
    p_function_version: functionVersion,
  });

  const { data: claims, error: claimError } = await admin.rpc("claim_discord_qa_nonce_probe", { p_run_id: runId });
  const claim = (claims?.[0] ?? null) as ProbeClaim | null;
  if (claimError) return Response.json({ error: "Unable to claim nonce probe" }, { status: 500, headers: corsHeaders });
  if (!claim) return Response.json({ error: "Nonce probe is unavailable" }, { status: 409, headers: corsHeaders });

  const { data: event, error: eventError } = await admin
    .from("integration_events")
    .select("id, tenant_id, event_type, aggregate_id, payload, attempt_count, status, available_at, provider")
    .eq("id", claim.event_id)
    .eq("tenant_id", claim.tenant_id)
    .eq("provider", "discord")
    .in("status", ["pending", "failed"])
    .lte("available_at", new Date().toISOString())
    .eq("attempt_count", 0)
    .maybeSingle();
  if (eventError || !event || !supportedDiscordEventTypes.has(event.event_type) || !(await discordEntitled(claim.tenant_id))) {
    await complete("evidence_failed", null, null, null, false);
    return Response.json({ error: "Nonce probe fixture is unavailable" }, { status: 409, headers: corsHeaders });
  }

  const { data: subscription, error: subscriptionError } = await admin
    .from("discord_channel_subscriptions")
    .select("id, discord_installations!inner(status)")
    .eq("tenant_id", claim.tenant_id)
    .eq("channel_id", claim.channel_id)
    .eq("event_type", event.event_type)
    .eq("enabled", true)
    .eq("discord_installations.status", "active")
    .limit(1)
    .maybeSingle();
  if (subscriptionError || !subscription) {
    await complete("evidence_failed", null, null, null, false);
    return Response.json({ error: "Nonce probe target is unavailable" }, { status: 409, headers: corsHeaders });
  }

  const { data: priorAttempt, error: priorAttemptError } = await admin
    .from("integration_delivery_attempts")
    .select("id")
    .eq("tenant_id", claim.tenant_id)
    .eq("event_id", claim.event_id)
    .limit(1)
    .maybeSingle();
  if (priorAttemptError || priorAttempt) {
    await complete("evidence_failed", null, null, null, false);
    return Response.json({ error: "Nonce probe event is no longer fresh" }, { status: 409, headers: corsHeaders });
  }

  const typedEvent = event as DiscordIntegrationEvent;
  const nonce = await discordDeliveryNonce(typedEvent.id, claim.channel_id);
  const providerBody = JSON.stringify({
    ...discordEventMessage(typedEvent, appUrl),
    nonce,
    enforce_nonce: true,
  });
  const post = () => fetch(`https://discord.com/api/v10/channels/${claim.channel_id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
    body: providerBody,
  });

  let firstResponse: Response;
  try {
    firstResponse = await post();
  } catch {
    const { error: completionError } = await complete("provider_failed", null, null, null, false);
    return Response.json(
      { outcome: "provider_failed", first_status: null, second_status: null, same_provider_reference: null, evidence_recorded: false },
      { status: completionError ? 500 : 200, headers: corsHeaders },
    );
  }
  const firstBody = await firstResponse.json().catch(() => ({}));
  const firstReference = firstResponse.ok && typeof firstBody.id === "string" ? firstBody.id : null;
  if (!firstReference) {
    const { error: completionError } = await complete("provider_failed", firstResponse.status, null, null, false);
    return Response.json(
      { outcome: "provider_failed", first_status: firstResponse.status, second_status: null, same_provider_reference: null, evidence_recorded: false },
      { status: completionError ? 500 : 200, headers: corsHeaders },
    );
  }

  const { error: evidenceError } = await admin.from("integration_delivery_attempts").insert({
    tenant_id: claim.tenant_id,
    event_id: claim.event_id,
    provider: "discord",
    delivery_target_id: claim.channel_id,
    outcome: "delivered",
    provider_reference: firstReference,
  });
  if (evidenceError) {
    const { error: completionError } = await complete("evidence_failed", firstResponse.status, null, null, false);
    return Response.json(
      { outcome: "evidence_failed", first_status: firstResponse.status, second_status: null, same_provider_reference: null, evidence_recorded: false },
      { status: completionError ? 500 : 200, headers: corsHeaders },
    );
  }

  let secondResponse: Response;
  try {
    secondResponse = await post();
  } catch {
    const { error: completionError } = await complete("provider_failed", firstResponse.status, null, null, true);
    return Response.json(
      { outcome: "provider_failed", first_status: firstResponse.status, second_status: null, same_provider_reference: null, evidence_recorded: true },
      { status: completionError ? 500 : 200, headers: corsHeaders },
    );
  }
  const secondBody = await secondResponse.json().catch(() => ({}));
  const secondReference = secondResponse.ok && typeof secondBody.id === "string" ? secondBody.id : null;
  const sameProviderReference = secondReference !== null && secondReference === firstReference;
  const outcome = !secondReference ? "provider_failed" : sameProviderReference ? "confirmed" : "mismatch";
  const { error: completionError } = await complete(
    outcome,
    firstResponse.status,
    secondResponse.status,
    sameProviderReference,
    true,
  );

  console.info("Discord nonce QA result", {
    run_id: runId,
    outcome,
    first_status: firstResponse.status,
    second_status: secondResponse.status,
    same_provider_reference: sameProviderReference,
    evidence_recorded: true,
    function_version: functionVersion,
  });

  return Response.json(
    {
      outcome,
      first_status: firstResponse.status,
      second_status: secondResponse.status,
      same_provider_reference: sameProviderReference,
      evidence_recorded: true,
    },
    { status: completionError ? 500 : 200, headers: corsHeaders },
  );
});
