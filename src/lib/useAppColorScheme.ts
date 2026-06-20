import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';

export function useAppColorScheme() {
  const preference = useSettingsStore((s) => s.colorScheme);
  const systemScheme = useColorScheme();

  if (preference === 'system') {
    return systemScheme ?? 'light';
  }

  return preference;
}
