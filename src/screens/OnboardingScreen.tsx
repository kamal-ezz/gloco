import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  type ListRenderItemInfo,
  type ViewToken
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSettingsStore } from '../stores/settingsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Slide = {
  id: string;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Track your glucose',
    description: 'Log your readings, stay in control of your health, and spot trends over time.'
  },
  {
    id: '2',
    title: 'Smart reminders & reports',
    description: 'Set reminders, export PDF reports, and manage emergency contacts in one place.'
  },
  {
    id: '3',
    title: 'Ready to start?',
    description: 'Sign in or create an account to begin tracking your glucose.'
  }
];

export function OnboardingScreen() {
  const setHasCompletedOnboarding = useSettingsStore((s) => s.setHasCompletedOnboarding);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      setHasCompletedOnboarding(true);
    }
  }

  function handleSkip() {
    setHasCompletedOnboarding(true);
  }

  function renderItem({ item }: ListRenderItemInfo<Slide>) {
    return (
      <View style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-8">
        <Animated.View entering={FadeIn.duration(500)}>
          <Text className="mb-4 text-center text-3xl font-bold text-slate-900 dark:text-slate-100">
            {item.title}
          </Text>
          <Text className="text-center text-lg text-slate-600 dark:text-slate-400">
            {item.description}
          </Text>
        </Animated.View>
      </View>
    );
  }

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      <View className="absolute right-4 top-14 z-10">
        <Pressable onPress={handleSkip} className="px-4 py-2">
          <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      <View className="items-center pb-12">
        <View className="mb-6 flex-row gap-2">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === activeIndex ? 'w-6 bg-brand-600' : 'w-2 bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          className="w-64 items-center rounded-xl bg-brand-600 px-6 py-4"
        >
          <Text className="text-lg font-semibold text-white">
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
