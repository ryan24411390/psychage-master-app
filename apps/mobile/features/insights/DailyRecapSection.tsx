import { View } from 'react-native';

import { TrendLine } from '@/components/ui/charts';
import { Text } from '@/components/ui/Text';

import { buildDailyRecap, type DailyRecapInput } from './daily-recap';
import { PresenceCalendar } from './PresenceCalendar';

// DailyRecapSection — the gentle, descriptive header of the Insights screen, built only
// from the on-device check-in (Moments) + energy (Clarity Journal) records. Three pieces:
//   1. a presence calendar (which days have a check-in — NOT a mood-intensity heatmap),
//   2. a factual weekly recap line ("You checked in N of 7 days this week"),
//   3. ONE descriptive insight (a plain count) beside ONE trend (the energy line).
// DESCRIPTIVE ONLY (SR-1/SR-3): no score, gauge, percentage, verdict, or direction
// language. LOCAL-ONLY (SR-4): every value comes from a record the caller already read.
// The ambient companion lives on the screen (InsightsView), not here — and never reads
// the logged mood. Kept router-free so it renders in a plain RNTL harness.

export interface DailyRecapSectionProps {
  readonly input: DailyRecapInput;
  /** Injectable clock for tests; defaults to the real now. */
  readonly now?: () => Date;
  readonly testID?: string;
}

export function DailyRecapSection({ input, now = () => new Date(), testID }: DailyRecapSectionProps) {
  const recap = buildDailyRecap(input, now());

  return (
    <View testID={testID} className="rounded-xl bg-surface p-5 shadow-base dark:bg-surface-dark">
      <Text variant="heading" className="font-display text-[16px] text-text-primary dark:text-text-primary-dark">
        This week
      </Text>

      {recap.hasAnyData ? null : (
        <Text variant="bodySm" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
          Your check-ins and energy notes will appear here as you record them. Everything stays on
          your device.
        </Text>
      )}

      {/* Presence calendar — which of the last 14 days have a check-in. */}
      <View className="mt-4" accessibilityLabel={recap.weeklyRecap} accessible>
        <PresenceCalendar days={recap.presence} testID={testID ? `${testID}-presence` : undefined} />
      </View>

      <Text variant="bodyMedium" className="mt-4 text-text-primary dark:text-text-primary-dark">
        {recap.weeklyRecap}
      </Text>

      {/* One trend (energy) beside one descriptive note. */}
      <View className="mt-5 gap-2 border-t border-border pt-4 dark:border-border-dark">
        <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
          Energy you've logged
        </Text>
        <View className="items-center">
          <TrendLine
            data={recap.energySeries}
            accessibilityLabel="Energy readings you've logged over time"
            testID={testID ? `${testID}-energy` : undefined}
          />
        </View>
        <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
          {recap.energyInsight}
        </Text>
      </View>
    </View>
  );
}
