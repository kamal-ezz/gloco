import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { LogForm } from '../components/LogForm';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuthStore } from '../stores/authStore';
import {
  glucoseLogDetailQuery,
  useUpdateGlucoseLog,
  useDeleteGlucoseLog
} from '../lib/queries/glucoseQueries';
import type { GlucoseLogUpdate } from '../types/database';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'EntryDetails'>;

export function EntryDetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const user = useAuthStore((s) => s.user);

  const logQ = useQuery(glucoseLogDetailQuery(user?.id ?? '', id));
  const updateMutation = useUpdateGlucoseLog();
  const deleteMutation = useDeleteGlucoseLog();

  const log = logQ.data ?? null;
  const loading = logQ.isLoading;
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate(payload: GlucoseLogUpdate) {
    if (!user) return;
    await updateMutation.mutateAsync({ id, userId: user.id, payload });
    Alert.alert('Updated', 'Entry updated successfully.');
  }

  async function handleDelete() {
    if (!user) return;

    Alert.alert('Delete entry', 'Are you sure you want to delete this log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id, userId: user.id });
            navigation.goBack();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
          }
        }
      }
    ]);
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-3 text-slate-600 dark:text-slate-400">Loading entry...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!log) {
    const errorMsg = logQ.error instanceof Error ? logQ.error.message : (error ?? 'Entry not found.');
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-700 dark:text-slate-300">{errorMsg}</Text>
          <View className="mt-3 flex-row gap-2">
            <Pressable
              onPress={() => void logQ.refetch()}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2"
            >
              <Text className="font-medium text-slate-700 dark:text-slate-300">Retry</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.goBack()}
              className="rounded-lg bg-slate-900 px-4 py-2"
            >
              <Text className="font-medium text-white">Back</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="py-3">
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">Entry Details</Text>
      </View>

      {error ? <Text className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</Text> : null}

      <LogForm
        mode="edit"
        initial={log}
        onSubmit={handleUpdate}
        loading={updateMutation.isPending || deleteMutation.isPending}
        submitLabel="Save Changes"
      />

      <Pressable
        onPress={handleDelete}
        disabled={updateMutation.isPending || deleteMutation.isPending}
        className="mb-4 items-center rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-4 py-3"
      >
        <Text className="font-semibold text-red-700 dark:text-red-400">
          {deleteMutation.isPending ? 'Deleting...' : 'Delete Entry'}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
