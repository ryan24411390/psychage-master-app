import { Pressable, View } from 'react-native';

import type { UserDuration } from '@psychage/shared/navigator';

import { Text } from '@/components/ui/Text';

// Per-symptom duration — mobile port of web components/navigator/DurationPicker.
// Seven options, values VERBATIM from web (they drive the engine's duration modifier).
// Selected = filled teal; unselected = surface. radiogroup semantics.

export interface DurationPickerProps {
  readonly value?: UserDuration;
  readonly onChange: (value: UserDuration) => void;
}

const DURATION_OPTIONS: ReadonlyArray<{ value: UserDuration; label: string }> = [
  { value: 'less_than_1_week', label: 'Less than 1 week' },
  { value: '1_to_2_weeks', label: '1 – 2 weeks' },
  { value: '2_to_4_weeks', label: '2 – 4 weeks' },
  { value: '1_to_3_months', label: '1 – 3 months' },
  { value: '3_to_6_months', label: '3 – 6 months' },
  { value: '6_months_to_1_year', label: '6 months – 1 year' },
  { value: 'more_than_1_year', label: 'More than 1 year' },
];

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Duration options" className="gap-3">
      {DURATION_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            className={`min-h-[56px] justify-center rounded-2xl border px-5 ${
              isSelected
                ? 'border-teal-600 bg-teal-600'
                : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
            }`}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Text
              variant="bodyMedium"
              className={
                isSelected
                  ? 'text-white'
                  : 'text-text-secondary dark:text-text-secondary-dark'
              }
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
