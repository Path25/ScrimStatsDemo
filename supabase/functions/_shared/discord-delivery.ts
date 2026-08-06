export type DiscordIntegrationEvent = {
  id: string;
  tenant_id: string;
  event_type: string;
  aggregate_id: string | null;
  payload: Record<string, unknown>;
  attempt_count: number;
};

export const supportedDiscordEventTypes = new Set([
  "schedule_created",
  "schedule_changed",
  "schedule_cancelled",
  "practice_reminder",
]);

const DISCORD_SUPPRESS_EMBEDS = 1 << 2;

function discordTime(payload: Record<string, unknown>) {
  const scheduledTime = typeof payload.scheduled_time === "string"
    ? payload.scheduled_time
    : typeof payload.match_date === "string"
      ? payload.match_date
      : null;
  const instant = scheduledTime ? Date.parse(scheduledTime) : Number.NaN;
  return Number.isFinite(instant) ? `<t:${Math.floor(instant / 1_000)}:F>` : "Time to be confirmed";
}

export function discordEventMessage(event: DiscordIntegrationEvent, appUrl: string) {
  const opponent = typeof event.payload.opponent_name === "string" ? event.payload.opponent_name : "opponent";
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
    content: `**${title}**\nvs ${opponent}\n${discordTime(event.payload)}\n${link}`,
    allowed_mentions: { parse: [] as string[] },
    flags: DISCORD_SUPPRESS_EMBEDS,
  };
}

export async function discordDeliveryNonce(eventId: string, channelId: string) {
  const input = new TextEncoder().encode(`${eventId}:${channelId}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(
    new Uint8Array(digest).slice(0, 12),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}
