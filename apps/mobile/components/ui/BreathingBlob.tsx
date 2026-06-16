import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

type BreathingBlobProps = {
  isBreathing: boolean;
  durationMs?: number;
  color?: string;
  size?: number;
};

export function BreathingBlob({
  isBreathing,
  durationMs = 4000,
  color = '#20B8A6',
  size = 200,
}: BreathingBlobProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isBreathing) {
      progress.value = withRepeat(
        withTiming(1, {
          duration: durationMs,
          easing: Easing.inOut(Easing.sin),
        }),
        -1, // infinite
        true // yoyo
      );
    } else {
      progress.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });
    }
  }, [isBreathing, durationMs, progress]);

  // Organic expansion using animated scaling and dynamic border radius to simulate path morphing
  const animatedStyle = useAnimatedStyle(() => {
    const scale = 1 + progress.value * 0.5; // Scales up to 1.5x
    
    // Simulate organic morphing by slightly shifting border radii
    const morphOffset = progress.value * 20; 
    
    return {
      transform: [{ scale }],
      opacity: 0.5 + progress.value * 0.3, // Soft glow fade
      borderTopLeftRadius: (size / 2) + morphOffset,
      borderTopRightRadius: (size / 2) - morphOffset,
      borderBottomLeftRadius: (size / 2) - morphOffset,
      borderBottomRightRadius: (size / 2) + morphOffset,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}
