import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { THERAPIST_COPY } from '@/features/therapist/copy';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// S38 — Why / consent intro. What sharing does, what the provider sees, consent
// framing. One primary ("Add your provider"). Router-agnostic body.
type ConsentIntroProps = {
  onPrimary: () => void;
};

export function ConsentIntro({ onPrimary }: ConsentIntroProps) {
  const reduced = useReducedMotion();

  return (
    <ScreenShell>
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="flex-1 justify-center gap-7"
      >
        <View className="gap-3">
          <Text variant="h2">{THERAPIST_COPY.consentTitle}</Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {THERAPIST_COPY.consentBody}
          </Text>
        </View>
        <Button variant="primary" onPress={onPrimary}>
          {THERAPIST_COPY.consentPrimary}
        </Button>
      </Animated.View>
    </ScreenShell>
  );
}
