import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { HomeView } from '@/components/home/HomeView';
import { Text } from '@/components/ui/Text';
import type { TerrainValue } from '@/components/terrain/terrain-geometry';
import { STATE_LABELS } from '@/lib/check-in-labels';
import {
  ctaLabel,
  greeting,
  type HomeStateKind,
  type HomeViewModel,
  readForHour,
  recordLabel,
  statusLine,
  toTerrainDays,
} from '@/lib/home-model';

// S3 "Today" home (sub-slice D: structure + regular/first-run). The four rule-based
// states differ only in greeting/status/terrain/CTA/card; this screen derives the
// view model and HomeView renders it. checked-in/away + the real RecordStore wiring
// + the CTA→S4 Imprint land in sub-slice E — here the states are driven by fixtures
// behind a __DEV__ toggle (per the order, a dev toggle/fixture is acceptable).

const REGULAR_VALUES: readonly TerrainValue[] = [3, 2, 1, null, 2, 3, 'today'];
const FIRST_RUN_VALUES: readonly TerrainValue[] = [null, null, null, null, null, null, 'today'];

// Most recent entry before today (skips the final 'today' slot).
function lastEntryLabel(values: readonly TerrainValue[]): string | undefined {
  for (let i = values.length - 2; i >= 0; i--) {
    const v = values[i];
    if (typeof v === 'number') return STATE_LABELS[v];
  }
  return undefined;
}

function recordedDayCount(values: readonly TerrainValue[]): number {
  return values.filter((v) => typeof v === 'number').length;
}

function buildModel(kind: HomeStateKind, now: Date): HomeViewModel {
  const hour = now.getHours();
  const read = readForHour(hour);

  if (kind === 'first-run') {
    return {
      greeting: greeting('first-run', hour),
      status: statusLine('first-run'),
      recordLabel: recordLabel(0),
      terrainDays: toTerrainDays(FIRST_RUN_VALUES, now),
      read,
      ctaLabel: ctaLabel(false),
      card: null,
    };
  }

  // 'regular' (this slice). 'checked-in' / 'away' arrive in sub-slice E.
  return {
    greeting: greeting('regular', hour),
    status: statusLine('regular', { yesterdayLabel: lastEntryLabel(REGULAR_VALUES) }),
    recordLabel: recordLabel(recordedDayCount(REGULAR_VALUES)),
    terrainDays: toTerrainDays(REGULAR_VALUES, now),
    read,
    ctaLabel: ctaLabel(false),
    card: null,
  };
}

// Dev-only state switcher (__DEV__) — the order permits a toggle/fixture to make the
// named states reachable. Not shipped to production. Sub-slice E adds checked-in/away.
const DEV_STATES: readonly HomeStateKind[] = ['regular', 'first-run'];

export default function TodayScreen() {
  const [kind, setKind] = useState<HomeStateKind>('regular');
  const model = buildModel(kind, new Date());

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      {__DEV__ && (
        <View className="flex-row gap-2 px-4 pt-1">
          {DEV_STATES.map((s) => (
            <Pressable
              key={s}
              accessibilityRole="button"
              accessibilityLabel={`dev-state-${s}`}
              onPress={() => setKind(s)}
              className="rounded-full border border-border px-2 py-1 dark:border-border-dark"
            >
              <Text
                variant="caption"
                className={
                  s === kind
                    ? 'text-primary dark:text-primary-dark'
                    : 'text-text-tertiary dark:text-text-tertiary-dark'
                }
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <HomeView model={model} onCheckIn={() => {}} onHistory={() => {}} />
    </View>
  );
}
