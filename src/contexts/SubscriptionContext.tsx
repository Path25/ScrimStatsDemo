
import { createContext, useContext } from 'react';
import { useTenant } from './TenantContext';

interface FeatureAccess {
  maxPlayers: number;
  maxScrims: number;
  maxSoloQGames: number;
  storageGB: number;
  advancedAnalytics: boolean;
  customReports: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  trialDays?: number;
}

interface SubscriptionContextType {
  tier: 'free' | 'pro' | 'elite';
  features: FeatureAccess;
  hasFeature: (feature: keyof FeatureAccess) => boolean;
  isWithinLimit: (feature: 'players' | 'scrims' | 'soloQGames', currentCount: number) => boolean;
  isTrialExpired: boolean;
  daysRemainingInTrial: number;
  daysUntilDeletion: number;
  isInGracePeriod: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const TIER_FEATURES: Record<string, FeatureAccess> = {
  free: {
    maxPlayers: 5,
    maxScrims: 20,
    maxSoloQGames: 10,
    storageGB: 1,
    advancedAnalytics: false,
    customReports: false,
    apiAccess: false,
    prioritySupport: false,
    trialDays: 14
  },
  pro: {
    maxPlayers: 7,
    maxScrims: 100,
    maxSoloQGames: 20,
    storageGB: 5,
    advancedAnalytics: true,
    customReports: true,
    apiAccess: false,
    prioritySupport: true
  },
  elite: {
    maxPlayers: -1, // unlimited
    maxScrims: -1, // unlimited
    maxSoloQGames: 50,
    storageGB: 20,
    advancedAnalytics: true,
    customReports: true,
    apiAccess: true,
    prioritySupport: true
  }
};

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant();
  
  if (!tenant) {
    return <>{children}</>;
  }

  // Use the subscription tier directly from the tenant
  const tier: 'free' | 'pro' | 'elite' = tenant.subscriptionTier;
  const features = TIER_FEATURES[tier];

  // For free tier trial calculation, use the tenant's actual creation date
  // This ensures the trial period is calculated from when the tenant was actually created
  const createdAtString = tenant.settings?.created_at as string;
  if (!createdAtString && tier === 'free') {
    console.warn('No tenant creation date found for free tier - trial logic may not work correctly');
  }
  const trialStartDate = tier === 'free' && createdAtString ? new Date(createdAtString) : null;
  const trialEndDate = trialStartDate ? new Date(trialStartDate.getTime() + (14 * 24 * 60 * 60 * 1000)) : null;
  const gracePeriodEndDate = trialEndDate ? new Date(trialEndDate.getTime() + (3 * 24 * 60 * 60 * 1000)) : null;
  
  const isTrialExpired = tier === 'free' && trialEndDate ? trialEndDate.getTime() < Date.now() : false;
  
  const daysRemainingInTrial = tier === 'free' && trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  const daysUntilDeletion = tier === 'free' && isTrialExpired && gracePeriodEndDate
    ? Math.max(0, Math.ceil((gracePeriodEndDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  const isInGracePeriod = tier === 'free' && isTrialExpired && daysUntilDeletion > 0;

  const hasFeature = (feature: keyof FeatureAccess) => {
    // If tenant has an active paid subscription (including Stripe trials), allow all features
    if (tenant.subscriptionStatus === 'active' || tenant.subscriptionStatus === 'trial') {
      return Boolean(features[feature]);
    }
    
    // For free tier trial logic
    if (tier === 'free' && isTrialExpired && !isInGracePeriod) {
      return false; // Block all features if trial expired and grace period over
    }
    return Boolean(features[feature]);
  };

  const isWithinLimit = (feature: 'players' | 'scrims' | 'soloQGames', currentCount: number) => {
    // If tenant has an active paid subscription (including Stripe trials), use tier limits
    if (tenant.subscriptionStatus === 'active' || tenant.subscriptionStatus === 'trial') {
      const limit = feature === 'players' ? features.maxPlayers 
                   : feature === 'scrims' ? features.maxScrims 
                   : features.maxSoloQGames;
      return limit === -1 || currentCount < limit;
    }
    
    // For free tier trial logic
    if (tier === 'free' && isTrialExpired && !isInGracePeriod) {
      return false; // Block all usage if trial expired and grace period over
    }
    
    const limit = feature === 'players' ? features.maxPlayers 
                 : feature === 'scrims' ? features.maxScrims 
                 : features.maxSoloQGames;
    return limit === -1 || currentCount < limit;
  };

  return (
    <SubscriptionContext.Provider value={{ 
      tier, 
      features, 
      hasFeature, 
      isWithinLimit, 
      isTrialExpired, 
      daysRemainingInTrial,
      daysUntilDeletion,
      isInGracePeriod
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
