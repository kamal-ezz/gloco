import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { MEAL_TAGS, MEAL_TAG_LABELS } from '../constants/mealTags';
import type { MealTag } from '../types/database';
import type { GlucoseLogFilters } from '../lib/supabase/glucoseLogs';
import { hapticLight } from '../lib/haptics';

type LogFiltersProps = {
  filters: GlucoseLogFilters;
  onFiltersChange: (filters: GlucoseLogFilters) => void;
};

const SORT_OPTIONS: { value: GlucoseLogFilters['sort']; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest' },
  { value: 'lowest', label: 'Lowest' }
];

export function LogFilters({ filters, onFiltersChange }: LogFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.mealTags?.length ? 1 : 0) +
    (filters.dateFrom || filters.dateTo ? 1 : 0) +
    (filters.sort && filters.sort !== 'newest' ? 1 : 0);

  function toggleMealTag(tag: MealTag) {
    hapticLight();
    const current = filters.mealTags ?? [];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    onFiltersChange({ ...filters, mealTags: next.length > 0 ? next : undefined });
  }

  function clearFilters() {
    onFiltersChange({});
    setExpanded(false);
  }

  return (
    <View className="mb-3">
      <View className="flex-row items-center gap-2">
        <TextInput
          value={filters.search ?? ''}
          onChangeText={(text) => onFiltersChange({ ...filters, search: text || undefined })}
          placeholder="Search notes..."
          placeholderTextColor="#94a3b8"
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
        />
        <Pressable
          onPress={() => { hapticLight(); setExpanded(!expanded); }}
          className={`rounded-lg border px-3 py-2 ${
            expanded || activeFilterCount > 0
              ? 'border-brand-600 bg-brand-50'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
          }`}
        >
          <Text className={expanded || activeFilterCount > 0 ? 'font-semibold text-brand-700' : 'text-slate-700 dark:text-slate-300'}>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </Pressable>
      </View>

      {expanded ? (
        <View className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
          <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Meal Tag</Text>
          <View className="mb-3 flex-row flex-wrap gap-1">
            {MEAL_TAGS.map((tag) => {
              const active = filters.mealTags?.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleMealTag(tag)}
                  className={`rounded-full border px-2.5 py-1 ${
                    active
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  <Text className={`text-xs ${active ? 'font-semibold text-brand-700' : 'text-slate-700 dark:text-slate-300'}`}>
                    {MEAL_TAG_LABELS[tag]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Sort By</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => {
              const active = (filters.sort ?? 'newest') === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => { hapticLight(); onFiltersChange({ ...filters, sort: option.value }); }}
                  className={`rounded-lg border px-3 py-1.5 ${
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

          {activeFilterCount > 0 ? (
            <Pressable onPress={clearFilters} className="self-start">
              <Text className="text-sm font-medium text-red-600 dark:text-red-400">Clear All Filters</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
