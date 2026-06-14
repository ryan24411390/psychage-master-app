import type { CheckInState } from '@psychage/shared/check-in';
import { Check } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colorForScheme, resolveColorRef } from '@/lib/a1-tokens';

// C0.4 the five-state selector. FIXED order Very low → Very good (state 0..4),
// each row = a proportional fill glyph (terrain.fillByState 12/32/52/74/95%) +
// plain label + mood tint. Selection = BORDER + CHECK, never color alone (the
// check mark is a non-color signal). Radio-group VoiceOver semantics; the checked
// state is announced. No emoji. Ships inside S4 (sub-slice E); built + tested here.
//
// Copy is the verbatim v5 `labels` array — Very low / Low / Okay / Good / Very
// good. (The token _note's Awful…Great set is stale; the order names the endpoints
// "Very low → Very good" and v5 governs the rest.)

const STATES: readonly CheckInState[] = [0, 1, 2, 3, 4];

const LABELS: Record<CheckInState, string> = {
  0: 'Very low',
  1: 'Low',
  2: 'Okay',
  3: 'Good',
  4: 'Very good',
};

// Proportional fill heights — these literals mirror terrain.fillByState; the
// a1-tokens unit test pins fillByState so a token change fails loudly here.
// NativeWind needs static class literals, so the % cannot be templated from the
// token at runtime — the test is the coupling guard.
const FILL_HEIGHT: Record<CheckInState, string> = {
  0: 'h-[12%]',
  1: 'h-[32%]',
  2: 'h-[52%]',
  3: 'h-[74%]',
  4: 'h-[95%]',
};

const TINT_BG: Record<CheckInState, string> = {
  0: 'bg-mood-1',
  1: 'bg-mood-2',
  2: 'bg-mood-3',
  3: 'bg-mood-4',
  4: 'bg-mood-5',
};

function FillGlyph({ state }: { state: CheckInState }) {
  return (
    <View className="h-7 w-7 justify-end overflow-hidden rounded-md border border-border dark:border-border-dark">
      <View className={`w-full ${FILL_HEIGHT[state]} ${TINT_BG[state]}`} />
    </View>
  );
}

type StateRowsProps = {
  /** Selected state, or null when nothing is chosen yet (save disabled upstream). */
  value: CheckInState | null;
  onChange: (state: CheckInState) => void;
};

export function StateRows({ value, onChange }: StateRowsProps) {
  const { colorScheme } = useColorScheme();
  const checkColor = colorForScheme(resolveColorRef('color.primary.default'), colorScheme);

  return (
    <View accessibilityRole="radiogroup" className="gap-2">
      {STATES.map((state) => {
        const isSelected = value === state;
        return (
          <Pressable
            key={state}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={LABELS[state]}
            onPress={() => onChange(state)}
            className={`min-h-[44px] flex-row items-center gap-3 rounded-lg border-2 px-3 py-2 ${
              isSelected
                ? 'border-primary dark:border-primary-dark'
                : 'border-border dark:border-border-dark'
            }`}
          >
            <FillGlyph state={state} />
            <Text variant="bodyMedium" className="flex-1">
              {LABELS[state]}
            </Text>
            {isSelected && <Check size={20} color={checkColor} strokeWidth={2.25} />}
          </Pressable>
        );
      })}
    </View>
  );
}
