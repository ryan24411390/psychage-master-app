import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Slice 5 validation surface: minimum content to exercise primitive + token +
// haptic + motion pipeline. Not a feature build — content here seeds Slice 8
// type/spacing calibration with a real (not synthetic) rendered surface.

export default function TodayScreen() {
  const reduced = useReducedMotion();
  return (
    <ScreenShell>
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="flex-1 items-center justify-center"
      >
        <View className="gap-3 items-center">
          <Text variant="headingLg">Today</Text>
          <Text variant="body">Placeholder content for primitive validation.</Text>
          <Button variant="primary" onPress={() => {}}>
            Tap to test affirm haptic
          </Button>
        </View>
      </Animated.View>
    </ScreenShell>
  );
}
