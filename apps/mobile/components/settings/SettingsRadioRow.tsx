import { Check } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

// C-RADIO grammar for register-neutral choices (S45 appearance: light / night /
// system). Mirrors components/check-in/StateRows.tsx — radiogroup semantics,
// selection = BORDER + CHECK (a non-color signal), VoiceOver announces the
// checked option.
//
// DELIBERATE DIVERGENCE from StateRows: that selector is the mood domain and its
// check is teal; settings state marks are CHARCOAL, never teal (the wave's
// register-neutral rule — a teal mark would read as brand emphasis on a neutral
// preference). The selected border is borderStrong (charcoal.500), the check glyph
// is charcoal.700.

export type RadioOption<T extends string> = {
  value: T;
  label: string;
};

type SettingsRadioRowProps<T extends string> = {
  /** Group label for VoiceOver. */
  groupLabel: string;
  options: readonly RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SettingsRadioRow<T extends string>({
  groupLabel,
  options,
  value,
  onChange,
}: SettingsRadioRowProps<T>) {
  // Selection mark stays on the CHARCOAL register (never teal — the wave's
  // register-neutral rule). On the true-black canvas charcoal-700 vanishes (~2:1),
  // so the mark flips to a light charcoal in dark while light mode is unchanged.
  const { colorScheme } = useColorScheme();
  const checkColor = colorScheme === 'dark' ? colors.charcoal[300] : colors.charcoal[700];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={groupLabel} className="gap-2">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            className={`min-h-[44px] flex-row items-center gap-3 rounded-lg border-2 px-3 py-2 ${
              isSelected
                ? 'border-charcoal-500'
                : 'border-border dark:border-border-dark'
            }`}
          >
            <Text variant="bodyMedium" className="flex-1">
              {option.label}
            </Text>
            {isSelected ? (
              <Check
                size={20}
                color={checkColor}
                strokeWidth={2.25}
                testID="settings-radio-check"
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
