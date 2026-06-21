import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import type {
  ChronotypeResult,
  SleepEntry,
  SleepEntryInput,
  SleepRecordStore,
} from '@psychage/shared/sleep';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ToolScreen } from '@/components/ui/ToolScreen';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { SleepDashboard } from '@/features/sleep-architect/dashboard/SleepDashboard';
import { SleepDiary } from '@/features/sleep-architect/diary/SleepDiary';
import { SleepLogForm } from '@/features/sleep-architect/diary/SleepLogForm';
import { SleepDisclaimer } from '@/features/sleep-architect/shared/SleepDisclaimer';
import { SleepInsights } from '@/features/sleep-architect/insights/SleepInsights';
import { SleepTools } from '@/features/sleep-architect/tools/SleepTools';
import { WindDown } from '@/features/sleep-architect/winddown/WindDown';
import { getSleepStore } from '@/lib/sleep-store';

// Sleep Architect shell. Pushed OUTSIDE the tabs, so it carries its OWN crisis
// affordance in the header (SR-2) — it does not inherit the GlobalHeader. Reads and
// writes go through the injected SleepRecordStore (LOCAL-ONLY, SR-4). The store is a
// prop (default: the app singleton) so render tests inject an in-memory double.

type Tab = 'overview' | 'diary' | 'dashboard' | 'tools' | 'wind-down' | 'insights';
type Editing = { mode: 'new' } | { mode: 'edit'; entry: SleepEntry } | null;

type SleepArchitectViewProps = {
  store?: SleepRecordStore;
  onClose?: () => void;
};

export function SleepArchitectView({
  store = getSleepStore(),
  onClose,
}: SleepArchitectViewProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [editing, setEditing] = useState<Editing>(null);
  const [entries, setEntries] = useState<SleepEntry[]>(() => store.getRecent(120));
  const [settings, setSettings] = useState(() => store.getSettings());

  const reload = useCallback(() => {
    setEntries(store.getRecent(120));
    setSettings(store.getSettings());
  }, [store]);

  const handleSubmit = useCallback(
    (input: SleepEntryInput) => {
      try {
        if (editing?.mode === 'edit') store.editEntry(editing.entry.id, input);
        else store.saveToday(input);
        reload();
        setEditing(null);
        setTab('dashboard');
      } catch {
        // Times are pre-validated in the form; any residual store-level rejection
        // keeps the form open so the user can correct it. No data leaves the device.
      }
    },
    [editing, store, reload],
  );

  const handleSaveTargets = useCallback(
    (result: ChronotypeResult) => {
      store.saveSettings({
        chronotype: result.animal,
        target_bedtime: result.ideal_bedtime,
        target_wake_time: result.ideal_wake_time,
      });
      reload();
    },
    [store, reload],
  );

  return (
    <ToolScreen scroll="none" title={CT4_SLEEP.title} onBack={onClose}>
      {editing !== null ? (
        <SleepLogForm
          initial={editing.mode === 'edit' ? editing.entry : undefined}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <>
          <TabBar tab={tab} onChange={setTab} />
          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-4 px-4 pb-12 pt-3"
            showsVerticalScrollIndicator={false}
          >
            {tab === 'overview' ? (
              <Overview
                entryCount={entries.length}
                onLog={() => setEditing({ mode: 'new' })}
              />
            ) : null}
            {tab === 'diary' ? (
              <SleepDiary
                entries={entries}
                onLog={() => setEditing({ mode: 'new' })}
                onSelect={(entry) => setEditing({ mode: 'edit', entry })}
              />
            ) : null}
            {tab === 'dashboard' ? (
              <SleepDashboard entries={entries} settings={settings} />
            ) : null}
            {tab === 'tools' ? (
              <SleepTools
                entries={entries}
                settings={settings}
                onSaveTargets={handleSaveTargets}
              />
            ) : null}
            {tab === 'wind-down' ? <WindDown /> : null}
            {tab === 'insights' ? <SleepInsights entries={entries} /> : null}
          </ScrollView>
        </>
      )}
    </ToolScreen>
  );
}

function Overview({ entryCount, onLog }: { entryCount: number; onLog: () => void }) {
  return (
    <View className="gap-4">
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
        {CT4_SLEEP.tagline}
      </Text>
      <SleepDisclaimer />
      {entryCount > 0 ? (
        <Text variant="body">
          {entryCount} {entryCount === 1 ? 'night' : 'nights'} logged. Open Patterns to see your
          recent trend.
        </Text>
      ) : (
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {CT4_SLEEP.diary.emptyBody}
        </Text>
      )}
      <Button variant="primary" className="w-full" onPress={onLog}>
        {CT4_SLEEP.diary.logToday}
      </Button>
    </View>
  );
}

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { key: Tab; label: string }[] = [
    { key: 'overview', label: CT4_SLEEP.tabs.overview },
    { key: 'diary', label: CT4_SLEEP.tabs.diary },
    { key: 'dashboard', label: CT4_SLEEP.tabs.dashboard },
    { key: 'tools', label: CT4_SLEEP.tabs.tools },
    { key: 'wind-down', label: CT4_SLEEP.tabs.windDown },
    { key: 'insights', label: CT4_SLEEP.tabs.insights },
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="max-h-12 flex-grow-0 border-b border-border dark:border-border-dark"
      contentContainerClassName="px-4"
    >
      {items.map((item) => {
        const active = item.key === tab;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            className={`min-h-[44px] items-center justify-center border-b-[3px] px-4 active:bg-surface-active/50 dark:active:bg-surface-active-dark/50 ${
              active ? 'border-primary dark:border-primary-dark' : 'border-transparent'
            }`}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <Text
              variant={active ? 'label' : 'body'}
              className={active ? 'text-primary dark:text-primary-dark' : 'text-text-secondary dark:text-text-secondary-dark'}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
