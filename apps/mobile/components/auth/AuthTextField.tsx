import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useColorScheme } from 'nativewind';

import { Text } from '@/components/ui/Text';
import { colorForScheme, resolveColorRef } from '@/lib/a1-tokens';

// Calm auth field. AUTH IS CALM (whole-wave constraint):
//   • focus border = ink2 (color.text.secondary), NOT teal — teal stays out of state marks
//   • error = an `error`-coloured border + one plain Text line below (color + text, never
//     colour alone)
//   • NEVER a shake — no Reanimated, no transform on error. An error shake reads as
//     punitive; auth errors are quiet.
// 44px min target (iOS HIG), VoiceOver label + hint, Dynamic Type via Text/TextInput.

type AuthTextFieldProps = Omit<TextInputProps, 'style' | 'accessibilityLabel'> & {
  label: string;
  /** When present and non-empty: error styling + this plain line below the field. */
  errorText?: string;
  fieldAccessibilityHint?: string;
};

export function AuthTextField({
  label,
  errorText,
  fieldAccessibilityHint,
  onFocus,
  onBlur,
  ...props
}: AuthTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const { colorScheme } = useColorScheme();
  const placeholderColor = colorForScheme(resolveColorRef('color.text.tertiary'), colorScheme);

  const hasError = errorText !== undefined && errorText.length > 0;
  const borderClass = hasError
    ? 'border-error dark:border-error-dark'
    : focused
      ? 'border-text-secondary dark:border-text-secondary-dark'
      : 'border-border dark:border-border-dark';

  return (
    <View className="gap-1.5">
      <Text variant="bodyMedium">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={fieldAccessibilityHint}
        placeholderTextColor={placeholderColor}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={`min-h-[44px] rounded-lg border px-3 py-2 font-sans text-base text-text-primary dark:text-text-primary-dark ${borderClass}`}
        {...props}
      />
      {hasError ? (
        <Text variant="bodySm" className="text-error dark:text-error-dark">
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}
