import React from 'react';
import { Pressable, PressableProps, GestureResponderEvent, ViewStyle, StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useReducedMotion, SPRING_PRESETS } from '@/lib/motion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export type AnimatedPressableProps = PressableProps & {
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
