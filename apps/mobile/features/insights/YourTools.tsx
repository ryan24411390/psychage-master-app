import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { ToolUsageData } from '@/lib/tool-usage-store';
import { useThemeColors } from '@/lib/use-theme-colors';

import { INSIGHTS_COPY } from './copy';
import { recentTools, relativeDayLabel } from './tool-recency';

// "Your Tools" (P47): the four tools the user opened most recently, each with a neutral
// last-opened line. Reads tool-usage only — no streak, score, or count-as-achievement
// framing. Tools never opened are absent. Tapping re-opens the tool.

export interface YourToolsProps {
  readonly usage: ToolUsageData;
  readonly onOpenTool: (route: string) => void;
  /** Injectable clock (epoch ms) for tests; defaults to the real now. */
  readonly now?: () => number;
  readonly testID?: string;
}

export function YourTools({ usage, onOpenTool, now = () => Date.now(), testID }: YourToolsProps) {
  const tc = useThemeColors();
  const nowMs = now();
  const tools = recentTools(usage, 4);

  return (
    <View testID={testID} className="gap-2">
      <View className="gap-1">
        <Text variant="h2" className="font-display text-[22px] tracking-tight text-text-primary dark:text-text-primary-dark">
          {INSIGHTS_COPY.yourTools.heading}
        </Text>
        <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
          {INSIGHTS_COPY.yourTools.subhead}
        </Text>
      </View>

      {tools.length === 0 ? (
        <View className="rounded-[24px] bg-surface p-5 shadow-base dark:bg-surface-dark">
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {INSIGHTS_COPY.yourTools.empty}
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {tools.map(({ tool, lastAtMs }) => (
            <Pressable
              key={tool.id}
              testID={testID ? `${testID}-${tool.id}` : undefined}
              accessibilityRole="button"
              accessibilityLabel={`Open ${tool.name}`}
              onPress={() => onOpenTool(tool.route)}
              hitSlop={4}
              className="flex-row items-center justify-between rounded-[20px] bg-surface p-4 shadow-base active:opacity-70 dark:bg-surface-dark"
            >
              <View className="flex-1 pr-3">
                <Text variant="bodyLarge" className="text-text-primary dark:text-text-primary-dark">
                  {tool.name}
                </Text>
                <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                  {`${INSIGHTS_COPY.yourTools.lastOpenedPrefix} ${relativeDayLabel(lastAtMs, nowMs)}`}
                </Text>
              </View>
              <ChevronRight size={18} color={tc.inkSecondary} strokeWidth={2} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
