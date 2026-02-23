
import { LoadingSkeleton } from './loading-skeleton';
import { Card, CardContent, CardHeader } from './card';

interface DashboardSkeletonProps {
  showKPIs?: boolean;
  showCharts?: boolean;
  showTables?: boolean;
}

export function DashboardSkeleton({ 
  showKPIs = true, 
  showCharts = true, 
  showTables = true 
}: DashboardSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-64" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>

      {/* KPI Cards */}
      {showKPIs && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={`kpi-${i}`} className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <LoadingSkeleton className="h-4 w-20" />
                <LoadingSkeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <LoadingSkeleton className="h-7 w-16 mb-2" />
                <LoadingSkeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Charts Column */}
        {showCharts && (
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <LoadingSkeleton className="h-5 w-32" />
                <LoadingSkeleton className="h-3 w-48" />
              </CardHeader>
              <CardContent>
                <LoadingSkeleton className="h-80 w-full" />
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <LoadingSkeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent>
                <LoadingSkeleton className="h-60 w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sidebar */}
        <div className="space-y-6">
          {showTables && (
            <>
              <Card className="glass-card">
                <CardHeader>
                  <LoadingSkeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`sidebar-item-${i}`} className="flex items-center space-x-3">
                      <LoadingSkeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <LoadingSkeleton className="h-3 w-full" />
                        <LoadingSkeleton className="h-2 w-3/4" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <LoadingSkeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`list-item-${i}`} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <LoadingSkeleton className="h-3 w-24" />
                        <LoadingSkeleton className="h-2 w-16" />
                      </div>
                      <LoadingSkeleton className="h-6 w-12" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
