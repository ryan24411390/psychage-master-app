import { Pressable, View } from 'react-native';

import type { UserFrequency } from '@psychage/shared/navigator';

import { Text } from '@/components/ui/Text';

// Per-symptom frequency — mobile port of web components/navigator/FrequencyPicker.
// Four options with a label + helper description and a radio dot. Values VERBATIM from
// web (they drive the engine's frequency modifier). Selected = inverted (ink) surface.

export interface FrequencyPickerProps {
  readonly value?: UserFrequency;
  readonly onChange: (value: UserFrequency) => void;
}

const FREQUENCY_OPTIONS: ReadonlyArray<{
  value: UserFrequency;
  label: string;
  description: string;
}> = [
  { value: 'rarely', label: 'Rarely', description: 'Less than once a week' },
  { value: 'sometimes', label: 'Sometimes', description: 'A few times a week' },
  { value: 'often', label: 'Often', description: 'Almost every day' },
  { value: 'always', label: 'Constant', description: 'Persistent throughout the day' },
];

export function FrequencyPicker({ value, onChange }: FrequencyPickerProps) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Frequency options" className="gap-3">
      {FREQUENCY_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${option.label}. ${option.description}`}
            onPress={() => onChange(option.value)}
            className={`min-h-[56px] flex-row items-start gap-4 rounded-2xl border p-4 ${
              isSelected
                ? 'border-text-primary bg-text-primary dark:border-text-primary-dark dark:bg-text-primary-dark'
                : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
            }`}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <View
              className={`mt-0.5 h-5 w-5 items-center justify-center rounded-full border-2 ${
                isSelected ? 'border-background dark:border-background-dark' : 'border-border dark:border-border-dark'
              }`}
            >
              {isSelected ? (
                <View className="h-2.5 w-2.5 rounded-full bg-background dark:bg-background-dark" />
              ) : null}
            </View>
            <View className="flex-1">
              <Text
                variant="bodyMedium"
                className={
                  isSelected
                    ? 'text-background dark:text-background-dark'
                    : 'text-text-secondary dark:text-text-secondary-dark'
                }
              >
                {option.label}
              </Text>
              <Text
                variant="bodySm"
                className={
                  isSelected
                    ? 'text-background/80 dark:text-background-dark/80'
                    : 'text-text-tertiary dark:text-text-tertiary-dark'
                }
              >
                {option.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
