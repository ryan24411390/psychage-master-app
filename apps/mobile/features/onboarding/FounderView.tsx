import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Mascot } from '@/components/home/Mascot';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { DURATION, easingFn } from '@/lib/motion';

import { ONBOARDING_COPY } from './copy';

// S7 — founder / intention beat (Flow 1, the terminal onboarding screen). The "made with
// intention" moment, in the existing brand voice, placed AFTER the orient reinforcement so
// the user gets a calm human beat before the #132 tab tour rather than being dropped
// straight into it. The mascot is a warm closing presence: route-auto 'friendly' (the warm
// secondary-neutral) — there is no dedicated "scene" / "founder" pose, so this is the
// nearest shipped warmth (flagged in mascot.surfaces.ts). One body line carries the
// intention; a quiet attribution sits beneath it (swappable placeholder — exact name/title
// pending the founder + Dr. Dobson, not fabricated).
//
// VALENCE-BLIND: takes no moment / valence / label input; the copy names no feeling.
// markOnboardingSeen fires at THIS screen's continue (the route owns that) and nowhere
// earlier on the happy path. Reduced motion: mascot static, settle fade skipped. Copy from
// ./copy (provisional pending Dr. Dobson — see copy.ts header).

const FOUNDER_MASCOT_WIDTH = 110;

export interface FounderViewProps {
  readonly reduced: boolean;
  readonly onContinue: () => void;
}

export function FounderView({ reduced, onContinue }: FounderViewProps) {
  const Settle = reduced ? View : Animated.View;
  const settleProps = reduced
    ? {}
    : { entering: FadeIn.duration(DURATION.calm).easing(easingFn('out')) };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <Settle {...settleProps} className="flex-1 items-center justify-center gap-6 px-5 my-4">
        <Mascot testID="onboarding-founder-mascot" size={FOUNDER_MASCOT_WIDTH} />
        <Text
          testID="onboarding-founder-text"
          variant="heading"
          className="text-center px-4"
          accessibilityRole="header"
        >
          {ONBOARDING_COPY.founderBody}
        </Text>
        <Text
          variant="bodySm"
          className="text-center text-text-secondary dark:text-text-secondary-dark"
        >
          {ONBOARDING_COPY.founderAttribution}
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
