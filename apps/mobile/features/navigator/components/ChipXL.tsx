import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

// C-CHIP-XL — a full-width ≥60px pill for the single-select screens (S13 area, S15
// clarifier answers, S16 severity). One tap advances; these screens NEVER render a
// selected state (selection is the navigation). Big target, few words.

export interface ChipXLProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly accessibilityLabel?: string;
}

export function ChipXL({ label, onPress, accessibilityLabel }: ChipXLProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      className="min-h-[60px] w-full justify-center rounded-full border border-border bg-surface px-5 dark:border-border-dark dark:bg-surface-dark"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View className="items-center">
        <Text variant="bodyLarge">{label}</Text>
      </View>
    </Pressable>
  );
}
