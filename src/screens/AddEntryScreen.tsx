import { Alert, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { LogForm, type LogFormValues } from '../components/LogForm';
import { useAuthStore } from '../stores/authStore';
import { useCreateGlucoseLog } from '../lib/queries/glucoseQueries';

export function AddEntryScreen() {
  const user = useAuthStore((s) => s.user);
  const createMutation = useCreateGlucoseLog();
  const draftStorageKey = `draft:log:create:${user?.id ?? 'anonymous'}`;

  async function handleSubmit(payload: LogFormValues) {
    if (!user) return;

    await createMutation.mutateAsync({
      ...payload,
      user_id: user.id
    });
    Alert.alert('Saved', 'Glucose log added successfully.');
  }

  return (
    <ScreenContainer>
      <View className="py-3">
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">Add Entry</Text>
      </View>
      <LogForm
        mode="create"
        onSubmit={handleSubmit}
        loading={createMutation.isPending}
        submitLabel="Save Entry"
        draftStorageKey={draftStorageKey}
      />
    </ScreenContainer>
  );
}
