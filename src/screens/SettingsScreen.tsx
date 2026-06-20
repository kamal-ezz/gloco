import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '../components/ScreenContainer';
import { Input } from '../components/Input';
import { signOut } from '../lib/auth';
import { hapticLight, hapticSuccess, hapticError } from '../lib/haptics';
import { pickAndParseCsv, importCsvRows } from '../lib/import/csvImport';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useReminderStore } from '../stores/reminderStore';
import type { GlucoseUnit } from '../types/glucose';

const UNITS: GlucoseUnit[] = ['mg/dL', 'g/L', 'mmol/L'];
const COLOR_SCHEMES = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' }
];
const REMINDER_OPTIONS = [60, 90, 120];
const MIN_REMINDER_MINUTES = 1;
const MAX_REMINDER_MINUTES = 24 * 60;

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const unit = useSettingsStore((s) => s.unit);
  const setUnit = useSettingsStore((s) => s.setUnit);
  const colorScheme = useSettingsStore((s) => s.colorScheme);
  const setColorScheme = useSettingsStore((s) => s.setColorScheme);
  const scheduledReminders = useSettingsStore((s) => s.scheduledReminders);
  const addScheduledReminder = useSettingsStore((s) => s.addScheduledReminder);
  const removeScheduledReminder = useSettingsStore((s) => s.removeScheduledReminder);
  const toggleScheduledReminder = useSettingsStore((s) => s.toggleScheduledReminder);
  const durationMinutes = useReminderStore((s) => s.durationMinutes);
  const setDurationMinutes = useReminderStore((s) => s.setDurationMinutes);
  const status = useReminderStore((s) => s.status);
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customDuration, setCustomDuration] = useState(String(durationMinutes));
  const [customDurationError, setCustomDurationError] = useState<string | null>(null);
  const [newReminderHour, setNewReminderHour] = useState('08');
  const [newReminderMinute, setNewReminderMinute] = useState('00');
  const [newReminderLabel, setNewReminderLabel] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setCustomDuration(String(durationMinutes));
  }, [durationMinutes]);

  function handleCustomDurationChange(value: string) {
    setCustomDuration(value.replace(/[^0-9]/g, ''));
    setCustomDurationError(null);
  }

  function adjustCustomDuration(delta: number) {
    const base = Number.parseInt(customDuration, 10);
    const seed = Number.isFinite(base) ? base : durationMinutes;
    const next = Math.max(MIN_REMINDER_MINUTES, Math.min(MAX_REMINDER_MINUTES, seed + delta));
    setCustomDuration(String(next));
    setCustomDurationError(null);
  }

  function applyCustomDuration() {
    const nextValue = Number.parseInt(customDuration, 10);
    if (!Number.isFinite(nextValue)) {
      setCustomDurationError('Enter reminder minutes.');
      return;
    }
    if (nextValue < MIN_REMINDER_MINUTES || nextValue > MAX_REMINDER_MINUTES) {
      setCustomDurationError(
        `Duration must be between ${MIN_REMINDER_MINUTES} and ${MAX_REMINDER_MINUTES} minutes.`
      );
      return;
    }
    setDurationMinutes(nextValue);
    setCustomDurationError(null);
  }

  async function handleAddScheduledReminder() {
    const hour = Number.parseInt(newReminderHour, 10);
    const minute = Number.parseInt(newReminderMinute, 10);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      Alert.alert('Invalid time', 'Hour must be 0-23, minute must be 0-59.');
      return;
    }
    await addScheduledReminder(newReminderLabel || 'Check glucose', hour, minute);
    hapticSuccess();
    setNewReminderLabel('');
  }

  async function handleDeleteScheduledReminder(id: string) {
    Alert.alert('Delete reminder', 'Remove this scheduled reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeScheduledReminder(id);
        }
      }
    ]);
  }

  async function handleCsvImport() {
    if (!user) return;
    setImporting(true);
    try {
      const parsed = await pickAndParseCsv();
      if (!parsed) {
        setImporting(false);
        return;
      }

      if (parsed.errors.length > 0) {
        Alert.alert('CSV parse errors', parsed.errors.slice(0, 3).map((e) => e.message).join('\n'));
      }

      const result = await importCsvRows(parsed.data, user.id);
      hapticSuccess();
      await queryClient.invalidateQueries({ queryKey: ['glucoseLogs', user.id] });
      Alert.alert(
        'Import complete',
        `Imported ${result.imported} of ${result.total} rows.${result.skipped > 0 ? ` ${result.skipped} skipped.` : ''}`
      );
    } catch (err) {
      hapticError();
      Alert.alert('Import failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setImporting(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    setError(null);
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="py-3">
          <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</Text>
        </View>

        <View className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <Text className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Glucose Unit</Text>
          <Text className="mb-3 text-slate-600 dark:text-slate-400">
            Values are stored as mg/dL, and converted for display.
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {UNITS.map((option) => {
              const active = option === unit;
              return (
                <Pressable
                  key={option}
                  onPress={() => { hapticLight(); setUnit(option); }}
                  className={`rounded-lg border px-3 py-2 ${
                    active
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  <Text className={active ? 'font-semibold text-brand-700' : 'text-slate-700 dark:text-slate-300'}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <Text className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Reminder Duration</Text>
          <Text className="mb-3 text-slate-600 dark:text-slate-400">
            Timer used for post-meal glucose reminder (1 to 1440 minutes).
            {status === 'running' ? ' Pause/reset timer before changing duration.' : ''}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {REMINDER_OPTIONS.map((minutes) => {
              const active = durationMinutes === minutes;
              const disabled = status === 'running' && !active;
              return (
                <Pressable
                  key={minutes}
                  onPress={() => { hapticLight(); setDurationMinutes(minutes); }}
                  disabled={disabled}
                  className={`rounded-lg border px-3 py-2 ${
                    active ? 'border-brand-600 bg-brand-50' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  } ${disabled ? 'opacity-50' : ''}`}
                >
                  <Text className={active ? 'font-semibold text-brand-700' : 'text-slate-700 dark:text-slate-300'}>
                    {minutes === 60 ? '1h' : minutes === 90 ? '1h 30m' : '2h'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
            <Input
              label="Custom Duration (minutes)"
              value={customDuration}
              onChangeText={handleCustomDurationChange}
              keyboardType={Platform.OS === 'android' ? 'default' : 'number-pad'}
              placeholder="e.g. 75"
              error={customDurationError ?? undefined}
            />
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => adjustCustomDuration(-15)}
                disabled={status === 'running'}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 disabled:opacity-50"
              >
                <Text className="font-medium text-slate-700 dark:text-slate-300">-15m</Text>
              </Pressable>
              <Pressable
                onPress={() => adjustCustomDuration(15)}
                disabled={status === 'running'}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 disabled:opacity-50"
              >
                <Text className="font-medium text-slate-700 dark:text-slate-300">+15m</Text>
              </Pressable>
              <Pressable
                onPress={applyCustomDuration}
                disabled={status === 'running'}
                className="ml-auto rounded-lg bg-brand-600 px-4 py-2 disabled:opacity-50"
              >
                <Text className="font-semibold text-white">Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <Text className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Scheduled Reminders</Text>
          <Text className="mb-3 text-slate-600 dark:text-slate-400">
            Set daily reminders to check your glucose at specific times.
          </Text>

          {scheduledReminders.map((reminder) => (
            <View
              key={reminder.id}
              className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3"
            >
              <View className="flex-1">
                <Text className="font-medium text-slate-900 dark:text-slate-100">
                  {formatTime(reminder.hour, reminder.minute)}
                </Text>
                <Text className="text-sm text-slate-600 dark:text-slate-400">{reminder.label}</Text>
              </View>
              <Switch
                value={reminder.enabled}
                onValueChange={() => void toggleScheduledReminder(reminder.id)}
                trackColor={{ true: '#2563eb' }}
              />
              <Pressable
                onPress={() => void handleDeleteScheduledReminder(reminder.id)}
                className="ml-2 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-2 py-1"
              >
                <Text className="text-sm font-medium text-red-700 dark:text-red-400">Delete</Text>
              </Pressable>
            </View>
          ))}

          <View className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
            <Input
              label="Label"
              value={newReminderLabel}
              onChangeText={setNewReminderLabel}
              placeholder="e.g. Morning check"
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Input
                  label="Hour (0-23)"
                  value={newReminderHour}
                  onChangeText={(v) => setNewReminderHour(v.replace(/[^0-9]/g, ''))}
                  keyboardType={Platform.OS === 'android' ? 'default' : 'number-pad'}
                  placeholder="08"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Minute (0-59)"
                  value={newReminderMinute}
                  onChangeText={(v) => setNewReminderMinute(v.replace(/[^0-9]/g, ''))}
                  keyboardType={Platform.OS === 'android' ? 'default' : 'number-pad'}
                  placeholder="00"
                />
              </View>
            </View>
            <Pressable
              onPress={() => void handleAddScheduledReminder()}
              className="items-center rounded-lg bg-brand-600 px-4 py-2"
            >
              <Text className="font-semibold text-white">Add Reminder</Text>
            </Pressable>
          </View>
        </View>

        <View className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <Text className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Appearance</Text>
          <Text className="mb-3 text-slate-600 dark:text-slate-400">
            Choose your preferred color scheme.
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {COLOR_SCHEMES.map((option) => {
              const active = option.value === colorScheme;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => { hapticLight(); setColorScheme(option.value); }}
                  className={`rounded-lg border px-3 py-2 ${
                    active
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  <Text className={active ? 'font-semibold text-brand-700' : 'text-slate-700 dark:text-slate-300'}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <Text className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Import Data</Text>
          <Text className="mb-3 text-slate-600 dark:text-slate-400">
            Import glucose logs from a CSV file. Required column: glucose_mgdl, logged_at.
          </Text>
          <Pressable
            onPress={() => void handleCsvImport()}
            disabled={importing}
            className="items-center rounded-lg bg-brand-600 px-4 py-3 disabled:opacity-60"
          >
            {importing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-semibold text-white">Import CSV</Text>
            )}
          </Pressable>
        </View>

        <View className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <Text className="mb-3 text-slate-700 dark:text-slate-300">You can sign out of your account here.</Text>
          <Pressable
            onPress={handleSignOut}
            disabled={loading}
            className="items-center rounded-lg bg-slate-900 px-4 py-3 disabled:opacity-60"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-semibold text-white">Sign Out</Text>
            )}
          </Pressable>
          {error ? <Text className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
