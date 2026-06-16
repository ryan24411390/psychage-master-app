import { useEffect } from 'react';
import { TextInput, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/lib/motion';

// CountUpText — a number that animates from 0 → `value` on mount, matching the web
// ScoreGauge's framer-motion count-up (1.2s, easeOut). Reanimated drives a read-only
// TextInput's `text` prop per frame (the canonical RN count-up trick — Text can't take
// an animated child string). Reduced motion → the final value renders immediately.

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
// `text` is not a default whitelisted animated prop; register it once.
Animated.addWhitelistedNativeProps({ text: true });

/** framer-motion 'easeOut' ≈ cubic-bezier(0, 0, 0.58, 1). */
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);

export interface CountUpTextProps {
  readonly value: number;
  readonly durationMs?: number;
  readonly style?: TextStyle;
}

export function CountUpText({ value, durationMs = 1200, style }: CountUpTextProps) {
  const reduced = useReducedMotion();
  const sv = useSharedValue(reduced ? value : 0);

  useEffect(() => {
    sv.value = reduced ? value : withTiming(value, { duration: durationMs, easing: EASE_OUT });
  }, [value, reduced, durationMs, sv]);

  // `text` is a real native prop on TextInput but not in its TS props; cast through.
  const animatedProps = useAnimatedProps(() => {
    const n = Math.round(sv.value);
    return { text: String(n), defaultValue: String(n) };
  });

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      // Accessibility: the gauge wrapper carries the spoken label; hide this from a11y.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={style}
      animatedProps={animatedProps as never}
    />
  );
}
