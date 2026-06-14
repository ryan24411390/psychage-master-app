import { Pressable } from 'react-native';

import { Text } from '@/components/ui/Text';

// The Compass bento tile — same grammar as the home "When you need something now"
// group (rounded-xl border surface card, heading + sub-label). Reused per tile.

type CompassTileProps = {
  title: string;
  subLabel: string;
  onPress: () => void;
  testID?: string;
};

export function CompassTile({ title, subLabel, onPress, testID }: CompassTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      testID={testID}
      className="rounded-xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Text variant="heading">{title}</Text>
      <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
        {subLabel}
      </Text>
    </Pressable>
  );
}
