import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Mascot } from '@/components/home/Mascot';
import { MetricBars, TrendLine } from '@/components/ui/charts';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ToolScreen } from '@/components/ui/ToolScreen';

import type { InsightsInput } from './aggregate';
import { INSIGHTS_COPY } from './copy';
import { DailyRecapSection } from './DailyRecapSection';
import { descriptorCounts, impactCounts, valenceSeries } from './moment-insights';
import { MomentsHistory } from './MomentsHistory';
import { YourTools } from './YourTools';

// Insights — a private, on-device feeling story (P45–P48). The unified Moments store is the
// spine: a plain-language explanation, real dated history, two explained charts, and the
// "Your Tools" recency rail. No diagnostic language; charts are "over time"/counts, never a
// "trend" or "score". LOCAL-ONLY (SR-4): every value comes from `input`, read on the route.

export interface InsightsViewProps {
  readonly input: InsightsInput;
  readonly onBack: () => void;
  /** Open a tool by route (Your Tools rows). */
  readonly onOpenTool: (route: string) => void;
  /** No-data CTA — take the user to record their first moment. */
  readonly onRecordMoment?: () => void;
  /** "See full history" — the complete moment record. */
  readonly onOpenFullHistory?: () => void;
  /** Injectable clocks for tests. */
  readonly now?: () => Date;
  readonly nowMs?: () => number;
}

type TimeRange = '7D' | '30D' | '3M' | 'ALL';
const RANGES: readonly TimeRange[] = ['7D', '30D', '3M', 'ALL'];
const DAY_MS = 86_400_000;

function getCutoffMs(range: TimeRange, nowMs: number): number {
  if (range === '7D') return nowMs - 7 * DAY_MS;
  if (range === '30D') return nowMs - 30 * DAY_MS;
  if (range === '3M') return nowMs - 90 * DAY_MS;
  return 0; // ALL
}

/** A titled card wrapping one explained chart. The caption is the plain explanation (P48). */
function ChartCard({
  title,
  caption,
  testID,
  children,
}: {
  title: string;
  caption: string;
  testID?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      testID={testID}
      className="overflow-hidden rounded-[24px] bg-surface p-5 shadow-base dark:bg-surface-dark"
    >
      <Text variant="h2" className="font-display text-[18px] text-text-primary dark:text-text-primary-dark">
        {title}
      </Text>
      <Text variant="caption" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
        {caption}
      </Text>
      <View className="mt-4 items-center">{children}</View>
    </View>
  );
}

function NotEnoughYet() {
  return (
    <Text variant="caption" className="py-4 text-center text-text-tertiary dark:text-text-tertiary-dark">
      A little more here will fill this in.
    </Text>
  );
}

function NoData({ onRecord }: { onRecord?: () => void }) {
  const c = INSIGHTS_COPY.noData;
  return (
    <View
      testID="insights-no-data"
      className="items-center gap-4 rounded-[24px] bg-surface p-6 shadow-base dark:bg-surface-dark"
    >
      <View pointerEvents="none">
        <Mascot />
      </View>
      <Text variant="h2" className="text-center font-display text-[20px] text-text-primary dark:text-text-primary-dark">
        {c.title}
      </Text>
      <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
        {c.why}
      </Text>
      <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
        {c.how}
      </Text>
      {onRecord ? (
        <Button accessibilityLabel={c.cta} onPress={onRecord} className="mt-1">
          {c.cta}
        </Button>
      ) : null}
    </View>
  );
}

export function InsightsView({
  input,
  onBack,
  onOpenTool,
  onRecordMoment,
  onOpenFullHistory,
  now = () => new Date(),
  nowMs = () => Date.now(),
}: InsightsViewProps) {
  const [range, setRange] = useState<TimeRange>('ALL');
  const cutoffMs = useMemo(() => getCutoffMs(range, nowMs()), [range, nowMs]);

  const moments = input.moments;
  const hasMoments = moments.length > 0;

  const inRange = useMemo(
    () => moments.filter((m) => Date.parse(m.timestamp) >= cutoffMs),
    [moments, cutoffMs],
  );
  const series = useMemo(() => valenceSeries(moments, cutoffMs), [moments, cutoffMs]);
  const descriptors = useMemo(() => descriptorCounts(moments, cutoffMs), [moments, cutoffMs]);
  const impacts = useMemo(() => impactCounts(moments, cutoffMs), [moments, cutoffMs]);

  const { charts } = INSIGHTS_COPY;

  return (
    <ToolScreen onBack={onBack} scroll="none">
      <ScrollView contentContainerClassName="px-5 pb-12 pt-2 gap-6" showsVerticalScrollIndicator={false}>
        {/* Header + plain-language explanation (P45) */}
        <View className="gap-2">
          <Text variant="h1" className="font-display text-[32px] tracking-tight text-text-primary dark:text-text-primary-dark">
            {INSIGHTS_COPY.title}
          </Text>
          <Text variant="body" className="text-[15px] leading-relaxed text-text-secondary dark:text-text-secondary-dark">
            {INSIGHTS_COPY.intro}
          </Text>
        </View>

        {!hasMoments ? (
          <NoData onRecord={onRecordMoment} />
        ) : (
          <>
            {/* Time range — scopes the charts + inline history */}
            <View className="flex-row items-center justify-between rounded-xl bg-surface-active p-1 dark:bg-surface-active-dark">
              {RANGES.map((r) => (
                <Pressable
                  key={r}
                  accessibilityRole="button"
                  accessibilityLabel={r === 'ALL' ? 'Show all of your history' : `Show the last ${r}`}
                  onPress={() => setRange(r)}
                  className={`flex-1 items-center rounded-lg py-2 ${range === r ? 'bg-surface shadow-sm dark:bg-surface-dark' : ''}`}
                >
                  <Text
                    variant="caption"
                    className={`font-sans-medium ${range === r ? 'text-text-primary dark:text-text-primary-dark' : 'text-text-tertiary dark:text-text-tertiary-dark'}`}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* This week — presence + factual count (Q2) */}
            <DailyRecapSection input={{ checkins: input.checkins }} now={now} testID="insights-recap" />

            {/* Feelings over time (P48) */}
            <ChartCard
              title={charts.feelingsOverTimeTitle}
              caption={charts.feelingsOverTime}
              testID="insights-feelings-chart"
            >
              {series.length >= 2 ? (
                <TrendLine data={series} yMin={1} yMax={5} accessibilityLabel={charts.feelingsOverTime} />
              ) : (
                <NotEnoughYet />
              )}
            </ChartCard>

            {/* Real dated history (P46) */}
            <MomentsHistory
              moments={inRange}
              now={now()}
              onOpenFullHistory={onOpenFullHistory}
              testID="insights-history"
            />

            {/* Feeling words + impacts breakdown (P48) */}
            <ChartCard
              title={charts.descriptorsTitle}
              caption={charts.descriptors}
              testID="insights-descriptors-chart"
            >
              {descriptors.length > 0 ? (
                <MetricBars bars={descriptors} accessibilityLabel={charts.descriptors} />
              ) : (
                <NotEnoughYet />
              )}
            </ChartCard>

            <ChartCard title={charts.impactsTitle} caption={charts.impacts} testID="insights-impacts-chart">
              {impacts.length > 0 ? (
                <MetricBars bars={impacts} accessibilityLabel={charts.impacts} />
              ) : (
                <NotEnoughYet />
              )}
            </ChartCard>

            {/* Your Tools — recency rail (P47) */}
            <YourTools usage={input.toolUsage} onOpenTool={onOpenTool} now={nowMs} testID="insights-your-tools" />

            {/* Ambient mascot — never the only content (P45). */}
            <View className="items-center pt-2" pointerEvents="none">
              <Mascot />
            </View>
          </>
        )}
      </ScrollView>
    </ToolScreen>
  );
}
