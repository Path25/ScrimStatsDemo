import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOverviewBriefing,
  type OverviewCalendarEvent,
  type OverviewGame,
  type OverviewScrim,
} from "../src/lib/overview-briefing.ts";

const now = new Date("2026-07-26T12:00:00.000Z");

function scrim(id: string, startsAt: string, status: string, result: string | null = null): OverviewScrim {
  return {
    ends_at: null,
    format: "BO3",
    id,
    notes: null,
    opponent_name: `Opponent ${id}`,
    opponent_score: null,
    our_score: null,
    result,
    starts_at: startsAt,
    status,
  };
}

test("selects the nearest active future block and excludes cancelled or completed blocks", () => {
  const result = buildOverviewBriefing({
    events: [],
    games: [],
    now,
    scrims: [
      scrim("later", "2026-07-29T18:00:00.000Z", "scheduled"),
      scrim("cancelled", "2026-07-26T13:00:00.000Z", "cancelled"),
      scrim("next", "2026-07-27T18:00:00.000Z", "confirmed"),
      scrim("past", "2026-07-25T18:00:00.000Z", "completed", "W 2-1"),
    ],
  });
  assert.equal(result.nextBlock?.id, "next");
  assert.deepEqual(result.upcomingAgenda.map((item) => item.id), ["scrim-later"]);
});

test("merges later scrims and non-linked calendar events in chronological order", () => {
  const events: OverviewCalendarEvent[] = [
    { end_time: null, event_type: "team_meeting", id: "meeting", location: "Discord", scrim_id: null, start_time: "2026-07-27T16:00:00.000Z", title: "Review meeting" },
    { end_time: null, event_type: "scrim", id: "linked", location: null, scrim_id: "next", start_time: "2026-07-27T18:00:00.000Z", title: "Duplicated scrim event" },
  ];
  const result = buildOverviewBriefing({
    events,
    games: [],
    now,
    scrims: [
      scrim("next", "2026-07-27T14:00:00.000Z", "scheduled"),
      scrim("later", "2026-07-27T20:00:00.000Z", "scheduled"),
    ],
  });
  assert.deepEqual(result.upcomingAgenda.map((item) => item.id), ["event-meeting", "scrim-later"]);
});

test("counts only explicit completed game results and limits history to five blocks", () => {
  const completed = Array.from({ length: 7 }, (_, index) =>
    scrim(`past-${index}`, `2026-07-${String(25 - index).padStart(2, "0")}T18:00:00.000Z`, "completed", index === 0 ? null : index % 2 ? "W 2-1" : "L 1-2"),
  );
  const games: OverviewGame[] = [
    { id: "win", result: "win", scrim_id: "past-0", status: "completed" },
    { id: "loss", result: "loss", scrim_id: "past-0", status: "completed" },
    { id: "missing", result: null, scrim_id: "past-0", status: "completed" },
    { id: "pending", result: "win", scrim_id: "past-0", status: "pending" },
  ];
  const result = buildOverviewBriefing({ events: [], games, now, scrims: completed });
  assert.equal(result.recentBlocks.length, 5);
  assert.deepEqual(result.recentBlocks[0].gameRecord, { wins: 1, losses: 1 });
  assert.deepEqual(result.recentGameRecord, { wins: 1, losses: 1 });
  assert.equal(result.completedBlocksLast30Days, 7);
});

test("uses inclusive seven-day schedule boundaries", () => {
  const result = buildOverviewBriefing({
    events: [
      { end_time: null, event_type: "team_meeting", id: "boundary", location: null, scrim_id: null, start_time: "2026-08-02T12:00:00.000Z", title: "Boundary event" },
      { end_time: null, event_type: "team_meeting", id: "outside", location: null, scrim_id: null, start_time: "2026-08-02T12:00:00.001Z", title: "Outside event" },
    ],
    games: [],
    now,
    scrims: [],
  });
  assert.equal(result.scheduledEventsNext7Days, 1);
});
