import { useEffect } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { easingFn, useReducedMotion } from '@/lib/motion';

// Animated confidence bar + percentage — mobile port of web ResultCard's <motion.div>
// fill. Width animates 0 → capped width over 600ms (easeOut, 200ms delay), exactly like
// web. The 0.75 cap is the engine's CONFIDENCE_CAP: width clamps to [8,75]%, the number
// to [1,75]. Strong matches fill teal; exploratory fill amber (warning token).
//
// This is the deliberate, signed-off override of the mobile "no bar/meter/percentage"
// relevance guard (see the result-card relevance decision) — full web parity.

export interface ConfidenceBarProps {
  /** Engine relevance_score (0–0.75, already capped). */
  readonly score: number;
  /** Exploratory (low/minimal) → amber fill; otherwise teal. */
  readonly exploratory: boolean;
}

export function ConfidenceBar({ score, exploratory }: ConfidenceBarProps) {
  const reduced = useReducedMotion();
  const pct = Math.round(score * 100);
  const barPct = Math.min(75, Math.max(8, pct)); // web: width clamp [8,75]
  const labelPct = Math.min(75, Math.max(1, pct)); // web: number clamp [1,75]

  const trackWidth = useSharedValue(0);
  const frac = useSharedValue(0);

  useEffect(() => {
    const target = barPct / 100;
    frac.value = reduced
      ? target
      : withDelay(200, withTiming(target, { duration: 600, easing: easingFn('out') }));
  }, [barPct, reduced, frac]);

  const fillStyle = useAnimatedStyle(() => ({ width: trackWidth.value * frac.value }));

  const onLayout = (e: LayoutChangeEvent) => {
    trackWidth.value = e.nativeEvent.layout.width;
  };

  return (
    <View className="flex-row items-center gap-2.5">
      <View
        onLayout={onLayout}
        className="h-1.5 max-w-[120px] flex-1 overflow-hidden rounded-full bg-border/60 dark:bg-border-dark/60"
      >
        <Animated.View
          style={fillStyle}
          className={`h-full rounded-full ${exploratory ? 'bg-warning dark:bg-warning-dark' : 'bg-teal-500'}`}
        />
      </View>
      <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
        {labelPct}%
      </Text>
    </View>
  );
}
