import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { json, serviceClient } from "../_shared/collector.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const ephemeral = (content: string) => json({ type: 4, data: { content, flags: 64 } });
const snowflake = (value: unknown) => typeof value === "string" && /^[0-9]{17,20}$/.test(value);
const supportedFormats = new Set(["BO1", "BO2", "BO3", "BO4", "BO5", "1G", "2G", "3G", "4G", "5G"]);

type EvaluationResult = "created" | "replay" | "rejected" | "error";
type Evaluation = {
  response: Response;
  result: EvaluationResult;
  interactionId?: string;
  qaRunId?: string;
};
type ReplayEnvelope = {
  url: string;
  contentType: string;
  timestamp: string;
  signature: string;
  rawBody: string;
};

const evaluation = (
  response: Response,
  result: EvaluationResult,
  interactionId?: string,
  qaRunId?: string,
): Evaluation => ({ response, result, interactionId, qaRunId });

function logRejection(reason: string, code = "none") {
  console.warn("Discord scrim request rejected", {
    reason,
    code,
    execution_id: Deno.env.get("SB_EXECUTION_ID") ?? "unknown",
  });
}

function rpcRejectionReason(error: { code?: string; message?: string } | null) {
  if (!error) return "empty_rpc_result";
  const knownMessages: Record<string, string> = {
    "Server authorization is required": "server_authorization_required",
    "Invalid interaction identity": "invalid_interaction_identity",
    "Discord automation is unavailable for this workspace": "workspace_unavailable",
    "A permitted Discord role is required": "permitted_role_required",
    "Opponent name must be between 1 and 120 characters": "invalid_opponent",
    "Choose a valid start time and duration": "invalid_schedule",
    "Choose a supported IANA timezone": "invalid_timezone",
    "A practice block already overlaps that time": "schedule_overlap",
  };
  if (error.message && knownMessages[error.message]) return knownMessages[error.message];
  if (error.code === "23514") return "constraint_violation";
  if (error.code?.startsWith("PGRST")) return "rpc_unavailable";
  return "rpc_rejected";
}

async function verified(request: Request, rawBody: string) {
  const timestamp = request.headers.get("X-Signature-Timestamp");
  const signature = request.headers.get("X-Signature-Ed25519");
  const publicKey = Deno.env.get("DISCORD_PUBLIC_KEY");
  if (!timestamp || !signature || !publicKey || !/^[0-9a-f]{64}$/i.test(publicKey) || !/^[0-9a-f]{128}$/i.test(signature)) return false;
  try {
    const hex = (value: string) => Uint8Array.from(value.match(/.{1,2}/g)!.map((pair) => Number.parseInt(pair, 16)));
    const key = await crypto.subtle.importKey("raw", hex(publicKey), { name: "Ed25519" }, false, ["verify"]);
    return crypto.subtle.verify({ name: "Ed25519" }, key, hex(signature), new TextEncoder().encode(timestamp + rawBody));
  } catch {
    return false;
  }
}

function optionMap(data: Record<string, unknown>) {
  const options = Array.isArray(data.options) ? data.options : [];
  return new Map(options.flatMap((option) => {
    if (!option || typeof option !== "object") return [];
    const item = option as Record<string, unknown>;
    return typeof item.name === "string" ? [[item.name, item.value]] as const : [];
  }));
}

function localParts(instant: Date, timezone: string) {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const part = (type: string) => Number(values.find((value) => value.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day"), hour: part("hour"), minute: part("minute") };
}

function parseLocalStart(startDate: string, startTime: string, timezone: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(startTime);
  if (!dateMatch || !timeMatch) return null;

  const [year, month, day] = dateMatch.slice(1).map(Number);
  const [hour, minute] = timeMatch.slice(1).map(Number);
  const intendedLocal = Date.UTC(year, month - 1, day, hour, minute);
  const calendarDate = new Date(intendedLocal);
  if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() !== month - 1 || calendarDate.getUTCDate() !== day || hour > 23 || minute > 59) return null;

  try {
    const offsetAt = (instant: Date) => {
      const local = localParts(instant, timezone);
      return (Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute) - instant.getTime()) / 60_000;
    };
    let instant = new Date(intendedLocal - offsetAt(new Date(intendedLocal)) * 60_000);
    instant = new Date(intendedLocal - offsetAt(instant) * 60_000);
    const resolved = localParts(instant, timezone);
    return resolved.year === year && resolved.month === month && resolved.day === day && resolved.hour === hour && resolved.minute === minute ? instant : null;
  } catch {
    return null;
  }
}

async function evaluateInteraction(request: Request, rawBody: string, allowQaClaim: boolean): Promise<Evaluation> {
  if (request.method !== "POST") return evaluation(json({ error: "Method not allowed." }, 405), "rejected");
  if (!(await verified(request, rawBody))) return evaluation(json({ error: "Invalid request signature." }, 401), "rejected");
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return evaluation(ephemeral("This interaction is not available."), "rejected");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return evaluation(ephemeral("This interaction is not available."), "rejected");
  const interaction = parsed as Record<string, unknown>;
  if (interaction.type === 1) return evaluation(json({ type: 1 }), "rejected");
  if (interaction.type !== 2 || !snowflake(interaction.id) || !snowflake(interaction.guild_id)) return evaluation(ephemeral("This interaction is not available."), "rejected");
  const interactionId = interaction.id as string;

  const command = interaction.data && typeof interaction.data === "object" ? interaction.data as Record<string, unknown> : {};
  if (command.name !== "scrim") return evaluation(ephemeral("Only /scrim is available here."), "rejected", interactionId);
  const member = interaction.member && typeof interaction.member === "object" ? interaction.member as Record<string, unknown> : {};
  const roleIds = Array.isArray(member.roles) ? member.roles.filter(snowflake) : [];
  const options = optionMap(command);
  const opponent = typeof options.get("opponent") === "string" ? options.get("opponent") : "";
  const startDate = typeof options.get("start_date") === "string" ? options.get("start_date") : "";
  const startTime = typeof options.get("start_time") === "string" ? options.get("start_time") : "";
  const timezone = typeof options.get("timezone") === "string" ? options.get("timezone") : "";
  const duration = options.get("duration_minutes");
  const durationMinutes = typeof duration === "number" ? duration : typeof duration === "string" && /^\d+$/.test(duration) ? Number(duration) : Number.NaN;
  const requestedFormat = options.get("format");
  const format = typeof requestedFormat === "string" ? requestedFormat.trim().toUpperCase() : "BO5";
  const notes = typeof options.get("notes") === "string" ? options.get("notes") : null;
  const parsedStartsAt = parseLocalStart(startDate, startTime, timezone);
  if (!opponent || !parsedStartsAt || !Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 720) {
    logRejection("invalid_schedule_input");
    return evaluation(ephemeral("Use the required opponent, date YYYY-MM-DD, time HH:MM (24-hour), valid timezone, and duration."), "rejected", interactionId);
  }
  if (!supportedFormats.has(format)) {
    logRejection("invalid_format");
    return evaluation(ephemeral("Use a supported format: BO1, BO2, BO3, BO4, BO5, 1G, 2G, 3G, 4G, or 5G."), "rejected", interactionId);
  }

  const db = serviceClient();
  const { data: installation } = await db.from("discord_installations")
    .select("tenant_id").eq("guild_id", interaction.guild_id).eq("status", "active").maybeSingle();
  if (!installation) {
    logRejection("installation_unavailable");
    return evaluation(ephemeral("Discord scheduling is not available for this server."), "rejected", interactionId);
  }

  let qaRunId: string | undefined;
  if (allowQaClaim) {
    const { data: qaClaim, error: qaClaimError } = await db.rpc("claim_discord_qa_replay_run", {
      p_tenant_id: installation.tenant_id,
      p_interaction_id: interactionId,
    }).maybeSingle();
    if (qaClaimError) {
      // The QA control is additive: an unavailable or unapplied control must
      // never prevent the normal, server-authorized scheduling path.
      logRejection("qa_replay_claim_unavailable", qaClaimError.code ?? "none");
    } else if (qaClaim && typeof qaClaim.run_id === "string") {
      qaRunId = qaClaim.run_id;
    }
  }
  const { data, error } = await db.rpc("create_discord_scrim_block", {
    p_interaction_id: interactionId,
    p_tenant_id: installation.tenant_id,
    p_guild_id: interaction.guild_id,
    p_role_ids: roleIds,
    p_opponent_name: opponent,
    p_starts_at: parsedStartsAt.toISOString(),
    p_timezone: timezone,
    p_duration_minutes: durationMinutes,
    p_format: format,
    p_notes: notes,
  }).maybeSingle();
  if (error || !data) {
    logRejection(rpcRejectionReason(error), error?.code ?? "none");
    return evaluation(
      ephemeral(error?.code === "23P01" ? "A practice block already overlaps that time." : "This command is not authorised for this workspace."),
      error ? "rejected" : "error",
      interactionId,
      qaRunId,
    );
  }
  const result: EvaluationResult = data.result === "replay" ? "replay" : "created";
  return evaluation(
    ephemeral(result === "replay" ? "That /scrim request was already recorded." : "Practice block added to ScrimStats."),
    result,
    interactionId,
    qaRunId,
  );
}

async function recordExactReplay(first: Evaluation, envelope: ReplayEnvelope, startedAt: number) {
  let replayResult: EvaluationResult | "not_run" = "not_run";
  if (first.result === "created") {
    try {
      const replayHeaders = new Headers();
      replayHeaders.set("content-type", envelope.contentType);
      replayHeaders.set("X-Signature-Timestamp", envelope.timestamp);
      replayHeaders.set("X-Signature-Ed25519", envelope.signature);
      const replayRequest = new Request(envelope.url, { method: "POST", headers: replayHeaders, body: envelope.rawBody });
      const replay = await evaluateInteraction(replayRequest, envelope.rawBody, false);
      replayResult = replay.result;
    } catch {
      replayResult = "error";
    }
  }

  const elapsedMs = Math.max(0, Math.round(performance.now() - startedAt));
  const functionVersion = Deno.env.get("DENO_DEPLOYMENT_ID") ?? "source-local";
  let evidenceWrite = "failed";
  try {
    const db = serviceClient();
    const { error } = await db.rpc("complete_discord_qa_replay_run", {
      p_run_id: first.qaRunId,
      p_interaction_id: first.interactionId,
      p_first_result: first.result,
      p_replay_result: replayResult,
      p_elapsed_ms: elapsedMs,
      p_function_version: functionVersion,
    });
    evidenceWrite = error ? "failed" : "recorded";
  } catch {
    evidenceWrite = "failed";
  }

  console.info("Discord exact-replay QA result", {
    run_id: first.qaRunId,
    first_result: first.result,
    replay_result: replayResult,
    elapsed_ms: elapsedMs,
    function_version: functionVersion,
    evidence_write: evidenceWrite,
    execution_id: Deno.env.get("SB_EXECUTION_ID") ?? "unknown",
  });
}

serve(async (request) => {
  const startedAt = performance.now();
  const rawBody = await request.text();
  const first = await evaluateInteraction(request, rawBody, true);

  if (first.qaRunId && first.interactionId) {
    const acknowledgementMs = Math.max(0, Math.round(performance.now() - startedAt));
    const envelope: ReplayEnvelope = {
      url: request.url,
      contentType: request.headers.get("content-type") ?? "application/json",
      timestamp: request.headers.get("X-Signature-Timestamp") ?? "",
      signature: request.headers.get("X-Signature-Ed25519") ?? "",
      rawBody,
    };
    EdgeRuntime.waitUntil(recordExactReplay(first, envelope, startedAt));
    console.info("Discord exact-replay QA scheduled", {
      run_id: first.qaRunId,
      first_result: first.result,
      acknowledgement_ms: acknowledgementMs,
      execution_id: Deno.env.get("SB_EXECUTION_ID") ?? "unknown",
    });
  }

  return first.response;
});
