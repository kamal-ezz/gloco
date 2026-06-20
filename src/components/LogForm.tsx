import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input } from './Input';
import { useSettingsStore } from '../stores/settingsStore';
import { hapticLight, hapticSuccess, hapticError } from '../lib/haptics';
import { MEAL_TAGS, MEAL_TAG_LABELS } from '../constants/mealTags';
import {
  displayToMgdl,
  roundMgdlForStorage,
  toInputString
} from '../lib/glucose/conversion';
import { glucoseLogSchema, type GlucoseLogFormData } from '../lib/schemas/glucoseLogSchema';
import type { GlucoseLog, MealTag } from '../types/database';
import { useState } from 'react';

type LogFormProps = {
  mode: 'create' | 'edit';
  initial?: GlucoseLog;
  loading?: boolean;
  submitLabel: string;
  onSubmit: (payload: LogFormValues) => Promise<void>;
  draftStorageKey?: string;
};

export type LogFormValues = {
  glucose_mgdl: number;
  logged_at: string;
  meal_tag: MealTag | null;
  insulin_units: number | null;
  carbs_grams: number | null;
  notes: string | null;
};

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function toLocalDateInput(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

function toLocalTimeInput(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(11, 16);
}

export function LogForm({
  mode,
  initial,
  loading = false,
  submitLabel,
  onSubmit,
  draftStorageKey
}: LogFormProps) {
  const unit = useSettingsStore((s) => s.unit);
  const previousUnitRef = useRef(unit);

  const initialLoggedAt = initial ? new Date(initial.logged_at) : new Date();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<GlucoseLogFormData>({
    resolver: zodResolver(glucoseLogSchema),
    defaultValues: {
      glucose: initial ? toInputString(initial.glucose_mgdl, unit) : '',
      loggedAt: initialLoggedAt,
      mealTag: initial?.meal_tag ?? '',
      insulin: initial?.insulin_units != null ? String(initial.insulin_units) : '',
      carbs: initial?.carbs_grams != null ? String(initial.carbs_grams) : '',
      notes: initial?.notes ?? ''
    }
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftHydrated, setDraftHydrated] = useState(mode !== 'create' || !draftStorageKey);

  const watchedLoggedAt = watch('loggedAt');
  const watchedMealTag = watch('mealTag');

  // Sync unit changes - convert glucose value when unit changes
  useEffect(() => {
    const previousUnit = previousUnitRef.current;
    if (previousUnit === unit) {
      previousUnitRef.current = unit;
      return;
    }

    const currentGlucose = watch('glucose');
    const currentValue = parseNumber(currentGlucose);
    if (currentValue != null) {
      const mgdl = displayToMgdl(currentValue, previousUnit);
      setValue('glucose', toInputString(mgdl, unit));
    }

    previousUnitRef.current = unit;
  }, [unit, setValue, watch]);

  // Sync initial values in edit mode
  useEffect(() => {
    if (mode === 'edit' && initial) {
      setValue('glucose', toInputString(initial.glucose_mgdl, unit));
      setValue('loggedAt', new Date(initial.logged_at));
    }
  }, [initial, mode, unit, setValue]);

  // Load draft
  useEffect(() => {
    if (mode !== 'create' || !draftStorageKey) return;

    let active = true;
    setDraftHydrated(false);

    AsyncStorage.getItem(draftStorageKey)
      .then((stored) => {
        if (!active || !stored) return;
        const parsed = JSON.parse(stored) as Partial<GlucoseLogFormData & { loggedAtIso: string }>;
        if (typeof parsed.glucose === 'string') setValue('glucose', parsed.glucose);
        if (typeof parsed.loggedAtIso === 'string') {
          const parsedDate = new Date(parsed.loggedAtIso);
          if (!Number.isNaN(parsedDate.getTime())) setValue('loggedAt', parsedDate);
        }
        if (parsed.mealTag === '' || MEAL_TAGS.includes(parsed.mealTag as MealTag)) {
          setValue('mealTag', (parsed.mealTag as MealTag | '') ?? '');
        }
        if (typeof parsed.insulin === 'string') setValue('insulin', parsed.insulin);
        if (typeof parsed.carbs === 'string') setValue('carbs', parsed.carbs);
        if (typeof parsed.notes === 'string') setValue('notes', parsed.notes);
      })
      .catch((err) => {
        console.warn('[LogForm] Failed to load draft:', err);
      })
      .finally(() => {
        if (active) setDraftHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [draftStorageKey, mode, setValue]);

  // Save draft with debounce
  const formValues = watch();
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode !== 'create' || !draftStorageKey || !draftHydrated) return;

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const draft = {
        glucose: formValues.glucose,
        loggedAtIso: formValues.loggedAt.toISOString(),
        mealTag: formValues.mealTag,
        insulin: formValues.insulin,
        carbs: formValues.carbs,
        notes: formValues.notes
      };
      AsyncStorage.setItem(draftStorageKey, JSON.stringify(draft)).catch((err) => {
        console.warn('[LogForm] Failed to save draft:', err);
      });
    }, 500);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [formValues, draftHydrated, draftStorageKey, mode]);

  function handleGlucoseChange(nextValue: string) {
    const normalized = nextValue.replace(',', '.');
    if (/^\d*\.?\d*$/.test(normalized)) {
      return normalized;
    }
    return watch('glucose');
  }

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;

    const current = watch('loggedAt');
    const next = new Date(current);
    next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    setValue('loggedAt', next);
  }

  function handleTimeChange(event: DateTimePickerEvent, selectedTime?: Date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed' || !selectedTime) return;

    const current = watch('loggedAt');
    const next = new Date(current);
    next.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    setValue('loggedAt', next);
  }

  async function onFormSubmit(data: GlucoseLogFormData) {
    setSubmitError(null);

    const glucoseVal = Number(data.glucose.replace(',', '.'));
    const glucoseMgdl = roundMgdlForStorage(displayToMgdl(glucoseVal, unit));

    if (glucoseMgdl > 1000) {
      hapticError();
      setSubmitError('Glucose value is unrealistically high (max 1000 mg/dL).');
      return;
    }

    const insulinVal = data.insulin?.trim() ? parseNumber(data.insulin) : null;
    const carbsVal = data.carbs?.trim() ? parseNumber(data.carbs) : null;

    const payload: LogFormValues = {
      glucose_mgdl: glucoseMgdl,
      logged_at: data.loggedAt.toISOString(),
      meal_tag: (data.mealTag as MealTag) || null,
      insulin_units: insulinVal,
      carbs_grams: carbsVal,
      notes: data.notes?.trim() ? data.notes.trim() : null
    };

    try {
      await onSubmit(payload);
      hapticSuccess();
      if (mode === 'create') {
        reset({
          glucose: '',
          loggedAt: new Date(),
          mealTag: '',
          insulin: '',
          carbs: '',
          notes: ''
        });
        if (draftStorageKey) {
          await AsyncStorage.removeItem(draftStorageKey);
        }
      }
    } catch (error) {
      hapticError();
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      setSubmitError(message);
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
      <Controller
        control={control}
        name="glucose"
        render={({ field: { onChange, value } }) => (
          <Input
            label={`Glucose (${unit})`}
            value={value}
            onChangeText={(text) => onChange(handleGlucoseChange(text))}
            keyboardType={Platform.OS === 'android' ? 'default' : 'decimal-pad'}
            placeholder={unit === 'mg/dL' ? 'e.g. 110' : unit === 'g/L' ? 'e.g. 1.10' : 'e.g. 6.10'}
            error={errors.glucose?.message}
          />
        )}
      />

      <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Logged At</Text>
      <View className="mb-3 flex-row gap-2">
        <Pressable
          onPress={() => setShowDatePicker((prev) => !prev)}
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-3"
        >
          <Text className="text-slate-900 dark:text-slate-100">{toLocalDateInput(watchedLoggedAt)}</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowTimePicker((prev) => !prev)}
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-3"
        >
          <Text className="text-slate-900 dark:text-slate-100">{toLocalTimeInput(watchedLoggedAt)}</Text>
        </Pressable>
      </View>
      {errors.loggedAt ? <Text className="mb-2 text-sm text-red-600 dark:text-red-400">{errors.loggedAt.message}</Text> : null}

      {showDatePicker ? (
        <View className="mb-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2">
          <DateTimePicker
            value={watchedLoggedAt}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleDateChange}
          />
        </View>
      ) : null}

      {showTimePicker ? (
        <View className="mb-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2">
          <DateTimePicker
            value={watchedLoggedAt}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            is24Hour
          />
        </View>
      ) : null}

      <View className="mb-4 flex-row gap-2">
        <Pressable
          onPress={() => setValue('loggedAt', new Date())}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
        >
          <Text className="text-slate-700 dark:text-slate-300">Use Current Time</Text>
        </Pressable>
      </View>

      <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Meal Timing (optional)</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => { hapticLight(); setValue('mealTag', ''); }}
          className={`rounded-full border px-3 py-1.5 ${!watchedMealTag ? 'border-brand-600 bg-brand-50' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}
        >
          <Text className={!watchedMealTag ? 'text-brand-700' : 'text-slate-700 dark:text-slate-300'}>None</Text>
        </Pressable>
        {MEAL_TAGS.map((tag) => {
          const active = watchedMealTag === tag;
          return (
            <Pressable
              key={tag}
              onPress={() => { hapticLight(); setValue('mealTag', tag); }}
              className={`rounded-full border px-3 py-1.5 ${active ? 'border-brand-600 bg-brand-50' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}
            >
              <Text className={active ? 'text-brand-700' : 'text-slate-700 dark:text-slate-300'}>
                {MEAL_TAG_LABELS[tag]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Controller
        control={control}
        name="insulin"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Insulin Units (optional)"
            value={value ?? ''}
            onChangeText={onChange}
            keyboardType="numeric"
            placeholder="e.g. 4"
            error={errors.insulin?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="carbs"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Carbs (g) (optional)"
            value={value ?? ''}
            onChangeText={onChange}
            keyboardType="numeric"
            placeholder="e.g. 30"
            error={errors.carbs?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Notes (optional)"
            value={value ?? ''}
            onChangeText={onChange}
            placeholder="Any context..."
            autoCapitalize="sentences"
            multiline
          />
        )}
      />

      {submitError ? <Text className="mb-3 text-sm text-red-600 dark:text-red-400">{submitError}</Text> : null}

      <Pressable
        onPress={handleSubmit(onFormSubmit)}
        disabled={loading}
        className="items-center rounded-lg bg-brand-600 px-4 py-3 disabled:opacity-60"
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-base font-semibold text-white">{submitLabel}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
