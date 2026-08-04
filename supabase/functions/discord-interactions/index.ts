import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { json, serviceClient } from "../_shared/collector.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const ephemeral = (content: string) => json({ type: 4, data: { content, flags: 64 } });
const snowflake = (value: unknown) => typeof value === "string" && /^[0-9]{17,20}$/.test(value);
const exactReplayHeader = "X-ScrimStats-Exact-Replay";
const exactReplayMarker = "WO-040 EXACT REPLAY";
const supportedFormats = new Set(["BO1", "BO2", "BO3", "BO4", "BO5", "1G", "2G", "3G", "4G", "5G"]);

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

async function runExactReplay(request: Request, rawBody: string, interactionId: string) {
  const timestamp = request.headers.get("X-Signature-Timestamp");
  const signature = request.headers.get("X-Signature-Ed25519");
  if (!timestamp || !signature) return;

  try {
    const response = await fetch(request.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Signature-Timestamp": timestamp,
        "X-Signature-Ed25519": signature,
        [exactReplayHeader]: "1",
      },
      body: rawBody,
    });
    const body = await response.json().catch(() => null) as Record<string, unknown> | null;
    const responseData = body?.data && typeof body.data === "object" ? body.data as Record<string, unknown> : null;
    console.info("Discord exact replay fixture completed", {
      interaction_id: interactionId,
      status: response.status,
      replay_confirmed: response.ok && responseData?.content === "That /scrim request was already recorded.",
    });
  } catch (error) {
    console.error("Discord exact replay fixture failed", {
      interaction_id: interactionId,
      error: error instanceof Error ? error.name : "unknown",
    });
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

serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const rawBody = await request.text();
  if (!(await verified(request, rawBody))) return json({ error: "Invalid request signature." }, 401);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return ephemeral("This interaction is not available.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return ephemeral("This interaction is not available.");
  const interaction = parsed as Record<string, unknown>;
  if (interaction.type === 1) return json({ type: 1 });
  if (interaction.type !== 2 || !snowflake(interaction.id) || !snowflake(interaction.guild_id)) return ephemeral("This interaction is not available.");

  const command = interaction.data && typeof interaction.data === "object" ? interaction.data as Record<string, unknown> : {};
  if (command.name !== "scrim") return ephemeral("Only /scrim is available here.");
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
    return ephemeral("Use the required opponent, date YYYY-MM-DD, time HH:MM (24-hour), valid timezone, and duration.");
  }
  if (!supportedFormats.has(format)) {
    logRejection("invalid_format");
    return ephemeral("Use a supported format: BO1, BO2, BO3, BO4, BO5, 1G, 2G, 3G, 4G, or 5G.");
  }

  const db = serviceClient();
  const { data: installation } = await db.from("discord_installations")
    .select("tenant_id").eq("guild_id", interaction.guild_id).eq("status", "active").maybeSingle();
  if (!installation) {
    logRejection("installation_unavailable");
    return ephemeral("Discord scheduling is not available for this server.");
  }
  const { data, error } = await db.rpc("create_discord_scrim_block", {
    p_interaction_id: interaction.id,
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
    return ephemeral(error?.code === "23P01" ? "A practice block already overlaps that time." : "This command is not authorised for this workspace.");
  }
  const replayGuildId = Deno.env.get("DISCORD_QA_REPLAY_GUILD_ID");
  if (
    data.result === "created"
    && replayGuildId
    && interaction.guild_id === replayGuildId
    && notes === exactReplayMarker
    && request.headers.get(exactReplayHeader) !== "1"
  ) {
    EdgeRuntime.waitUntil(runExactReplay(request, rawBody, interaction.id));
  }
  return ephemeral(data.result === "replay" ? "That /scrim request was already recorded." : "Practice block added to ScrimStats.");
});
