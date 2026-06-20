import { Platform } from 'react-native';
import Constants from 'expo-constants';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;

function isExpoGoClient() {
  return Constants.executionEnvironment === 'storeClient';
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (isExpoGoClient()) return null;

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications')
      .then((module) => module)
      .catch(() => null);
  }

  return notificationsModulePromise;
}

async function ensurePermissions(): Promise<NotificationsModule | null> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const current = await Notifications.getPermissionsAsync();
  if (current.status !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();
    if (result.status !== 'granted') return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('scheduled-reminders', {
      name: 'Scheduled Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default'
    });
  }

  return Notifications;
}

export type ScheduledReminder = {
  id: string;
  label: string;
  hour: number;
  minute: number;
  notificationId: string | null;
  enabled: boolean;
};

export async function scheduleDaily(
  hour: number,
  minute: number,
  label: string
): Promise<string | null> {
  const Notifications = await ensurePermissions();
  if (!Notifications) return null;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Glucose Reminder',
      body: label || 'Time to check your blood glucose.',
      sound: 'default'
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(Platform.OS === 'android' ? { channelId: 'scheduled-reminders' } : {})
    }
  });

  return notificationId;
}

export async function cancelScheduled(notificationId: string): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await Notifications.cancelScheduledNotificationAsync(notificationId).catch((err) => {
    console.warn('[Notifications] Failed to cancel:', err);
  });
}
