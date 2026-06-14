import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// The C-WV-LOAD skeleton — a STATIC clay still-life of a page (clay = color.border).
// NO shimmer, NO opacity/translate loop (a shimmer would be a forbidden 5th motion
// verb). The ONLY motion is the single settle entrance, gated on reduced motion.
export function WebViewSkeleton() {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      entering={
        reduced ? undefined : FadeInUp.duration(DURATION.base).easing(easingFn('standard'))
      }
      className="flex-1 gap-3 px-5 py-5"
      testID="wv-skeleton"
    >
      <View className="h-6 w-2/3 rounded-md bg-border dark:bg-border-dark" />
      <View className="h-4 w-full rounded-md bg-border dark:bg-border-dark" />
      <View className="h-4 w-5/6 rounded-md bg-border dark:bg-border-dark" />
      <View className="mt-2 h-40 w-full rounded-xl bg-border dark:bg-border-dark" />
    </Animated.View>
  );
}
