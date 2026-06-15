import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { HomeCardSlot } from '@/components/home/HomeCardSlot';
import { Mascot } from '@/components/home/Mascot';
import { ReflectionRow } from '@/components/home/ReflectionRow';
import { Terrain } from '@/components/terrain/Terrain';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { type HomeViewModel, READ_CREDIT } from '@/lib/home-model';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// S3 presentational view (sub-slice D structure). Takes a derived HomeViewModel +
// handlers; the stateful wiring (state selection, clock, RecordStore) lives in the
// screen. Anatomy top→bottom: state zone (greeting + Fraunces-italic status +
// mascot) · record well (pressed) with the 7-day terrain · check-in CTA · card slot
// · "When you need something now" bento · "Care and learning" (today's read + rail)
// · mission footer. The page-load SETTLE fires on the content; reduced motion = in
// place. Bento/read/rail tiles are static placeholders (their tools are later waves).

// Article rail — verbatim v5 Library chiprow, fixed order.
const ARTICLE_RAIL = ['Anxiety & stress', 'Sleep', 'Relationships', 'More topics'];

type HomeViewProps = {
  model: HomeViewModel;
  onCheckIn: () => void;
  onHistory: () => void;
  /** Bumps to fire the home Imprint (first save of today only — never on re-save). */
  imprintSignal?: number;
  /** Bumps to tilt the mascot. */
  tiltSignal?: number;
  /** Show the one-time "reflection ready" row on the record well (Flow 12). */
  reflectionReady?: boolean;
  /** Tap handler for the reflection row (marks it opened + opens S9 when it lands). */
  onReflectionOpen?: () => void;
};

export function HomeView({
  model,
  onCheckIn,
  onHistory,
  imprintSignal = 0,
  tiltSignal = 0,
  reflectionReady = false,
  onReflectionOpen,
}: HomeViewProps) {
  const reduced = useReducedMotion();
  const [terrainWidth, setTerrainWidth] = useState(318);

  // Imprint — scale .985→1 (~320ms) + a teal inset ring flash on the record well.
  // Reduced motion = instant fill (no animation); the haptic fires in the container.
  const imprintScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  useEffect(() => {
    if (imprintSignal === 0 || reduced) return;
    imprintScale.value = withSequence(
      withTiming(0.985, { duration: 0 }),
      withTiming(1, { duration: 320, easing: easingFn('out') }),
    );
    ringOpacity.value = withSequence(
      withTiming(0.9, { duration: 120, easing: easingFn('out') }),
      withTiming(0, { duration: 320, easing: easingFn('standard') }),
    );
  }, [imprintSignal, reduced, imprintScale, ringOpacity]);
  const wellStyle = useAnimatedStyle(() => ({ transform: [{ scale: imprintScale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOpacity.value }));

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        contentContainerClassName="px-4 pb-10 pt-3"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={
            reduced ? undefined : FadeInUp.duration(DURATION.base).easing(easingFn('standard'))
          }
          className="gap-6"
        >
          {/* STATE ZONE */}
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text variant="headingLg">{model.greeting}</Text>
              <Text
                variant="body"
                className="font-display italic text-text-secondary dark:text-text-secondary-dark"
              >
                {model.status}
              </Text>
            </View>
            <Mascot tiltSignal={tiltSignal} />
          </View>

          {/* RECORD WELL — pressed ("it's yours"); Imprint flashes on first save */}
          <Animated.View
            style={wellStyle}
            className="overflow-hidden rounded-xl bg-surface-active px-4 py-4 dark:bg-surface-active-dark"
          >
            <View className="absolute left-0 right-0 top-0 h-[1.5px] bg-charcoal-950/10" />
            <Animated.View
              pointerEvents="none"
              style={ringStyle}
              className="absolute inset-0 rounded-xl border-2 border-primary dark:border-primary-dark"
            />
            <View className="flex-row items-center justify-between">
              <Text
                variant="caption"
                className="text-text-secondary dark:text-text-secondary-dark"
              >
                {model.recordLabel}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="History"
                onPress={onHistory}
                hitSlop={8}
                className="min-h-[44px] justify-center"
              >
                <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
                  History
                </Text>
              </Pressable>
            </View>
            <View
              className="mt-1"
              onLayout={(e) => setTerrainWidth(e.nativeEvent.layout.width)}
            >
              <Terrain days={model.terrainDays} width={terrainWidth} />
            </View>
            {/* Reflection-ready row — in place, no settle (consistent with S3) */}
            {reflectionReady && <ReflectionRow onOpen={onReflectionOpen} />}
          </Animated.View>

          {/* CHECK-IN CTA */}
          <Button variant="primary" onPress={onCheckIn}>
            {model.ctaLabel}
          </Button>

          {/* HOME CARD SLOT (bridge > reminder) */}
          <HomeCardSlot card={model.card} />

          {/* WHEN YOU NEED SOMETHING NOW */}
          <View className="gap-2">
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
              When you need something now
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {}}
              className="rounded-xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark"
            >
              <Text variant="heading">Steady yourself right now</Text>
              <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
                Toolkit
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {}}
              className="rounded-xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark"
            >
              <Text variant="heading">Make sense of what you feel</Text>
              <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
                Symptom Navigator
              </Text>
            </Pressable>
          </View>

          {/* CARE AND LEARNING */}
          <View className="gap-2">
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
              Care and learning
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {}}
              className="gap-1 rounded-xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark"
            >
              <View className="flex-row items-center gap-2">
                <Text
                  variant="caption"
                  className="rounded-full bg-surface-active px-2 py-0.5 text-text-secondary dark:bg-surface-active-dark dark:text-text-secondary-dark"
                >
                  {model.read.tag}
                </Text>
                <Text
                  variant="caption"
                  className="text-text-tertiary dark:text-text-tertiary-dark"
                >
                  {model.read.meta}
                </Text>
              </View>
              <Text variant="bodyBold">{model.read.title}</Text>
              <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
                {READ_CREDIT}
              </Text>
            </Pressable>
            <View className="flex-row flex-wrap gap-2">
              {ARTICLE_RAIL.map((topic) => (
                <Pressable
                  key={topic}
                  accessibilityRole="button"
                  onPress={() => {}}
                  className="min-h-[44px] justify-center rounded-full border border-border px-3 dark:border-border-dark"
                >
                  <Text variant="bodySm">{topic}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* MISSION FOOTER */}
          <Text
            variant="caption"
            className="text-center text-text-secondary dark:text-text-secondary-dark"
          >
            Free for everyone · 5 languages · No ads
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
