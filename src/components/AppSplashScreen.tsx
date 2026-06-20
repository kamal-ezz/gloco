import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Text, View } from 'react-native';

export function AppSplashScreen() {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );

    pulseLoop.start();
    spinLoop.start();

    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [pulse, spin]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06]
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5]
  });

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View className="flex-1 items-center justify-center bg-slate-100">
      <View
        className="absolute h-56 w-56 rounded-full bg-brand-100"
        style={{ top: -40, left: -50, opacity: 0.5 }}
      />
      <View
        className="absolute h-64 w-64 rounded-full bg-brand-50"
        style={{ bottom: -90, right: -90, opacity: 0.8 }}
      />

      <Animated.View
        className="items-center justify-center"
        style={{ transform: [{ scale }] }}
      >
        <Animated.View
          className="absolute h-24 w-24 rounded-full bg-brand-100"
          style={{ opacity: glowOpacity }}
        />

        <Image
          source={require('../../assets/icon.png')}
          className="h-16 w-16 rounded-2xl"
          resizeMode="cover"
        />

        <Animated.View
          className="absolute h-24 w-24 rounded-full border-2"
          style={{
            borderColor: '#93c5fd',
            borderTopColor: '#2563eb',
            transform: [{ rotate }]
          }}
        />
      </Animated.View>

      <Text className="mt-8 text-2xl font-bold text-slate-900">Gloco</Text>
      <Text className="mt-1 text-sm text-slate-600">Securing your session</Text>

      <View className="mt-6 flex-row items-center">
        <ActivityIndicator color="#2563eb" />
        <Text className="ml-2 text-sm text-slate-600">Loading your dashboard...</Text>
      </View>
    </View>
  );
}
