import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)} className="items-center py-10">
      <Text className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-300">{title}</Text>
      <Text className="mb-4 text-center text-sm text-slate-500 dark:text-slate-400">{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="rounded-lg bg-brand-600 px-5 py-2"
        >
          <Text className="font-semibold text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
