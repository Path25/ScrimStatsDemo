import { useState } from "react";
import { PLAYER_ROLES, ROLE_LABELS, type PlayerRole } from "@/types/availability";
import { cn } from "@/lib/utils";
import { Shield, Swords, Zap, Crosshair, Heart, Users as UsersIcon, Loader2 } from "lucide-react";
import { useAvailability } from "@/hooks/useAvailability";
import { isSameDay, setHours, setMinutes } from "date-fns";

// Map roles to icons
const RoleIcon = ({ role, className }: { role: PlayerRole; className?: string }) => {
    switch (role) {
        case 'top': return <Shield className={className} />;
        case 'jungle': return <Swords className={className} />;
        case 'mid': return <Zap className={className} />;
        case 'adc': return <Crosshair className={className} />;
        case 'support': return <Heart className={className} />;
        default: return <UsersIcon className={className} />;
    }
};

interface AvailabilityCalendarProps {
    weekDays: Array<{ day: string; date: number; fullDate: Date }>;
}

export default function AvailabilityCalendar({ weekDays }: AvailabilityCalendarProps) {
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const { availability, isLoading } = useAvailability();

    // Time slots for the day (6 AM to 11 PM in 1-hour increments)
    const timeSlots = Array.from({ length: 17 }, (_, i) => {
        const hour = i + 6;
        return {
            hour,
            label: `${hour.toString().padStart(2, '0')}:00`,
        };
    });

    // Helper to check if a player is available at a specific time
    const getAvailabilityForSlot = (dayDate: Date, hour: number, role: PlayerRole) => {
        const slotStart = setMinutes(setHours(dayDate, hour), 0);
        const slotEnd = setMinutes(setHours(dayDate, hour + 1), 0);

        return availability.find(av => {
            if (av.playerRole !== role) return false;

            const avStart = new Date(av.startTime);
            const avEnd = new Date(av.endTime);

            // Check if the slot overlaps with availability on the same day
            return (
                av.isAvailable &&
                isSameDay(avStart, dayDate) &&
                avStart <= slotStart &&
                avEnd >= slotEnd
            );
        });
    };

    // Check if all 5 roles are available for a time slot
    const isFullTeamAvailable = (dayDate: Date, hour: number): boolean => {
        return PLAYER_ROLES.every(role =>
            getAvailabilityForSlot(dayDate, hour, role) !== undefined
        );
    };

    if (isLoading) {
        return (
            <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading tactical availability...</p>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-2xl overflow-hidden">
            {/* Header with roles */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-white/5 bg-white/5">
                <div className="p-3 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest border-r border-white/5">
                    Time
                </div>
                {weekDays.map(day => (
                    <div key={day.day} className="p-3 text-center border-r border-white/5 last:border-r-0">
                        <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">{day.day}</span>
                        <span className="text-lg font-bold text-white">{day.date}</span>
                    </div>
                ))}
            </div>

            {/* Time slots grid */}
            <div className="max-h-[600px] overflow-y-auto">
                {timeSlots.map(({ hour, label }) => (
                    <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        {/* Time label */}
                        <div className="p-2 text-xs text-zinc-500 font-mono border-r border-white/5 flex items-center justify-center">
                            {label}
                        </div>

                        {/* Day columns */}
                        {weekDays.map(day => {
                            const isFullTeam = isFullTeamAvailable(day.fullDate, hour);
                            const slotKey = `${day.date}-${hour}`;

                            return (
                                <div
                                    key={day.day}
                                    className={cn(
                                        "p-1 border-r border-white/5 last:border-r-0 relative cursor-pointer transition-all",
                                        isFullTeam && "bg-yellow-500/10 ring-1 ring-yellow-500/30",
                                        selectedSlot === slotKey && "bg-brand-primary/10"
                                    )}
                                    onClick={() => setSelectedSlot(slotKey)}
                                >
                                    {/* Role availability indicators */}
                                    <div className="grid grid-cols-5 gap-0.5 h-full min-h-[60px]">
                                        {PLAYER_ROLES.map(role => {
                                            const availability = getAvailabilityForSlot(day.fullDate, hour, role);
                                            const isAvailable = availability !== undefined;

                                            return (
                                                <div
                                                    key={role}
                                                    className={cn(
                                                        "rounded flex items-center justify-center transition-all group relative",
                                                        isAvailable
                                                            ? "bg-green-500/20 hover:bg-green-500/30"
                                                            : "bg-zinc-800/30 hover:bg-zinc-700/30"
                                                    )}
                                                    title={`${ROLE_LABELS[role]}: ${isAvailable ? availability.playerName : 'Not available'}`}
                                                >
                                                    <RoleIcon
                                                        role={role}
                                                        className={cn(
                                                            "w-3 h-3 transition-all",
                                                            isAvailable ? "text-green-400" : "text-zinc-600"
                                                        )}
                                                    />

                                                    {/* Tooltip on hover */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/90 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                                                        {ROLE_LABELS[role]}: {isAvailable ? availability.playerName : 'N/A'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Full team indicator */}
                                    {isFullTeam && (
                                        <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                                            title="Full team available" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="border-t border-white/5 p-4 bg-white/[0.02]">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Roles:</span>
                        {PLAYER_ROLES.map(role => (
                            <div key={role} className="flex items-center gap-1.5">
                                <RoleIcon role={role} className="w-3 h-3 text-zinc-400" />
                                <span className="text-xs text-zinc-400">{ROLE_LABELS[role]}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" />
                            <span className="text-xs text-zinc-400">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-zinc-800/30 border border-zinc-700/30" />
                            <span className="text-xs text-zinc-400">Unavailable</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/30" />
                            <span className="text-xs text-zinc-400">Full Team</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
