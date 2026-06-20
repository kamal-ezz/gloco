import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { GlucoseLog } from '../types/database';
import { formatGlucoseValue } from '../lib/glucose/conversion';
import { useSettingsStore } from '../stores/settingsStore';
import { formatMealTag } from '../constants/mealTags';

type LogCardProps = {
  log: GlucoseLog;
  onPress: () => void;
  index?: number;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function LogCard({ log, onPress, index = 0 }: LogCardProps) {
  const unit = useSettingsStore((s) => s.unit);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        onPress={onPress}
        className="mb-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
      >
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatGlucoseValue(log.glucose_mgdl, unit)}
          </Text>
          {log.meal_tag ? (
            <Text className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700">
              {formatMealTag(log.meal_tag)}
            </Text>
          ) : null}
        </View>
        <Text className="text-sm text-slate-600 dark:text-slate-400">{formatDate(log.logged_at)}</Text>
        {(log.insulin_units ?? log.carbs_grams) ? (
          <Text className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            {log.insulin_units != null ? `Insulin: ${log.insulin_units}u` : ''}
            {log.insulin_units != null && log.carbs_grams != null ? ' | ' : ''}
            {log.carbs_grams != null ? `Carbs: ${log.carbs_grams}g` : ''}
          </Text>
        ) : null}
        {log.notes ? <Text className="mt-1 text-sm text-slate-700 dark:text-slate-300">{log.notes}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}
