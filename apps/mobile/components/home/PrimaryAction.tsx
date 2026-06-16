import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Tool } from '@/lib/tool-usage-store';
import { Link } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

type PrimaryActionProps = {
  checkedInToday: boolean;
  dormantTool: { tool: Tool; sinceDays: number } | null;
  onCheckIn: () => void;
};

export function PrimaryAction({ checkedInToday, dormantTool, onCheckIn }: PrimaryActionProps) {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#34D399' : '#059669'; // emerald-400 / emerald-600

  if (!checkedInToday) {
    return (
      <Button variant="primary" onPress={onCheckIn}>
        Check in — 30 seconds
      </Button>
    );
  }

  if (dormantTool) {
    return (
      <Link href={dormantTool.tool.route as any} asChild>
        <Pressable className="overflow-hidden rounded-xl bg-surface-active p-5 shadow-base dark:bg-surface-active-dark flex-row items-center justify-between active:scale-[0.98]">
          <View className="flex-1 gap-1">
            <Text variant="caption" className="text-primary dark:text-primary-dark font-sans-medium">It's been a while</Text>
            <Text variant="h5" className="text-text-primary dark:text-text-primary-dark">Use {dormantTool.tool.name}</Text>
          </View>
          <View className="bg-background dark:bg-background-dark px-4 py-2 rounded-full border border-border/50 dark:border-border-dark/50">
            <Text variant="bodySmall" className="font-sans-medium">Open</Text>
          </View>
        </Pressable>
      </Link>
    );
  }

  return (
    <View className="flex-row items-center justify-center py-4 bg-transparent">
      <Check size={20} color={iconColor} className="mr-2" />
      <Text variant="h6" className="text-text-secondary dark:text-text-secondary-dark">Checked in today</Text>
    </View>
  );
}
