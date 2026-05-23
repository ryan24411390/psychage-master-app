import { Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { DURATION, useReducedMotion } from '@/lib/motion';

export default function LearnScreen() {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(DURATION.base)}
      className="flex-1 items-center justify-center bg-white"
    >
      <Text className="text-lg text-black">Learn</Text>
    </Animated.View>
  );
}
