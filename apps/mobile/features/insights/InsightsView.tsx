import { useState, useMemo } from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { Mascot } from '@/components/home/Mascot';
import { DomainRadar, MetricBars, ScoreGauge, TrendLine } from '@/components/ui/charts';
import { Text } from '@/components/ui/Text';
import { ToolScreen } from '@/components/ui/ToolScreen';
import { useThemeColors } from '@/lib/use-theme-colors';

import { buildToolSummaries, type InsightsInput, type ToolKey, type ToolSummary } from './aggregate';
import { DailyRecapSection } from './DailyRecapSection';

// Insights screen — upgraded premium experience.

export interface InsightsViewProps {
  readonly input: InsightsInput;
  readonly onBack: () => void;
  readonly onOpenTool: (route: string) => void;
}

type TimeRange = '7D' | '30D' | '3M' | 'ALL';

function getCutoffMs(range: TimeRange): number {
  if (range === 'ALL') return 0;
  const now = Date.now();
  if (range === '7D') return now - 7 * 24 * 60 * 60 * 1000;
  if (range === '30D') return now - 30 * 24 * 60 * 60 * 1000;
  if (range === '3M') return now - 90 * 24 * 60 * 60 * 1000;
  return 0;
}

function parseDateMs(dateStr: string): number {
  if (!dateStr) return 0;
  if (dateStr.includes('T')) {
    const t = Date.parse(dateStr);
    return Number.isFinite(t) ? t : 0;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime();
}

// Check-in state 0–4 → 0–100 for a single gentle trend.
function checkinTrend(input: InsightsInput, cutoffMs: number) {
  return [...input.checkins]
    .filter(e => parseDateMs(e.date) >= cutoffMs)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e, i) => ({ x: i, y: e.state * 25, label: e.date }));
}

function clarityTrend(input: InsightsInput, cutoffMs: number) {
  return [...input.clarity]
    .filter(e => parseDateMs(e.date) >= cutoffMs)
    .slice()
    .reverse() // store is newest-first; chart wants oldest→newest
    .map((s, i) => ({ x: i, y: s.composite, label: s.date }));
}

function sleepQualityTrend(input: InsightsInput, cutoffMs: number) {
  return [...input.sleep]
    .filter(e => parseDateMs(e.created_at) >= cutoffMs)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e, i) => ({ x: i, y: e.sleep_quality * 20, label: e.date }));
}

function moodBars(input: InsightsInput, cutoffMs: number) {
  const counts = new Map<string, number>();
  const filtered = input.mood.filter(m => parseDateMs(m.createdAt) >= cutoffMs);
  for (const m of filtered) for (const e of m.emotions) counts.set(e, (counts.get(e) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));
}

function TrendDelta({ data }: { data: { y: number }[] }) {
  const tc = useThemeColors();
  if (data.length < 2) return null;
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  if (!last || !prev || last.y == null || prev.y == null) return null;
  
  const diff = last.y - prev.y;
  if (Math.abs(diff) < 1) {
    return (
      <View className="flex-row items-center gap-1 rounded-full bg-surface-raised px-2 py-1 dark:bg-surface-raised-dark">
        <Minus size={12} color={tc.inkSecondary} />
        <Text variant="caption" className="text-xs text-text-secondary dark:text-text-secondary-dark">Stable</Text>
      </View>
    );
  }
  
  const isUp = diff > 0;
  const color = isUp ? '#14B8A6' : '#F43F5E'; // teal-500 : rose-500
  const Icon = isUp ? TrendingUp : TrendingDown;
  const textClass = isUp ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400';
  
  return (
    <View className={`flex-row items-center gap-1 rounded-full px-2 py-1 ${isUp ? 'bg-success/10 dark:bg-success-dark/10' : 'bg-warning/10 dark:bg-warning-dark/10'}`}>
      <Icon size={12} color={color} />
      <Text variant="caption" className={`text-xs font-medium ${textClass}`}>
        {Math.abs(diff).toFixed(0)} {isUp ? 'up' : 'down'}
      </Text>
    </View>
  );
}

export function InsightsView({ input, onBack, onOpenTool }: InsightsViewProps) {
  const tc = useThemeColors();
  const summaries = buildToolSummaries(input);
  
  const [range, setRange] = useState<TimeRange>('ALL');
  const cutoffMs = useMemo(() => getCutoffMs(range), [range]);

  const ranges: TimeRange[] = ['7D', '30D', '3M', 'ALL'];

  const InsightCard = ({ summary, children, deltaData }: { summary: ToolSummary; children?: React.ReactNode; deltaData?: { y: number }[] }) => (
    <View className="overflow-hidden rounded-[24px] bg-surface p-1 shadow-lg shadow-black/5 dark:bg-surface-dark dark:shadow-black/20">
      <View className="rounded-[20px] bg-surface-active p-5 dark:bg-surface-active-dark">
        <View className="flex-row items-center justify-between mb-1">
          <Text variant="h2" className="font-display text-[18px] text-text-primary dark:text-text-primary-dark">
            {summary.name}
          </Text>
          {deltaData ? <TrendDelta data={deltaData} /> : null}
        </View>
        <Text variant="caption" className="mb-4 text-text-secondary dark:text-text-secondary-dark">
          {summary.metric}
        </Text>
        
        {children ? <View className="my-4 items-center">{children}</View> : null}
        
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`See full ${summary.name} history`}
          onPress={() => onOpenTool(summary.route)}
          hitSlop={8}
          className="mt-2 flex-row items-center justify-center gap-1.5 rounded-full bg-background px-4 py-3 active:opacity-70 dark:bg-background-dark"
        >
          <Text variant="bodyLarge" className="font-medium text-text-primary dark:text-text-primary-dark">
            Explore history
          </Text>
          <ChevronRight size={16} color={tc.inkSecondary} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );

  const renderChart = (key: ToolKey) => {
    switch (key) {
      case 'checkin': {
        const data = checkinTrend(input, cutoffMs);
        return {
          chart: data.length >= 2 ? <TrendLine data={data} yMin={0} yMax={100} accessibilityLabel="Check-in trend" /> : null,
          deltaData: data
        };
      }
      case 'clarity': {
        const data = clarityTrend(input, cutoffMs);
        const latest = input.clarity[0]; // overall latest, ignoring filter for the top score gauge
        return {
          chart: (
            <View className="items-center gap-6 w-full">
              <ScoreGauge value={latest?.composite ?? null} label="LATEST" size={180} />
              {data.length >= 2 ? <TrendLine data={data} yMin={0} yMax={100} accessibilityLabel="Clarity over time" /> : null}
            </View>
          ),
          deltaData: data
        };
      }
      case 'relationship': {
        const latest = input.relationship[0];
        if (!latest) return { chart: null };
        const d = latest.domainScores;
        const points = [
          { label: 'Partner', value: d.partner },
          { label: 'Family', value: d.family },
          { label: 'Friends', value: d.friends },
          { label: 'Community', value: d.community },
        ];
        return {
          chart: (
            <View className="items-center gap-6 w-full">
              <ScoreGauge value={latest.compositeScore} label={latest.tierLabel} size={180} />
              <DomainRadar points={points} accessibilityLabel="Relationship domains" />
            </View>
          )
        };
      }
      case 'mood': {
        const bars = moodBars(input, cutoffMs);
        return {
          chart: bars.length > 0 ? <MetricBars bars={bars} accessibilityLabel="Most-noted emotions" /> : null
        };
      }
      case 'sleep': {
        const data = sleepQualityTrend(input, cutoffMs);
        return {
          chart: data.length >= 2 ? <TrendLine data={data} yMin={0} yMax={100} accessibilityLabel="Sleep quality trend" /> : null,
          deltaData: data
        };
      }
      case 'navigator':
        return { chart: null };
    }
  };

  return (
    <ToolScreen onBack={onBack} scroll="none">
      <ScrollView contentContainerClassName="px-5 pb-12 pt-2 gap-6" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text variant="h1" className="font-display text-[32px] tracking-tight text-text-primary dark:text-text-primary-dark">
            Insights
          </Text>
          <Text variant="body" className="text-[15px] leading-relaxed text-text-secondary dark:text-text-secondary-dark">
            A comprehensive look at your well-being across all tools. Processed securely on your device.
          </Text>
        </View>
        
        {/* Time Range Selector */}
        {summaries.length > 0 && (
          <View className="flex-row items-center justify-between rounded-xl bg-surface-active p-1 dark:bg-surface-active-dark">
            {ranges.map(r => (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                className={`flex-1 rounded-lg py-2 items-center ${range === r ? 'bg-surface shadow-sm dark:bg-surface-dark' : ''}`}
              >
                <Text variant="caption" className={`font-medium ${range === r ? 'text-text-primary dark:text-text-primary-dark' : 'text-text-tertiary dark:text-text-tertiary-dark'}`}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View className="items-center" pointerEvents="none">
          <Mascot />
        </View>

        <DailyRecapSection input={input} testID="insights-daily-recap" />

        {summaries.length === 0 ? (
          <View className="rounded-[24px] bg-surface p-6 shadow-base dark:bg-surface-dark">
            <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
              Your insights will appear here as you use your tools — log check-ins, take the Clarity Score, and more.
            </Text>
          </View>
        ) : (
          summaries.map((s) => {
            const { chart, deltaData } = renderChart(s.key) ?? { chart: null };
            return (
              <InsightCard key={s.key} summary={s} deltaData={deltaData}>
                {chart}
              </InsightCard>
            );
          })
        )}
      </ScrollView>
    </ToolScreen>
  );
}
