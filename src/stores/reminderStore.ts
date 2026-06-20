import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

type ReminderStatus = 'idle' | 'running' | 'paused';

type ReminderState = {
  durationMinutes: number;
  status: ReminderStatus;
  remainingMs: number;
  endAtMs: number | null;
  notificationId: string | null;
  _hydrated: boolean;
};

type ReminderActions = {
  setDurationMinutes: (minutes: number) => void;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  reset: () => Promise<void>;
  tick: () => void;
  _setHydrated: (hydrated: boolean) => void;
};

const DEFAULT_DURATION_MINUTES = 60;
const DEFAULT_DURATION_MS = DEFAULT_DURATION_MINUTES * 60 * 1000;

type NotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;
let notificationHandlerConfigured = false;

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

  const Notifications = await notificationsModulePromise;
  if (!Notifications) return null;

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false
      })
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

async function ensureReminderPermissions() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const current = await Notifications.getPermissionsAsync();
  if (current.status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('glucose-reminders', {
      name: 'Glucose Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default'
    });
  }

  return Notifications;
}

function formatDurationMs(minutes: number) {
  return Math.max(1, minutes) * 60 * 1000;
}

export const useReminderStore = create<ReminderState & ReminderActions>()(
  persist(
    (set, get) => ({
      durationMinutes: DEFAULT_DURATION_MINUTES,
      status: 'idle',
      remainingMs: DEFAULT_DURATION_MS,
      endAtMs: null,
      notificationId: null,
      _hydrated: false,

      _setHydrated: (hydrated) => set({ _hydrated: hydrated }),

      setDurationMinutes: (minutes) => {
        const durationMinutes = Math.max(1, minutes);
        const durationMs = formatDurationMs(durationMinutes);
        const state = get();

        if (state.status === 'running') {
          set({ durationMinutes });
        } else {
          set({ durationMinutes, remainingMs: durationMs });
        }
      },

      start: async () => {
        const state = get();
        if (state.status === 'running') return;

        const baseRemaining =
          state.status === 'paused'
            ? state.remainingMs
            : formatDurationMs(state.durationMinutes);
        const triggerAt = Date.now() + baseRemaining;

        let notificationId: string | null = null;
        try {
          const Notifications = await ensureReminderPermissions();
          if (Notifications) {
            notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Glucose Reminder',
                body: 'Time to check your blood glucose.',
                sound: 'default'
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: new Date(triggerAt)
              }
            });
          }
        } catch {
          notificationId = null;
        }

        set({
          status: 'running',
          remainingMs: baseRemaining,
          endAtMs: triggerAt,
          notificationId
        });
      },

      pause: async () => {
        const state = get();
        if (state.status !== 'running' || state.endAtMs == null) return;

        const nextRemaining = Math.max(0, state.endAtMs - Date.now());
        if (state.notificationId) {
          const Notifications = await getNotificationsModule();
          if (Notifications) {
            await Notifications.cancelScheduledNotificationAsync(state.notificationId).catch(
              (err) => {
                console.warn('[ReminderStore] Failed to cancel scheduled notification:', err);
              }
            );
          }
        }

        set({
          status: 'paused',
          remainingMs: nextRemaining,
          endAtMs: null,
          notificationId: null
        });
      },

      reset: async () => {
        const state = get();
        if (state.notificationId) {
          const Notifications = await getNotificationsModule();
          if (Notifications) {
            await Notifications.cancelScheduledNotificationAsync(state.notificationId).catch(
              (err) => {
                console.warn('[ReminderStore] Failed to cancel scheduled notification:', err);
              }
            );
          }
        }

        const durationMs = formatDurationMs(state.durationMinutes);
        set({
          status: 'idle',
          remainingMs: durationMs,
          endAtMs: null,
          notificationId: null
        });
      },

      tick: () => {
        const state = get();
        if (state.status !== 'running' || state.endAtMs == null) return;

        const nextRemaining = Math.max(0, state.endAtMs - Date.now());
        if (nextRemaining <= 0) {
          const durationMs = formatDurationMs(state.durationMinutes);
          set({
            status: 'idle',
            remainingMs: durationMs,
            endAtMs: null,
            notificationId: null
          });
        } else {
          set({ remainingMs: nextRemaining });
        }
      }
    }),
    {
      name: 'settings:reminder',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        durationMinutes: state.durationMinutes,
        status: state.status,
        remainingMs: state.remainingMs,
        endAtMs: state.endAtMs,
        notificationId: state.notificationId
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Reconcile timer state after rehydration
        if (state.status === 'running' && state.endAtMs != null) {
          const nextRemaining = Math.max(0, state.endAtMs - Date.now());
          if (nextRemaining <= 0) {
            const durationMs = formatDurationMs(state.durationMinutes);
            useReminderStore.setState({
              status: 'idle',
              remainingMs: durationMs,
              endAtMs: null,
              notificationId: null,
              _hydrated: true
            });
            return;
          }
          useReminderStore.setState({ remainingMs: nextRemaining, _hydrated: true });
        } else {
          useReminderStore.setState({ _hydrated: true });
        }
      }
    }
  )
);

// Request permissions on import
void ensureReminderPermissions().catch((err) => {
  console.warn('[ReminderStore] Failed to request notification permissions:', err);
});
