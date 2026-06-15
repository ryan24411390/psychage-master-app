import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { ComponentType } from 'react';
import { useState, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { CompassPictogram } from '@/components/pictograms/Compass';
import { FindPictogram } from '@/components/pictograms/Find';
import { LearnPictogram } from '@/components/pictograms/Learn';
import type { PictogramProps } from '@/components/pictograms/shared';
import { TodayPictogram } from '@/components/pictograms/Today';
import { Text } from '@/components/ui/Text';
import { colorForScheme, tabBarTokens } from '@/lib/a1-tokens';
import { useHaptics } from '@/lib/haptic-context';
import { SPRING_PRESETS, useReducedMotion } from '@/lib/motion';

const PICTOGRAMS: Record<string, ComponentType<PictogramProps>> = {
  index: TodayPictogram,
  learn: LearnPictogram,
  compass: CompassPictogram,
  find: FindPictogram,
};

type AnimatedTabItemProps = {
  isActive: boolean;
  label: string;
  onPress: () => void;
  activeInk: string;
  inactiveInk: string;
  Pictogram: ComponentType<PictogramProps>;
  reduced: boolean;
};

function AnimatedTabItem({
  isActive,
  label,
  onPress,
  activeInk,
  inactiveInk,
  Pictogram,
  reduced,
}: AnimatedTabItemProps) {
  const scale = useSharedValue(isActive ? 1.08 : 1);
  const opacity = useSharedValue(isActive ? 1 : 0.85);

  useEffect(() => {
    if (reduced) {
      scale.value = isActive ? 1.08 : 1;
      opacity.value = isActive ? 1 : 0.85;
      return;
    }
    scale.value = withSpring(isActive ? 1.08 : 1, SPRING_PRESETS.magnetic);
    opacity.value = withSpring(isActive ? 1 : 0.85, SPRING_PRESETS.magnetic);
  }, [isActive, reduced, scale, opacity]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-1 items-center justify-center py-1.5"
    >
      <View className="min-h-[44px] items-center justify-center gap-0.5 px-3 bg-transparent">
        <Animated.View style={animatedIconStyle}>
          <Pictogram color={isActive ? activeInk : inactiveInk} />
        </Animated.View>
        <Animated.View style={animatedTextStyle}>
          <Text
            variant="caption"
            className={`text-xs tracking-wide ${
              isActive
                ? 'text-text-primary dark:text-text-primary-dark font-sans-medium'
                : 'text-text-secondary dark:text-text-secondary-dark'
            }`}
          >
            {label}
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { fireHaptic } = useHaptics();
  const { colorScheme } = useColorScheme();
  const reduced = useReducedMotion();
  const [layoutWidth, setLayoutWidth] = useState(0);

  const activeInk = colorForScheme(tabBarTokens.color.labelActive, colorScheme);
  const inactiveInk = colorForScheme(tabBarTokens.color.labelInactive, colorScheme);

  const activeIndex = state.index;
  const N = state.routes.length;
  const W = layoutWidth / N;

  const translateX = useSharedValue(0);

  useEffect(() => {
    if (layoutWidth > 0) {
      if (reduced) {
        translateX.value = activeIndex * W;
      } else {
        translateX.value = withSpring(activeIndex * W, SPRING_PRESETS.magnetic);
      }
    }
  }, [activeIndex, layoutWidth, W, reduced, translateX]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      top: 6,
      width: W - 16,
      height: 44,
      borderRadius: 8,
      transform: [{ translateX: translateX.value + 8 }],
      opacity: layoutWidth > 0 ? 1 : 0,
    };
  });

  return (
    <SafeAreaView
      edges={['bottom']}
      onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
      className="flex-row border-t border-border bg-surface dark:border-border-dark dark:bg-surface-dark relative"
    >
      {layoutWidth > 0 && (
        <Animated.View
          style={indicatorStyle}
          className="bg-surface-active dark:bg-surface-active-dark overflow-hidden"
          pointerEvents="none"
        >
          <View className="absolute left-0 right-0 top-0 h-[1.5px] bg-charcoal-950/10 dark:bg-white/10" />
        </Animated.View>
      )}

      {state.routes.map((route, index) => {
        const Pictogram = PICTOGRAMS[route.name];
        const descriptor = descriptors[route.key];
        if (!Pictogram || !descriptor) return null;

        const label =
          typeof descriptor.options.title === 'string' ? descriptor.options.title : route.name;
        const isActive = state.index === index;

        const onPress = () => {
          fireHaptic('tab');
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <AnimatedTabItem
            key={route.key}
            isActive={isActive}
            label={label}
            onPress={onPress}
            activeInk={activeInk}
            inactiveInk={inactiveInk}
            Pictogram={Pictogram}
            reduced={reduced}
          />
        );
      })}
    </SafeAreaView>
  );
}
