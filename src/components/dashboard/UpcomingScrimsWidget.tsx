
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { useTeamSchedule } from '@/hooks/useTeamSchedule';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { formatInTimeZone } from 'date-fns-tz';
import { getTimezoneAbbr } from '@/utils/timezoneHelpers';

export function UpcomingScrimsWidget() {
  const { data: scheduleData, isLoading, error } = useTeamSchedule();

  // Helper function to format time with timezone
  const formatTimeWithTimezone = (dateString?: string, timezone?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      if (timezone) {
        // Format time in the scrim's timezone and show the timezone abbreviation
        const timeStr = formatInTimeZone(date, timezone, 'HH:mm');
        const tzAbbr = getTimezoneAbbr(timezone, date);
        return `${timeStr} ${tzAbbr}`;
      }
      
      // Fallback to local time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time with timezone:', error);
      return '';
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Upcoming Scrims</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  if (error || !scheduleData) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Upcoming Scrims</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load schedule</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'starting_soon':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'ongoing':
        return 'bg-green-500/20 text-green-500';
      default:
        return 'bg-blue-500/20 text-blue-500';
    }
  };

  const getStatusText = (status: string, minutesToStart: number, hoursSinceStart: number | null) => {
    switch (status) {
      case 'starting_soon':
        return `Starts in ${minutesToStart}m`;
      case 'ongoing':
        return hoursSinceStart ? `${hoursSinceStart}h ago` : 'Live now';
      default:
        return 'Scheduled';
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Upcoming Scrims</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scheduleData.scrims.length > 0 ? (
          <div className="space-y-3">
            {scheduleData.scrims.map((scrim) => (
              <div key={scrim.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col">
                    <p className="font-medium text-sm">vs {scrim.opponent_name}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeWithTimezone(scrim.scheduled_time, (scrim as any).timezone)}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <Badge variant="outline" className="text-xs">
                        {scrim.format || 'BO3'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(scrim.status)}>
                    {getStatusText(scrim.status, scrim.minutes_to_start, scrim.hours_since_start)}
                  </Badge>
                  {scrim.status === 'starting_soon' && (
                    <div className="flex items-center mt-1">
                      <AlertCircle className="w-3 h-3 text-yellow-500 mr-1" />
                      <span className="text-xs text-yellow-500">Get ready!</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming scrims</p>
            <p className="text-xs text-muted-foreground mt-1">Schedule a scrim to see it here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
