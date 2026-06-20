import type { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenContainer({ children }: PropsWithChildren) {
  return <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-900 px-4">{children}</SafeAreaView>;
}
