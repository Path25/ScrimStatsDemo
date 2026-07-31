
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { reportClientError } from '@/lib/error-reporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  reference?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const reference = reportClientError(error);
    this.setState({ reference });
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, reference: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="glass-card border-destructive/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Something went wrong</CardTitle>
            <CardDescription>
              This part of the dashboard could not be displayed. Retry once, or include support reference {this.state.reference || "pending"} when contacting support.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={this.handleRetry} className="mr-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
