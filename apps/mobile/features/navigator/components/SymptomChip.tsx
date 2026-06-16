import { Check } from 'lucide-react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

// S14 multi-select symptom chip. Selection is signalled THREE ways, never color alone:
// a tealDeep (teal-700) border + a subtle teal fill + a check glyph. A toggle button
// that reports its selected state to VoiceOver. Oversized target (≥56px).

export interface SymptomChipProps {
  readonly label: string;
  readonly selected: boolean;
  readonly onToggle: () => void;
}

export function SymptomChip({ label, selected, onToggle }: SymptomChipProps) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onToggle}
      className={`min-h-[56px] w-full flex-row items-center justify-between rounded-2xl border px-4 ${
        selected
          ? 'border-teal-700 bg-teal-50 dark:bg-teal-900'
          : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <Text
        variant="bodyMedium"
        className={selected ? 'text-teal-900 dark:text-teal-50' : undefined}
      >
        {label}
      </Text>
      {selected ? <Check size={20} color={colors.teal[700]} strokeWidth={2} /> : null}
    </AnimatedPressable>
  );
}
