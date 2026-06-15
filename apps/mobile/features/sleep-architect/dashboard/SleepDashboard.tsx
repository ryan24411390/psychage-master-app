import { useColorScheme } from 'nativewind';
import { useWindowDimensions, View } from 'react-native';

import {
  bandForScore,
  calculateMetrics,
  calculateSleepScore,
  calculateStreak,
  formatDuration,
  type SleepEntry,
  type SleepScoreBand,
  type SleepSettings,
  toLocalCalendarDate,
} from '@psychage/shared/sleep';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { colors } from '@/lib/colors';

import { QualityMoodTrend } from './QualityMoodTrend';
import { ScoreBand } from './ScoreBand';
import { Sparkline } from './Sparkline';
import { WeeklyDigest } from './WeeklyDigest';

// Patterns/Dashboard tab. The composite score reaches the UI only as a band
// (SR-1). Raw measured metrics (length, efficiency, latency) are factual data and
// ARE shown, like the web. All computed locally from the on-device store (SR-4).

type SleepDashboardProps = {
  entries: readonly SleepEntry[]; // newest-first
  settings: SleepSettings;
};

const DOT_CLASS: Record<SleepScoreBand, string> = {
  rested: 'bg-teal-500',
  steady: 'bg-success',
  uneven: 'bg-warning',
  low: 'bg-charcoal-400',
};

export function SleepDashboard({ entries, settings }: SleepDashboardProps) {
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const t = CT4_SLEEP.metrics;

  if (entries.length === 0) {
    return (
      <Card className="gap-1 px-4 py-6">
        <Text variant="bodyBold">{CT4_SLEEP.dashboard.emptyTitle}</Text>
        <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
          {CT4_SLEEP.dashboard.emptyBody}
        </Text>
      </Card>
    );
  }

  const recent = entries.slice(0, 14);
  const chronological = [...recent].reverse();
  const metrics = recent.map(calculateMetrics);
  const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);

  const avgDuration = avg(metrics.map((m) => m.total_sleep_minutes));
  const avgEfficiency = avg(metrics.map((m) => m.sleep_efficiency));
  const avgLatency = avg(metrics.map((m) => m.sleep_latency_minutes));

  const score = calculateSleepScore(recent, settings.age_range);
  const band = bandForScore(score.overall);
  const streak = calculateStreak(entries, toLocalCalendarDate(new Date()));

  const trend = chronological.map((e) => calculateMetrics(e).total_sleep_minutes);
  const strokeTint = colorScheme === 'dark' ? colors.teal[400] : colors.teal[600];

  const components: { key: keyof typeof CT4_SLEEP.componentLabels; value: number }[] = [
    { key: 'duration', value: score.duration },
    { key: 'efficiency', value: score.efficiency },
    { key: 'quality', value: score.quality },
    { key: 'consistency', value: score.consistency },
    { key: 'latency', value: score.latency },
  ];

  return (
    <View className="gap-4">
      <ScoreBand band={band} caption={CT4_SLEEP.scoreCaption} />

      <View className="flex-row flex-wrap gap-3">
        <MetricCard label={t.avgSleep} value={formatDuration(Math.round(avgDuration))} />
        <MetricCard label={t.efficiency} value={`${Math.round(avgEfficiency)}%`} />
        <MetricCard label={t.latency} value={`${Math.round(avgLatency)} min`} />
        <MetricCard label={t.streak} value={String(streak.current)} />
      </View>

      <WeeklyDigest entries={entries} />

      {trend.length >= 2 ? (
        <Card className="gap-2 px-4 py-4">
          <Text variant="caption" className="uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark">
            {t.trendTitle}
          </Text>
          <Sparkline values={trend} width={Math.max(0, width - 64)} color={strokeTint} />
        </Card>
      ) : null}

      <QualityMoodTrend entries={chronological} />

      <View className="gap-2">
        {components.map((c) => (
          <View key={c.key} className="min-h-[44px] flex-row items-center justify-between rounded-lg border border-border bg-surface px-4 py-2 dark:border-border-dark dark:bg-surface-dark">
            <Text variant="bodySm">{CT4_SLEEP.componentLabels[c.key]}</Text>
            <View className="flex-row items-center gap-2">
              <View className={`h-2 w-2 rounded-full ${DOT_CLASS[bandForScore(c.value)]}`} />
              <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
                {CT4_SLEEP.bands[bandForScore(c.value)].label}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="min-w-[44%] flex-1 gap-1 px-4 py-3">
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
        {label}
      </Text>
      <Text variant="bodyBold">{value}</Text>
    </Card>
  );
}
