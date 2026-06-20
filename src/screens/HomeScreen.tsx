import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '../components/ScreenContainer';
import { LogCard } from '../components/LogCard';
import { LogFilters } from '../components/LogFilters';
import { EmptyState } from '../components/EmptyState';
import { StatsCard } from '../components/home/StatsCard';
import { StatusCard } from '../components/home/StatusCard';
import { GlucoseChart } from '../components/home/GlucoseChart';
import { A1CCard } from '../components/home/A1CCard';
import { ReminderCard } from '../components/home/ReminderCard';
import { ContactsCard } from '../components/home/ContactsCard';
import { ExportCard } from '../components/home/ExportCard';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import {
  glucoseLogsQuery,
  filteredGlucoseLogsQuery,
  todayStatsQuery
} from '../lib/queries/glucoseQueries';
import type { GlucoseLogFilters } from '../lib/supabase/glucoseLogs';
import type { RootStackParamList } from '../types/navigation';

function getErrorHint(message: string): string | null {
  if (/glucose_logs|relation .* does not exist|PGRST205|42P01/i.test(message)) {
    return 'Supabase table not found. Run supabase/schema.sql in Supabase SQL Editor.';
  }
  if (/permission denied|42501|row level security|policy/i.test(message)) {
    return 'RLS/policies may be missing. Re-run supabase/schema.sql and ensure you are signed in.';
  }
  return null;
}

function hasActiveFilters(filters: GlucoseLogFilters): boolean {
  return !!(filters.search || filters.mealTags?.length || filters.dateFrom || filters.dateTo || (filters.sort && filters.sort !== 'newest'));
}

export function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const unit = useSettingsStore((s) => s.unit);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filters, setFilters] = useState<GlucoseLogFilters>({});

  const filtersActive = hasActiveFilters(filters);

  const logsQ = useQuery(glucoseLogsQuery(user?.id ?? ''));
  const filteredQ = useQuery({
    ...filteredGlucoseLogsQuery(user?.id ?? '', filters),
    enabled: !!user?.id && filtersActive
  });
  const statsQ = useQuery(todayStatsQuery(user?.id ?? ''));

  const logs = filtersActive ? (filteredQ.data ?? []) : (logsQ.data ?? []);
  const stats = statsQ.data ?? { count: 0, averageGlucose: null };
  const loading = logsQ.isLoading || statsQ.isLoading;
  const error = logsQ.error ?? statsQ.error;
  const errorMessage = error instanceof Error ? error.message : error ? 'Failed to load logs' : null;
  const hint = errorMessage ? getErrorHint(errorMessage) : null;

  const onRefresh = useCallback(async () => {
    const promises = [logsQ.refetch(), statsQ.refetch()];
    if (filtersActive) promises.push(filteredQ.refetch());
    await Promise.all(promises);
  }, [logsQ, statsQ, filteredQ, filtersActive]);

  const latestLog = (logsQ.data ?? [])[0] ?? null;

  return (
    <ScreenContainer>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={logsQ.isRefetching || statsQ.isRefetching}
              onRefresh={onRefresh}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="py-3">
            <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">Today</Text>
          </View>

          <StatsCard stats={stats} unit={unit} />
          <StatusCard latestLog={latestLog} unit={unit} />
          <GlucoseChart />
          <A1CCard />
          <ReminderCard />
          <ContactsCard />
          <ExportCard logs={logs} unit={unit} />

          <Text className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {filtersActive ? 'Filtered Logs' : 'Recent Logs'}
          </Text>
          <LogFilters filters={filters} onFiltersChange={setFilters} />
          {filtersActive && filteredQ.isLoading ? (
            <View className="items-center py-6">
              <ActivityIndicator />
            </View>
          ) : logs.length === 0 ? (
            <EmptyState
              title={filtersActive ? 'No matching logs' : 'No glucose logs yet'}
              message={filtersActive ? 'Try adjusting your filters.' : 'Tap the Add Entry tab below to create your first reading.'}
            />
          ) : (
            logs.map((item, index) => (
              <LogCard
                key={item.id}
                log={item}
                index={index}
                onPress={() => navigation.navigate('EntryDetails', { id: item.id })}
              />
            ))
          )}
          {errorMessage ? (
            <View className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/30 p-3">
              <Text className="text-red-700 dark:text-red-400">{errorMessage}</Text>
              {hint ? <Text className="mt-1 text-red-700 dark:text-red-400">{hint}</Text> : null}
              <Pressable onPress={onRefresh} className="mt-2 self-start">
                <Text className="font-semibold text-red-700 dark:text-red-400">Try again</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
