
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'error' | 'success';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  icon?: ReactNode;
}

export function StatusIndicator({
  status,
  label,
  size = 'md',
  showPulse = false,
  icon
}: StatusIndicatorProps) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    success: 'bg-green-500'
  };

  const textColors = {
    online: 'text-green-600',
    offline: 'text-gray-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    success: 'text-green-600'
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div
          className={cn(
            'rounded-full',
            statusColors[status],
            sizeClasses[size],
            showPulse && 'animate-pulse'
          )}
        />
        {showPulse && (
          <div
            className={cn(
              'absolute inset-0 rounded-full animate-ping',
              statusColors[status],
              'opacity-75'
            )}
          />
        )}
      </div>
      {icon && <div className={textColors[status]}>{icon}</div>}
      {label && (
        <span className={cn(textColors[status], textSizes[size], 'font-medium')}>
          {label}
        </span>
      )}
    </div>
  );
}
