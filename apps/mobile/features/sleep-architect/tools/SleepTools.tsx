import { useState } from 'react';
import { View } from 'react-native';

import type { ChronotypeResult, SleepEntry, SleepSettings } from '@psychage/shared/sleep';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';

import { BedtimeCalculator } from './BedtimeCalculator';
import { ChronotypeQuiz } from './ChronotypeQuiz';
import { SleepDebt } from './SleepDebt';

// Tools tab: a small menu that opens one tool at a time. Each tool is backed by a
// shared, tested pure function (chronotype scoring, optimal bedtimes, sleep debt).

type Tool = 'menu' | 'chronotype' | 'bedtime' | 'debt';

type SleepToolsProps = {
  entries: readonly SleepEntry[];
  settings: SleepSettings;
  onSaveTargets: (result: ChronotypeResult) => void;
};

export function SleepTools({ entries, settings, onSaveTargets }: SleepToolsProps) {
  const t = CT4_SLEEP.tools;
  const [tool, setTool] = useState<Tool>('menu');

  if (tool === 'menu') {
    const items: { key: Tool; title: string; sub: string }[] = [
      { key: 'chronotype', ...t.chronotype },
      { key: 'bedtime', ...t.bedtime },
      { key: 'debt', ...t.debt },
    ];
    return (
      <View className="gap-3">
        {items.map((item) => (
          <AnimatedPressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => setTool(item.key)}
            className="min-h-[44px] gap-0.5 rounded-xl border border-border bg-surface px-4 py-3 dark:border-border-dark dark:bg-surface-dark"
          >
            <Text variant="bodyBold">{item.title}</Text>
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
              {item.sub}
            </Text>
          </AnimatedPressable>
        ))}
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Button variant="ghost" className="self-start" onPress={() => setTool('menu')}>
        {t.back}
      </Button>
      {tool === 'chronotype' ? (
        <ChronotypeQuiz
          onSaveTargets={(result) => {
            onSaveTargets(result);
            setTool('menu');
          }}
        />
      ) : null}
      {tool === 'bedtime' ? <BedtimeCalculator /> : null}
      {tool === 'debt' ? <SleepDebt entries={entries} settings={settings} /> : null}
    </View>
  );
}
