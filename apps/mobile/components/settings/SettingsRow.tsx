import { ChevronRight } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

// A calm navigation row for the Settings hub (S42) and its sub-screens. Label
// left, optional value + chevron right. 44px floor. `destructive` tints the label
// (used by the sign-out / delete entry points — NOT the filled-rust button; that
// is DestructivePair). No teal anywhere here.

type SettingsRowProps = {
  label: string;
  /** Trailing value text (e.g. the current reminder time, the selected mode). */
  value?: string;
  onPress?: () => void;
  /** Show the trailing chevron (navigation affordance). Default true. */
  chevron?: boolean;
  /** Tints the label as a destructive entry point (charcoal→error). Default false. */
  destructive?: boolean;
  /** Leading icon slot. */
  icon?: ReactNode;
  testID?: string;
};

export function SettingsRow({
  label,
  value,
  onPress,
  chevron = true,
  destructive = false,
  icon,
  testID,
}: SettingsRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      className="min-h-[52px] flex-row items-center gap-3 px-4 py-3 active:bg-surface-active dark:active:bg-surface-active-dark border-b border-border-hairline last:border-b-0"
    >
      {icon ? <View>{icon}</View> : null}
      <Text
        variant="bodyMedium"
        className={`flex-1 ${destructive ? 'text-error dark:text-error-dark' : ''}`}
      >
        {label}
      </Text>
      {value ? (
        <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
          {value}
        </Text>
      ) : null}
      {chevron ? (
        <ChevronRight size={18} color={colors.charcoal[400]} strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}
