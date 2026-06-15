import type { ElementType } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

export type CompassTileTint = 'now' | 'patterns' | 'understand';
export type CompassTileVariant = 'hero' | 'standard';

type CompassTileProps = {
  title: string;
  subLabel: string;
  onPress: () => void;
  tint: CompassTileTint;
  icon: ElementType;
  variant?: CompassTileVariant;
  testID?: string;
};

export function CompassTile({
  title,
  subLabel,
  onPress,
  tint,
  icon: Icon,
  variant = 'standard',
  testID,
}: CompassTileProps) {
  const tileBg = {
    now: 'bg-intent-now dark:bg-intent-now',
    patterns: 'bg-intent-patterns dark:bg-intent-patterns',
    understand: 'bg-intent-understand dark:bg-intent-understand',
  }[tint];

  const chipBg = {
    now: 'bg-intent-now-chip dark:bg-intent-now-chip',
    patterns: 'bg-intent-patterns-chip dark:bg-intent-patterns-chip',
    understand: 'bg-intent-understand-chip dark:bg-intent-understand-chip',
  }[tint];

  const isHero = variant === 'hero';

  // For hero, we can do a side-by-side or stacked layout. A wide hero tile typically
  // benefits from either larger text or side-by-side icon and text. Let's stack it for
  // consistency or do a flex-row if requested. The prompt implies mixed sizes: hero is 
  // wide, the rest 2-up. We'll use a larger stacked layout or a row layout. 
  // A row layout reads well for a wide hero tile.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      testID={testID}
      className={`rounded-xl border border-border-hairline ${tileBg} ${isHero ? 'w-full' : 'flex-1'} p-4`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View className={`gap-3 ${isHero ? 'flex-row items-center' : 'flex-col'}`}>
        <View className={`w-12 h-12 rounded-[12px] ${chipBg} items-center justify-center shrink-0`}>
          <Icon color="#FBF9F4" size={24} />
        </View>
        <View className="flex-1 justify-center">
          <Text variant="heading">{title}</Text>
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark mt-1">
            {subLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
