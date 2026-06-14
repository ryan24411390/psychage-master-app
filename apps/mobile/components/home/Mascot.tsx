import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';

import { colorForScheme, resolveColorRef, type ThemedColor } from '@/lib/a1-tokens';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Mascot — the founder-delivered asset belongs in apps/mobile/assets/mascot/. That
// directory does NOT exist yet, so this renders a correctly-dimensioned clay-figure
// PLACEHOLDER (ported from the v5 mascot SVG). FLAGGED: swap for the real asset when
// it lands. Breathing is the mascot-breathing motion verb — a slow scale loop over
// motion.duration.breath; reduced motion = static. Decorative, hidden from VoiceOver.
// (Tilt-on-save + return-tilt are sub-slice E.)

const WIDTH = 76;
const HEIGHT = 88;
const BREATHE_SCALE = 1.03;

type MascotProps = {
  testID?: string;
  /** Bumps to fire a single tilt — on save, and the one return tilt after an absence. */
  tiltSignal?: number;
};

export function Mascot({ testID, tiltSignal = 0 }: MascotProps) {
  const reduced = useReducedMotion();
  const { colorScheme } = useColorScheme();
  const pick = (themed: ThemedColor) => colorForScheme(themed, colorScheme);

  const clay = pick(resolveColorRef('color.border.default'));
  const stroke = pick(resolveColorRef('color.border.hover'));
  const eyes = pick(resolveColorRef('color.text.tertiary'));
  const teal = pick(resolveColorRef('color.primary.default'));

  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withTiming(BREATHE_SCALE, { duration: DURATION.breath / 2, easing: easingFn('breath') }),
      -1,
      true,
    );
    return () => cancelAnimation(scale);
  }, [reduced, scale]);

  const tilt = useSharedValue(0);
  useEffect(() => {
    if (tiltSignal === 0 || reduced) return;
    tilt.value = withSequence(
      withTiming(-0.12, { duration: 140, easing: easingFn('out') }),
      withTiming(0, { duration: 240, easing: easingFn('standard') }),
    );
  }, [tiltSignal, reduced, tilt]);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${tilt.value}rad` }],
  }));

  return (
    <Animated.View
      style={breathingStyle}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    >
      <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 80 92">
        <Ellipse cx={40} cy={86} rx={20} ry={4} fill="rgba(46,44,40,0.08)" />
        <Rect x={26} y={52} width={28} height={34} rx={13} fill={clay} stroke={stroke} />
        <Circle cx={40} cy={30} r={26} fill={clay} stroke={stroke} />
        <Circle cx={32} cy={30} r={2.6} fill={eyes} />
        <Circle cx={48} cy={30} r={2.6} fill={eyes} />
        <Circle cx={40} cy={62} r={3.4} fill={teal} />
      </Svg>
    </Animated.View>
  );
}
