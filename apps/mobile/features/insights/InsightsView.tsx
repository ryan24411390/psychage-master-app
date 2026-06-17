import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { DomainRadar, MetricBars, ScoreGauge, TrendLine } from '@/components/ui/charts';
import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import { buildToolSummaries, type InsightsInput, type ToolKey, type ToolSummary } from './aggregate';

// Insights screen — the drill-down behind the home "Your tools" card. Renders one
// section per tool the user has data in, newest-used first, each with a real chart
// from its on-device store and a link into that tool's full history. Educational
// framing only (SR-2/SR-3); all data is local (SR-4/SR-11).

export interface InsightsViewProps {
  readonly input: InsightsInput;
  readonly onBack: () => void;
  readonly onOpenTool: (route: string) => void;
}

// Check-in state 0–4 → 0–100 for a single gentle trend.
function checkinTrend(input: InsightsInput) {
  return [...input.checkins]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e, i) => ({ x: i, y: e.state * 25 }));
}

function clarityTrend(input: InsightsInput) {
  return [...input.clarity]
    .slice()
    .reverse() // store is newest-first; chart wants oldest→newest
    .map((s, i) => ({ x: i, y: s.composite }));
}

function sleepQualityTrend(input: InsightsInput) {
  return [...input.sleep]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e, i) => ({ x: i, y: e.sleep_quality * 20 }));
}

function moodBars(input: InsightsInput) {
  const counts = new Map<string, number>();
  for (const m of input.mood) for (const e of m.emotions) counts.set(e, (counts.get(e) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));
}

export function InsightsView({ input, onBack, onOpenTool }: InsightsViewProps) {
  const tc = useThemeColors();
  const summaries = buildToolSummaries(input);

  const Section = ({ summary, children }: { summary: ToolSummary; children?: React.ReactNode }) => (
    <View className="rounded-xl bg-surface p-5 shadow-base dark:bg-surface-dark">
      <Text variant="heading" className="font-display text-[16px] text-text-primary dark:text-text-primary-dark">
        {summary.name}
      </Text>
      <Text variant="bodySm" className="mt-0.5 text-text-secondary dark:text-text-secondary-dark">
        {summary.metric}
      </Text>
      {children ? <View className="mt-3 items-center">{children}</View> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`See full ${summary.name} history`}
        onPress={() => onOpenTool(summary.route)}
        hitSlop={6}
        className="mt-3 min-h-[40px] flex-row items-center gap-1"
      >
        <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
          See full history
        </Text>
        <ChevronRight size={16} color={tc.primary} strokeWidth={2} />
      </Pressable>
    </View>
  );

  const renderChart = (key: ToolKey) => {
    switch (key) {
      case 'checkin': {
        const data = checkinTrend(input);
        return data.length >= 2 ? <TrendLine data={data} accessibilityLabel="Check-in trend" /> : null;
      }
      case 'clarity': {
        const latest = input.clarity[0];
        const trend = clarityTrend(input);
        return (
          <View className="items-center gap-3">
            <ScoreGauge value={latest?.composite ?? null} label="Latest clarity" />
            {trend.length >= 2 ? <TrendLine data={trend} accessibilityLabel="Clarity over time" /> : null}
          </View>
        );
      }
      case 'relationship': {
        const latest = input.relationship[0];
        if (!latest) return null;
        const d = latest.domainScores;
        const points = [
          { label: 'Partner', value: d.partner },
          { label: 'Family', value: d.family },
          { label: 'Friends', value: d.friends },
          { label: 'Community', value: d.community },
        ];
        return (
          <View className="items-center gap-3">
            <ScoreGauge value={latest.compositeScore} label={latest.tierLabel} />
            <DomainRadar points={points} accessibilityLabel="Relationship domains" />
          </View>
        );
      }
      case 'mood': {
        const bars = moodBars(input);
        return bars.length > 0 ? <MetricBars bars={bars} accessibilityLabel="Most-noted emotions" /> : null;
      }
      case 'sleep': {
        const data = sleepQualityTrend(input);
        return data.length >= 2 ? <TrendLine data={data} accessibilityLabel="Sleep quality trend" /> : null;
      }
      case 'navigator':
        // No chart — Navigator history is a list of explorations (educational, no scores).
        return null;
    }
  };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-2 pt-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={8}
          testID="insights-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
        >
          <ChevronLeft size={20} color={tc.inkSecondary} strokeWidth={2} />
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            Back
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10 pt-2 gap-5" showsVerticalScrollIndicator={false}>
        <View className="gap-1">
          <Text variant="headingLg" className="text-text-primary dark:text-text-primary-dark">
            Your insights
          </Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            A look across the tools you've used. All of this stays on your device.
          </Text>
        </View>

        {summaries.length === 0 ? (
          <View className="rounded-xl bg-surface p-6 shadow-base dark:bg-surface-dark">
            <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
              Your tools' insights will appear here as you use them — check-ins, Clarity Score,
              the Symptom Navigator, and more.
            </Text>
          </View>
        ) : (
          summaries.map((s) => (
            <Section key={s.key} summary={s}>
              {renderChart(s.key)}
            </Section>
          ))
        )}
      </ScrollView>
    </View>
  );
}
