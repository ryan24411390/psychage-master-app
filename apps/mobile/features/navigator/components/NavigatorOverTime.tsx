import { ScrollView, View } from 'react-native';

import { TrendLine, type TrendPoint } from '@/components/ui/charts';
import { Text } from '@/components/ui/Text';

import { NAVIGATOR_COPY } from '../copy';
import type { NavigatorSnapshot } from '../result-store';

// P41 — a record of past explorations over time. Plots how many areas EACH exploration
// surfaced (descriptive breadth) using the shared TrendLine. This is a record of what was
// LOOKED AT — NEVER a measure of getting better or worse, and never a confidence number
// (SR-1/SR-3). Local-only (SR-4). The copy is CT4 FIXTURE (pending Dr. Dobson).

export interface NavigatorOverTimeProps {
  /** Stored runs, newest-first (as returned by getRecent). */
  readonly snapshots: readonly NavigatorSnapshot[];
}

export function NavigatorOverTime({ snapshots }: NavigatorOverTimeProps) {
  // TrendLine reads oldest → newest; getRecent gives newest-first.
  const ordered = [...snapshots].reverse();
  const points: TrendPoint[] = ordered.map((s) => ({
    x: s.date,
    y: s.results.results.length,
  }));
  const yMax = Math.max(1, ...points.map((p) => (typeof p.y === 'number' ? p.y : 0)));

  return (
    <ScrollView contentContainerClassName="px-5 pb-10 pt-2 gap-4" showsVerticalScrollIndicator={false}>
      <View className="gap-1">
        <Text variant="h1" accessibilityRole="header" className="text-text-primary dark:text-text-primary-dark">
          {NAVIGATOR_COPY.overTimeTitle}
        </Text>
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {NAVIGATOR_COPY.overTimeCaption}
        </Text>
      </View>

      {points.length >= 2 ? (
        <View className="rounded-xl bg-surface p-4 shadow-base dark:bg-surface-dark">
          <TrendLine
            data={points}
            yMin={0}
            yMax={yMax}
            accessibilityLabel={NAVIGATOR_COPY.overTimeTitle}
          />
        </View>
      ) : (
        <View className="rounded-xl bg-surface p-6 shadow-base dark:bg-surface-dark">
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {NAVIGATOR_COPY.overTimeNotEnough}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
