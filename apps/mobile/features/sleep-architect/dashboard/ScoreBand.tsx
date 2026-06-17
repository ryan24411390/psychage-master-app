import { View } from 'react-native';

import type { SleepScoreBand } from '@psychage/shared/sleep';

import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';

// SR-1 surface. The composite score is computed as 0–100 in the shared module but
// reaches the UI ONLY as one of four bands — no number, no gauge, no percentage
// bar. This chip is the single rendering of `bandForScore`. The status dot is a
// gentle, non-alarming cue (sleep is framed as optimization, never a verdict): no
// red, no "urgency" — the lowest band is a muted charcoal, not an error color.

// Token-backed dot colors (tailwind.config.js): one calm accent per band.
const DOT_CLASS: Record<SleepScoreBand, string> = {
  rested: 'bg-teal-500',
  steady: 'bg-success',
  uneven: 'bg-warning',
  low: 'bg-charcoal-400',
};

type ScoreBandProps = {
  band: SleepScoreBand;
  caption?: string;
  testID?: string;
};

export function ScoreBand({ band, caption, testID }: ScoreBandProps) {
  const copy = CT4_SLEEP.bands[band];
  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      accessibilityLabel={`${copy.label}. ${copy.note}`}
      className="gap-1 rounded-xl border border-border bg-surface px-4 py-4 dark:border-border-dark dark:bg-surface-dark"
    >
      {caption ? (
        <Text
          variant="caption"
          className="uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark"
        >
          {caption}
        </Text>
      ) : null}
      <View className="flex-row items-center gap-2">
        <View className={`h-2.5 w-2.5 rounded-full ${DOT_CLASS[band]}`} />
        <Text variant="label">{copy.label}</Text>
      </View>
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
        {copy.note}
      </Text>
    </View>
  );
}
