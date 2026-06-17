import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '@/lib/use-theme-colors';

const DOT_SIZE = 6;

function BouncingDot({ delay }: { delay: number }) {
  const tc = useThemeColors();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 300 }),
          withTiming(0, { duration: 300 }),
          withTiming(0, { duration: 400 }) // pause at bottom
        ),
        -1, // infinite
        true // reverse
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.4, { duration: 300 }),
          withTiming(0.4, { duration: 400 })
        ),
        -1,
        true
      )
    );
  }, [delay, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className="rounded-full"
      style={[
        { width: DOT_SIZE, height: DOT_SIZE, backgroundColor: tc.inkSecondary },
        style,
      ]}
    />
  );
}

export function ThinkingIndicator() {
  return (
    <View className="flex-row items-center justify-center gap-1.5 h-6">
      <BouncingDot delay={0} />
      <BouncingDot delay={150} />
      <BouncingDot delay={300} />
    </View>
  );
}
