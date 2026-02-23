
import { ReactNode } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = 'md'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className={cn("text-center", sizeClasses[size])}>
        <div className="flex flex-col items-center space-y-4">
          {icon && (
            <div className={cn("text-muted-foreground", iconSizes[size])}>
              {icon}
            </div>
          )}
          <div className="space-y-2">
            <h3 className={cn("font-semibold text-foreground", titleSizes[size])}>
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {description}
              </p>
            )}
          </div>
          {action && (
            <Button onClick={action.onClick} className="mt-4">
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
