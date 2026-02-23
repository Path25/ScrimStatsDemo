
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  id?: string;
  email_notifications: boolean;
  push_notifications: boolean;
}

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: false,
    push_notifications: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          id: data.id,
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
        });
      } else {
        // Create default preferences if none exist (off by default)
        await createDefaultPreferences();
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .insert({
          user_id: user.id,
          email_notifications: false,
          push_notifications: false,
        })
        .select()
        .single();

      if (error) throw error;

      setPreferences({
        id: data.id,
        email_notifications: data.email_notifications,
        push_notifications: data.push_notifications,
      });
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences.id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(prev => ({ ...prev, ...updates }));
      
      toast({
        title: 'Success',
        description: 'Notification preferences updated successfully.',
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      toast({
        title: 'Permission Denied',
        description: 'Push notifications are blocked. Please enable them in your browser settings.',
        variant: 'destructive',
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast({
        title: 'Success',
        description: 'Push notifications enabled successfully.',
      });
      return true;
    } else {
      toast({
        title: 'Permission Required',
        description: 'Push notifications require permission to work.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    preferences,
    isLoading,
    isUpdating,
    updatePreferences,
    requestPushPermission,
  };
};
