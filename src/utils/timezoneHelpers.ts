
import { formatInTimeZone } from 'date-fns-tz';

// Get user's current timezone
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Timezone abbreviation mappings for common zones
const TIMEZONE_ABBR_MAP: Record<string, { standard: string; daylight: string }> = {
  'Europe/London': { standard: 'GMT', daylight: 'BST' },
  'Europe/Berlin': { standard: 'CET', daylight: 'CEST' },
  'Europe/Paris': { standard: 'CET', daylight: 'CEST' },
  'Europe/Amsterdam': { standard: 'CET', daylight: 'CEST' },
  'Europe/Rome': { standard: 'CET', daylight: 'CEST' },
  'Europe/Madrid': { standard: 'CET', daylight: 'CEST' },
  'America/New_York': { standard: 'EST', daylight: 'EDT' },
  'America/Los_Angeles': { standard: 'PST', daylight: 'PDT' },
  'America/Chicago': { standard: 'CST', daylight: 'CDT' },
  'America/Denver': { standard: 'MST', daylight: 'MDT' },
  'Asia/Tokyo': { standard: 'JST', daylight: 'JST' },
  'Asia/Seoul': { standard: 'KST', daylight: 'KST' },
  'Australia/Sydney': { standard: 'AEST', daylight: 'AEDT' },
};

// Check if a date is in daylight saving time for a timezone
const isDaylightSavingTime = (date: Date, timezone: string): boolean => {
  try {
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    
    const janOffset = new Date(jan.toLocaleString('en', { timeZone: timezone })).getTime() - jan.getTime();
    const julOffset = new Date(jul.toLocaleString('en', { timeZone: timezone })).getTime() - jul.getTime();
    const currentOffset = new Date(date.toLocaleString('en', { timeZone: timezone })).getTime() - date.getTime();
    
    return Math.min(janOffset, julOffset) === currentOffset;
  } catch {
    return false;
  }
};

// Get timezone abbreviation for display with optional date for DST calculation
export const getTimezoneAbbr = (timezone: string, date?: Date | string): string => {
  try {
    const targetDate = date ? new Date(date) : new Date();
    
    // Use our mapping first for better accuracy
    if (TIMEZONE_ABBR_MAP[timezone]) {
      const isDST = isDaylightSavingTime(targetDate, timezone);
      const abbr = TIMEZONE_ABBR_MAP[timezone];
      return isDST ? abbr.daylight : abbr.standard;
    }
    
    // Fallback to browser API
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(targetDate);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    
    if (timeZonePart && timeZonePart.value && !timeZonePart.value.includes('GMT')) {
      return timeZonePart.value;
    }
    
    // Final fallback: extract city name
    return timezone.split('/').pop() || timezone;
  } catch (error) {
    console.error('Error getting timezone abbreviation:', error);
    return timezone.split('/').pop() || timezone;
  }
};

// Format date for user's timezone
export const formatDateForTimezone = (dateString: string, timezone?: string): string => {
  const tz = timezone || getUserTimezone();
  return formatInTimeZone(new Date(dateString), tz, 'MMM dd, yyyy');
};

// Format time for user's timezone
export const formatTimeForTimezone = (dateString: string, timezone?: string): string => {
  const tz = timezone || getUserTimezone();
  return formatInTimeZone(new Date(dateString), tz, 'HH:mm');
};

// Format datetime for user's timezone
export const formatDateTimeForTimezone = (dateString: string, timezone?: string): string => {
  const tz = timezone || getUserTimezone();
  return formatInTimeZone(new Date(dateString), tz, 'MMM dd, yyyy HH:mm');
};

// Common timezone options for select dropdowns
export const COMMON_TIMEZONES = [
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];
