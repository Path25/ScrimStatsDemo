import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type CalendarEvent,
  type EventType,
  useCalendarEvents,
} from "@/hooks/useCalendarEvents";

const eventTypes: Array<{ value: EventType; label: string }> = [
  { value: "team_meeting", label: "Team meeting" },
  { value: "team_practice", label: "Team practice" },
  { value: "official", label: "Official match" },
  { value: "other", label: "Other" },
];

function dateInputValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function timeInputValue(value: string) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function WorkspaceEventDialog({
  event,
  initialDate,
  open,
  onOpenChange,
}: {
  event?: CalendarEvent | null;
  initialDate: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    createEventAsync,
    updateEventAsync,
    deleteEventAsync,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCalendarEvents();
  const [form, setForm] = useState({
    title: "",
    eventType: "team_meeting" as EventType,
    date: dateInputValue(new Date().toISOString()),
    time: "18:00",
    duration: 60,
    description: "",
    location: "",
  });

  useEffect(() => {
    if (!open) return;
    if (!event) {
      setForm({
        title: "",
        eventType: "team_meeting",
        date: dateInputValue(initialDate.toISOString()),
        time: "18:00",
        duration: 60,
        description: "",
        location: "",
      });
      return;
    }
    const duration = event.end_time
      ? Math.max(
          15,
          Math.round(
            (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60_000,
          ),
        )
      : 60;
    setForm({
      title: event.title,
      eventType: event.event_type,
      date: dateInputValue(event.start_time),
      time: timeInputValue(event.start_time),
      duration,
      description: event.description || "",
      location: event.location || "",
    });
  }, [event, initialDate, open]);

  async function submit(eventForm: React.FormEvent) {
    eventForm.preventDefault();
    if (!form.title.trim() || !form.date || !form.time || form.duration < 15) return;
    const start = new Date(`${form.date}T${form.time}:00`);
    const end = new Date(start.getTime() + form.duration * 60_000);
    const payload = {
      title: form.title.trim(),
      event_type: form.eventType,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      description: form.description.trim() || undefined,
      location: form.location.trim() || undefined,
    };
    if (event) {
      await updateEventAsync({ id: event.id, ...payload });
    } else {
      await createEventAsync(payload);
    }
    onOpenChange(false);
  }

  async function remove() {
    if (!event || !window.confirm(`Delete “${event.title}”?`)) return;
    await deleteEventAsync(event.id);
    onOpenChange(false);
  }

  const pending = isCreating || isUpdating || isDeleting;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Edit team event" : "Add team event"}</DialogTitle>
          <DialogDescription>
            Times are saved as an exact instant with the device timezone attached.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              required
              value={form.title}
              onChange={(input) => setForm({ ...form, title: input.target.value })}
              maxLength={120}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-type">Event type</Label>
            <Select
              value={form.eventType}
              onValueChange={(eventType) => setForm({ ...form, eventType: eventType as EventType })}
            >
              <SelectTrigger id="event-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                required
                value={form.date}
                onChange={(input) => setForm({ ...form, date: input.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-time">Local time</Label>
              <Input
                id="event-time"
                type="time"
                required
                value={form.time}
                onChange={(input) => setForm({ ...form, time: input.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-duration">Duration in minutes</Label>
            <Input
              id="event-duration"
              type="number"
              min={15}
              max={1440}
              required
              value={form.duration}
              onChange={(input) => setForm({ ...form, duration: Number(input.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-location">Location or call link</Label>
            <Input
              id="event-location"
              value={form.location}
              onChange={(input) => setForm({ ...form, location: input.target.value })}
              maxLength={300}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-description">Notes</Label>
            <Textarea
              id="event-description"
              value={form.description}
              onChange={(input) => setForm({ ...form, description: input.target.value })}
              maxLength={1000}
            />
          </div>
          <DialogFooter className="sm:justify-between">
            <div>
              {event && (
                <Button type="button" variant="destructive" onClick={() => void remove()} disabled={pending}>
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
              <Button type="submit" disabled={pending || !form.title.trim()}>
                {pending ? "Saving..." : event ? "Save event" : "Add event"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
