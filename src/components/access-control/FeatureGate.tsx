
import { ReactNode } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSubscriptionActions } from '@/hooks/useSubscriptionActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';

interface FeatureGateProps {
  feature: 'advancedAnalytics' | 'customReports' | 'apiAccess' | 'prioritySupport';
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature, tier } = useSubscription();
  const { createCheckout, isLoading } = useSubscriptionActions();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const getUpgradeMessage = () => {
    switch (feature) {
      case 'advancedAnalytics':
        return 'Get detailed performance insights and predictive analytics';
      case 'customReports':
        return 'Create custom reports and export data in multiple formats';
      case 'apiAccess':
        return 'Integrate with third-party tools and build custom solutions';
      case 'prioritySupport':
        return 'Get priority customer support and dedicated account management';
      default:
        return 'Unlock premium features';
    }
  };

  const getRequiredTier = () => {
    if (feature === 'apiAccess') return 'Elite';
    return tier === 'free' ? 'Pro' : 'Elite';
  };

  const handleUpgradeClick = () => {
    const requiredTier = getRequiredTier();
    if (requiredTier === 'Elite') {
      createCheckout('elite');
    } else {
      createCheckout('pro');
    }
  };

  return (
    <Card className="glass-card border-2 border-dashed border-muted-foreground/30">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          {getRequiredTier()} Feature
        </CardTitle>
        <CardDescription>
          {getUpgradeMessage()}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleUpgradeClick}
          disabled={isLoading}
        >
          Upgrade to {getRequiredTier()}
        </Button>
      </CardContent>
    </Card>
  );
}
