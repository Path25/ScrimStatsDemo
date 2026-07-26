import { useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
} from "lucide-react";

import AvailabilityCalendar from "@/components/calendar/AvailabilityCalendar";
import AvailabilityInput from "@/components/calendar/AvailabilityInput";
import { WorkspaceEventDialog } from "@/components/calendar/WorkspaceEventDialog";
import { ScheduleScrimDialog } from "@/components/scrims/ScheduleScrimDialog";
import { Button } from "@/components/ui/button";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { type CalendarEvent, useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useRole } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function eventTone(type: CalendarEvent["event_type"]) {
  if (type === "scrim") return "border-[var(--workspace-accent)] text-[var(--workspace-foreground)]";
  if (type === "official") return "border-rose-400 text-rose-200";
  if (type === "team_practice") return "border-violet-400 text-violet-200";
  return "border-[var(--workspace-awaiting)] text-[var(--workspace-muted)]";
}

function CalendarEventRow({
  event,
  onOpen,
}: {
  event: CalendarEvent;
  onOpen?: (event: CalendarEvent) => void;
}) {
  const content = (
    <>
      <p className="truncate text-sm font-medium">{event.title}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--workspace-subtle)]">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        {format(parseISO(event.start_time), "HH:mm")}
        {event.end_time && <>–{format(parseISO(event.end_time), "HH:mm")}</>}
      </p>
    </>
  );

  const className = cn(
    "block w-full border-l-2 pl-3 text-left",
    eventTone(event.event_type),
    onOpen && "cursor-pointer transition-colors hover:bg-[var(--workspace-surface-raised)]",
  );

  if (onOpen) {
    return (
      <button type="button" className={className} onClick={() => onOpen(event)}>
        {content}
      </button>
    );
  }

  return (
    <article className={className}>{content}</article>
  );
}

export default function Calendar() {
  const { events, isLoading, error, refetch } = useCalendarEvents();
  const [view, setView] = useState<"week" | "month">("month");
  const [calendarMode, setCalendarMode] = useState<"events" | "availability">("events");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showAvailabilityInput, setShowAvailabilityInput] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { activeRole, isManager } = useRole();
  const canAddAvailability = isManager || activeRole === "member";
  const usesWeeklyRange = calendarMode === "availability" || view === "week";

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const rangeStart =
    !usesWeeklyRange
      ? startOfWeek(monthStart, { weekStartsOn: 1 })
      : startOfWeek(currentDate, { weekStartsOn: 1 });
  const rangeEnd =
    !usesWeeklyRange
      ? endOfWeek(monthEnd, { weekStartsOn: 1 })
      : endOfWeek(currentDate, { weekStartsOn: 1 });
  const displayedDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const selectedDayEvents = events
    .filter((event) => isSameDay(parseISO(event.start_time), selectedDay))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const currentDateDisplay =
    !usesWeeklyRange
      ? format(currentDate, "MMMM yyyy")
      : `${format(rangeStart, "MMM d")} – ${format(rangeEnd, "MMM d, yyyy")}`;

  function movePrevious() {
    const nextDate = !usesWeeklyRange ? subMonths(currentDate, 1) : subWeeks(currentDate, 1);
    setCurrentDate(nextDate);
    setSelectedDay(nextDate);
  }

  function moveNext() {
    const nextDate = !usesWeeklyRange ? addMonths(currentDate, 1) : addWeeks(currentDate, 1);
    setCurrentDate(nextDate);
    setSelectedDay(nextDate);
  }

  function getEventsForDay(day: Date) {
    return events.filter((event) => isSameDay(parseISO(event.start_time), day));
  }

  function chooseDay(day: Date) {
    setSelectedDay(day);
    setCurrentDate(day);
  }

  function moveSelectedDay(amount: number) {
    chooseDay(addDays(selectedDay, amount));
  }

  return (
    <div className="space-y-8 pb-10">
      <WorkspacePageHeader
        eyebrow="Team and calendar"
        title="Team calendar"
        description="Coordinate practice blocks and availability without separating the schedule from the team workspace."
        actions={
          isManager ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedEvent(null);
                  setEventDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add event
              </Button>
              <ScheduleScrimDialog />
            </>
          ) : undefined
        }
      />

      <div className="flex flex-col justify-between gap-4 border-y border-[var(--workspace-rule-strong)] py-4 xl:flex-row xl:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              setCurrentDate(today);
              setSelectedDay(today);
            }}
          >
            Today
          </Button>
          <Button variant="ghost" size="icon" aria-label="Previous period" onClick={movePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-44 text-center text-sm font-semibold">{currentDateDisplay}</span>
          <Button variant="ghost" size="icon" aria-label="Next period" onClick={moveNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex border border-[var(--workspace-rule)] p-1">
            {[
              { id: "events", label: "Events", icon: CalendarIcon },
              { id: "availability", label: "Availability", icon: CalendarDays },
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={calendarMode === mode.id}
                  onClick={() => setCalendarMode(mode.id as "events" | "availability")}
                  className={cn(
                    "flex min-h-9 items-center gap-2 px-3 text-xs font-medium transition-colors",
                    calendarMode === mode.id
                      ? "bg-[var(--workspace-surface-raised)] text-[var(--workspace-foreground)]"
                      : "text-[var(--workspace-muted)] hover:text-[var(--workspace-foreground)]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {mode.label}
                </button>
              );
            })}
          </div>

          {calendarMode === "events" ? (
            <div className="flex border border-[var(--workspace-rule)] p-1">
              {(["week", "month"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={view === option}
                  onClick={() => setView(option)}
                  className={cn(
                    "min-h-9 px-3 text-xs font-medium capitalize transition-colors",
                    view === option
                      ? "bg-[var(--workspace-surface-raised)] text-[var(--workspace-foreground)]"
                      : "text-[var(--workspace-muted)] hover:text-[var(--workspace-foreground)]",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : canAddAvailability ? (
            <Button size="sm" onClick={() => setShowAvailabilityInput(true)}>
              <Plus className="h-4 w-4" /> Add availability
            </Button>
          ) : null}
        </div>
      </div>

      {calendarMode === "availability" ? (
        <AvailabilityCalendar
          weekDays={eachDayOfInterval({
            start: startOfWeek(currentDate, { weekStartsOn: 1 }),
            end: endOfWeek(currentDate, { weekStartsOn: 1 }),
          }).map((date) => ({
            day: format(date, "EEE"),
            date: date.getDate(),
            fullDate: date,
          }))}
        />
      ) : isLoading ? (
        <WorkspaceState
          icon={CalendarDays}
          title="Loading the team calendar"
          description="ScrimStats is reading saved events and scrim blocks."
        />
      ) : error ? (
        <WorkspaceState
          icon={CalendarDays}
          title="The calendar is unavailable"
          description={error}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <div className="md:hidden">
            <div
              className="flex snap-x gap-2 overflow-x-auto pb-2"
              aria-label="Select calendar date"
            >
              {displayedDays.map((day) => {
                const selected = isSameDay(day, selectedDay);
                const eventCount = getEventsForDay(day).length;
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => chooseDay(day)}
                    aria-pressed={selected}
                    className={cn(
                      "min-w-16 snap-center border px-3 py-3 text-center transition-colors",
                      selected
                        ? "border-[var(--workspace-accent)] bg-[color:rgba(17,226,208,.08)] text-[var(--workspace-foreground)]"
                        : "border-[var(--workspace-rule)] text-[var(--workspace-muted)]",
                    )}
                  >
                    <span className="workspace-eyebrow block text-[var(--workspace-subtle)]">
                      {format(day, "EEE")}
                    </span>
                    <span className="mt-1 block text-lg font-semibold">{format(day, "d")}</span>
                    <span className="mt-1 block text-[10px] text-[var(--workspace-subtle)]">
                      {eventCount ? `${eventCount} event${eventCount === 1 ? "" : "s"}` : "Free"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <DataSurface className="hidden md:block">
            <div className="grid grid-cols-7 border-b border-[var(--workspace-rule)]">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="workspace-eyebrow py-3 text-center text-[var(--workspace-subtle)]"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {displayedDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const inCurrentMonth = day.getMonth() === currentDate.getMonth();
                const selected = isSameDay(day, selectedDay);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-32 border-b border-r border-[var(--workspace-rule)] p-3",
                      isToday(day) && "bg-[color:rgba(17,226,208,.035)]",
                      selected && "bg-[color:rgba(17,226,208,.065)] ring-1 ring-inset ring-[var(--workspace-accent)]",
                      view === "month" && !inCurrentMonth && "opacity-35",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => chooseDay(day)}
                      aria-label={`Select ${format(day, "EEEE, MMMM d")}`}
                      aria-pressed={selected}
                      className={cn(
                        "ss-mono grid h-7 w-7 place-items-center text-xs text-[var(--workspace-subtle)]",
                        isToday(day) &&
                          "bg-[var(--workspace-accent)] font-semibold text-[var(--workspace-bg)]",
                        selected && !isToday(day) && "border border-[var(--workspace-accent)] text-[var(--workspace-foreground)]",
                      )}
                    >
                      {format(day, "d")}
                    </button>
                    <div className="mt-3 space-y-3">
                      {dayEvents.slice(0, view === "month" ? 3 : 6).map((event) => (
                        <CalendarEventRow
                          key={`${event.event_type}-${event.id}`}
                          event={event}
                          onOpen={
                            isManager && event.source === "calendar"
                              ? (selected) => {
                                  setSelectedEvent(selected);
                                  setEventDialogOpen(true);
                                }
                              : undefined
                          }
                        />
                      ))}
                      {dayEvents.length > (view === "month" ? 3 : 6) && (
                        <p className="text-xs text-[var(--workspace-subtle)]">
                          +{dayEvents.length - (view === "month" ? 3 : 6)} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DataSurface>

          <DataSurface elevated>
            <div className="flex flex-col gap-3 border-b border-[var(--workspace-rule)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Selected day</p>
                <h2 className="mt-1 text-lg font-semibold">
                  {format(selectedDay, "EEEE, MMMM d, yyyy")}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Previous day"
                  onClick={() => moveSelectedDay(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Next day"
                  onClick={() => moveSelectedDay(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedDayEvents.length ? (
              <div className="divide-y divide-[var(--workspace-rule)]">
                {selectedDayEvents.map((event) => (
                  <div key={`${event.event_type}-${event.id}`} className="px-5 py-4">
                    <CalendarEventRow
                      event={event}
                      onOpen={
                        isManager && event.source === "calendar"
                          ? (selected) => {
                              setSelectedEvent(selected);
                              setEventDialogOpen(true);
                            }
                          : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-sm text-[var(--workspace-muted)]">
                Nothing is scheduled for this day.
              </div>
            )}
          </DataSurface>
        </>
      )}

      {showAvailabilityInput && (
        <AvailabilityInput
          initialDate={selectedDay}
          onClose={() => setShowAvailabilityInput(false)}
        />
      )}
      <WorkspaceEventDialog
        event={selectedEvent}
        initialDate={selectedDay}
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
      />
    </div>
  );
}
