import { type ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

// A labelled group of settings rows. Optional heading + a hairline-bordered
// container. Keeps the hub calm and scannable.

type SettingsSectionProps = {
  title?: string;
  children: ReactNode;
};

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View className="gap-1">
      {title ? (
        <Text
          variant="caption"
          className="px-1 pt-2 uppercase tracking-wide text-text-tertiary dark:text-text-tertiary-dark"
        >
          {title}
        </Text>
      ) : null}
      <View className="rounded-xl border border-border px-2 dark:border-border-dark">
        {children}
      </View>
    </View>
  );
}
