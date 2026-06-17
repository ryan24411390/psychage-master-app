import type React from 'react';
import { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import { Text } from './Text';
import { Mascot } from '@/components/home/Mascot';
import { MASCOT_CONTEXTUAL } from '@/features/mascot';
import { useReducedMotion } from '@/lib/motion';

export interface AnimatedEmptyStateProps extends ViewProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function AnimatedEmptyState({
  title,
  description,
  icon,
  className,
  ...props
}: AnimatedEmptyStateProps) {
  const reduced = useReducedMotion();
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    if (!reduced) {
      floatAnim.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [reduced, floatAnim]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatAnim.value }],
    };
  });

  return (
    <Animated.View
      entering={!reduced ? FadeInUp.springify().damping(16).stiffness(150) : undefined}
      className={['flex-1 items-center justify-center p-8', className].filter(Boolean).join(' ')}
      {...props}
    >
      <Animated.View style={animatedIconStyle} className="mb-6">
        {/* Contextual placement (see MASCOT_CONTEXTUAL): generic / first-run empty → 'open'.
            Callers may override via the `icon` prop for surface-specific states. */}
        {icon || <Mascot state={MASCOT_CONTEXTUAL.emptyGeneric} size={156} />}
      </Animated.View>
      <Text variant="h2" className="text-center mb-2 text-text-primary dark:text-text-primary-dark">
        {title}
      </Text>
      {description && (
        <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
          {description}
        </Text>
      )}
    </Animated.View>
  );
}
