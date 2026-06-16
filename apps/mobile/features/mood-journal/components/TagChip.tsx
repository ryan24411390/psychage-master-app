import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';

// A multi-select tag chip (emotions / triggers). Calm by design: a teal BORDER +
// teal label when selected, neutral otherwise — no per-tag color floods (brand:
// "teal sparingly, not floods"; mirrors StateRows' selected = border-primary).
// ≥44pt touch target (DESIGN.mobile.md §7). NativeWind classes only.

type TagChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

export function TagChip({ label, selected, onPress, testID }: TagChipProps) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      className={`min-h-[44px] flex-row items-center justify-center rounded-full border px-4 ${
        selected ? 'border-primary dark:border-primary-dark' : 'border-border dark:border-border-dark'
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Text
        variant="bodySm"
        className={
          selected
            ? 'text-primary dark:text-primary-dark'
            : 'text-text-secondary dark:text-text-secondary-dark'
        }
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
