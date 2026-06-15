import { useColorScheme } from 'nativewind';
import { useWindowDimensions, View } from 'react-native';

import type { SleepEntry } from '@psychage/shared/sleep';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { colors } from '@/lib/colors';

import { Sparkline } from './Sparkline';

// Self-rated quality + morning-mood trends (1–5), each a reused Sparkline. Two
// gentle lines to notice alongside the nights — never scored or judged (SR-1 /
// SR-3). All from the on-device store (SR-4). Reuses the in-feature Sparkline; no
// new chart code.

type QualityMoodTrendProps = {
  entries: readonly SleepEntry[]; // chronological (oldest → newest)
};

export function QualityMoodTrend({ entries }: QualityMoodTrendProps) {
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const t = CT4_SLEEP.trends;

  // Sparkline needs ≥2 points; with fewer nights there is no trend to show.
  if (entries.length < 2) return null;

  const qualityValues = entries.map((e) => e.sleep_quality);
  const moodValues = entries.map((e) => e.morning_mood);

  const qualityTint = colorScheme === 'dark' ? colors.teal[400] : colors.teal[600];
  const moodTint = colors.charcoal[400];
  const chartWidth = Math.max(0, width - 64);

  return (
    <Card className="gap-3 px-4 py-4">
      <TrendRow
        label={t.qualityTitle}
        dotClass="bg-teal-500"
        values={qualityValues}
        width={chartWidth}
        color={qualityTint}
      />
      <TrendRow
        label={t.moodTitle}
        dotClass="bg-charcoal-400"
        values={moodValues}
        width={chartWidth}
        color={moodTint}
      />
    </Card>
  );
}

function TrendRow({
  label,
  dotClass,
  values,
  width,
  color,
}: {
  label: string;
  dotClass: string;
  values: readonly number[];
  width: number;
  color: string;
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <View className={`h-2 w-2 rounded-full ${dotClass}`} />
        <Text
          variant="caption"
          className="uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark"
        >
          {label}
        </Text>
      </View>
      <Sparkline values={values} width={width} color={color} />
    </View>
  );
}
