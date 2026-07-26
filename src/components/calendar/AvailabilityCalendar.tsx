import { format } from "date-fns";
import {
  Crosshair,
  Heart,
  Loader2,
  Shield,
  Swords,
  Trash2,
  Users as UsersIcon,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useAvailability } from "@/hooks/useAvailability";
import {
  entriesOverlappingSlot,
  roleStateForSlot,
  type RoleSlotState,
} from "@/lib/calendar-availability";
import { cn } from "@/lib/utils";
import { PLAYER_ROLES, ROLE_LABELS, type PlayerRole } from "@/types/availability";

const timeSlots = Array.from({ length: 17 }, (_, index) => ({
  hour: index + 6,
  label: `${String(index + 6).padStart(2, "0")}:00`,
}));

function RoleIcon({ role, className }: { role: PlayerRole; className?: string }) {
  switch (role) {
    case "top":
      return <Shield className={className} aria-hidden="true" />;
    case "jungle":
      return <Swords className={className} aria-hidden="true" />;
    case "mid":
      return <Zap className={className} aria-hidden="true" />;
    case "adc":
      return <Crosshair className={className} aria-hidden="true" />;
    case "support":
      return <Heart className={className} aria-hidden="true" />;
    default:
      return <UsersIcon className={className} aria-hidden="true" />;
  }
}

function statusTone(status: RoleSlotState) {
  if (status === "available") return "border-emerald-400/30 bg-emerald-400/12 text-emerald-300";
  if (status === "unavailable") return "border-rose-400/25 bg-rose-400/10 text-rose-300";
  return "border-[var(--workspace-rule)] bg-white/[0.018] text-[var(--workspace-unavailable)]";
}

interface AvailabilityCalendarProps {
  weekDays: Array<{ day: string; date: number; fullDate: Date }>;
}

export default function AvailabilityCalendar({ weekDays }: AvailabilityCalendarProps) {
  const {
    availability,
    isLoading,
    error,
    refetch,
    deleteAvailability,
    isDeleting,
    pendingAvailabilityId,
  } = useAvailability();
  const { user } = useAuth();
  const { activeRole, isManager } = useRole();
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const selectedEntries = useMemo(
    () =>
      selectedSlot
        ? entriesOverlappingSlot(availability, selectedSlot.date, selectedSlot.hour)
        : [],
    [availability, selectedSlot],
  );

  if (isLoading) {
    return (
      <WorkspaceState
        icon={UsersIcon}
        title="Loading team availability"
        description="ScrimStats is reading confirmed availability for this week."
      />
    );
  }

  if (error) {
    return (
      <WorkspaceState
        icon={UsersIcon}
        title="Availability could not be loaded"
        description={error}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <DataSurface>
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[72px_repeat(7,minmax(96px,1fr))] border-b border-[var(--workspace-rule)] bg-white/[0.018]">
              <div className="workspace-eyebrow border-r border-[var(--workspace-rule)] p-3 text-center text-[var(--workspace-subtle)]">
                Time
              </div>
              {weekDays.map((day) => (
                <div
                  key={day.fullDate.toISOString()}
                  className="border-r border-[var(--workspace-rule)] p-3 text-center last:border-r-0"
                >
                  <span className="workspace-eyebrow block text-[var(--workspace-subtle)]">{day.day}</span>
                  <span className="mt-1 block text-base font-semibold">{day.date}</span>
                </div>
              ))}
            </div>

            <div className="max-h-[620px] overflow-y-auto">
              {timeSlots.map(({ hour, label }) => (
                <div
                  key={hour}
                  className="grid grid-cols-[72px_repeat(7,minmax(96px,1fr))] border-b border-[var(--workspace-rule)] last:border-b-0"
                >
                  <div className="ss-mono flex items-center justify-center border-r border-[var(--workspace-rule)] p-2 text-xs text-[var(--workspace-subtle)]">
                    {label}
                  </div>

                  {weekDays.map((day) => {
                    const roleStates = PLAYER_ROLES.map((role) => ({
                      role,
                      status: roleStateForSlot(availability, day.fullDate, hour, role),
                    }));
                    const fullTeam = roleStates.every(({ status }) => status === "available");
                    const roleSummary = roleStates
                      .map(({ role, status }) => `${ROLE_LABELS[role]} ${status}`)
                      .join(", ");
                    const selected =
                      selectedSlot?.hour === hour &&
                      selectedSlot.date.toDateString() === day.fullDate.toDateString();

                    return (
                      <button
                        key={day.fullDate.toISOString()}
                        type="button"
                        onClick={() => setSelectedSlot({ date: day.fullDate, hour })}
                        aria-label={`${format(day.fullDate, "EEEE, MMMM d")} at ${label}. ${roleSummary}`}
                        className={cn(
                          "relative min-h-16 border-r border-[var(--workspace-rule)] p-1.5 text-left transition-colors last:border-r-0 hover:bg-[var(--workspace-surface-hover)]",
                          fullTeam && "bg-[color:rgba(17,226,208,.045)]",
                          selected && "bg-[color:rgba(17,226,208,.085)] ring-1 ring-inset ring-[var(--workspace-accent)]",
                        )}
                      >
                        <span className="grid h-full grid-cols-5 gap-1" aria-hidden="true">
                          {roleStates.map(({ role, status }) => (
                            <span
                              key={role}
                              className={cn("grid place-items-center border", statusTone(status))}
                              title={`${ROLE_LABELS[role]}: ${status}`}
                            >
                              <RoleIcon role={role} className="h-3.5 w-3.5" />
                            </span>
                          ))}
                        </span>
                        {fullTeam && (
                          <span className="absolute right-1 top-1 h-1.5 w-1.5 bg-[var(--workspace-accent)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--workspace-rule)] px-4 py-3 text-xs text-[var(--workspace-muted)]">
          {[
            { label: "Available", className: "bg-emerald-400/20 border-emerald-400/30" },
            { label: "Unavailable", className: "bg-rose-400/15 border-rose-400/25" },
            { label: "No response", className: "bg-white/[0.018] border-[var(--workspace-rule)]" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-2">
              <span className={cn("h-3 w-3 border", item.className)} aria-hidden="true" />
              {item.label}
            </span>
          ))}
          <span className="ml-auto">Select a time to inspect player responses.</span>
        </div>
      </DataSurface>

      {selectedSlot && (
        <DataSurface elevated>
          <div className="border-b border-[var(--workspace-rule)] px-5 py-4">
            <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Selected window</p>
            <h2 className="mt-1 text-lg font-semibold">
              {format(selectedSlot.date, "EEEE, MMMM d")} · {String(selectedSlot.hour).padStart(2, "0")}:00
            </h2>
          </div>
          {selectedEntries.length ? (
            <div className="divide-y divide-[var(--workspace-rule)]">
              {selectedEntries.map((entry) => {
                const canRemove =
                  isManager || (activeRole === "member" && entry.createdBy === user?.id);
                return (
                  <div key={entry.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{entry.playerName || "Unknown player"}</p>
                        <span
                          className={cn(
                            "border px-2 py-0.5 text-xs",
                            entry.isAvailable
                              ? "border-emerald-400/30 text-emerald-300"
                              : "border-rose-400/30 text-rose-300",
                          )}
                        >
                          {entry.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                        {entry.playerRole ? ROLE_LABELS[entry.playerRole] : "Role not set"} · {format(entry.startTime, "HH:mm")}–{format(entry.endTime, "HH:mm")}
                      </p>
                      {entry.notes && (
                        <p className="mt-2 text-sm text-[var(--workspace-subtle)]">{entry.notes}</p>
                      )}
                    </div>
                    {canRemove && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => void deleteAvailability(entry.id)}
                      >
                        {pendingAvailabilityId === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Remove
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-6 text-sm text-[var(--workspace-muted)]">
              No player has recorded availability that overlaps this window.
            </div>
          )}
        </DataSurface>
      )}

      {!availability.length && !selectedSlot && (
        <p className="text-sm text-[var(--workspace-muted)]">
          No availability has been recorded for this workspace yet.
        </p>
      )}
    </div>
  );
}
