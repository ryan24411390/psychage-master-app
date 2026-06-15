import { View } from 'react-native';

import {
  calculateSleepDebt,
  formatDuration,
  type SleepEntry,
  type SleepSettings,
} from '@psychage/shared/sleep';

import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';

// Sleep debt — rolling shortfall against the target over the last 14 nights, via
// the shared tested calculateSleepDebt. Framed gently (no "you're sleep-deprived").

type SleepDebtProps = {
  entries: readonly SleepEntry[]; // newest-first
  settings: SleepSettings;
};

export function SleepDebt({ entries, settings }: SleepDebtProps) {
  const t = CT4_SLEEP.tools;

  if (entries.length === 0) {
    return (
      <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
        {t.debtEmpty}
      </Text>
    );
  }

  // calculateSleepDebt keeps the last 14 of the array (slice(-14)); pass chronological.
  const chronological = [...entries].reverse();
  const debt = calculateSleepDebt(chronological, settings.target_sleep_minutes);

  return (
    <View className="gap-3">
      <View className="gap-1 rounded-xl border border-border bg-surface px-4 py-4 dark:border-border-dark dark:bg-surface-dark">
        <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
          {t.debtTotal}
        </Text>
        <Text variant="headingLg">{formatDuration(debt.total_debt_minutes)}</Text>
      </View>
      {debt.total_debt_minutes > 0 ? (
        <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
          {t.debtRecovery}
        </Text>
      ) : null}
    </View>
  );
}
