import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Compass tab — entry to the Symptom Navigator (PR B, Flow 13). The flow itself is a
// full-screen pushed route (app/navigator.tsx) so it carries no tab bar and unmounts on
// exit (zero residue, SR-4). The "Begin" launch label is a FIXTURE → CT4. Entrance
// motion gated on useReducedMotion per DESIGN.mobile.md §3.1.

export default function CompassScreen() {
  const reduced = useReducedMotion();
  return (
    <ScreenShell>
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="flex-1 items-center justify-center"
      >
        <View className="w-full items-center gap-4">
          <Text variant="headingLg">Compass</Text>
          <Button
            variant="primary"
            className="mt-2 w-full"
            onPress={() => router.push('/navigator')}
          >
            Begin
          </Button>
        </View>
      </Animated.View>
    </ScreenShell>
  );
}
