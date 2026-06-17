import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Mascot } from '@/components/home/Mascot';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { DURATION, easingFn } from '@/lib/motion';

import { ONBOARDING_COPY } from './copy';

// S6 — orient reinforcement (Flow 1, the close). After the acknowledgment settles, one
// calm screen restates the EVENT-INITIATED model: a Moment is noticed when the person
// chooses, never on a schedule. This is NOT covered by the #132 tour (which introduces the
// tabs), so it earns its own screen. The mascot opens warmly to the ready space: route-auto
// 'encouraging' (a non-idle pose, so static) at host scale; the inviting read toward the
// continue action is the layout (mascot above, primary in the thumb zone), not a pose.
//
// VALENCE-BLIND: takes no moment / valence / label input; the copy names no feeling.
// Reduced motion: mascot static, settle fade skipped. Copy from ./copy (provisional
// pending Dr. Dobson — see copy.ts header).

const ORIENT_MASCOT_WIDTH = 143; // host scale, matching S4

export interface OrientViewProps {
  readonly reduced: boolean;
  readonly onContinue: () => void;
}

export function OrientView({ reduced, onContinue }: OrientViewProps) {
  const Settle = reduced ? View : Animated.View;
  const settleProps = reduced
    ? {}
    : { entering: FadeIn.duration(DURATION.calm).easing(easingFn('out')) };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <Settle {...settleProps} className="flex-1 items-center justify-center gap-6 px-5 my-4">
        <Mascot testID="onboarding-orient-mascot" size={ORIENT_MASCOT_WIDTH} />
        <Text variant="headingLg" className="text-center px-4" accessibilityRole="header">
          {ONBOARDING_COPY.orientTitle}
        </Text>
        <Text
          variant="body"
          className="text-center text-text-secondary dark:text-text-secondary-dark px-4"
        >
          {ONBOARDING_COPY.orientBody}
        </Text>
      </Settle>
      <SafeAreaView edges={['bottom']} className="px-5 pb-2">
        <Button variant="primary" size="lg" className="w-full" onPress={onContinue}>
          {ONBOARDING_COPY.continue}
        </Button>
      </SafeAreaView>
    </View>
  );
}
