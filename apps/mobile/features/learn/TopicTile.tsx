import { View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';
import { ArtPanel } from '@/features/learn/ArtPanel';
import { useHaptics } from '@/lib/haptic-context';

// Common-topics tile: a unified category card — a token-gradient image with an
// integrated rectangular label container of the SAME width fused to it (shared
// border + radius), not a floating label or a pill. Taps route to the topic's
// category list (haptic.tap). Width set by the rail.

type TopicTileProps = {
  label: string;
  count?: string;
  artKey: string;
  onPress: () => void;
  className?: string;
};

export function TopicTile({ label, count, artKey, onPress, className }: TopicTileProps) {
  const { fireHaptic } = useHaptics();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={count ? `${label}, ${count}` : label}
      onPress={() => {
        fireHaptic('tab');
        onPress();
      }}
      className={[
        'overflow-hidden rounded-2xl border border-border dark:border-border-dark',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <ArtPanel artKey={artKey} className="aspect-[4/3] w-full" />
      <View className="border-t border-border bg-surface px-3 py-2.5 dark:border-border-dark dark:bg-surface-dark">
        <Text
          variant="heading"
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-[15px] leading-[19px]"
        >
          {label}
        </Text>
        {count ? (
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {count}
          </Text>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}
