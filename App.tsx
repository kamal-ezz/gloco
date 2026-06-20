import 'react-native-gesture-handler';
import './global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from './src/lib/queryClient';
import { useAuthStore } from './src/stores/authStore';
import { useAppColorScheme } from './src/lib/useAppColorScheme';
import { useNetworkStatus } from './src/lib/useNetworkStatus';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineBanner } from './src/components/OfflineBanner';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const colorScheme = useAppColorScheme();
  const isOnline = useNetworkStatus();

  useEffect(() => {
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <OfflineBanner visible={!isOnline} />
          <AppNavigator />
        </ErrorBoundary>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
