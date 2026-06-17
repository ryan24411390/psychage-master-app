import {
  emotionFrequency,
  type MomentEntry,
  streakSummary,
  triggerFrequency,
  valenceTrend,
} from '@psychage/shared/mood-journal';
import { useWindowDimensions, View } from 'react-native';

import { MetricBars, TrendLine } from '@/components/ui/charts';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { CT4_MOOD_JOURNAL } from '@/features/mood-journal/copy';

// Insights — the DESCRIPTIVE longitudinal read, built from the Lane-0 chart primitives
// (no chart code here). Three calm, non-diagnostic panels:
//   • a streak + gentle valence-direction line,
//   • a valence TrendLine (the average rating per logged day),
//   • emotion / trigger distribution as MetricBars.
// SR-3: these only count and average — never score the person, infer a cause, or label.
// The trigger↔mood co-occurrence remains GATED (see PatternView); valence's own trend
// carries no claim, so it ships. Copy is FIXTURE pending Dr. Dobson (CLAUDE.md §7).

type InsightsViewProps = {
  moments: readonly MomentEntry[];
};

function SectionHeading({ children }: { children: string }) {
  return (
    <Text
      variant="caption"
      className="mb-2 font-sans-medium uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark"
    >
      {children}
    </Text>
  );
}

export function InsightsView({ moments }: InsightsViewProps) {
  const { width } = useWindowDimensions();
  // Screen padding (px-4 = 16×2) + card padding (~16×2). Floors so a tiny screen still
  // renders a sensible chart rather than a negative width.
  const chartWidth = Math.max(220, width - 64);

  const t = CT4_MOOD_JOURNAL;
  const trend = valenceTrend(moments);
  const summary = streakSummary(moments);
  const emotions = emotionFrequency(moments);
  const triggers = triggerFrequency(moments);

  const streakLabel = `${summary.latestStreak} ${
    summary.latestStreak === 1 ? t.insights.streakDay : t.insights.streakDays
  }`;
  const directionLine =
    summary.valenceDirection === 'up'
      ? t.insights.directionUp
      : summary.valenceDirection === 'down'
        ? t.insights.directionDown
        : summary.valenceDirection === 'steady'
          ? t.insights.directionSteady
          : null;

  return (
    <View className="gap-4">
      <Card testID="mood-journal-streak">
        <Text variant="h1">{streakLabel}</Text>
        {directionLine ? (
          <Text variant="caption" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
            {directionLine}
          </Text>
        ) : null}
      </Card>

      {trend.length >= 2 ? (
        <View testID="mood-journal-valence-trend">
          <SectionHeading>{t.insights.valenceHeading}</SectionHeading>
          <TrendLine
            data={trend.map((point) => ({ x: point.date, y: point.average }))}
            width={chartWidth}
            accessibilityLabel={`${t.insights.valenceHeading}: ${trend.length} days`}
          />
          <Text variant="caption" className="mt-2 text-text-tertiary dark:text-text-tertiary-dark">
            {t.insights.valenceCaption}
          </Text>
        </View>
      ) : trend.length === 1 ? (
        <View testID="mood-journal-valence-lowdata">
          <SectionHeading>{t.insights.valenceHeading}</SectionHeading>
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            {t.insights.lowData}
          </Text>
        </View>
      ) : null}

      {emotions.length > 0 ? (
        <View testID="mood-journal-emotions">
          <SectionHeading>{t.patterns.emotionsHeading}</SectionHeading>
          <MetricBars
            bars={emotions.map((row) => ({ label: row.tag, value: row.count }))}
            width={chartWidth}
          />
        </View>
      ) : null}

      {triggers.length > 0 ? (
        <View testID="mood-journal-triggers">
          <SectionHeading>{t.patterns.triggersHeading}</SectionHeading>
          <MetricBars
            bars={triggers.map((row) => ({ label: row.tag, value: row.count }))}
            width={chartWidth}
          />
        </View>
      ) : null}
    </View>
  );
}
