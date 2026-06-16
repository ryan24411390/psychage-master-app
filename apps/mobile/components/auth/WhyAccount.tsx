import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { AUTH_COPY } from '@/features/auth/copy';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// S33 — Why / keep-this-safe. The honest persistence framing: why an account exists
// (cross-device), and that it is NOT required to use the app. One primary ("Use my
// email"), one quiet secondary ("Not now"). Router-agnostic — the route wires the
// callbacks so this body stays testable without expo-router.

type WhyAccountProps = {
  onPrimary: () => void;
  onSecondary: () => void;
};

export function WhyAccount({ onPrimary, onSecondary }: WhyAccountProps) {
  const reduced = useReducedMotion();

  return (
    <ScreenShell>
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="flex-1 justify-center gap-7"
      >
        <View className="gap-3">
          <Text variant="h2">{AUTH_COPY.whyTitle}</Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {AUTH_COPY.whyBody}
          </Text>
        </View>
        <View className="gap-2">
          <Button variant="primary" onPress={onPrimary}>
            {AUTH_COPY.whyPrimary}
          </Button>
          <Button variant="ghost" onPress={onSecondary}>
            {AUTH_COPY.whySecondary}
          </Button>
        </View>
      </Animated.View>
    </ScreenShell>
  );
}
