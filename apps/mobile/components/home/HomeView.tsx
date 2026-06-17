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
import { RecordChart } from '@/components/home/RecordChart';
import { PrimaryAction } from '@/components/home/PrimaryAction';
import { PickUpRail } from '@/components/home/PickUpRail';
import { ToolsBento } from '@/components/home/ToolsBento';
import { MostRead } from '@/components/home/MostRead';
import { CareAndLearning } from '@/components/home/CareAndLearning';
import { Text } from '@/components/ui/Text';
import { ToolSummaryCard } from '@/features/insights/ToolSummaryCard';
import { ctaLabel, type HomeViewModel } from '@/lib/home-model';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// S3 presentational view (sub-slice D structure). Takes a derived HomeViewModel +
// handlers; the stateful wiring (state selection, clock, RecordStore) lives in the
// screen. Anatomy top→bottom: state zone (greeting + Fraunces-italic status +
// mascot) · record well (pressed) with the 14-day terrain · check-in CTA · card slot
// (steadying bridge) · in-progress reads · "When you need something now" bento ·
// "Most read this month" · "Care & learning" doorways · mission footer. The page-load
// SETTLE fires on the content; reduced motion = in place.

type HomeViewProps = {
  model: HomeViewModel;
  onCheckIn: () => void;
  onHistory: () => void;
  /** Opens the cross-tool Insights screen (from the "Your tools" summary card). */
  onInsights?: () => void;
  /** Steadying-bridge "Breathing" chip — opens the real breathing flow. */
  onBreathing?: () => void;
  /** Steadying-bridge "Not now" — dismisses the card for the session. */
  onDismissBridge?: () => void;
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
  onInsights,
  onBreathing,
  onDismissBridge,
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
        contentContainerClassName="px-5 pb-10 pt-3"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={
            reduced ? undefined : FadeInUp.springify().damping(18).stiffness(150).mass(0.8)
          }
          className="gap-8"
        >
          {/* STATE ZONE */}
          <View className="flex-row items-start justify-between gap-3 bg-surface-accent/30 border border-border-accent/50 dark:bg-surface-accent-dark/15 dark:border-border-accent-dark/30 p-5 rounded-xl shadow-sm">
            <View className="flex-1 gap-1">
              <Text variant="h1">{model.greeting}</Text>
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
            className="overflow-hidden rounded-xl bg-surface-active p-5 shadow-base dark:bg-surface-active-dark"
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
                <Text variant="bodyLarge" className="text-primary dark:text-primary-dark">
                  History
                </Text>
              </Pressable>
            </View>
            <View
              className="mt-1"
              onLayout={(e) => setTerrainWidth(e.nativeEvent.layout.width)}
            >
              <RecordChart days={model.terrainDays} insight={model.insight} width={terrainWidth} />
            </View>
            {/* Reflection-ready row — in place, no settle (consistent with S3) */}
            {reflectionReady && <ReflectionRow onOpen={onReflectionOpen} />}
          </Animated.View>

          {/* YOUR TOOLS — cross-tool summary; taps into the Insights drill-down */}
          <ToolSummaryCard summaries={model.tools} onOpen={onInsights ?? (() => {})} />

          {/* CHECK-IN CTA / ADAPTIVE ACTION */}
          <PrimaryAction
            checkedInToday={model.ctaLabel === ctaLabel(true)} 
            dormantTool={model.dormantTool} 
            onCheckIn={onCheckIn} 
          />

          {/* HOME CARD SLOT (bridge > reminder) */}
          <HomeCardSlot
            card={model.card}
            onBreathing={onBreathing}
            onDismissBridge={onDismissBridge}
          />

          {/* IN-PROGRESS READS */}
          <PickUpRail reads={model.inProgressReads} />

          {/* TOOLS BENTO */}
          <ToolsBento />

          {/* EDITORIAL MOST READ */}
          <MostRead />

          {/* CARE & LEARNING — outward doorways */}
          <CareAndLearning />

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
