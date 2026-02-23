
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

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
}

export interface UpdateEventData extends Partial<CreateEventData> { }

// High quality mock data for demo fallback
const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'mock-event-1',
    tenant_id: 'demo',
    title: 'VOD Review: Early Game Macro',
    event_type: 'team_meeting',
    start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(),
    description: 'Reviewing recent scrim games focused on jungle rotations and lane swaps.',
    created_by: 'demo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-event-2',
    tenant_id: 'demo',
    title: 'Scrim Block vs KC Blue',
    event_type: 'scrim',
    start_time: new Date(Date.now() + 86400000 * 2).toISOString(), // In 2 days
    end_time: new Date(Date.now() + 86400000 * 2 + 10800000).toISOString(),
    description: 'Format: BO3. Focused on testing new bot lane priority.',
    created_by: 'demo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-pract-1',
    tenant_id: 'demo',
    title: 'Positional Training: Bot Lane',
    event_type: 'team_practice',
    start_time: new Date(Date.now() + 86400000 * 3).toISOString(), // In 3 days
    end_time: new Date(Date.now() + 86400000 * 3 + 7200000).toISOString(),
    description: 'ADC/Support synergy drills and level 1 lane setups.',
    created_by: 'demo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useCalendarEvents = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['calendar_events', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return MOCK_EVENTS;

      const [eventsResponse, scrimsResponse] = await Promise.all([
        supabase
          .from('calendar_events')
          .select('*')
          .eq('tenant_id', tenant.id),
        supabase
          .from('scrims')
          .select('*')
          .eq('tenant_id', tenant.id)
      ]);

      if (eventsResponse.error) throw eventsResponse.error;
      if (scrimsResponse.error) throw scrimsResponse.error;

      const dbEvents = eventsResponse.data as CalendarEvent[];

      const scrimEvents: CalendarEvent[] = (scrimsResponse.data || []).map((scrim: any) => {
        // Construct start time
        const time = scrim.scheduled_time || '00:00:00';
        const startIso = `${scrim.match_date}T${time}`;

        // Estimate end time based on format (BO1=1h, BO3=3h, Block=3h)
        let durationHours = 1;
        if (scrim.format === 'BO3') durationHours = 3;
        if (scrim.format === 'BO5') durationHours = 5;
        if (scrim.format?.includes('BLOCK')) durationHours = 3;

        const startDate = new Date(startIso);
        const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

        return {
          id: scrim.id,
          tenant_id: scrim.tenant_id,
          title: `Scrim vs ${scrim.opponent_name}`,
          event_type: 'scrim',
          start_time: startIso,
          end_time: endDate.toISOString(),
          description: `Format: ${scrim.format || 'Unknown'}\nStatus: ${scrim.status}`,
          scrim_id: scrim.id,
          created_by: scrim.created_by,
          created_at: scrim.created_at,
          updated_at: scrim.updated_at
        };
      });

      const merged = [...dbEvents, ...scrimEvents];

      // Fallback for demo if DB is empty
      if (merged.length === 0) {
        return MOCK_EVENTS;
      }

      // Sort
      return merged.sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    },
    enabled: true,
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateEventData) => {
      if (!user || !tenant?.id) {
        throw new Error('User not authenticated or no tenant selected');
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([
          {
            ...eventData,
            tenant_id: tenant.id,
            created_by: user.id,
          },
        ])
        .select()
        .single();

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
      toast.error('Failed to create event. Please try again.');
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateEventData & { id: string }) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

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
      toast.error('Failed to update event. Please try again.');
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

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
      toast.error('Failed to delete event. Please try again.');
    },
  });

  return {
    events,
    isLoading,
    error,
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
  };
};
