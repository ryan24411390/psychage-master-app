import { View } from 'react-native';

import { TrendLine } from '@/components/ui/charts';
import { Text } from '@/components/ui/Text';

import { buildDailyRecap, type DailyRecapInput } from './daily-recap';
import { PresenceCalendar } from './PresenceCalendar';

// DailyRecapSection — upgraded premium header.

export interface DailyRecapSectionProps {
  readonly input: DailyRecapInput;
  /** Injectable clock for tests; defaults to the real now. */
  readonly now?: () => Date;
  readonly testID?: string;
}

export function DailyRecapSection({ input, now = () => new Date(), testID }: DailyRecapSectionProps) {
  const recap = buildDailyRecap(input, now());

  return (
    <View testID={testID} className="overflow-hidden rounded-[24px] bg-surface p-1 shadow-lg shadow-black/5 dark:bg-surface-dark dark:shadow-black/20">
      <View className="rounded-[20px] bg-surface-active p-6 dark:bg-surface-active-dark">
        <Text variant="h2" className="font-display text-[22px] tracking-tight text-text-primary dark:text-text-primary-dark">
          This week
        </Text>

        {recap.hasAnyData ? null : (
          <Text variant="body" className="mt-2 text-text-secondary dark:text-text-secondary-dark">
            Your check-ins and energy notes will appear here as you record them. Everything stays on
            your device.
          </Text>
        )}

        {/* Presence calendar */}
        <View className="mt-4" accessibilityLabel={recap.weeklyRecap} accessible>
          <PresenceCalendar days={recap.presence} testID={testID ? `${testID}-presence` : undefined} />
        </View>

        <View className="mt-6 rounded-2xl bg-surface/80 p-4 dark:bg-surface-dark/80">
          <Text variant="bodyLarge" className="text-center font-medium text-text-primary dark:text-text-primary-dark">
            {recap.weeklyRecap}
          </Text>
        </View>

        {/* Energy Trend */}
        <View className="mt-6 pt-4 border-t border-border/50 dark:border-border-dark/50">
          <View className="flex-row justify-between items-end mb-2 px-1">
            <Text variant="bodyLarge" className="font-semibold text-text-primary dark:text-text-primary-dark">
              Energy logged
            </Text>
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark text-right flex-1 ml-4" numberOfLines={2}>
              {recap.energyInsight}
            </Text>
          </View>
          
          <View className="items-center bg-surface/50 dark:bg-surface-dark/50 rounded-[16px] py-2 mt-2">
            <TrendLine
              data={recap.energySeries}
              yMin={0}
              yMax={10}
              accessibilityLabel="Energy readings you've logged over time"
              testID={testID ? `${testID}-energy` : undefined}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
