import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

import { buildDailyRecap, type DailyRecapInput } from './daily-recap';
import { PresenceCalendar } from './PresenceCalendar';

// "This week" — the presence calendar + a factual weekly count of the days a moment was
// recorded. Descriptive only (SR-1/SR-3): presence + a count, never a score or a verdict.
// Rendered only when there is moment history; the empty case is owned by the screen-level
// no-data state.

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

        {/* Presence calendar */}
        <View className="mt-4" accessibilityLabel={recap.weeklyRecap} accessible>
          <PresenceCalendar days={recap.presence} testID={testID ? `${testID}-presence` : undefined} />
        </View>

        <View className="mt-6 rounded-2xl bg-surface/80 p-4 dark:bg-surface-dark/80">
          <Text variant="bodyLarge" className="text-center font-medium text-text-primary dark:text-text-primary-dark">
            {recap.weeklyRecap}
          </Text>
        </View>
      </View>
    </View>
  );
}
