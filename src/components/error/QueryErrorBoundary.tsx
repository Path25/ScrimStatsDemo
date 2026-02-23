
import React from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
}

export function QueryErrorBoundary({ children }: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onError={() => reset()}
          fallback={
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <p className="text-destructive font-medium mb-2">Failed to load data</p>
                <button 
                  onClick={reset}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Try again
                </button>
              </div>
            </div>
          }
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
