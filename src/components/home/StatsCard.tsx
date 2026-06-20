import { Text, View } from 'react-native';
import { mgdlToDisplay } from '../../lib/glucose/conversion';
import type { GlucoseUnit } from '../../types/glucose';
import type { TodayStats } from '../../lib/supabase/glucoseLogs';

type StatsCardProps = {
    stats: TodayStats;
    unit: GlucoseUnit;
};

export function StatsCard({ stats, unit }: StatsCardProps) {
    return (
        <View className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <Text className="text-sm text-slate-600 dark:text-slate-400">Readings count</Text>
            <Text className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.count}</Text>
            <Text className="mt-2 text-sm text-slate-600 dark:text-slate-400">Average glucose</Text>
            <Text className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {stats.averageGlucose == null
                    ? '-'
                    : `${Math.round(mgdlToDisplay(stats.averageGlucose, unit) * 100) / 100} ${unit}`}
            </Text>
        </View>
    );
}
