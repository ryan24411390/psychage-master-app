import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { easingFn } from '@/lib/motion';

import type { BreathingExercise } from '../exercises';

// C-BREATH. A filled clay circle breathing r54↔r104 inside a static boundary ring, a
// teal dot at the centre (the still point). Pacing is 4-4-6; HOLD is stillness (no
// animation). Eased on the SYSTEM breath curve via easingFn('breath') — "add no new
// easing". (Tree-vs-prose: the order cites cubic-bezier(.37,0,.63,1); the tree's
// EASING.breath token is cubic-bezier(0.45,0,0.55,1) — tree governs, so the existing
// token is used. Flagged.)
//
// REDUCED MOTION: the form is REMOVED entirely — only the active phase word at promptLg,
// still cycling on the same 4-4-6 pacing. Night dimming falls out of the dark clay token
// (bg-border dark = night clay).

type Phase = 'inhale' | 'hold' | 'exhale';

const R_BASE = 54;
const SCALE_MAX = 104 / R_BASE; // r54 → r104

export interface BreathingFormProps {
  readonly exercise: BreathingExercise;
  readonly reduced: boolean;
}

export function BreathingForm({ exercise, reduced }: BreathingFormProps) {
  const { cues, pacing } = exercise;
  const [phase, setPhase] = useState<Phase>('inhale');
  const scale = useSharedValue(1);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const cycle = () => {
      setPhase('inhale');
      if (!reduced) scale.value = withTiming(SCALE_MAX, { duration: pacing.inhale, easing: easingFn('breath') });
      timers.push(setTimeout(() => !cancelled && setPhase('hold'), pacing.inhale));
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setPhase('exhale');
          if (!reduced) scale.value = withTiming(1, { duration: pacing.exhale, easing: easingFn('breath') });
        }, pacing.inhale + pacing.hold),
      );
      timers.push(setTimeout(() => !cancelled && cycle(), pacing.inhale + pacing.hold + pacing.exhale));
    };
    cycle();
    return () => {
      cancelled = true;
      for (const t of timers) clearTimeout(t);
    };
  }, [reduced, pacing, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (reduced) {
    // Form removed — phase word only, at promptLg.
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text
          accessibilityRole="header"
          className="font-display text-[32px] text-text-primary dark:text-text-primary-dark"
        >
          {cues[phase]}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-8">
      <View className="h-[208px] w-[208px] items-center justify-center">
        {/* static boundary ring (r104) */}
        <View className="absolute h-[208px] w-[208px] rounded-full border border-border dark:border-border-dark" />
        {/* filled clay circle, breathing r54↔r104 (night clay = dark border token) */}
        <Animated.View
          testID="breath-circle"
          className="h-[108px] w-[108px] rounded-full bg-border dark:bg-border-dark"
          style={animatedStyle}
        />
        {/* teal dot — the still point */}
        <View className="absolute h-2 w-2 rounded-full bg-primary dark:bg-primary-dark" />
      </View>
      <Text className="font-display text-[22px] text-text-primary dark:text-text-primary-dark">
        {cues[phase]}
      </Text>
    </View>
  );
}
