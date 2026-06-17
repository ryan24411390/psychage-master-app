import { Image } from 'expo-image';
import { usePathname } from 'expo-router';
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

import { MASCOT_IDLE_STATES, MASCOT_SOURCES, type MascotState } from '@/features/mascot/manifest';
import { resolveMascotState } from '@/features/mascot/mascot.surfaces';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Mascot — the route-aware presence layer over the founder-delivered clay-figure assets
// (apps/mobile/assets/mascot/, manifest in @/features/mascot). Replaces the prior SVG
// placeholder. Two modes:
//   • no `state` prop → reads the active route and renders MASCOT_BY_ROUTE[route]
//     (with the Today time-of-day / dark-theme override);
//   • explicit `state` prop → renders that state (contextual sites: empty/error/etc.).
// ALWAYS renders null on a MASCOT_FORBIDDEN route (crisis / Navigator / delete-account)
// or when `suppressed` (Storm Check sub-state) — regardless of any explicit state.
// Breathing scale-loop runs only on idle states; tilt-on-save (tiltSignal) is preserved.
// Decorative, hidden from VoiceOver.

const DEFAULT_WIDTH = 125;
const ASPECT = 1.15; // height ≈ 1.15× width — roughly the figure's standing footprint
const BREATHE_SCALE = 1.03;

type MascotProps = {
  testID?: string;
  /** Explicit state for contextual render sites. Omit for route-driven presence. */
  state?: MascotState;
  /** Storm Check (and future) sub-state guard — forces null regardless of route/state. */
  suppressed?: boolean;
  /** Rendered width in px (height derived by aspect). */
  size?: number;
  /** Bumps to fire a single tilt — on save, and the one return tilt after an absence. */
  tiltSignal?: number;
};

export function Mascot({ testID, state, suppressed, size = DEFAULT_WIDTH, tiltSignal = 0 }: MascotProps) {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const { colorScheme } = useColorScheme();

  const resolved = resolveMascotState({
    pathname,
    state,
    suppressed,
    hour: new Date().getHours(),
    isDark: colorScheme === 'dark',
  });

  const isIdle = resolved !== null && MASCOT_IDLE_STATES.has(resolved);

  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduced || !isIdle) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withTiming(BREATHE_SCALE, { duration: DURATION.breath / 2, easing: easingFn('breath') }),
      -1,
      true,
    );
    return () => cancelAnimation(scale);
  }, [reduced, isIdle, scale]);

  const tilt = useSharedValue(0);
  useEffect(() => {
    if (tiltSignal === 0 || reduced) return;
    tilt.value = withSequence(
      withTiming(-0.12, { duration: 140, easing: easingFn('out') }),
      withTiming(0, { duration: 240, easing: easingFn('standard') }),
    );
  }, [tiltSignal, reduced, tilt]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${tilt.value}rad` }],
  }));

  // Sacred Rule: forbidden routes and suppressed sub-states get NO mascot, ever.
  if (resolved === null) return null;

  const width = size;
  const height = Math.round(size * ASPECT);

  return (
    <Animated.View
      style={animatedStyle}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    >
      <Image
        source={MASCOT_SOURCES[resolved]}
        style={{ width, height }}
        contentFit="contain"
        // Decorative — keep transitions cheap; the figure never animates between states.
        transition={0}
      />
    </Animated.View>
  );
}
