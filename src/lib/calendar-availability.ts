import { setHours, setMinutes } from "date-fns";

import type { AvailabilityEntry, PlayerRole } from "@/types/availability";

export type RoleSlotState = "available" | "unavailable" | "unanswered";

export function slotBounds(day: Date, hour: number) {
  return {
    start: setMinutes(setHours(day, hour), 0),
    end: setMinutes(setHours(day, hour + 1), 0),
  };
}

export function entriesOverlappingSlot(
  availability: AvailabilityEntry[],
  day: Date,
  hour: number,
) {
  const slot = slotBounds(day, hour);
  return availability
    .filter((entry) => entry.startTime < slot.end && entry.endTime > slot.start)
    .sort((a, b) => {
      const role = (a.playerRole || "").localeCompare(b.playerRole || "");
      return role || (a.playerName || "").localeCompare(b.playerName || "");
    });
}

export function roleStateForSlot(
  availability: AvailabilityEntry[],
  day: Date,
  hour: number,
  role: PlayerRole,
): RoleSlotState {
  const slot = slotBounds(day, hour);
  const latestByPlayer = new Map<string, AvailabilityEntry>();

  availability.forEach((entry) => {
    if (
      entry.playerRole !== role ||
      entry.startTime > slot.start ||
      entry.endTime < slot.end
    ) {
      return;
    }
    const current = latestByPlayer.get(entry.playerId);
    if (!current || entry.updatedAt > current.updatedAt) latestByPlayer.set(entry.playerId, entry);
  });

  const currentEntries = [...latestByPlayer.values()];
  if (currentEntries.some((entry) => entry.isAvailable)) return "available";
  if (currentEntries.some((entry) => !entry.isAvailable)) return "unavailable";
  return "unanswered";
}
