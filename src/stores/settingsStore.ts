import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GlucoseUnit } from '../types/glucose';
import type { ScheduledReminder } from '../lib/notifications';
import { scheduleDaily, cancelScheduled } from '../lib/notifications';

type SettingsState = {
  unit: GlucoseUnit;
  colorScheme: 'light' | 'dark' | 'system';
  scheduledReminders: ScheduledReminder[];
  hasCompletedOnboarding: boolean;
};

type SettingsActions = {
  setUnit: (unit: GlucoseUnit) => void;
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
  addScheduledReminder: (label: string, hour: number, minute: number) => Promise<void>;
  removeScheduledReminder: (id: string) => Promise<void>;
  toggleScheduledReminder: (id: string) => Promise<void>;
  setHasCompletedOnboarding: (completed: boolean) => void;
};

let nextId = 1;
function generateId() {
  return `sr_${Date.now()}_${nextId++}`;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      unit: 'mg/dL',
      colorScheme: 'system',
      scheduledReminders: [],
      hasCompletedOnboarding: false,

      setUnit: (unit) => set({ unit }),
      setColorScheme: (colorScheme) => set({ colorScheme }),

      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),

      addScheduledReminder: async (label, hour, minute) => {
        const notificationId = await scheduleDaily(hour, minute, label);
        const reminder: ScheduledReminder = {
          id: generateId(),
          label,
          hour,
          minute,
          notificationId,
          enabled: true
        };
        set({ scheduledReminders: [...get().scheduledReminders, reminder] });
      },

      removeScheduledReminder: async (id) => {
        const reminder = get().scheduledReminders.find((r) => r.id === id);
        if (reminder?.notificationId) {
          await cancelScheduled(reminder.notificationId);
        }
        set({
          scheduledReminders: get().scheduledReminders.filter((r) => r.id !== id)
        });
      },

      toggleScheduledReminder: async (id) => {
        const reminders = get().scheduledReminders;
        const reminder = reminders.find((r) => r.id === id);
        if (!reminder) return;

        let newNotificationId = reminder.notificationId;

        if (reminder.enabled) {
          // Disable: cancel notification
          if (reminder.notificationId) {
            await cancelScheduled(reminder.notificationId);
          }
          newNotificationId = null;
        } else {
          // Enable: schedule notification
          newNotificationId = await scheduleDaily(reminder.hour, reminder.minute, reminder.label);
        }

        set({
          scheduledReminders: reminders.map((r) =>
            r.id === id
              ? { ...r, enabled: !r.enabled, notificationId: newNotificationId }
              : r
          )
        });
      }
    }),
    {
      name: 'settings:glucose',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
