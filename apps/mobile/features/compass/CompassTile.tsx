import { Pressable } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

// The Compass bento tile — same grammar as the home "When you need something now"
// group (elevated surface card, heading + sub-label). Reused per tile. The raised
// surface is the shared Card `elevated` variant; Pressable owns press + a11y.

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
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Card variant="elevated">
        <Text variant="heading">{title}</Text>
        <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
          {subLabel}
        </Text>
      </Card>
    </Pressable>
  );
}
