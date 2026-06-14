import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';

import { colorForScheme, resolveColorRef, type ThemedColor } from '@/lib/a1-tokens';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Onboarding HOST mascot — its biggest moment (S1). The founder-delivered asset belongs
// in apps/mobile/assets/mascot/, which does NOT exist yet, so this renders the SAME
// correctly-dimensioned clay-figure PLACEHOLDER the A1 home Mascot established, scaled to
// the HOST size step (130×150 = 1.7× the standard 76×88). FLAGGED: swap for the real
// M-1/M-2 asset when it lands. Breathing = the mascot-breathing verb (reduced = static).
// Decorative, hidden from VoiceOver. (A1's Mascot is read-only and not size-parameterized,
// so the geometry is duplicated here at host scale rather than edited there.)

const HOST_W = 130;
const HOST_H = 150;
const BREATHE_SCALE = 1.03;

export function OnboardingMascot({ testID }: { testID?: string }) {
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

  const breathingStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={breathingStyle}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    >
      <Svg width={HOST_W} height={HOST_H} viewBox="0 0 80 92">
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
