
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PerformanceMetrics {
  pageLoadTime: number;
  renderTime: number;
  apiResponseTimes: Record<string, number>;
  errorCount: number;
  memoryUsage?: number;
}

export function usePerformanceMonitoring() {
  const metricsRef = useRef<PerformanceMetrics>({
    pageLoadTime: 0,
    renderTime: 0,
    apiResponseTimes: {},
    errorCount: 0
  });

  // Track page load performance
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      metricsRef.current.pageLoadTime = loadTime;
    }
  }, []);

  // Track render performance
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      metricsRef.current.renderTime = endTime - startTime;
    };
  });

  // Monitor memory usage (if available)
  const { data: memoryInfo } = useQuery({
    queryKey: ['memory-usage'],
    queryFn: () => {
      if ('memory' in performance) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        };
      }
      return null;
    },
    refetchInterval: 10000, // Check every 10 seconds
    enabled: typeof window !== 'undefined' && 'memory' in performance
  });

  const logError = (error: Error, context?: string) => {
    metricsRef.current.errorCount++;
    console.error(`Performance Monitor - Error ${context ? `in ${context}` : ''}:`, error);
    
    // In production, you might want to send this to an analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: analytics.track('error', { error: error.message, context });
    }
  };

  const trackApiCall = (endpoint: string, duration: number) => {
    metricsRef.current.apiResponseTimes[endpoint] = duration;
  };

  const getMetrics = () => ({
    ...metricsRef.current,
    memoryUsage: memoryInfo?.usedJSHeapSize
  });

  return {
    metrics: getMetrics(),
    logError,
    trackApiCall,
    memoryInfo
  };
}
