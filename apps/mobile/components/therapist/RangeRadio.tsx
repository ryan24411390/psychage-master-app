import { Check } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colorForScheme, resolveColorRef } from '@/lib/a1-tokens';

// C-RADIO — the date-range selector. Mirrors C0.4 StateRows: radiogroup semantics,
// selection = BORDER + CHECK (a non-colour signal), 44px min target. Therapist is NOT
// under the auth-calm "teal out of state marks" rule, so the canonical teal selection
// mark is correct here.

export type RangeOption = {
  readonly key: string;
  readonly label: string;
  readonly days: number;
};

type RangeRadioProps = {
  options: readonly RangeOption[];
  value: string | null;
  onChange: (key: string) => void;
};

export function RangeRadio({ options, value, onChange }: RangeRadioProps) {
  const { colorScheme } = useColorScheme();
  const checkColor = colorForScheme(resolveColorRef('color.primary.default'), colorScheme);

  return (
    <View accessibilityRole="radiogroup" className="gap-2">
      {options.map((option) => {
        const isSelected = value === option.key;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.key)}
            className={`min-h-[44px] flex-row items-center gap-3 rounded-lg border-2 px-3 py-2 ${
              isSelected
                ? 'border-primary dark:border-primary-dark'
                : 'border-border dark:border-border-dark'
            }`}
          >
            <Text variant="bodyMedium" className="flex-1">
              {option.label}
            </Text>
            {isSelected ? <Check size={20} color={checkColor} strokeWidth={2.25} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
