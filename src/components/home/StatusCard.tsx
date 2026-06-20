import { Text, View } from 'react-native';
import { formatMealTag } from '../../constants/mealTags';
import { formatGlucoseValue } from '../../lib/glucose/conversion';
import { evaluateGlucoseStatus } from '../../lib/glucose/status';
import type { GlucoseLog } from '../../types/database';
import type { GlucoseUnit } from '../../types/glucose';

type StatusCardProps = {
    latestLog: GlucoseLog | null;
    unit: GlucoseUnit;
};

export function StatusCard({ latestLog, unit }: StatusCardProps) {
    const latestStatus = evaluateGlucoseStatus(
        latestLog?.glucose_mgdl ?? null,
        latestLog?.meal_tag ?? null
    );

    const statusStyle =
        latestStatus.status === 'normal'
            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700'
            : latestStatus.status === 'high'
                ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700'
                : latestStatus.status === 'low'
                    ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

    const statusTextStyle =
        latestStatus.status === 'normal'
            ? 'text-emerald-700 dark:text-emerald-400'
            : latestStatus.status === 'high'
                ? 'text-amber-700 dark:text-amber-400'
                : latestStatus.status === 'low'
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-slate-700 dark:text-slate-300';

    const accessibilityLabel = `Status: ${latestStatus.status === 'unknown' ? 'No data' : latestStatus.status}. ${latestStatus.message}`;

    return (
        <View className={`mb-4 rounded-xl border p-4 ${statusStyle}`} accessibilityLabel={accessibilityLabel}>
            <Text className={`text-sm ${statusTextStyle}`}>Current status</Text>
            <Text className={`mt-1 text-xl font-semibold capitalize ${statusTextStyle}`}>
                {latestStatus.status === 'unknown' ? 'No data' : latestStatus.status}
            </Text>
            <Text className={`mt-1 text-sm ${statusTextStyle}`}>{latestStatus.message}</Text>
            {latestLog ? (
                <Text className={`mt-2 text-sm ${statusTextStyle}`}>
                    Latest: {formatGlucoseValue(latestLog.glucose_mgdl, unit)}
                    {latestLog.meal_tag ? ` (${formatMealTag(latestLog.meal_tag)})` : ''}
                </Text>
            ) : null}
        </View>
    );
}
