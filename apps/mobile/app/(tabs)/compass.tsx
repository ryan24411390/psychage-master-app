import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Canonical tab-screen template (W2-A): ScreenShell + token-variant Text only —
// no raw color/font literals. Entrance motion gated on useReducedMotion per the
// DESIGN.mobile.md §3.1 two-tier rule. Stub body until first-screen calibration.

export default function CompassScreen() {
  const reduced = useReducedMotion();
  return (
    <ScreenShell>
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="flex-1 items-center justify-center"
      >
        <View className="gap-3 items-center">
          <Text variant="headingLg">Compass</Text>
          <Text variant="body">Coming soon.</Text>
        </View>
      </Animated.View>
    </ScreenShell>
  );
}
