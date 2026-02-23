
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Button } from '@/components/ui/button';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useErrorLogging } from '@/hooks/useErrorLogging';
import { Activity, AlertTriangle, Clock, Database, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SystemMonitor() {
  const [showDetails, setShowDetails] = useState(false);
  const { metrics, memoryInfo } = usePerformanceMonitoring();
  const { getStoredErrors, clearStoredErrors } = useErrorLogging();

  const storedErrors = getStoredErrors();
  const recentErrors = storedErrors.slice(-5);

  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatMs = (ms: number) => {
    return `${ms.toFixed(1)}ms`;
  };

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'success';
    if (value <= thresholds.warning) return 'warning';
    return 'error';
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Monitor
            </CardTitle>
            <CardDescription>
              Real-time performance and error tracking
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">System Status</div>
            <StatusIndicator 
              status="online" 
              label="Operational"
              showPulse={true}
            />
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Error Count</div>
            <StatusIndicator 
              status={metrics.errorCount === 0 ? 'success' : metrics.errorCount < 5 ? 'warning' : 'error'}
              label={`${metrics.errorCount} errors`}
              icon={<AlertTriangle className="w-4 h-4" />}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Page Load</div>
            <StatusIndicator 
              status={getPerformanceStatus(metrics.pageLoadTime, { good: 2000, warning: 5000 })}
              label={formatMs(metrics.pageLoadTime)}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>

          {memoryInfo && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Memory Usage</div>
              <StatusIndicator 
                status={getPerformanceStatus(
                  memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit, 
                  { good: 0.7, warning: 0.9 }
                )}
                label={formatBytes(memoryInfo.usedJSHeapSize)}
                icon={<Database className="w-4 h-4" />}
              />
            </div>
          )}
        </div>

        {showDetails && (
          <>
            {/* Performance Metrics */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Performance Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Page Load Time:</span>
                  <Badge variant={
                    metrics.pageLoadTime <= 2000 ? 'default' : 
                    metrics.pageLoadTime <= 5000 ? 'secondary' : 'destructive'
                  }>
                    {formatMs(metrics.pageLoadTime)}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Render Time:</span>
                  <Badge variant="outline">
                    {formatMs(metrics.renderTime)}
                  </Badge>
                </div>

                {memoryInfo && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Used Memory:</span>
                      <Badge variant="outline">
                        {formatBytes(memoryInfo.usedJSHeapSize)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Memory Limit:</span>
                      <Badge variant="outline">
                        {formatBytes(memoryInfo.jsHeapSizeLimit)}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* API Response Times */}
            {Object.keys(metrics.apiResponseTimes).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">API Response Times</h4>
                <div className="space-y-2">
                  {Object.entries(metrics.apiResponseTimes).map(([endpoint, duration]) => (
                    <div key={endpoint} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate">{endpoint}</span>
                      <Badge variant={duration <= 500 ? 'default' : duration <= 1000 ? 'secondary' : 'destructive'}>
                        {formatMs(duration)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Errors */}
            {recentErrors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Recent Errors</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearStoredErrors}
                    className="text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recentErrors.map((error, index) => (
                    <div key={index} className="p-2 rounded border border-destructive/20 bg-destructive/5">
                      <div className="text-xs font-mono text-destructive truncate">
                        {error.message}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
