import { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { easingFn } from '@/lib/motion';
import { useHaptics } from '@/lib/haptic-context';

import { ENCOURAGEMENT, type BreathingPacing } from '../exercises';

type Phase = 'inhale' | 'hold' | 'exhale';

const R_BASE = 54;
const SCALE_MAX = 104 / R_BASE; // r54 → r104

export interface BreathingFormProps {
  readonly exercise: {
    readonly cues: Record<Phase, string>;
    readonly pacing: BreathingPacing;
  };
  /** Override the exercise's own pacing (the intro pace selector). Defaults to it. */
  readonly pacing?: BreathingPacing;
  readonly reduced: boolean;
}

export function BreathingForm({ exercise, pacing, reduced }: BreathingFormProps) {
  const { width } = useWindowDimensions();
  // Ensure the circle fits comfortably on smaller screens (max 208px, min depending on screen)
  const baseSize = Math.min(208, width * 0.55);
  const coreSize = baseSize * (108 / 208); // Maintain proportion

  const { cues } = exercise;
  const pace = pacing ?? exercise.pacing;
  const { inhale, hold, exhale } = pace;

  const [phase, setPhase] = useState<Phase>('inhale');
  // Whole-second countdown remaining in the current phase (the visible "count").
  const [remaining, setRemaining] = useState(() => Math.max(1, Math.round(pace.inhale / 1000)));
  const count = String(remaining);
  const scale = useSharedValue(1);
  const glowScale = useSharedValue(1);
  const { fireHaptic } = useHaptics();

  useEffect(() => {
    // Phase clock + countdown run as a plain JS state machine (discrete by design),
    // anchored at mount alongside the UI-thread scale animation below. Both share the
    // same cycle length, so the word/number stay in lockstep with the motion.
    const inSec = Math.max(1, Math.round(inhale / 1000));
    const holdSec = Math.max(0, Math.round(hold / 1000));
    const exSec = Math.max(1, Math.round(exhale / 1000));
    const cycleSec = inSec + holdSec + exSec;

    let elapsed = 0;
    let prev: Phase | null = null;

    const apply = () => {
      const t = elapsed % cycleSec;
      let nextPhase: Phase;
      let left: number;
      if (t < inSec) {
        nextPhase = 'inhale';
        left = inSec - t;
      } else if (t < inSec + holdSec) {
        nextPhase = 'hold';
        left = inSec + holdSec - t;
      } else {
        nextPhase = 'exhale';
        left = cycleSec - t;
      }
      setPhase(nextPhase);
      setRemaining(Math.max(1, Math.ceil(left)));
      if (nextPhase !== prev) {
        if (nextPhase === 'inhale') fireHaptic('breathIn');
        else if (nextPhase === 'exhale') fireHaptic('breathOut');
        prev = nextPhase;
      }
    };

    apply(); // t = 0
    const id = setInterval(() => {
      elapsed += 1;
      apply();
    }, 1000);

    // Fluid breath: ONE continuous UI-thread animation (no per-cycle JS re-trigger).
    // grow over inhale → rest at full through hold → shrink over exhale → repeat.
    if (!reduced) {
      const inhaleEasing = { duration: inhale, easing: easingFn('breath') };
      const exhaleEasing = { duration: exhale, easing: easingFn('breath') };
      scale.value = withRepeat(
        withSequence(
          withTiming(SCALE_MAX, inhaleEasing),
          withDelay(hold, withTiming(1, exhaleEasing)),
        ),
        -1,
      );
      // Soft glow: a low-opacity halo that breathes a touch wider than the clay circle,
      // so a teal rim swells on the inhale and recedes on the exhale.
      glowScale.value = withRepeat(
        withSequence(
          withTiming(SCALE_MAX + 0.2, inhaleEasing),
          withDelay(hold, withTiming(1, exhaleEasing)),
        ),
        -1,
      );
    } else {
      scale.value = 1;
      glowScale.value = 1;
    }

    return () => {
      clearInterval(id);
      cancelAnimation(scale);
      cancelAnimation(glowScale);
    };
  }, [reduced, inhale, hold, exhale, fireHaptic, scale, glowScale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ transform: [{ scale: glowScale.value }] }));

  if (reduced) {
    // Form removed — phase word (large) + countdown + the steadying line. No motion.
    return (
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text accessibilityRole="header" variant="display">
          {cues[phase]}
        </Text>
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no"
          className="font-sans-medium text-3xl text-text-secondary dark:text-text-secondary-dark"
        >
          {count}
        </Text>
        <Text className="text-center text-sm text-text-secondary dark:text-text-secondary-dark">
          {ENCOURAGEMENT}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-8 px-6">
      <View style={{ width: baseSize, height: baseSize }} className="items-center justify-center">
        {/* static boundary ring (r104) */}
        <View
          style={{ width: baseSize, height: baseSize }}
          className="absolute rounded-full border border-border dark:border-border-dark"
        />
        {/* breathing-form soft glow — low-opacity teal halo that swells with the breath */}
        <Animated.View
          style={[{ width: coreSize, height: coreSize }, glowStyle]}
          className="absolute rounded-full bg-primary/20 dark:bg-primary-dark/20"
        />
        {/* filled clay circle, breathing r54↔r104 (night clay = dark border token) */}
        <Animated.View
          testID="breath-circle"
          style={[{ width: coreSize, height: coreSize }, animatedStyle]}
          className="rounded-full bg-border dark:bg-border-dark"
        />
        {/* teal dot — the still point */}
        <View className="absolute h-2 w-2 rounded-full bg-primary dark:bg-primary-dark" />
      </View>
      <View className="items-center gap-2">
        <Text variant="display">{cues[phase]}</Text>
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no"
          className="font-sans-medium text-3xl text-text-secondary dark:text-text-secondary-dark"
        >
          {count}
        </Text>
      </View>
      <Text className="text-center text-sm text-text-secondary dark:text-text-secondary-dark">
        {ENCOURAGEMENT}
      </Text>
    </View>
  );
}
