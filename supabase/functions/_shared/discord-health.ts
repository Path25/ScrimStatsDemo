export type DiscordDeliveryHealthState = "setup_required" | "connected" | "configured" | "queued" | "retrying" | "failed" | "delivered" | "disconnected";

export function discordDeliveryHealthState(
  installationStatus: string | null,
  subscriptionCount: number,
  event: { status: string; attempt_count: number } | null,
): DiscordDeliveryHealthState {
  if (installationStatus && installationStatus !== "active") return "disconnected";
  if (!installationStatus) return "setup_required";
  if (subscriptionCount === 0) return "connected";
  if (event?.status === "failed") return "failed";
  if (event?.status === "delivered") return "delivered";
  if (event?.status === "pending" || event?.status === "processing") return event.attempt_count > 0 ? "retrying" : "queued";
  return "configured";
}
