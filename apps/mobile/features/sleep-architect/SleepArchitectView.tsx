import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SleepEntry, SleepEntryInput, SleepRecordStore } from '@psychage/shared/sleep';

import { Button } from '@/components/ui/Button';
import { CrisisPill } from '@/components/CrisisPill';
import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { SleepDashboard } from '@/features/sleep-architect/dashboard/SleepDashboard';
import { SleepDiary } from '@/features/sleep-architect/diary/SleepDiary';
import { SleepLogForm } from '@/features/sleep-architect/diary/SleepLogForm';
import { SleepDisclaimer } from '@/features/sleep-architect/shared/SleepDisclaimer';
import { getSleepStore } from '@/lib/sleep-store';

// Sleep Architect shell. Pushed OUTSIDE the tabs, so it carries its OWN crisis
// affordance in the header (SR-2) — it does not inherit the GlobalHeader. Reads and
// writes go through the injected SleepRecordStore (LOCAL-ONLY, SR-4). The store is a
// prop (default: the app singleton) so render tests inject an in-memory double.

type Tab = 'overview' | 'diary' | 'dashboard';
type Editing = { mode: 'new' } | { mode: 'edit'; entry: SleepEntry } | null;

type SleepArchitectViewProps = {
  store?: SleepRecordStore;
};

export function SleepArchitectView({ store = getSleepStore() }: SleepArchitectViewProps) {
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

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text variant="heading" accessibilityRole="header">
          {CT4_SLEEP.title}
        </Text>
        <CrisisPill />
      </View>

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
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

function Overview({ entryCount, onLog }: { entryCount: number; onLog: () => void }) {
  return (
    <View className="gap-4">
      <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
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
  ];
  return (
    <View className="flex-row border-b border-border px-4 dark:border-border-dark">
      {items.map((item) => {
        const active = item.key === tab;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            className={`min-h-[44px] flex-1 items-center justify-center border-b-2 ${
              active ? 'border-primary dark:border-primary-dark' : 'border-transparent'
            }`}
          >
            <Text
              variant={active ? 'bodyBold' : 'body'}
              className={active ? 'text-primary dark:text-primary-dark' : 'text-text-secondary dark:text-text-secondary-dark'}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
