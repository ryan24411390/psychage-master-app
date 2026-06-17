import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Mascot } from '@/components/home/Mascot';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { DURATION, easingFn } from '@/lib/motion';

import { ONBOARDING_COPY } from './copy';

// S2 — "what naming does" (Flow 1). The mascot guides: smaller than the host scale,
// 'guiding' (route-auto via /onboarding/naming), in the upper third — directing the user
// toward the act of naming. One line of body, a primary that names the time
// cost honestly ("— 20 seconds"), and a quiet "Look around first" text-link that exits to
// the first-run home. GlobalHeader keeps the Help-now pill reachable. Copy from ./copy
// (provisional pending Dr. Dobson). Reduced motion: settle fade skipped; mascot is static.

const SECONDARY_WIDTH = 114; // below host (169), above the Today footprint feel

export interface NamingViewProps {
  readonly reduced: boolean;
  readonly onName: () => void;
  readonly onLookAround: () => void;
}

export function NamingView({ reduced, onName, onLookAround }: NamingViewProps) {
  const Settle = reduced ? View : Animated.View;
  const settleProps = reduced
    ? {}
    : { entering: FadeIn.duration(DURATION.calm).easing(easingFn('out')) };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <Settle {...settleProps} className="flex-1 items-center gap-6 px-5 pt-10">
        <Mascot testID="onboarding-naming-mascot" size={SECONDARY_WIDTH} />
        <Text
          variant="body"
          className="text-center text-text-primary dark:text-text-primary-dark px-2"
        >
          {ONBOARDING_COPY.namingBody}
        </Text>
      </Settle>
      <SafeAreaView edges={['bottom']} className="gap-3 px-5 pb-2">
        <Button variant="primary" size="lg" className="w-full" onPress={onName}>
          {ONBOARDING_COPY.nameFirstMoment}
        </Button>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ONBOARDING_COPY.lookAround}
          onPress={onLookAround}
          hitSlop={8}
          className="min-h-[44px] items-center justify-center active:scale-[0.98]"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
            {ONBOARDING_COPY.lookAround}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
