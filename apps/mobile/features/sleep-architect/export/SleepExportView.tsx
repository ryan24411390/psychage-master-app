import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type LocalCalendarDate, type SleepEntry, toLocalCalendarDate } from '@psychage/shared/sleep';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { RangeRadio, type RangeOption } from '@/components/therapist/RangeRadio';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Export & share flow (P59). The person picks a window + name, sees an HONEST night
// count, then generates + shares the PDF THEMSELVES via the system sheet — the route
// owns the native egress; this view only builds the request (SR-4). Rendered inside the
// Sleep Architect's ToolScreen (it replaces the tab content, like the log form).

const c = CT4_SLEEP.export;

const RANGE_OPTIONS: readonly RangeOption[] = [
  { key: '7', label: c.range7, days: 7 },
  { key: '30', label: c.range30, days: 30 },
  { key: '90', label: c.range90, days: 90 },
  // `days` is unused for "all" — the earliest logged night drives the window.
  { key: 'all', label: c.rangeAll, days: 0 },
];

type SleepExportViewProps = {
  entries: readonly SleepEntry[]; // newest-first
  onGenerate: (fullName: string, from: LocalCalendarDate, to: LocalCalendarDate) => void;
  onCancel: () => void;
};

type Window = { from: LocalCalendarDate; to: LocalCalendarDate };

function resolveWindow(key: string, entries: readonly SleepEntry[]): Window {
  const to = toLocalCalendarDate(new Date());
  if (key === 'all') {
    const dates = entries.map((e) => e.date);
    const from = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : to;
    return { from, to };
  }
  const days = Number(key);
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return { from: toLocalCalendarDate(start), to };
}

export function SleepExportView({ entries, onGenerate, onCancel }: SleepExportViewProps) {
  const reduced = useReducedMotion();
  const [name, setName] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>('30');

  const window = useMemo(() => resolveWindow(selectedKey, entries), [selectedKey, entries]);
  const count = useMemo(
    () => entries.filter((e) => e.date >= window.from && e.date <= window.to).length,
    [entries, window],
  );

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-6 px-4 pb-12 pt-4"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="gap-6"
      >
        <View className="gap-1">
          <Text variant="bodyLarge">{c.title}</Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {c.intro}
          </Text>
        </View>

        <AuthTextField
          label={c.nameLabel}
          fieldAccessibilityHint={c.nameHint}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <View className="gap-3">
          <Text variant="bodyLarge">{c.rangeLabel}</Text>
          <RangeRadio options={RANGE_OPTIONS} value={selectedKey} onChange={setSelectedKey} />
        </View>

        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {count > 0 ? c.countLine(count) : c.empty}
        </Text>

        <View className="gap-3">
          <Button
            variant="primary"
            className="w-full"
            disabled={count === 0}
            onPress={() => onGenerate(name.trim(), window.from, window.to)}
            testID="sleep-export-generate"
          >
            {c.generate}
          </Button>
          <Button variant="ghost" className="w-full" onPress={onCancel}>
            {c.cancel}
          </Button>
        </View>
      </Animated.View>
    </ScrollView>
  );
}
