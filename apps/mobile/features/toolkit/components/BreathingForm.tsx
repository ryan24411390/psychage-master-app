import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { easingFn } from '@/lib/motion';
import { useHaptics } from '@/lib/haptic-context';

type Phase = 'inhale' | 'hold' | 'exhale';

const R_BASE = 54;
const SCALE_MAX = 104 / R_BASE; // r54 → r104

export interface BreathingFormProps {
  readonly exercise: {
    readonly cues: Record<Phase, string>;
    readonly pacing: {
      readonly inhale: number;
      readonly hold: number;
      readonly exhale: number;
    };
  };
  readonly reduced: boolean;
}

export function BreathingForm({ exercise, reduced }: BreathingFormProps) {
  const { cues, pacing } = exercise;
  const [phase, setPhase] = useState<Phase>('inhale');
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const { fireHaptic } = useHaptics();

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    
    const cycle = () => {
      setPhase('inhale');
      if (!cancelled) {
        fireHaptic('breathIn');
        if (!reduced) {
          scale.value = withTiming(SCALE_MAX, { duration: pacing.inhale, easing: easingFn('breath') });
          pulseScale.value = 1;
          pulseOpacity.value = 0.5;
          pulseScale.value = withTiming(SCALE_MAX + 0.2, { duration: pacing.inhale, easing: easingFn('breath') });
          pulseOpacity.value = withTiming(0, { duration: pacing.inhale });
        }
      }
      
      timers.push(
        setTimeout(() => {
          if (!cancelled) {
            setPhase('hold');
          }
        }, pacing.inhale)
      );

      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setPhase('exhale');
          fireHaptic('breathOut');
          if (!reduced) {
            scale.value = withTiming(1, { duration: pacing.exhale, easing: easingFn('breath') });
          }
        }, pacing.inhale + pacing.hold)
      );

      timers.push(
        setTimeout(() => {
          if (!cancelled) {
            cycle();
          }
        }, pacing.inhale + pacing.hold + pacing.exhale)
      );
    };

    cycle();
    return () => {
      cancelled = true;
      for (const t of timers) clearTimeout(t);
    };
  }, [reduced, pacing, scale, pulseScale, pulseOpacity, fireHaptic]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

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
        {/* dispersing pulse ring */}
        <Animated.View
          className="absolute h-[108px] w-[108px] rounded-full bg-primary/20 dark:bg-primary-dark/20"
          style={pulseStyle}
        />
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
