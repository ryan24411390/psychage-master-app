import { VALENCE_MAX, VALENCE_MIN } from '@psychage/shared/mood-journal';
import { View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';

// A 1–10 pleasantness picker (the optional valence step). Single-select, calm by
// design: a teal BORDER + teal numeral when chosen, neutral otherwise — no color
// floods, mirroring TagChip / StateRows ("teal sparingly"). The endpoints are labelled
// in words so the scale reads without a legend. ≥44pt targets (DESIGN.mobile.md §7);
// the row wraps on narrow screens. NativeWind classes only.
//
// Descriptive, not diagnostic (SR-3): this is the PERSON's own read of a moment, never
// a score the app assigns. `value` of null = unrated (the step is skippable).

type ValenceScaleProps = {
  value: number | null;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
};

const SCALE = Array.from({ length: VALENCE_MAX - VALENCE_MIN + 1 }, (_, i) => VALENCE_MIN + i);

export function ValenceScale({ value, onChange, lowLabel, highLabel }: ValenceScaleProps) {
  return (
    <View>
      <View className="flex-row flex-wrap justify-between gap-2">
        {SCALE.map((n) => {
          const selected = value === n;
          return (
            <AnimatedPressable
              key={n}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Rate ${n} of ${VALENCE_MAX}`}
              testID={`valence-chip-${n}`}
              onPress={() => onChange(n)}
              className={`h-11 w-11 items-center justify-center rounded-full border ${
                selected
                  ? 'border-primary dark:border-primary-dark'
                  : 'border-border dark:border-border-dark'
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
                {n}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
          {lowLabel}
        </Text>
        <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
          {highLabel}
        </Text>
      </View>
    </View>
  );
}
