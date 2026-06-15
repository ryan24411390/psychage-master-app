import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

// A single domain's 0–100 score as a labelled horizontal bar. Numbers are kept
// (per the product decision to mirror the web tool); the fill uses the single
// brand-teal accent — domains are told apart by label + value, not by color.

export interface DomainBarProps {
  readonly label: string;
  readonly score: number;
  readonly subLabel?: string;
}

export function DomainBar({ label, score, subLabel }: DomainBarProps) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <View className="gap-1.5">
      <View className="flex-row items-baseline justify-between">
        <Text variant="bodyMedium" className="text-[15px]">
          {label}
        </Text>
        <Text variant="bodyMedium" className="text-[15px] text-primary dark:text-primary-dark">
          {score}
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {' '}
            / 100
          </Text>
        </Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ now: clamped, min: 0, max: 100 }}
        className="h-2 overflow-hidden rounded-full bg-surface-active dark:bg-surface-active-dark"
      >
        <View className="h-full rounded-full bg-primary dark:bg-primary-dark" style={{ width: `${clamped}%` }} />
      </View>
      {subLabel ? (
        <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
          {subLabel}
        </Text>
      ) : null}
    </View>
  );
}
