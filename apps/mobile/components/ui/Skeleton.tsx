import { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/lib/motion';

export interface SkeletonProps extends ViewProps {
  className?: string;
}

export function Skeleton({ className, style, ...props }: SkeletonProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    if (reduced) {
      opacity.value = 0.35;
      return;
    }
    opacity.value = withRepeat(
      withTiming(0.6, { 
        duration: 1000,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );
    return () => cancelAnimation(opacity);
  }, [reduced, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        style,
        animatedStyle,
      ]}
      className={['bg-charcoal-200 dark:bg-charcoal-800', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
