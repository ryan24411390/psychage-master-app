import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Mascot } from '@/components/home/Mascot';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { DURATION, easingFn } from '@/lib/motion';

import { ONBOARDING_COPY } from './copy';

// S4 — acknowledge the act (Flow 1). The mascot RETURNS: route-auto 'neutral' (an idle
// state, so it breathes = "settle"), plus a single tilt fired on mount (the same tiltSignal
// machinery HomeContainer uses on save). One teal element — the brand accent dot — pulses
// once, then rests; under reduced motion it is simply shown in its rested state (a single
// static state change, no animation).
//
// VALENCE-BLIND (the whole point of this slice): this view takes NO moment / valence /
// label input. The acknowledgment is byte-identical regardless of which feeling was named —
// naming itself is the skill being affirmed, not the valence of what was named.

const ACK_MASCOT_WIDTH = 110;

export interface AcknowledgeViewProps {
  readonly reduced: boolean;
  readonly onContinue: () => void;
}

export function AcknowledgeView({ reduced, onContinue }: AcknowledgeViewProps) {
  // The single teal element: one pulse (scale + brighten), then rest. Static when reduced.
  const pulse = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    pulse.value = withSequence(
      withTiming(1, { duration: DURATION.base, easing: easingFn('out') }),
      withTiming(0.85, { duration: DURATION.calm, easing: easingFn('standard') }),
    );
  }, [reduced, pulse]);

  const tealStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + pulse.value * 0.5,
    transform: [{ scale: 0.9 + pulse.value * 0.2 }],
  }));

  const Settle = reduced ? View : Animated.View;
  const settleProps = reduced
    ? {}
    : { entering: FadeIn.duration(DURATION.calm).easing(easingFn('out')) };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <Settle {...settleProps} className="flex-1 items-center justify-center gap-6 px-5 my-4">
        <Mascot testID="onboarding-acknowledge-mascot" size={ACK_MASCOT_WIDTH} tiltSignal={1} />
        {/* The one teal element per scene (Sacred brand discipline §7). */}
        <Animated.View
          testID="onboarding-acknowledge-pulse"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={tealStyle}
          className="h-2 w-10 rounded-full bg-primary dark:bg-primary-dark"
        />
        <Text
          testID="onboarding-acknowledge-text"
          variant="headingLg"
          className="text-center px-4"
          accessibilityRole="header"
        >
          {ONBOARDING_COPY.acknowledge}
        </Text>
      </Settle>
      <SafeAreaView edges={['bottom']} className="px-5 pb-2">
        <Button variant="primary" size="lg" className="w-full" onPress={onContinue}>
          {ONBOARDING_COPY.acknowledgeContinue}
        </Button>
      </SafeAreaView>
    </View>
  );
}
