
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, Clock, Plus, Edit2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useScrimsData } from '@/hooks/useScrimsData';
import type { Scrim, CreateScrimData, UpdateScrimData } from '@/types/scrim';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { getUserTimezone, getTimezoneAbbr, COMMON_TIMEZONES } from '@/utils/timezoneHelpers';
import { TimezoneBadge } from '@/components/ui/timezone-badge';

const scrimSchema = z.object({
  opponent_name: z.string().min(1, 'Opponent name is required'),
  match_date: z.string().min(1, 'Match date is required'),
  scheduled_time: z.string().optional(),
  format: z.enum(['BO1', 'BO2', 'BO3', 'BO4', 'BO5', '1G', '2G', '3G', '4G', '5G']).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  data_source: z.enum(['manual', 'grid', 'desktop_app']).optional(),
  grid_match_id: z.string().optional(),
  notes: z.string().optional(),
  timezone: z.string().optional(),
});

type ScrimFormData = z.infer<typeof scrimSchema>;

interface ScrimFormProps {
  scrim?: Scrim;
  trigger?: React.ReactNode;
}

export const ScrimForm = ({ scrim, trigger }: ScrimFormProps) => {
  const [open, setOpen] = useState(false);
  const { createScrim, updateScrim, isCreating, isUpdating } = useScrimsData();
  
  // Get user's current timezone
  const userTimezone = getUserTimezone();

  // Helper function to extract date from scrim timestamp
  const extractDate = (dateString: string): string => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      // Extract just the date part in YYYY-MM-DD format
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error extracting date:', error);
      return '';
    }
  };

  // Helper function to extract time from scrim timestamp
  const extractTime = (dateString: string, timezone?: string): string => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      if (timezone) {
        return formatInTimeZone(date, timezone, 'HH:mm');
      }
      
      // Fallback to local time format
      return date.toTimeString().slice(0, 5);
    } catch (error) {
      console.error('Error extracting time:', error);
      return '';
    }
  };

  const form = useForm<ScrimFormData>({
    resolver: zodResolver(scrimSchema),
    defaultValues: {
      opponent_name: scrim?.opponent_name || '',
      match_date: scrim?.match_date ? extractDate(scrim.match_date) : '',
      scheduled_time: scrim?.scheduled_time ? extractTime(scrim.scheduled_time, scrim.timezone) : '',
      format: (scrim?.format as any) || 'BO3',
      status: (scrim?.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled') || 'scheduled',
      data_source: (scrim?.data_source as 'manual' | 'grid' | 'desktop_app') || 'manual',
      grid_match_id: scrim?.grid_match_id || '',
      notes: scrim?.notes || '',
      timezone: scrim?.timezone || userTimezone,
    },
  });

  const onSubmit = (data: ScrimFormData) => {
    try {
      const timezone = data.timezone || userTimezone;
      
      // Combine date and time into a proper timestamp in the selected timezone
      let scheduledTimestamp: string | undefined = undefined;
      
      if (data.match_date && data.scheduled_time) {
        // Create a date object representing the time in the selected timezone
        const dateTimeString = `${data.match_date} ${data.scheduled_time}`;
        
        // Use fromZonedTime to convert the local time in the selected timezone to UTC
        const zonedDate = fromZonedTime(dateTimeString, timezone);
        
        if (!isNaN(zonedDate.getTime())) {
          scheduledTimestamp = zonedDate.toISOString();
        }
      }
      
      // Create the final data object
      const formattedData = {
        opponent_name: data.opponent_name,
        match_date: data.match_date,
        scheduled_time: scheduledTimestamp,
        format: data.format,
        status: data.status,
        data_source: data.data_source,
        grid_match_id: data.grid_match_id || undefined,
        notes: data.notes || undefined,
        timezone: timezone,
      };

      console.log('Submitting scrim data:', formattedData);

      if (scrim) {
        updateScrim({ id: scrim.id, ...formattedData } as UpdateScrimData & { id: string });
      } else {
        createScrim(formattedData as CreateScrimData);
      }
      
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error submitting scrim form:', error);
    }
  };

  const defaultTrigger = (
    <Button className="bg-electric-500 hover:bg-electric-600">
      {scrim ? (
        <>
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Scrim
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Scrim
        </>
      )}
    </Button>
  );

  const formatOptions = [
    { value: 'BO1', label: 'Best of 1' },
    { value: 'BO2', label: 'Best of 2' },
    { value: 'BO3', label: 'Best of 3' },
    { value: 'BO4', label: 'Best of 4' },
    { value: 'BO5', label: 'Best of 5' },
    { value: '1G', label: '1 Game' },
    { value: '2G', label: '2 Games' },
    { value: '3G', label: '3 Games' },
    { value: '4G', label: '4 Games' },
    { value: '5G', label: '5 Games' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5" />
            <span>{scrim ? 'Edit Scrim' : 'Schedule New Scrim'}</span>
          </DialogTitle>
          <DialogDescription>
            {scrim ? 'Update scrim details and settings.' : 'Create a new scrim match for your team.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opponent_name">Opponent Team</Label>
            <Input
              id="opponent_name"
              placeholder="Enter opponent team name"
              {...form.register('opponent_name')}
            />
            {form.formState.errors.opponent_name && (
              <p className="text-sm text-red-500">{form.formState.errors.opponent_name.message}</p>
            )}
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
                  <SelectItem key="user-timezone" value={userTimezone}>
                    Your Local Time ({getTimezoneAbbr(userTimezone)})
                  </SelectItem>
                </SelectContent>
              </Select>
              <TimezoneBadge timezone={form.watch('timezone') || userTimezone} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="match_date">Match Date</Label>
              <Input
                id="match_date"
                type="date"
                {...form.register('match_date')}
              />
              {form.formState.errors.match_date && (
                <p className="text-sm text-red-500">{form.formState.errors.match_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Time</Label>
              <Input
                id="scheduled_time"
                type="time"
                {...form.register('scheduled_time')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select
                value={form.watch('format')}
                onValueChange={(value) => form.setValue('format', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as 'scheduled' | 'in_progress' | 'completed' | 'cancelled')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_source">Data Source</Label>
            <Select
              value={form.watch('data_source')}
              onValueChange={(value) => form.setValue('data_source', value as 'manual' | 'grid' | 'desktop_app')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select data source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Entry</SelectItem>
                <SelectItem value="grid">GRID API (Tournament Realm)</SelectItem>
                <SelectItem value="desktop_app">Desktop App (Live Server)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.watch('data_source') === 'grid' && (
            <div className="space-y-2">
              <Label htmlFor="grid_match_id">GRID Match ID (Optional)</Label>
              <Input
                id="grid_match_id"
                placeholder="Will be auto-detected when match starts"
                {...form.register('grid_match_id')}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-detect when the scheduled time is reached
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this scrim..."
              rows={3}
              {...form.register('notes')}
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
              {isCreating || isUpdating ? 'Saving...' : scrim ? 'Update Scrim' : 'Schedule Scrim'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
