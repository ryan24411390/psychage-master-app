import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { DURATION, easingFn } from '@/lib/motion';

import { ONBOARDING_COPY } from './copy';
import { OnboardingMascot } from './OnboardingMascot';

// S1 Welcome (Flow 1) — the mascot's host moment. GlobalHeader (Help-now pill reachable
// before the user has done anything), the host mascot LARGE + breathing, the Fraunces
// display title, one line of body, and a single primary "Continue" in the thumb zone.
// Nothing else — no carousel, dots, or skip. Reduced motion: mascot still + settle skipped.
// All copy VERBATIM Flow Book (now sourced from ./copy — CT4 §1).

const TITLE = ONBOARDING_COPY.welcomeTitle;
const BODY = ONBOARDING_COPY.welcomeBody;

export interface WelcomeViewProps {
  readonly reduced: boolean;
  readonly onContinue: () => void;
}

export function WelcomeView({ reduced, onContinue }: WelcomeViewProps) {
  const Settle = reduced ? View : Animated.View;
  const settleProps = reduced
    ? {}
    : { entering: FadeIn.duration(DURATION.calm).easing(easingFn('out')) };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <Settle {...settleProps} className="flex-1 items-center justify-center gap-6 px-6 my-4">
        <View className="mb-4">
          <OnboardingMascot testID="onboarding-host-mascot" />
        </View>
        <Text variant="headingLg" className="text-center" accessibilityRole="header">
          {TITLE}
        </Text>
        <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark px-4">
          {BODY}
        </Text>
      </Settle>
      <SafeAreaView edges={['bottom']} className="px-6 pb-2">
        <Button variant="primary" size="lg" className="w-full" onPress={onContinue}>
          {ONBOARDING_COPY.continue}
        </Button>
      </SafeAreaView>
    </View>
  );
}
