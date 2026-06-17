import { Pressable, View } from 'react-native';
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
// display title, one line of body, a single primary "Begin" in the thumb zone, and a quiet
// "Already have a record? Sign in" text-link (link weight only — no wall; the anonymous-
// first invariant means signing in is optional). Reduced motion: mascot still + settle
// skipped. Copy from ./copy (provisional pending Dr. Dobson — see copy.ts header).

const TITLE = ONBOARDING_COPY.welcomeTitle;
const BODY = ONBOARDING_COPY.welcomeBody;

export interface WelcomeViewProps {
  readonly reduced: boolean;
  readonly onBegin: () => void;
  readonly onSignIn: () => void;
}

export function WelcomeView({ reduced, onBegin, onSignIn }: WelcomeViewProps) {
  const Settle = reduced ? View : Animated.View;
  const settleProps = reduced
    ? {}
    : { entering: FadeIn.duration(DURATION.calm).easing(easingFn('out')) };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <Settle {...settleProps} className="flex-1 items-center justify-center gap-6 px-5 my-4">
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
      <SafeAreaView edges={['bottom']} className="gap-3 px-5 pb-2">
        <Button variant="primary" size="lg" className="w-full" onPress={onBegin}>
          {ONBOARDING_COPY.begin}
        </Button>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ONBOARDING_COPY.signIn}
          onPress={onSignIn}
          hitSlop={8}
          className="min-h-[44px] items-center justify-center active:scale-[0.98]"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            {ONBOARDING_COPY.signIn}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
