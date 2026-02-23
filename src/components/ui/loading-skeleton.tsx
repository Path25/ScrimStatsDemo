
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'default' | 'text' | 'circle' | 'card';
}

export function LoadingSkeleton({ className, variant = 'default' }: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]";
  
  const variants = {
    default: "h-4 w-full rounded",
    text: "h-4 w-3/4 rounded",
    circle: "h-12 w-12 rounded-full",
    card: "h-32 w-full rounded-lg"
  };

  return (
    <div 
      className={cn(baseClasses, variants[variant], className)}
      style={{
        animation: 'pulse 1.5s ease-in-out infinite, shimmer 2s ease-in-out infinite'
      }}
    />
  );
}
