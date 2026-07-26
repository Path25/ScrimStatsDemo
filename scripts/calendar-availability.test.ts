import assert from "node:assert/strict";
import test from "node:test";

import {
  entriesOverlappingSlot,
  roleStateForSlot,
} from "../src/lib/calendar-availability.ts";
import type { AvailabilityEntry } from "../src/types/availability.ts";

function entry(
  overrides: Partial<AvailabilityEntry> & Pick<AvailabilityEntry, "id" | "playerId">,
): AvailabilityEntry {
  return {
    id: overrides.id,
    playerId: overrides.playerId,
    playerName: "Player",
    playerRole: "top",
    tenantId: "tenant-a",
    startTime: new Date("2026-07-27T18:00:00"),
    endTime: new Date("2026-07-27T21:00:00"),
    isAvailable: true,
    createdBy: "user-a",
    createdAt: new Date("2026-07-26T10:00:00"),
    updatedAt: new Date("2026-07-26T10:00:00"),
    ...overrides,
  };
}

test("distinguishes available, unavailable, and unanswered roles", () => {
  const day = new Date("2026-07-27T12:00:00");
  const entries = [
    entry({ id: "available", playerId: "top-a" }),
    entry({ id: "unavailable", playerId: "jungle-a", playerRole: "jungle", isAvailable: false }),
  ];

  assert.equal(roleStateForSlot(entries, day, 18, "top"), "available");
  assert.equal(roleStateForSlot(entries, day, 18, "jungle"), "unavailable");
  assert.equal(roleStateForSlot(entries, day, 18, "mid"), "unanswered");
});

test("uses the latest response for the same player", () => {
  const day = new Date("2026-07-27T12:00:00");
  const entries = [
    entry({ id: "old", playerId: "top-a", isAvailable: true }),
    entry({
      id: "new",
      playerId: "top-a",
      isAvailable: false,
      updatedAt: new Date("2026-07-26T11:00:00"),
    }),
  ];

  assert.equal(roleStateForSlot(entries, day, 18, "top"), "unavailable");
});

test("returns responses that partially overlap a selected slot", () => {
  const day = new Date("2026-07-27T12:00:00");
  const entries = [
    entry({
      id: "partial",
      playerId: "top-a",
      startTime: new Date("2026-07-27T18:30:00"),
      endTime: new Date("2026-07-27T19:30:00"),
    }),
    entry({
      id: "later",
      playerId: "mid-a",
      playerRole: "mid",
      startTime: new Date("2026-07-27T20:00:00"),
      endTime: new Date("2026-07-27T21:00:00"),
    }),
  ];

  assert.deepEqual(entriesOverlappingSlot(entries, day, 18).map((item) => item.id), ["partial"]);
});
