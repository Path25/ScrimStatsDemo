import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { json, serviceClient } from "../_shared/collector.ts";

const ephemeral = (content: string) => json({ type: 4, data: { content, flags: 64 } });
const snowflake = (value: unknown) => typeof value === "string" && /^[0-9]{17,20}$/.test(value);

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

serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const rawBody = await request.text();
  if (!(await verified(request, rawBody))) return json({ error: "Invalid request signature." }, 401);
  const interaction = JSON.parse(rawBody) as Record<string, unknown>;
  if (interaction.type === 1) return json({ type: 1 });
  if (interaction.type !== 2 || !snowflake(interaction.id) || !snowflake(interaction.guild_id)) return ephemeral("This interaction is not available.");

  const command = interaction.data && typeof interaction.data === "object" ? interaction.data as Record<string, unknown> : {};
  if (command.name !== "scrim") return ephemeral("Only /scrim is available here.");
  const member = interaction.member && typeof interaction.member === "object" ? interaction.member as Record<string, unknown> : {};
  const roleIds = Array.isArray(member.roles) ? member.roles.filter(snowflake) : [];
  const options = optionMap(command);
  const opponent = typeof options.get("opponent") === "string" ? options.get("opponent") : "";
  const startsAt = typeof options.get("starts_at") === "string" ? options.get("starts_at") : "";
  const timezone = typeof options.get("timezone") === "string" ? options.get("timezone") : "";
  const duration = options.get("duration_minutes");
  const durationMinutes = typeof duration === "number" ? duration : Number.parseInt(String(duration), 10);
  const format = typeof options.get("format") === "string" ? options.get("format") : "BO5";
  const notes = typeof options.get("notes") === "string" ? options.get("notes") : null;
  if (!opponent || !timezone || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(startsAt) || !Number.isInteger(durationMinutes)) {
    return ephemeral("Use the required opponent, timezone, ISO start time with an offset, and duration.");
  }

  const db = serviceClient();
  const { data: installation } = await db.from("discord_installations")
    .select("tenant_id").eq("guild_id", interaction.guild_id).eq("status", "active").maybeSingle();
  if (!installation) return ephemeral("Discord scheduling is not available for this server.");
  const { data, error } = await db.rpc("create_discord_scrim_block", {
    p_interaction_id: interaction.id,
    p_tenant_id: installation.tenant_id,
    p_guild_id: interaction.guild_id,
    p_role_ids: roleIds,
    p_opponent_name: opponent,
    p_starts_at: new Date(startsAt).toISOString(),
    p_timezone: timezone,
    p_duration_minutes: durationMinutes,
    p_format: format,
    p_notes: notes,
  }).maybeSingle();
  if (error || !data) return ephemeral(error?.code === "23P01" ? "A practice block already overlaps that time." : "This command is not authorised for this workspace.");
  return ephemeral(data.result === "replay" ? "That /scrim request was already recorded." : "Practice block added to ScrimStats.");
});
