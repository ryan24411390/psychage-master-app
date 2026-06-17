import {
  Activity,
  ChevronRight,
  Compass,
  HeartHandshake,
  HeartPulse,
  Moon,
  Notebook,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import type { ToolKey, ToolSummary } from './aggregate';

// Home "Your tools" surface: a compact, tappable summary of every tool the user has
// data in, newest-used first. Replaces the old single-tool fixation — tapping opens
// the full Insights screen (per-tool charts, one by one). Renders nothing when the
// user has no tool data yet (the caller omits it from the layout).

const ICONS: Record<ToolKey, ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  checkin: HeartPulse,
  clarity: Activity,
  navigator: Compass,
  relationship: HeartHandshake,
  mood: Notebook,
  sleep: Moon,
};

export interface ToolSummaryCardProps {
  readonly summaries: readonly ToolSummary[];
  readonly onOpen: () => void;
  readonly testID?: string;
}

export function ToolSummaryCard({ summaries, onOpen, testID }: ToolSummaryCardProps) {
  const tc = useThemeColors();
  if (summaries.length === 0) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Your tools — ${summaries.length} with data. Open insights.`}
      onPress={onOpen}
      testID={testID ?? 'tool-summary-card'}
      className="rounded-xl bg-surface p-5 shadow-base dark:bg-surface-dark active:scale-[0.99]"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View className="flex-row items-center justify-between">
        <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
          Your tools
        </Text>
        <View className="flex-row items-center gap-1">
          <Text variant="bodyLarge" className="text-primary dark:text-primary-dark">
            Insights
          </Text>
          <ChevronRight size={16} color={tc.primary} strokeWidth={2} />
        </View>
      </View>

      <View className="mt-3 gap-3">
        {summaries.map((s) => {
          const Icon = ICONS[s.key];
          return (
            <View key={s.key} className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-[10px] bg-surface-accent dark:bg-surface-accent-dark">
                <Icon size={18} color={tc.primary} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text variant="bodyLarge" className="text-text-primary dark:text-text-primary-dark">
                  {s.name}
                </Text>
                <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                  {s.metric}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}
