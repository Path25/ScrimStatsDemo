
import { Loader2 } from 'lucide-react';
import { DashboardSkeleton } from './dashboard-skeleton';
import { StatusIndicator } from './status-indicator';

interface PageLoadingProps {
  title?: string;
  description?: string;
  showKPIs?: boolean;
  showCharts?: boolean;
  showTables?: boolean;
}

export function PageLoading({ 
  title = "Loading Dashboard...", 
  description = "Please wait while we fetch your data",
  showKPIs = true,
  showCharts = true,
  showTables = true
}: PageLoadingProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-electric-500" />
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>
        {description && (
          <div className="flex items-center space-x-2">
            <StatusIndicator 
              status="online" 
              label={description}
              showPulse={true}
              size="sm"
            />
          </div>
        )}
      </div>
      
      <DashboardSkeleton 
        showKPIs={showKPIs}
        showCharts={showCharts}
        showTables={showTables}
      />
    </div>
  );
}
