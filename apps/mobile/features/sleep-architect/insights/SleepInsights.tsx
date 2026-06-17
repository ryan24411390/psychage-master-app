import { View } from 'react-native';

import {
  calculateMetrics,
  correlate,
  type CorrelationResult,
  type DatedValue,
  type SleepEntry,
} from '@psychage/shared/sleep';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';

// Insights tab. Looks for gentle associations between each sleep metric and the
// entry's OWN morning-mood rating (self-contained — no cross-feature data). Uses
// the shared, tested correlate() with its 14-pair gate. Strictly descriptive and
// educational: "tends to go with", never a causal or clinical claim (SR-1/SR-3).
// All computed locally (SR-4).

const METRICS = ['duration', 'efficiency', 'quality', 'latency'] as const;
type MetricKey = (typeof METRICS)[number];

export function SleepInsights({ entries }: { entries: readonly SleepEntry[] }) {
  const t = CT4_SLEEP.insights;

  if (entries.length < 14) {
    return (
      <View className="gap-2">
        <Text
          variant="caption"
          className="uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark"
        >
          {t.title}
        </Text>
        <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
          {t.insufficient}
        </Text>
      </View>
    );
  }

  const mood: DatedValue[] = entries.map((e) => ({ date: e.date, value: e.morning_mood }));

  const seriesFor = (metric: MetricKey): DatedValue[] =>
    entries.map((e) => {
      const m = calculateMetrics(e);
      const value =
        metric === 'duration'
          ? m.total_sleep_minutes
          : metric === 'efficiency'
            ? m.sleep_efficiency
            : metric === 'quality'
              ? e.sleep_quality
              : m.sleep_latency_minutes;
      return { date: e.date, value };
    });

  const results: { metric: MetricKey; result: CorrelationResult }[] = [];
  for (const metric of METRICS) {
    const result = correlate(seriesFor(metric), mood);
    if (result) results.push({ metric, result });
  }
  const meaningful = results.filter((r) => r.result.significance !== 'none');

  return (
    <View className="gap-4">
      <Text
        variant="caption"
        className="uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark"
      >
        {t.title}
      </Text>
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
        {t.intro}
      </Text>

      {meaningful.length === 0 ? (
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {t.none}
        </Text>
      ) : (
        meaningful.map(({ metric, result }) => (
          <Card key={metric} className="gap-1 px-4 py-4">
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
              {t.strengthLabel[result.significance]} · {t.pairs(result.sample_size)}
            </Text>
            <Text variant="body">
              {t.metricLabel[metric]}{' '}
              {result.coefficient >= 0 ? t.directionUp : t.directionDown}.
            </Text>
          </Card>
        ))
      )}
    </View>
  );
}
