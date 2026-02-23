
import { useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';

interface ErrorLog {
  message: string;
  stack?: string;
  url: string;
  timestamp: Date;
  userAgent: string;
  tenantId?: string;
  userId?: string;
  context?: Record<string, any>;
}

export function useErrorLogging() {
  const { tenant } = useTenant();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorLog: ErrorLog = {
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        tenantId: tenant?.id,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      };

      logError(errorLog);
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      const errorLog: ErrorLog = {
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        tenantId: tenant?.id,
        context: {
          type: 'unhandledrejection',
          reason: event.reason
        }
      };

      logError(errorLog);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, [tenant?.id]);

  const logError = (errorLog: ErrorLog) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog);
    }

    // In production, you might want to send to an external service
    // Example: sendToErrorService(errorLog);
    
    // Store in localStorage as backup
    try {
      const existingLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      const logs = [...existingLogs, errorLog].slice(-50); // Keep last 50 errors
      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed to store error log:', e);
    }
  };

  const logCustomError = (error: Error, context?: Record<string, any>) => {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      tenantId: tenant?.id,
      context
    };

    logError(errorLog);
  };

  const getStoredErrors = (): ErrorLog[] => {
    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch {
      return [];
    }
  };

  const clearStoredErrors = () => {
    localStorage.removeItem('error_logs');
  };

  return {
    logCustomError,
    getStoredErrors,
    clearStoredErrors
  };
}
