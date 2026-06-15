import { View } from 'react-native';

import {
  calculateMetrics,
  dayNumber,
  formatDuration,
  type SleepEntry,
  toLocalCalendarDate,
} from '@psychage/shared/sleep';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';

// Last-7-nights digest. Counts + typical rested length this week, plus a gentle
// week-over-week comparison. All computed locally from the on-device store (SR-4);
// purely descriptive, never a verdict or target (SR-1 / SR-3). Reuses the shared
// pure calculators — no new domain logic.

type WeeklyDigestProps = {
  entries: readonly SleepEntry[]; // newest-first
};

// Minutes of difference below which two weeks read as "about the same" rested time.
const SAME_THRESHOLD_MINUTES = 15;

function avg(nums: readonly number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function restedMinutes(entries: readonly SleepEntry[]): number {
  return avg(entries.map((e) => calculateMetrics(e).total_sleep_minutes));
}

export function WeeklyDigest({ entries }: WeeklyDigestProps) {
  const t = CT4_SLEEP.weeklyDigest;
  const todayNum = dayNumber(toLocalCalendarDate(new Date()));

  const thisWeek = entries.filter((e) => dayNumber(e.date) >= todayNum - 6);
  const priorWeek = entries.filter((e) => {
    const d = dayNumber(e.date);
    return d <= todayNum - 7 && d >= todayNum - 13;
  });

  return (
    <Card className="gap-2 px-4 py-4">
      <Text
        variant="caption"
        className="uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark"
      >
        {t.title}
      </Text>

      {thisWeek.length === 0 ? (
        <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
          {t.emptyWeek}
        </Text>
      ) : (
        <>
          <View className="flex-row items-baseline justify-between">
            <Text variant="bodyBold">{t.nightsLabel(thisWeek.length)}</Text>
            <View className="flex-row items-baseline gap-2">
              <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
                {t.typicalLabel}
              </Text>
              <Text variant="bodyBold">{formatDuration(Math.round(restedMinutes(thisWeek)))}</Text>
            </View>
          </View>

          {priorWeek.length > 0 ? (
            <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
              {comparisonCopy(restedMinutes(thisWeek) - restedMinutes(priorWeek))}
            </Text>
          ) : null}
        </>
      )}
    </Card>
  );
}

function comparisonCopy(diffMinutes: number): string {
  const t = CT4_SLEEP.weeklyDigest;
  if (diffMinutes > SAME_THRESHOLD_MINUTES) return t.moreRested;
  if (diffMinutes < -SAME_THRESHOLD_MINUTES) return t.lessRested;
  return t.aboutSame;
}
