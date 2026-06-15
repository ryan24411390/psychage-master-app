import { Pressable } from 'react-native';

import { Text } from '@/components/ui/Text';
import { ArtPanel } from '@/features/learn/ArtPanel';
import { useHaptics } from '@/lib/haptic-context';

// Common-topics tile: a small token-gradient panel + Fraunces label + count.
// Taps route to the topic's category list (haptic.tap). Width set by the rail.

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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count ? `${label}, ${count}` : label}
      onPress={() => {
        fireHaptic('tab');
        onPress();
      }}
      className={className}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <ArtPanel artKey={artKey} className="aspect-[4/3] rounded-xl" />
      <Text
        variant="heading"
        numberOfLines={1}
        ellipsizeMode="tail"
        className="mt-2 px-0.5 text-[15px] leading-[19px]"
      >
        {label}
      </Text>
      {count ? (
        <Text variant="caption" className="px-0.5 text-text-tertiary dark:text-text-tertiary-dark">
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}
