
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export type EventType = 'scrim' | 'official' | 'team_practice' | 'team_meeting' | 'other';

export interface CalendarEvent {
  id: string;
  tenant_id: string;
  title: string;
  event_type: EventType;
  start_time: string;
  end_time?: string;
  description?: string;
  location?: string;
  attendees?: string[];
  scrim_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  timezone?: string;
  source: 'calendar' | 'scrim';
}

export interface CreateEventData {
  title: string;
  event_type: EventType;
  start_time: string;
  end_time?: string;
  description?: string;
  location?: string;
  attendees?: string[];
  scrim_id?: string;
  timezone?: string;
}

export type UpdateEventData = Partial<CreateEventData>;
type ScrimRow = Database['public']['Tables']['scrims']['Row'];

function localParts(value: string, timezone?: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('The event time is invalid');

  const resolvedTimezone =
    timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: resolvedTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || '';

  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
    timezone: resolvedTimezone,
  };
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

export const useCalendarEvents = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ['calendar_events', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const [eventsResponse, scrimsResponse] = await Promise.all([
        supabase
          .from('calendar_events')
          .select('*')
          .eq('tenant_id', tenant.id),
        supabase
          .from('scrims')
          .select('*')
          .is('archived_at', null)
          .eq('tenant_id', tenant.id)
      ]);

      if (eventsResponse.error) throw eventsResponse.error;
      if (scrimsResponse.error) throw scrimsResponse.error;

      const dbEvents = (eventsResponse.data || [])
        .filter((event) => !event.scrim_id)
        .map((event) => ({
          ...event,
          end_time: event.end_time || undefined,
          description: event.description || undefined,
          location: event.location || undefined,
          attendees: Array.isArray(event.attendees)
            ? event.attendees.filter((attendee): attendee is string => typeof attendee === 'string')
            : undefined,
          scrim_id: event.scrim_id || undefined,
          timezone: event.timezone || undefined,
          source: 'calendar' as const,
        }));

      const scrimEvents: CalendarEvent[] = ((scrimsResponse.data || []) as ScrimRow[])
        .filter((scrim) => scrim.status !== 'cancelled')
        .map((scrim) => {
        return {
          id: scrim.id,
          tenant_id: scrim.tenant_id,
          title: `Scrim vs ${scrim.opponent_name}`,
          event_type: 'scrim',
          start_time: scrim.starts_at,
          end_time: scrim.ends_at || undefined,
          description: `Format: ${scrim.format || 'Unknown'}\nStatus: ${scrim.status}`,
          scrim_id: scrim.id,
          created_by: scrim.created_by,
          created_at: scrim.created_at,
          updated_at: scrim.updated_at,
          timezone: scrim.timezone || undefined,
          source: 'scrim',
        };
        });

      return [...dbEvents, ...scrimEvents].sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    },
    enabled: Boolean(tenant?.id),
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateEventData) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      const start = localParts(eventData.start_time, eventData.timezone);
      const durationMinutes = eventData.end_time
        ? Math.max(
            15,
            Math.round(
              (new Date(eventData.end_time).getTime() -
                new Date(eventData.start_time).getTime()) /
                60_000,
            ),
          )
        : 60;
      const { data, error } = await supabase.rpc('upsert_workspace_calendar_event', {
        p_tenant_id: tenant.id,
        p_event_id: undefined,
        p_title: eventData.title,
        p_event_type: eventData.event_type,
        p_local_date: start.date,
        p_local_time: start.time,
        p_timezone: start.timezone,
        p_duration_minutes: durationMinutes,
        p_description: eventData.description,
        p_location: eventData.location,
      });

      if (error) {
        console.error('Error creating calendar event:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      toast.success('Event created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create event:', error);
      toast.error(errorMessage(error, 'Failed to create event. Please try again.'));
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateEventData & { id: string }) => {
      if (!tenant?.id) throw new Error('No tenant selected');
      if (!updateData.title || !updateData.event_type || !updateData.start_time) {
        throw new Error('A complete event is required when rescheduling');
      }
      const start = localParts(updateData.start_time, updateData.timezone);
      const durationMinutes = updateData.end_time
        ? Math.max(
            15,
            Math.round(
              (new Date(updateData.end_time).getTime() -
                new Date(updateData.start_time).getTime()) /
                60_000,
            ),
          )
        : 60;
      const { data, error } = await supabase.rpc('upsert_workspace_calendar_event', {
        p_tenant_id: tenant.id,
        p_event_id: id,
        p_title: updateData.title,
        p_event_type: updateData.event_type,
        p_local_date: start.date,
        p_local_time: start.time,
        p_timezone: start.timezone,
        p_duration_minutes: durationMinutes,
        p_description: updateData.description,
        p_location: updateData.location,
      });

      if (error) {
        console.error('Error updating calendar event:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      toast.success('Event updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update event:', error);
      toast.error(errorMessage(error, 'Failed to update event. Please try again.'));
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenant?.id) throw new Error('No tenant selected');
      const { error } = await supabase.rpc('delete_workspace_calendar_event', {
        p_event_id: id,
        p_tenant_id: tenant.id,
      });

      if (error) {
        console.error('Error deleting calendar event:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      toast.success('Event deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete event:', error);
      toast.error(errorMessage(error, 'Failed to delete event. Please try again.'));
    },
  });

  return {
    events,
    isLoading,
    error: error ? errorMessage(error, 'Saved events could not be loaded.') : null,
    refetch,
    createEvent: createEventMutation.mutate,
    createEventAsync: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutate,
    updateEventAsync: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutate,
    deleteEventAsync: deleteEventMutation.mutateAsync,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
  };
};
