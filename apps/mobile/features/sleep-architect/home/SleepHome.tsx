import { View } from 'react-native';

import type { SleepEntry, SleepSettings } from '@psychage/shared/sleep';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { SleepDashboard } from '@/features/sleep-architect/dashboard/SleepDashboard';
import { SleepInsights } from '@/features/sleep-architect/insights/SleepInsights';
import { SleepDisclaimer } from '@/features/sleep-architect/shared/SleepDisclaimer';

// Home tab (P58). One calm scroll that merges the former Overview, Patterns and
// Insights tabs: tagline + disclaimer → the primary actions (Log / Export) → the
// patterns dashboard → the gentle morning-mood links. Empty state stays a single
// calm card + Log CTA, so a first-time screen is not three empty panels. All data is
// computed locally from the on-device store (SR-4); the score is a band only (SR-1).

type SleepHomeProps = {
  entries: readonly SleepEntry[]; // newest-first
  settings: SleepSettings;
  onLog: () => void;
  /** Opens the export/share flow. Hidden until there is something to share. */
  onExport: () => void;
};

export function SleepHome({ entries, settings, onLog, onExport }: SleepHomeProps) {
  const hasData = entries.length > 0;

  return (
    <View className="gap-4">
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
        {CT4_SLEEP.tagline}
      </Text>
      <SleepDisclaimer />

      <View className="gap-3">
        <Button variant="primary" className="w-full" onPress={onLog}>
          {CT4_SLEEP.diary.logToday}
        </Button>
        {hasData ? (
          <Button variant="secondary" className="w-full" onPress={onExport}>
            {CT4_SLEEP.home.exportCta}
          </Button>
        ) : null}
      </View>

      {hasData ? (
        <>
          <SleepDashboard entries={entries} settings={settings} />
          <SleepInsights entries={entries} />
        </>
      ) : (
        <Card className="gap-1 px-4 py-6">
          <Text variant="label">{CT4_SLEEP.dashboard.emptyTitle}</Text>
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            {CT4_SLEEP.dashboard.emptyBody}
          </Text>
        </Card>
      )}
    </View>
  );
}
