
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSubscriptionActions } from '@/hooks/useSubscriptionActions';
import { useTenantBranding } from '@/hooks/useTenantBranding';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CreditCard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TenantGuardProps {
  children: ReactNode;
}

export function TenantGuard({ children }: TenantGuardProps) {
  const { user } = useAuth();
  const { tenant, isLoading, error, hasNoTenant } = useTenant();
  const { createCheckout, isLoading: isSubscriptionLoading } = useSubscriptionActions();
  const location = useLocation();
  useTenantBranding();

  // Only use subscription context if we have a tenant
  const subscription = tenant ? useSubscription() : null;
  const { tier, isTrialExpired, isInGracePeriod, daysUntilDeletion } = subscription || {
    tier: 'free' as const,
    isTrialExpired: false,
    isInGracePeriod: false,
    daysUntilDeletion: 0
  };

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

  // If user is authenticated but has no tenant, check for pending invitations
  if (user && hasNoTenant) {
    // Check if this is an invitation URL that we should allow
    if (location.pathname.startsWith('/invite/')) {
      return <>{children}</>;
    }
    
    // Otherwise redirect to waiting page
    return <Navigate to="/waiting" replace />;
  }

  if (error || !tenant) {
    // Redirect to waiting page instead of showing error
    return <Navigate to="/waiting" replace />;
  }

  // If trial expired but in grace period, only allow access to settings page
  if (tier === 'free' && isTrialExpired && isInGracePeriod && location.pathname !== '/settings') {
    return <Navigate to="/settings" replace />;
  }

  // If trial expired and grace period over, show upgrade required screen (except for settings page)
  if (tier === 'free' && isTrialExpired && !isInGracePeriod && location.pathname !== '/settings') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-red-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-500" />
              <CardTitle>Upgrade Required</CardTitle>
            </div>
            <CardDescription>
              Your free trial has expired and your data will be deleted soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You have {daysUntilDeletion} days remaining to upgrade to Pro or Elite before your dashboard and data are permanently deleted.
            </p>
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-electric-500 hover:bg-electric-600"
                onClick={() => createCheckout('pro')}
                disabled={isSubscriptionLoading}
              >
                Upgrade to Pro
              </Button>
              <Button 
                className="flex-1 bg-performance-excellent hover:bg-performance-excellent/80"
                onClick={() => createCheckout('elite')}
                disabled={isSubscriptionLoading}
              >
                Upgrade to Elite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tenant.isActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-yellow-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <CardTitle>Subscription Required</CardTitle>
            </div>
            <CardDescription>
              Your team's subscription has expired or is inactive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please contact your team administrator to renew the subscription and continue accessing your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
