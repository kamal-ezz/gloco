import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type OfflineBannerProps = {
  visible: boolean;
};

export function OfflineBanner({ visible }: OfflineBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;

  return (
    <View className="flex-row items-center justify-between bg-amber-500 px-4 py-2">
      <Text className="flex-1 text-sm font-medium text-white">
        You're offline. Changes will sync when connected.
      </Text>
      <Pressable onPress={() => setDismissed(true)} className="ml-2 px-2 py-1">
        <Text className="text-sm font-bold text-white">Dismiss</Text>
      </Pressable>
    </View>
  );
}
