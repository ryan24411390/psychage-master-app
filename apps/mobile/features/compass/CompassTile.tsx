import type { ElementType } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ArrowUpRight } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';

// Compass bento tiles. These are explicit, single-purpose components local to the
// Compass landing — NOT a generic tile framework. Light-mode colors are the
// confirmed design hexes (arbitrary classNames, matching this feature's existing
// convention); dark-mode pairs keep the true-black register intact.
const TEAL = '#1A9B8C';

type TileProps = {
  title: string;
  feature: string;
  icon: ElementType;
  onPress: () => void;
  testID?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Shared press feedback (scale + fade). An interaction primitive, not layout —
// every Compass tile reuses the same gesture the previous tiles had.
function usePressScale() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 150 });
  };
  return { style, onPressIn, onPressOut };
}

// Tall hero (Toolkit). Stretches to match the stacked small tiles beside it.
export function HeroTile({ title, feature, icon: Icon, onPress, testID }: TileProps) {
  const press = usePressScale();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={4}
      testID={testID}
      style={press.style}
      className="min-h-[44px] flex-1 justify-between rounded-[20px] border border-[rgba(26,155,140,0.22)] bg-[rgba(26,155,140,0.08)] p-4 dark:border-border-dark dark:bg-surface-dark"
    >
      <View className="flex-row items-start justify-between">
        <Icon size={27} color={TEAL} strokeWidth={1.75} />
        <ArrowUpRight
          size={17}
          color={TEAL}
          strokeWidth={1.75}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
      <View className="mt-12">
        <Text
          className="font-sans-medium text-[15.5px] text-text-primary dark:text-text-primary-dark"
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text className="mt-0.5 font-sans text-[10.5px] text-text-secondary dark:text-text-secondary-dark">
          {feature}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

// White small tile. Self-sizing to content; stretches to its parent's width.
export function SmallTile({ title, feature, icon: Icon, onPress, testID }: TileProps) {
  const press = usePressScale();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={4}
      testID={testID}
      style={press.style}
      className="min-h-[44px] justify-between rounded-[20px] border border-[#EDE7DB] bg-white p-4 dark:border-border-dark dark:bg-surface-dark"
    >
      <Icon size={21} color={TEAL} strokeWidth={1.75} />
      <View className="mt-3">
        <Text
          className="font-sans-medium text-[12px] text-text-primary dark:text-text-primary-dark"
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text className="mt-0.5 font-sans text-[10.5px] text-text-secondary dark:text-text-secondary-dark">
          {feature}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

// Full-width navy accent tile (Clarity Score). Same in both color schemes.
export function ClarityTile({ title, feature, icon: Icon, onPress, testID }: TileProps) {
  const press = usePressScale();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={4}
      testID={testID}
      style={press.style}
      className="min-h-[44px] w-full flex-row items-center justify-between rounded-[20px] bg-[#1A1A2E] p-[15px]"
    >
      <View className="flex-1 pr-3">
        <Text className="font-sans-bold text-[15px] text-white" numberOfLines={2}>
          {title}
        </Text>
        <Text className="mt-0.5 font-sans-medium text-[10.5px] text-teal-400">{feature}</Text>
      </View>
      <Icon size={30} color={TEAL} strokeWidth={1.75} />
    </AnimatedPressable>
  );
}

// Full-width illustrated card with a large ghosted background glyph.
export function DeepDiveCard({ title, feature, icon: Icon, onPress, testID }: TileProps) {
  const press = usePressScale();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={4}
      testID={testID}
      style={press.style}
      className="min-h-[44px] w-full overflow-hidden rounded-[20px] border border-[#EDE7DB] bg-white p-4 dark:border-border-dark dark:bg-surface-dark"
    >
      <View
        className="absolute -bottom-2 -right-2 opacity-[0.09]"
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Icon size={94} color={TEAL} strokeWidth={1.5} />
      </View>
      <Icon size={24} color={TEAL} strokeWidth={1.75} />
      <View className="mt-10">
        <Text className="font-sans-medium text-[15px] text-text-primary dark:text-text-primary-dark">
          {title}
        </Text>
        <Text className="mt-0.5 font-sans text-[10.5px] text-text-secondary dark:text-text-secondary-dark">
          {feature}
        </Text>
      </View>
    </AnimatedPressable>
  );
}
