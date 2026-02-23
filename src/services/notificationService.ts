
import { supabase } from '@/integrations/supabase/client';

export interface EmailNotificationData {
  to: string;
  subject: string;
  message: string;
  type: 'scrim_reminder' | 'match_update' | 'team_activity' | 'general';
}

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

class NotificationService {
  async sendEmailNotification(data: EmailNotificationData): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: data,
      });

      if (error) {
        console.error('Error sending email notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  async sendPushNotification(data: PushNotificationData): Promise<boolean> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('Push notifications not available or not permitted');
      return false;
    }

    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icon.png',
        badge: data.badge || '/icon.png',
        tag: data.tag,
        requireInteraction: data.requireInteraction || false,
      });

      // Auto close after 5 seconds unless it requires interaction
      if (!data.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  async checkUserPreferences(userId: string): Promise<{
    emailNotifications: boolean;
    pushNotifications: boolean;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('email_notifications, push_notifications')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return {
        emailNotifications: data?.email_notifications ?? true,
        pushNotifications: data?.push_notifications ?? true,
      };
    } catch (error) {
      console.error('Error checking user preferences:', error);
      return { emailNotifications: true, pushNotifications: true };
    }
  }

  async notifyUser(
    userId: string,
    emailData: EmailNotificationData,
    pushData: PushNotificationData
  ): Promise<void> {
    const preferences = await this.checkUserPreferences(userId);

    const promises = [];

    if (preferences.emailNotifications) {
      promises.push(this.sendEmailNotification(emailData));
    }

    if (preferences.pushNotifications) {
      promises.push(this.sendPushNotification(pushData));
    }

    await Promise.all(promises);
  }
}

export const notificationService = new NotificationService();
