import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { a1cEstimateQuery } from '../../lib/queries/glucoseQueries';
import { estimateA1C, getA1CCategory } from '../../lib/glucose/a1c';

const CATEGORY_LABELS = {
  normal: 'Normal',
  prediabetic: 'Pre-diabetic',
  diabetic: 'Diabetic range'
} as const;

const CATEGORY_STYLES = {
  normal: 'text-emerald-700 dark:text-emerald-400',
  prediabetic: 'text-amber-700 dark:text-amber-400',
  diabetic: 'text-red-700 dark:text-red-400'
} as const;

export function A1CCard() {
  const user = useAuthStore((s) => s.user);
  const a1cQ = useQuery(a1cEstimateQuery(user?.id ?? ''));

  const avgData = a1cQ.data;
  if (!avgData || avgData.average == null || avgData.count < 5) {
    return null;
  }

  const a1c = estimateA1C(avgData.average);
  const category = getA1CCategory(a1c);

  return (
    <View className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <Text className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Estimated A1C</Text>
      <View className="flex-row items-baseline gap-2">
        <Text className="text-3xl font-bold text-slate-900 dark:text-slate-100">{a1c}%</Text>
        <Text className={`text-sm font-medium ${CATEGORY_STYLES[category]}`}>
          {CATEGORY_LABELS[category]}
        </Text>
      </View>
      <Text className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Based on {avgData.count} readings (90-day avg: {Math.round(avgData.average)} mg/dL)
      </Text>
      <Text className="mt-2 text-xs text-slate-500 dark:text-slate-500">
        This is an estimate, not a lab result. Consult your doctor for actual A1C testing.
      </Text>
    </View>
  );
}
