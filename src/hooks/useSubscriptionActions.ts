import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useSubscriptionActions() {
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();

  const createCheckout = async (tier: 'pro' | 'elite') => {
    if (!session?.access_token) {
      toast.error('You must be logged in to subscribe');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create checkout session');
    } finally {
      setIsLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      toast.error('You must be logged in to manage your subscription');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe customer portal in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open customer portal');
    } finally {
      setIsLoading(false);
    }
  };

  const syncSubscription = async () => {
    if (!session?.access_token) {
      toast.error('You must be logged in to sync subscription');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success('Subscription status synced successfully');
      
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error syncing subscription:', error);
      toast.error('Failed to sync subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckout,
    openCustomerPortal,
    syncSubscription,
    isLoading
  };
}