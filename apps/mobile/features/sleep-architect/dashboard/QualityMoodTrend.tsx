import { useWindowDimensions, View } from 'react-native';

import type { SleepEntry } from '@psychage/shared/sleep';

import { Card } from '@/components/ui/Card';
import { TrendLine, type TrendPoint } from '@/components/ui/charts/TrendLine';
import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { colors } from '@/lib/colors';

// Self-rated quality + morning-mood trends (1–5), each on the shared TrendLine with a
// fixed 1–5 axis (so the lines read on a stable scale). Two gentle lines to notice
// alongside the nights — never scored or judged (SR-1 / SR-3). All from the on-device
// store (SR-4). Consumes the shared chart kit; no in-feature chart code.

type QualityMoodTrendProps = {
  entries: readonly SleepEntry[]; // chronological (oldest → newest)
};

export function QualityMoodTrend({ entries }: QualityMoodTrendProps) {
  const { width } = useWindowDimensions();
  const t = CT4_SLEEP.trends;

  // TrendLine needs ≥2 points; with fewer nights there is no trend to show.
  if (entries.length < 2) return null;

  const qualityData: TrendPoint[] = entries.map((e, i) => ({ x: i, y: e.sleep_quality }));
  const moodData: TrendPoint[] = entries.map((e, i) => ({ x: i, y: e.morning_mood }));
  const chartWidth = Math.max(0, width - 64);

  return (
    <Card className="gap-3 px-4 py-4">
      <TrendRow
        label={t.qualityTitle}
        dotClass="bg-teal-500"
        data={qualityData}
        width={chartWidth}
      />
      <TrendRow
        label={t.moodTitle}
        dotClass="bg-charcoal-400"
        data={moodData}
        width={chartWidth}
        lineColor={colors.charcoal[400]}
      />
    </Card>
  );
}

function TrendRow({
  label,
  dotClass,
  data,
  width,
  lineColor,
}: {
  label: string;
  dotClass: string;
  data: readonly TrendPoint[];
  width: number;
  lineColor?: string;
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
      <TrendLine
        data={data}
        width={width}
        height={72}
        yMin={1}
        yMax={5}
        lineColor={lineColor}
        accessibilityLabel={label}
      />
    </View>
  );
}
