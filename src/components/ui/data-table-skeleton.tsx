
import { LoadingSkeleton } from './loading-skeleton';
import { Card, CardContent, CardHeader } from './card';

interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showPagination?: boolean;
}

export function DataTableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  showPagination = true 
}: DataTableSkeletonProps) {
  return (
    <Card className="w-full">
      {showHeader && (
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <LoadingSkeleton className="h-6 w-48" />
            <LoadingSkeleton className="h-9 w-24" />
          </div>
          <div className="flex items-center space-x-2">
            <LoadingSkeleton className="h-8 w-64" />
            <LoadingSkeleton className="h-8 w-32" />
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Table header */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <LoadingSkeleton key={`header-${i}`} className="h-4 w-full" />
          ))}
        </div>
        
        {/* Table rows */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div 
              key={`row-${rowIndex}`} 
              className="grid gap-4" 
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <LoadingSkeleton 
                  key={`cell-${rowIndex}-${colIndex}`} 
                  className="h-4 w-full" 
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        {showPagination && (
          <div className="flex items-center justify-between pt-4">
            <LoadingSkeleton className="h-4 w-32" />
            <div className="flex items-center space-x-2">
              <LoadingSkeleton className="h-8 w-8" />
              <LoadingSkeleton className="h-8 w-8" />
              <LoadingSkeleton className="h-8 w-8" />
              <LoadingSkeleton className="h-8 w-8" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
