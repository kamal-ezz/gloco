import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { glucoseChartQuery } from '../../lib/queries/glucoseQueries';
import { mgdlToDisplay } from '../../lib/glucose/conversion';
import { useAppColorScheme } from '../../lib/useAppColorScheme';

const PERIODS = [7, 14, 30] as const;
type Period = (typeof PERIODS)[number];

export function GlucoseChart() {
  const user = useAuthStore((s) => s.user);
  const unit = useSettingsStore((s) => s.unit);
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';
  const [period, setPeriod] = useState<Period>(7);

  const chartQ = useQuery(glucoseChartQuery(user?.id ?? ''));
  const allLogs = chartQ.data ?? [];

  const data = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    const cutoffIso = cutoff.toISOString();

    return allLogs
      .filter((log) => log.logged_at >= cutoffIso)
      .map((log) => ({
        x: new Date(log.logged_at).getTime(),
        y: mgdlToDisplay(log.glucose_mgdl, unit)
      }));
  }, [allLogs, period, unit]);

  if (data.length < 2) {
    return null;
  }

  const lineColor = isDark ? '#60a5fa' : '#2563eb';

  return (
    <View className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <Text className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Glucose Trend</Text>
      <Text className="mb-3 text-sm text-slate-600 dark:text-slate-400">
        Last {period} days ({unit})
      </Text>

      <View className="mb-3 flex-row gap-2">
        {PERIODS.map((p) => {
          const active = p === period;
          return (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              className={`rounded-lg border px-3 py-1 ${
                active
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <Text className={active ? 'font-semibold text-brand-700' : 'text-slate-700 dark:text-slate-300'}>
                {p}d
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: 200 }}>
        <CartesianChart
          data={data}
          xKey="x"
          yKeys={['y']}
          domainPadding={{ top: 20, bottom: 20 }}
        >
          {({ points }) => (
            <Line
              points={points.y}
              color={lineColor}
              strokeWidth={2}
              curveType="natural"
            />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}
