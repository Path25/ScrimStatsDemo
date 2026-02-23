
import { ReactNode, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';

interface KPIWidgetProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  format?: 'number' | 'percentage' | 'time' | 'currency';
  isLoading?: boolean;
  error?: string;
}

export function KPIWidget({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend,
  className,
  format = 'number',
  isLoading = false,
  error
}: KPIWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-performance-excellent" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-performance-terrible" />;
      case 'neutral':
        return <Minus className="w-4 h-4 text-performance-average" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-performance-excellent';
      case 'down':
        return 'text-performance-terrible';
      case 'neutral':
        return 'text-performance-average';
      default:
        return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <LoadingSkeleton className="h-8 w-20 mb-2" />
          <LoadingSkeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("glass-card border-destructive/50", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon && (
            <div className="text-destructive/50">
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">
            Error loading data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "glass-card transition-all duration-300 cursor-pointer group",
        "hover:shadow-lg hover:shadow-electric-500/10 hover:border-electric-500/30",
        "hover:-translate-y-1 hover:scale-[1.02]",
        isHovered && "ring-1 ring-electric-500/20",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn(
            "text-electric-500 transition-all duration-300",
            isHovered && "scale-110 rotate-3"
          )}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {typeof value === 'number' ? (
                <AnimatedCounter value={value} format={format} />
              ) : (
                value
              )}
            </div>
            {change !== undefined && (
              <div className={cn(
                "flex items-center text-xs mt-1 transition-all duration-300",
                getTrendColor(),
                isHovered && "scale-105"
              )}>
                <div className="transition-transform duration-300 group-hover:scale-110">
                  {getTrendIcon()}
                </div>
                <span className="ml-1">
                  {change > 0 ? '+' : ''}{change}
                  {format === 'percentage' ? 'pp' : ''}
                  {changeLabel && ` ${changeLabel}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
