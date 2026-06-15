import { type ReactNode } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
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
          className="ml-2 uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark"
        >
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-xl border border-border/40 bg-surface dark:border-border-dark/40 dark:bg-surface-dark">
        {children}
      </View>
    </View>
  );
}
