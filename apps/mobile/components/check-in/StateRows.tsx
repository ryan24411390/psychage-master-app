import type { CheckInState } from '@psychage/shared/check-in';
import { Check } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Pressable, View } from 'react-native';

import { MoodGlyphFace } from '@/components/icon-system/mood';
import { Text } from '@/components/ui/Text';
import { colorForScheme, resolveColorRef } from '@/lib/a1-tokens';
import { STATE_LABELS } from '@/lib/check-in-labels';

// C0.4 the five-state selector. FIXED order Very low → Very good (state 0..4),
// each row = the mood-scale glyph (MoodGlyphFace — direction B, clinically signed
// off by Dr. Lena Dobson) + plain label. Selection = BORDER + CHECK, never color
// alone (the check mark is a non-color signal). Radio-group VoiceOver semantics;
// the checked state is announced. No emoji (the face is a drawn vector, not an
// emoji glyph). Ships inside S4 (sub-slice E); built + tested here.
// Labels are single-sourced (verbatim v5) in lib/check-in-labels.

const STATES: readonly CheckInState[] = [0, 1, 2, 3, 4];

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
            accessibilityLabel={STATE_LABELS[state]}
            onPress={() => onChange(state)}
            className={`min-h-[44px] flex-row items-center gap-3 rounded-lg border-2 px-3 py-2 ${
              isSelected
                ? 'border-primary dark:border-primary-dark'
                : 'border-border dark:border-border-dark'
            }`}
          >
            <MoodGlyphFace state={state} />
            <Text variant="bodyMedium" className="flex-1">
              {STATE_LABELS[state]}
            </Text>
            {isSelected && <Check size={20} color={checkColor} strokeWidth={2.25} />}
          </Pressable>
        );
      })}
    </View>
  );
}
