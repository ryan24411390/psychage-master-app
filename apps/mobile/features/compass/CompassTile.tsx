import type { ElementType } from 'react';
import { View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';
import { staggeredEnter, useReducedMotion } from '@/lib/motion';

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
  /** Position in the screen's tile sequence; drives the staggered entrance. Omit to skip. */
  enterIndex?: number;
};

// Tints mapping for soft backgrounds or icon wrappers.
// These use standard Psychage tailwind classes and hexes.
const TINTS = {
  now: { bg: 'bg-[#F0FDFA] dark:bg-[#0D5C54]', iconColor: '#1A9B8C' }, // teal (brand)
  patterns: { bg: 'bg-[#F5F3FF] dark:bg-[#4C1D95]', iconColor: '#7C3AED' }, // violet
  understand: { bg: 'bg-[#F0F9FF] dark:bg-[#0C4A6E]', iconColor: '#0284C7' }, // sky blue
};

// Press feedback + entrance flow through the shared AnimatedPressable (scale via
// SPRING_PRESETS) and the staggeredEnter factory — no inline spring/duration
// constants live here. The press dim is layered as a NativeWind-free style fn,
// which the shared primitive composes on top of its scale.
export function CompassTile({
  title,
  subLabel,
  onPress,
  tint = 'now',
  icon: Icon,
  variant = 'list',
  testID,
  enterIndex,
}: CompassTileProps) {
  const reduced = useReducedMotion();
  const entering = enterIndex == null ? undefined : staggeredEnter(enterIndex, reduced);
  const colors = TINTS[tint];

  const pressDim = ({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.85 : 1 });

  if (variant === 'action') {
    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        testID={testID}
        entering={entering}
        className="flex-1 rounded-2xl bg-surface dark:bg-surface-dark p-4 shadow-sm border border-border-hairline"
        style={pressDim}
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
        testID={testID}
        entering={entering}
        className="w-full overflow-hidden rounded-3xl bg-surface dark:bg-surface-dark shadow-sm border border-border-hairline mb-4"
        style={pressDim}
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
      testID={testID}
      entering={entering}
      className="w-full flex-row items-center rounded-2xl bg-surface dark:bg-surface-dark p-4 shadow-sm border border-border-hairline mb-3"
      style={pressDim}
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
