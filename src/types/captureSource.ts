export type CaptureSource = "collector" | "desktop" | "grid" | "manual" | "awaiting" | "unavailable";

export function resolveCaptureSource(
  source: string | null | undefined,
  status?: string | null,
): CaptureSource {
  const normalized = source?.trim().toLowerCase();
  const normalizedStatus = status?.trim().toLowerCase();

  if (normalized === "desktop_app" || normalized === "desktop collector" || normalized === "desktop_collector") return "desktop";
  if (normalized === "grid") return "grid";
  if (normalized === "manual") return "manual";
  if (
    normalizedStatus === "scheduled" ||
    normalizedStatus === "confirmed" ||
    normalizedStatus === "pending"
  ) {
    return "awaiting";
  }
  return "unavailable";
}
