
import { Badge } from '@/components/ui/badge';
import { getTimezoneAbbr } from '@/utils/timezoneHelpers';

interface TimezoneBadgeProps {
  timezone: string;
  date?: string | Date;
  className?: string;
}

export const TimezoneBadge = ({ timezone, date, className }: TimezoneBadgeProps) => {
  return (
    <Badge variant="outline" className={`text-xs ${className}`}>
      {getTimezoneAbbr(timezone, date)}
    </Badge>
  );
};
