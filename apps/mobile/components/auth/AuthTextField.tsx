import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
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
//
// secureToggle (Amendment 2026-06-16): when set alongside secureTextEntry, a plain
// Show/Hide text button is rendered at the trailing edge and the field manages its own
// visibility. The toggle is a button (VoiceOver), label flips with state.

type AuthTextFieldProps = Omit<TextInputProps, 'style' | 'accessibilityLabel'> & {
  label: string;
  /** When present and non-empty: error styling + this plain line below the field. */
  errorText?: string;
  fieldAccessibilityHint?: string;
  /** Render a Show/Hide toggle (only meaningful with secureTextEntry). */
  secureToggle?: boolean;
  showLabel?: string;
  hideLabel?: string;
};

export function AuthTextField({
  label,
  errorText,
  fieldAccessibilityHint,
  secureToggle,
  secureTextEntry,
  showLabel = 'Show',
  hideLabel = 'Hide',
  onFocus,
  onBlur,
  ...props
}: AuthTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const { colorScheme } = useColorScheme();
  const placeholderColor = colorForScheme(resolveColorRef('color.text.tertiary'), colorScheme);

  const hasError = errorText !== undefined && errorText.length > 0;
  const hasToggle = Boolean(secureToggle && secureTextEntry);
  const effectiveSecure = secureTextEntry && !(hasToggle && visible);
  const borderClass = hasError
    ? 'border-error dark:border-error-dark'
    : focused
      ? 'border-text-secondary dark:border-text-secondary-dark'
      : 'border-border/40 dark:border-border-dark/40';

  return (
    <View className="gap-1.5">
      <Text variant="bodyLarge">{label}</Text>
      <View className="justify-center">
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={fieldAccessibilityHint}
          placeholderTextColor={placeholderColor}
          secureTextEntry={effectiveSecure}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className={`min-h-[52px] rounded-xl border bg-surface px-4 py-3 font-sans text-base text-text-primary dark:bg-surface-dark dark:text-text-primary-dark ${hasToggle ? 'pr-16' : ''} ${borderClass}`}
          {...props}
        />
        {hasToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? hideLabel : showLabel}
            hitSlop={8}
            onPress={() => setVisible((value) => !value)}
            className="absolute right-3 px-1 py-2"
          >
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
              {visible ? hideLabel : showLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {hasError ? (
        <Text variant="caption" className="text-error dark:text-error-dark">
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}
