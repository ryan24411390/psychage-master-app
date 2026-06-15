import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Loading placeholder for the directory list — a STATIC clay still-life of result
// rows (clay = color.border), mirroring WebViewSkeleton. NO shimmer / opacity loop
// (a pulse would be a forbidden 5th motion verb per DESIGN.mobile.md); the only
// motion is a single settle entrance, gated on reduced motion.

function Row() {
  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className="h-11 w-11 rounded-full bg-border dark:bg-border-dark" />
      <View className="flex-1 gap-1.5">
        <View className="h-4 w-1/2 rounded-md bg-border dark:bg-border-dark" />
        <View className="h-3 w-3/4 rounded-md bg-border dark:bg-border-dark" />
        <View className="h-3 w-1/3 rounded-md bg-border dark:bg-border-dark" />
      </View>
    </View>
  );
}

export function DirectorySkeleton() {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      entering={reduced ? undefined : FadeInUp.duration(DURATION.base).easing(easingFn('standard'))}
      className="flex-1 px-4"
      testID="directory-skeleton"
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Row key={i} />
      ))}
    </Animated.View>
  );
}
