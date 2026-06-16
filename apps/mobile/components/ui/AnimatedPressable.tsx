import React from 'react';
import {
  Pressable,
  type PressableProps,
  type GestureResponderEvent,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import Animated, {
  type AnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useReducedMotion, SPRING_PRESETS } from '@/lib/motion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

// PressableProps + just the three Reanimated layout-animation props (`entering` /
// `exiting` / `layout`) so callers can thread an animation builder through — e.g.
// CompassTile passing a staggeredEnter() builder. We Pick only those three from
// AnimatedProps rather than spreading the whole thing, which would otherwise wrap
// every callback (onPressIn, …) as a possible SharedValue and break the handlers.
export type AnimatedPressableProps = PressableProps &
  Pick<AnimatedProps<PressableProps>, 'entering' | 'exiting' | 'layout'> & {
    children: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
    scaleTo?: number;
    springPreset?: keyof typeof SPRING_PRESETS;
    style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  };

export function AnimatedPressable({
  children,
  scaleTo = 0.96,
  springPreset = 'magnetic',
  onPressIn,
  onPressOut,
  style,
  ...props
}: AnimatedPressableProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (e: GestureResponderEvent) => {
    onPressIn?.(e);
    if (!reduced && !props.disabled) {
      scale.value = withSpring(scaleTo, SPRING_PRESETS[springPreset]);
    }
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    onPressOut?.(e);
    if (!reduced) {
      scale.value = withSpring(1, SPRING_PRESETS[springPreset]);
    }
  };

  return (
    <AnimatedPressableBase
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        animatedStyle,
      ]}
    >
      {typeof children === 'function'
        ? (state) => children(state)
        : children}
    </AnimatedPressableBase>
  );
}
