
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, Plus, Edit2, Users, MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import type { CalendarEvent, CreateEventData, UpdateEventData } from '@/types/calendar';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { getUserTimezone, getTimezoneAbbr, COMMON_TIMEZONES } from '@/utils/timezoneHelpers';
import { TimezoneBadge } from '@/components/ui/timezone-badge';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  event_type: z.enum(['scrim', 'official', 'team_practice', 'team_meeting', 'other']),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  attendees: z.string().optional(),
  timezone: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: CalendarEvent;
  trigger?: React.ReactNode;
}

export const EventForm = ({ event, trigger }: EventFormProps) => {
  const [open, setOpen] = useState(false);
  const { createEvent, updateEvent, isCreating, isUpdating } = useCalendarEvents();
  
  // Get user's current timezone
  const userTimezone = getUserTimezone();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      event_type: event?.event_type || 'other',
      // Format times for the user's timezone when editing
      start_time: event?.start_time 
        ? formatInTimeZone(new Date(event.start_time), event.timezone || userTimezone, "yyyy-MM-dd'T'HH:mm")
        : '',
      end_time: event?.end_time 
        ? formatInTimeZone(new Date(event.end_time), event.timezone || userTimezone, "yyyy-MM-dd'T'HH:mm")
        : '',
      description: event?.description || '',
      location: event?.location || '',
      attendees: event?.attendees?.join(', ') || '',
      timezone: event?.timezone || userTimezone,
    },
  });

  const onSubmit = (data: EventFormData) => {
    const timezone = data.timezone || userTimezone;
    
    console.log('Form submission data:', data);
    console.log('Selected timezone:', timezone);
    
    // Convert local times to UTC for storage
    const startTimeUtc = fromZonedTime(new Date(data.start_time), timezone).toISOString();
    const endTimeUtc = data.end_time 
      ? fromZonedTime(new Date(data.end_time), timezone).toISOString()
      : undefined;

    console.log('Start time UTC:', startTimeUtc);
    console.log('End time UTC:', endTimeUtc);

    const formattedData = {
      ...data,
      start_time: startTimeUtc,
      end_time: endTimeUtc,
      timezone: timezone,
      attendees: data.attendees ? data.attendees.split(',').map(a => a.trim()).filter(Boolean) : [],
    };

    console.log('Formatted data for submission:', formattedData);

    if (event) {
      updateEvent({ id: event.id, ...formattedData } as UpdateEventData & { id: string });
    } else {
      createEvent(formattedData as CreateEventData);
    }
    
    setOpen(false);
    form.reset();
  };

  const defaultTrigger = (
    <Button className="bg-electric-500 hover:bg-electric-600">
      {event ? (
        <>
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Event
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </>
      )}
    </Button>
  );

  const eventTypeOptions = [
    { value: 'scrim', label: 'Scrim', icon: Users },
    { value: 'official', label: 'Official Match', icon: Calendar },
    { value: 'team_practice', label: 'Team Practice', icon: Clock },
    { value: 'team_meeting', label: 'Team Meeting', icon: Users },
    { value: 'other', label: 'Other', icon: Calendar },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>{event ? 'Edit Event' : 'Create New Event'}</span>
          </DialogTitle>
          <DialogDescription>
            {event ? 'Update event details and settings.' : 'Add a new event to your team calendar.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              placeholder="Enter event title"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_type">Event Type</Label>
            <Select
              value={form.watch('event_type')}
              onValueChange={(value) => form.setValue('event_type', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Timezone Selector */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <Select
                value={form.watch('timezone') || userTimezone}
                onValueChange={(value) => form.setValue('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                  <SelectItem value={userTimezone}>Your Local Time ({getTimezoneAbbr(userTimezone)})</SelectItem>
                </SelectContent>
              </Select>
              <TimezoneBadge timezone={form.watch('timezone') || userTimezone} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Date & Time</Label>
              <Input
                id="start_time"
                type="datetime-local"
                {...form.register('start_time')}
              />
              {form.formState.errors.start_time && (
                <p className="text-sm text-red-500">{form.formState.errors.start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Date & Time (Optional)</Label>
              <Input
                id="end_time"
                type="datetime-local"
                {...form.register('end_time')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Enter location or platform"
                className="pl-10"
                {...form.register('location')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendees">Attendees (Optional)</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="attendees"
                placeholder="Enter attendees separated by commas"
                className="pl-10"
                {...form.register('attendees')}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Separate multiple attendees with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add event description or notes..."
              rows={3}
              {...form.register('description')}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || isUpdating}
              className="bg-electric-500 hover:bg-electric-600"
            >
              {isCreating || isUpdating ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
