import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';

type BentoCardProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
};

export function BentoCard({ title, description, icon, children }: BentoCardProps) {
  return (
    <View className="overflow-hidden rounded-3xl border border-border/40 bg-surface dark:border-border-dark/40 dark:bg-surface-dark">
      {(title || icon) && (
        <View className="flex-row items-center gap-3 px-5 pt-5 pb-2">
          {icon && (
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-charcoal-50 dark:bg-charcoal-800">
              {icon}
            </View>
          )}
          <View className="flex-1 justify-center">
            {title && (
              <Text variant="label" className="text-lg leading-tight">
                {title}
              </Text>
            )}
            {description && (
              <Text
                variant="caption"
                className="mt-0.5 text-text-secondary dark:text-text-secondary-dark"
              >
                {description}
              </Text>
            )}
          </View>
        </View>
      )}
      <View className="px-3 pb-3 pt-1">
        <View className="overflow-hidden rounded-[20px] bg-charcoal-50/50 dark:bg-charcoal-900/50">
          {children}
        </View>
      </View>
    </View>
  );
}
