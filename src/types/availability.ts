// Player Availability Types

export type PlayerRole = 'top' | 'jungle' | 'mid' | 'adc' | 'support';

export const PLAYER_ROLES: PlayerRole[] = ['top', 'jungle', 'mid', 'adc', 'support'];

export const ROLE_LABELS: Record<PlayerRole, string> = {
    top: 'Top',
    jungle: 'Jungle',
    mid: 'Mid',
    adc: 'ADC',
    support: 'Support',
};

export interface AvailabilityEntry {
    id: string;
    playerId: string;
    playerName?: string;
    playerRole?: PlayerRole;
    tenantId: string;
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
    recurrenceRule?: string; // iCal RRULE format
    notes?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface RoleAvailability {
    role: PlayerRole;
    playerId?: string;
    playerName?: string;
    isAvailable: boolean;
    availabilityId?: string;
    notes?: string;
}

export interface TeamAvailabilitySlot {
    startTime: Date;
    endTime: Date;
    availableRoles: RoleAvailability[];
    isFullTeam: boolean; // true when all 5 roles are available
}

export interface AvailabilityFormData {
    playerId: string;
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
    recurrenceRule?: string;
    notes?: string;
}

export interface PlayerWithRole {
    id: string;
    name: string;
    role?: PlayerRole;
    roleAssignedAt?: Date;
    roleAssignedBy?: string;
}

// Time slot helpers
export interface TimeSlot {
    start: Date;
    end: Date;
    label: string;
}

export const generateTimeSlots = (date: Date, intervalMinutes: number = 60): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    for (let hour = 0; hour < 24; hour += intervalMinutes / 60) {
        const start = new Date(startOfDay);
        start.setHours(hour);

        const end = new Date(start);
        end.setMinutes(start.getMinutes() + intervalMinutes);

        const label = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;

        slots.push({ start, end, label });
    }

    return slots;
};
