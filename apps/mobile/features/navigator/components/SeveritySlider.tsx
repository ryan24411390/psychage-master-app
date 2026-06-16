import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

// Per-symptom severity (1–10) — mobile port of web components/navigator/SeveritySlider.
// 10 segmented squares + a large live value + tier label. Color ramps teal→amber→red
// with intensity, exactly like web. radiogroup semantics; selection is the only state.
//
// NOTE (relevance vs severity): the no-number/no-meter clinical guard applies to the
// RESULT relevance, not to this INPUT — the user is rating their own experience here,
// which is the same self-report scale web uses.

export interface SeveritySliderProps {
  readonly value?: number; // 1–10, defaults to 5 (matches web)
  readonly onChange: (value: number) => void;
}

const SEVERITY_LABELS: Record<number, string> = {
  1: 'Very Mild',
  2: 'Mild',
  3: 'Mild',
  4: 'Moderate',
  5: 'Moderate',
  6: 'Moderate',
  7: 'Significant',
  8: 'Significant',
  9: 'Severe',
  10: 'Severe',
};

// Tailwind classes for the filled segment, by selected intensity (web getSegmentColor).
function filledSegmentClass(selected: number): string {
  if (selected <= 3) return 'bg-teal-500 border-teal-500';
  if (selected <= 6) return 'bg-teal-600 border-teal-600';
  if (selected <= 8) return 'bg-warning border-warning';
  return 'bg-crisis border-crisis';
}

function valueColorClass(val: number): string {
  if (val <= 3) return 'text-teal-500';
  if (val <= 6) return 'text-teal-600';
  if (val <= 8) return 'text-warning dark:text-warning-dark';
  return 'text-crisis dark:text-crisis-dark';
}

export function SeveritySlider({ value = 5, onChange }: SeveritySliderProps) {
  const selected = value;
  return (
    <View className="gap-5">
      {/* Live value + tier label */}
      <View className="items-center">
        <Text variant="headingLg" className={`text-5xl ${valueColorClass(selected)}`}>
          {String(selected)}
        </Text>
        <Text variant="bodyMedium" className={`mt-1 ${valueColorClass(selected)}`}>
          {SEVERITY_LABELS[selected]}
        </Text>
      </View>

      {/* Segmented buttons */}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Severity scale from 1 to 10"
        className="flex-row gap-1.5"
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
          const isSelected = num === selected;
          const isFilled = num <= selected;
          return (
            <Pressable
              key={num}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${num} — ${SEVERITY_LABELS[num]}`}
              onPress={() => onChange(num)}
              className={`aspect-square flex-1 items-center justify-center rounded-lg border ${
                isFilled
                  ? filledSegmentClass(selected)
                  : 'border-border bg-surface-accent dark:border-border-dark dark:bg-surface-accent-dark'
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text
                variant="caption"
                className={
                  isFilled
                    ? 'text-white'
                    : 'text-text-tertiary dark:text-text-tertiary-dark'
                }
              >
                {String(num)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Min / Max labels */}
      <View className="flex-row justify-between px-1">
        <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
          Mild
        </Text>
        <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
          Severe
        </Text>
      </View>
    </View>
  );
}
