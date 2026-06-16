import { View } from 'react-native';

import { Terrain } from '@/components/terrain/Terrain';
import type { TerrainDay } from '@/components/terrain/terrain-geometry';
import { Text } from '@/components/ui/Text';

type RecordChartProps = {
  days: readonly TerrainDay[];
  insight: { headline: string; consistency: string } | null;
  width: number;
};

// The 14-day record: the derived insight headline + consistency line above the
// canonical Terrain renderer. Terrain is the single source for the terrain grammar
// (mood-tinted entry dots + the load-bearing ring, hollow no-entry dots at the
// baseline, a dashed "today" marker, a connecting line that breaks over gaps, per-day
// VoiceOver labels, token-driven scheme-aware colors) — the same component S7's
// continuum and S9's reflection use. No bespoke SVG here: a second hand-rolled chart
// would drift from that grammar (hardcoded hex, single-color dots, no markers, no
// a11y), which is exactly what this replaced.
export function RecordChart({ days, insight, width }: RecordChartProps) {
  return (
    <View className="gap-4">
      {insight ? (
        <View className="gap-1">
          <Text variant="h5" className="text-text-primary dark:text-text-primary-dark">
            {insight.headline}
          </Text>
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            {insight.consistency}
          </Text>
        </View>
      ) : (
        <Text
          variant="h5"
          className="mt-2 mb-2 text-text-secondary dark:text-text-secondary-dark"
        >
          No history to show yet.
        </Text>
      )}
      <Terrain days={days} width={width} />
    </View>
  );
}
