import { View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';

// A wrap of selectable pill chips — reused for the affect labels and the context
// domains. Built on the app's pill language (rounded-full, surface-accent fill,
// teal when selected). Selection is shown by fill + ring, never color alone (the
// selected state is also announced to VoiceOver). NativeWind classes only.

export interface ChipItem {
  readonly key: string;
  readonly label: string;
}

type ChipGroupProps = {
  items: readonly ChipItem[];
  /** Currently-selected keys. */
  selected: readonly string[];
  onToggle: (key: string) => void;
  /** Optional cap; chips beyond the cap are disabled (not hidden) once it's reached. */
  max?: number;
};

export function ChipGroup({ items, selected, onToggle, max }: ChipGroupProps) {
  const atCap = max !== undefined && selected.length >= max;
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => {
        const isSelected = selected.includes(item.key);
        const disabled = atCap && !isSelected;
        return (
          <AnimatedPressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled }}
            accessibilityLabel={item.label}
            disabled={disabled}
            onPress={() => onToggle(item.key)}
            scaleTo={0.96}
            className={`min-h-[36px] justify-center rounded-full px-4 py-2 ${
              isSelected
                ? 'bg-primary dark:bg-primary-dark'
                : 'bg-surface-accent dark:bg-surface-accent-dark'
            } ${disabled ? 'opacity-40' : ''}`}
          >
            <Text
              variant="bodySm"
              className={
                isSelected
                  ? 'text-white dark:text-charcoal-950'
                  : 'text-text-secondary dark:text-text-secondary-dark'
              }
            >
              {item.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}
