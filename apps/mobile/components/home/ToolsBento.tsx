import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Link } from 'expo-router';
import { TOOLS } from '@/lib/tool-usage-store';

export function ToolsBento() {
  const primaryTools = [TOOLS.toolkit, TOOLS.navigator];
  const secondaryTools = [TOOLS.mindmate, TOOLS.clarity, TOOLS.breathing];

  return (
    <View className="gap-3">
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider ml-1 mt-2">
        When you need something now
      </Text>
      
      {/* Primary Tools (Stacked full width) */}
      {primaryTools.map(t => (
        <Link key={t.id} href={t.route as any} asChild>
          <Pressable className="rounded-xl border border-border/40 bg-surface p-5 shadow-sm active:scale-[0.98] dark:border-border-dark/40 dark:bg-surface-dark">
            <Text variant="h3" className="mb-1">{t.title}</Text>
            <Text variant="bodySmall" className="font-sans-medium text-text-secondary dark:text-text-secondary-dark">
              {t.name}
            </Text>
          </Pressable>
        </Link>
      ))}

      {/* Secondary Tools (Side by side using flex-wrap or row) */}
      <View className="flex-row gap-3">
        {secondaryTools.map(t => (
          <Link key={t.id} href={t.route as any} asChild>
            <Pressable className="flex-1 rounded-xl border border-border/40 bg-surface p-4 shadow-sm active:scale-[0.98] dark:border-border-dark/40 dark:bg-surface-dark justify-between min-h-[100px]">
              <Text variant="h5" className="mb-1 leading-tight">{t.name}</Text>
              <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">Tool</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}
