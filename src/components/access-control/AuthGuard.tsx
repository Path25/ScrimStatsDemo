
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="space-y-2">
              <LoadingSkeleton className="h-6 w-3/4" />
              <LoadingSkeleton className="h-4 w-1/2" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoadingSkeleton className="h-32" />
            <div className="grid grid-cols-2 gap-4">
              <LoadingSkeleton className="h-8" />
              <LoadingSkeleton className="h-8" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
