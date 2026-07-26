import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, input, availabilityCalendar, eventsHook, availabilityHook, availabilityMigration] = await Promise.all([
  readFile(new URL("../src/pages/Calendar.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/calendar/AvailabilityInput.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/calendar/AvailabilityCalendar.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/hooks/useCalendarEvents.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/hooks/useAvailability.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20260726104115_create_secure_player_availability.sql", import.meta.url), "utf8"),
]);

test("availability storage is deployed as an authenticated tenant-scoped relation", () => {
  assert.match(availabilityMigration, /create table if not exists public\.player_availability/);
  assert.match(availabilityMigration, /alter table public\.player_availability enable row level security/);
  assert.match(availabilityMigration, /grant select, insert, update, delete[\s\S]*?to authenticated/);
  assert.match(availabilityMigration, /revoke all[\s\S]*?from anon/);
  assert.match(availabilityMigration, /user_belongs_to_tenant\(tenant_id\)/);
  assert.match(availabilityMigration, /user_has_tenant_role/);
});

test("calendar and availability reads remain tenant scoped", () => {
  assert.match(eventsHook, /from\('calendar_events'\)[\s\S]*?eq\('tenant_id', tenant\.id\)/);
  assert.match(eventsHook, /from\('scrims'\)[\s\S]*?eq\('tenant_id', tenant\.id\)/);
  assert.match(availabilityHook, /from\('player_availability'\)[\s\S]*?eq\('tenant_id', tenant\.id\)/);
  assert.match(availabilityHook, /from\('players'\)[\s\S]*?eq\('tenant_id', tenant\.id\)[\s\S]*?in\('id', playerIds\)/);
  assert.match(availabilityHook, /delete\(\)[\s\S]*?eq\('id', id\)[\s\S]*?eq\('tenant_id', tenant\.id\)/);
});

test("availability does not depend on a cached PostgREST relationship", () => {
  assert.doesNotMatch(availabilityHook, /player:players/);
  assert.match(availabilityHook, /playersById/);
});

test("availability selector uses the themed accessible Select control", () => {
  assert.match(input, /<Select[\s\S]*?<SelectTrigger id="availability-player">/);
  assert.match(input, /<SelectContent>/);
  assert.doesNotMatch(input, /<select/);
  assert.doesNotMatch(input, /<option/);
});

test("availability navigation always moves by week and viewers cannot add responses", () => {
  assert.match(page, /calendarMode === "availability" \|\| view === "week"/);
  assert.match(page, /canAddAvailability = isManager \|\| activeRole === "member"/);
  assert.match(page, /canAddAvailability \? \(/);
});

test("availability distinguishes explicit responses and supports managed removal", () => {
  assert.match(availabilityCalendar, /Available/);
  assert.match(availabilityCalendar, /Unavailable/);
  assert.match(availabilityCalendar, /No response/);
  assert.match(availabilityCalendar, /deleteAvailability\(entry\.id\)/);
  assert.match(availabilityCalendar, /entry\.createdBy === user\?\.id/);
});

test("calendar event editing is keyboard accessible and recoverable", () => {
  assert.match(page, /<button type="button" className=\{className\}/);
  assert.match(page, /Try again/);
  assert.match(page, /aria-pressed=\{calendarMode === mode\.id\}/);
});

test("calendar dates are selectable and expose a scrollable selected-day agenda", () => {
  assert.match(page, /overflow-x-auto/);
  assert.match(page, /aria-label="Select calendar date"/);
  assert.match(page, /onClick=\{\(\) => chooseDay\(day\)\}/);
  assert.match(page, /Selected day/);
  assert.match(page, /moveSelectedDay\(-1\)/);
  assert.match(page, /moveSelectedDay\(1\)/);
  assert.match(page, /initialDate=\{selectedDay\}/);
});
