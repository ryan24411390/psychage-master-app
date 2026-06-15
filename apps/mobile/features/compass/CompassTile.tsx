import type { ElementType } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';

export type CompassTileVariant = 'action' | 'feature' | 'list';
export type CompassTileTint = 'now' | 'patterns' | 'understand';

type CompassTileProps = {
  title: string;
  subLabel: string;
  onPress: () => void;
  tint?: CompassTileTint;
  icon: ElementType;
  variant?: CompassTileVariant;
  testID?: string;
};

// Tints mapping for soft backgrounds or icon wrappers.
// These use standard Psychage tailwind classes and hexes.
const TINTS = {
  now: { bg: 'bg-[#F0FDFA] dark:bg-[#0D5C54]', iconColor: '#1A9B8C' }, // teal (brand)
  patterns: { bg: 'bg-[#F5F3FF] dark:bg-[#4C1D95]', iconColor: '#7C3AED' }, // violet
  understand: { bg: 'bg-[#F0F9FF] dark:bg-[#0C4A6E]', iconColor: '#0284C7' }, // sky blue
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CompassTile({
  title,
  subLabel,
  onPress,
  tint = 'now',
  icon: Icon,
  variant = 'list',
  testID,
}: CompassTileProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const colors = TINTS[tint];

  if (variant === 'action') {
    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={testID}
        className="flex-1 rounded-2xl bg-surface dark:bg-surface-dark p-4 shadow-sm border border-border-hairline"
        style={animatedStyle}
      >
        <View className={`h-10 w-10 items-center justify-center rounded-full mb-3 ${colors.bg}`}>
          <Icon size={20} color={colors.iconColor} />
        </View>
        <Text variant="bodyBold" className="mb-1" numberOfLines={2}>{title}</Text>
        <Text variant="caption" numberOfLines={1}>{subLabel}</Text>
      </AnimatedPressable>
    );
  }

  if (variant === 'feature') {
    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={testID}
        className="w-full overflow-hidden rounded-3xl bg-surface dark:bg-surface-dark shadow-sm border border-border-hairline mb-4"
        style={animatedStyle}
      >
        <View className={`absolute -right-6 -top-6 p-6 opacity-5 dark:opacity-10`} pointerEvents="none">
           <Icon size={140} color={colors.iconColor} />
        </View>
        <View className="p-5">
          <View className={`h-12 w-12 items-center justify-center rounded-2xl mb-4 ${colors.bg}`}>
            <Icon size={24} color={colors.iconColor} />
          </View>
          <Text variant="heading" className="mb-1">{title}</Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">{subLabel}</Text>
        </View>
      </AnimatedPressable>
    );
  }

  // default 'list' variant
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={testID}
      className="w-full flex-row items-center rounded-2xl bg-surface dark:bg-surface-dark p-4 shadow-sm border border-border-hairline mb-3"
      style={animatedStyle}
    >
      <View className={`h-12 w-12 items-center justify-center rounded-full mr-4 ${colors.bg}`}>
        <Icon size={24} color={colors.iconColor} />
      </View>
      <View className="flex-1 justify-center">
        <Text variant="bodyBold" className="mb-1">{title}</Text>
        <Text variant="caption">{subLabel}</Text>
      </View>
    </AnimatedPressable>
  );
}
