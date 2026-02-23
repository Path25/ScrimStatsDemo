
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown } from 'lucide-react';

interface UsageWarningProps {
  type: 'players' | 'scrims';
  currentCount: number;
  className?: string;
}

export function UsageWarning({ type, currentCount, className }: UsageWarningProps) {
  const { features, isWithinLimit, tier } = useSubscription();
  
  const limit = type === 'players' ? features.maxPlayers : features.maxScrims;
  const isUnlimited = limit === -1;
  const isNearLimit = !isUnlimited && currentCount >= limit * 0.8;
  const isAtLimit = !isUnlimited && !isWithinLimit(type, currentCount);

  if (isUnlimited || (!isNearLimit && !isAtLimit)) {
    return null;
  }

  const getWarningText = () => {
    if (isAtLimit) {
      return `You've reached your ${type} limit (${limit}). Upgrade to add more.`;
    }
    return `You're using ${currentCount} of ${limit} ${type}. Consider upgrading soon.`;
  };

  const getVariant = () => {
    return isAtLimit ? 'destructive' : 'default';
  };

  return (
    <Alert variant={getVariant()} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{getWarningText()}</span>
        <Button variant="outline" size="sm" className="ml-4">
          <Crown className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  );
}
