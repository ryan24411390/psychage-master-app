import type React from 'react';
import { Pressable, type PressableProps, type GestureResponderEvent, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useReducedMotion, SPRING_PRESETS } from '@/lib/motion';
import { useHaptics } from '@/lib/haptic-context';
import type { HapticEvent } from '@/lib/haptics';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export type AnimatedPressableProps = PressableProps & {
  children: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
  scaleTo?: number;
  activeOpacity?: number;
  springPreset?: keyof typeof SPRING_PRESETS;
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  tilt?: boolean;
  haptic?: HapticEvent;
};

export function AnimatedPressable({
  children,
  scaleTo = 0.98,
  activeOpacity = 1,
  springPreset = 'subtle',
  onPressIn,
  onPressOut,
  style,
  tilt = false,
  haptic,
  onLayout,
  ...props
}: AnimatedPressableProps) {
  const reduced = useReducedMotion();
  const { fireHaptic } = useHaptics();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const handleLayout = (e: any) => {
    width.value = e.nativeEvent.layout.width;
    height.value = e.nativeEvent.layout.height;
    onLayout?.(e);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: any[] = [{ scale: scale.value }];
    if (tilt && !reduced) {
      transforms.unshift({ perspective: 400 });
      transforms.push({ rotateX: `${rotateX.value}rad` });
      transforms.push({ rotateY: `${rotateY.value}rad` });
    }
    return {
      transform: transforms,
      opacity: opacity.value,
    };
  });

  const handlePressIn = (e: GestureResponderEvent) => {
    onPressIn?.(e);
    if (haptic) {
      fireHaptic(haptic);
    }
    if (!reduced && !props.disabled) {
      scale.value = withSpring(scaleTo, SPRING_PRESETS[springPreset]);
      if (activeOpacity !== 1) {
        opacity.value = withSpring(activeOpacity, SPRING_PRESETS[springPreset]);
      }
      if (tilt && width.value > 0 && height.value > 0) {
        const { locationX, locationY } = e.nativeEvent;
        const normX = locationX / width.value - 0.5;
        const normY = locationY / height.value - 0.5;
        const maxTilt = 0.08; // ~5 degrees
        rotateX.value = withSpring(normY * maxTilt, SPRING_PRESETS[springPreset]);
        rotateY.value = withSpring(-normX * maxTilt, SPRING_PRESETS[springPreset]);
      }
    }
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    onPressOut?.(e);
    if (!reduced) {
      scale.value = withSpring(1, SPRING_PRESETS[springPreset]);
      if (activeOpacity !== 1) {
        opacity.value = withSpring(1, SPRING_PRESETS[springPreset]);
      }
      if (tilt) {
        rotateX.value = withSpring(0, SPRING_PRESETS[springPreset]);
        rotateY.value = withSpring(0, SPRING_PRESETS[springPreset]);
      }
    }
  };

  return (
    <AnimatedPressableBase
      accessibilityRole={props.accessibilityRole || 'button'}
      {...props}
      onLayout={handleLayout}
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
