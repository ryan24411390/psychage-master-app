import type { CheckInState } from '@psychage/shared/check-in';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CheckInSheet } from '@/components/check-in/CheckInSheet';
import { HomeView } from '@/components/home/HomeView';
import type { TerrainValue } from '@/components/terrain/terrain-geometry';
import { Text } from '@/components/ui/Text';
import { storage } from '@/lib/adapters/storage';
import { STATE_LABELS } from '@/lib/check-in-labels';
import { useHaptics } from '@/lib/haptic-context';
import {
  bridgeCardFor,
  buildTerrainDaysFromEntries,
  ctaLabel,
  deriveKind,
  greeting,
  type HomeStateKind,
  type HomeStore,
  type HomeViewModel,
  isReflectionAvailable,
  readForHour,
  recordLabel,
  statusLine,
  toTerrainDays,
} from '@/lib/home-model';
import {
  isReflectionRowOpened,
  markReflectionRowOpened,
} from '@/lib/persistence/reflection-row';

// Stateful S3 container (sub-slice E). Takes the RecordStore as a prop so render
// tests inject an in-memory double (the real store imports the shared package at
// runtime, which Jest does not transform). Default mode is 'live' — derived from the
// store, so the CTA→S4→saveToday path drives status/terrain/bridge + the Imprint. The
// __DEV__ toggle forces any of the four named states as fixtures for reachability
// (away can't be produced by saving). checked-in/away copy lives in home-model.

type DevMode = 'live' | HomeStateKind;
const DEV_MODES: readonly DevMode[] = ['live', 'first-run', 'regular', 'checked-in', 'away'];

// Dismissal seam for the one-time reflection row — injected so render tests can drive
// the opened/not-opened states directly. The default is the mobile-local flag (off the
// RecordStore; see lib/persistence/reflection-row for why local, not store meta).
export interface ReflectionGate {
  isOpened(): boolean;
  markOpened(): void;
}

const storageReflectionGate: ReflectionGate = {
  isOpened: () => isReflectionRowOpened(storage),
  markOpened: () => markReflectionRowOpened(storage),
};

// Fixture day-values (v5 shapes) for the forced dev states.
const REGULAR_VALUES: readonly TerrainValue[] = [3, 2, 1, null, 2, 3, 'today'];
const CHECKED_IN_VALUES: readonly TerrainValue[] = [2, 1, 3, null, 2, 3, 1];
const FIRST_RUN_VALUES: readonly TerrainValue[] = [null, null, null, null, null, null, 'today'];
const AWAY_VALUES: readonly TerrainValue[] = [2, null, null, null, null, null, 'today'];

function buildFixtureModel(kind: HomeStateKind, now: Date): HomeViewModel {
  const hour = now.getHours();
  const read = readForHour(hour);
  switch (kind) {
    case 'first-run':
      return {
        greeting: greeting('first-run', hour),
        status: statusLine('first-run'),
        recordLabel: recordLabel(0),
        terrainDays: toTerrainDays(FIRST_RUN_VALUES, now),
        read,
        ctaLabel: ctaLabel(false),
        card: null,
      };
    case 'checked-in':
      return {
        greeting: greeting('checked-in', hour),
        status: statusLine('checked-in', { todayLabel: STATE_LABELS[1], hasPrior: true }),
        recordLabel: recordLabel(5),
        terrainDays: toTerrainDays(CHECKED_IN_VALUES, now),
        read,
        ctaLabel: ctaLabel(true),
        card: bridgeCardFor(1, hour),
      };
    case 'away':
      return {
        greeting: greeting('away', hour),
        status: statusLine('away'),
        recordLabel: recordLabel(1),
        terrainDays: toTerrainDays(AWAY_VALUES, now),
        read,
        ctaLabel: ctaLabel(false),
        card: null,
      };
    default:
      return {
        greeting: greeting('regular', hour),
        status: statusLine('regular', { yesterdayLabel: STATE_LABELS[3] }),
        recordLabel: recordLabel(5),
        terrainDays: toTerrainDays(REGULAR_VALUES, now),
        read,
        ctaLabel: ctaLabel(false),
        card: null,
      };
  }
}

function buildLiveModel(store: HomeStore, now: Date): HomeViewModel {
  const hour = now.getHours();
  const today = store.getToday();
  const recent = store.getRecent(7);
  const kind = deriveKind(recent.length > 0, today !== undefined);
  const prior = today ? recent.find((e) => e.id !== today.id) : recent[0];
  return {
    greeting: greeting(kind, hour),
    status: statusLine(kind, {
      yesterdayLabel: prior ? STATE_LABELS[prior.state] : undefined,
      todayLabel: today ? STATE_LABELS[today.state] : undefined,
      hasPrior: prior !== undefined,
    }),
    recordLabel: recordLabel(recent.length),
    terrainDays: buildTerrainDaysFromEntries(recent, now),
    read: readForHour(hour),
    ctaLabel: ctaLabel(today !== undefined),
    card: today ? bridgeCardFor(today.state, hour) : null,
  };
}

export function HomeContainer({
  store,
  reflectionGate = storageReflectionGate,
  navigateToReflection = () => router.push('/reflection'),
  autoOpenCheckIn = false,
}: {
  store: HomeStore;
  reflectionGate?: ReflectionGate;
  // Navigation seam (mirrors reflectionGate): the default pushes S9; render tests
  // inject a spy so they never touch the real router (which throws without a root).
  navigateToReflection?: () => void;
  // A2/PR-E: onboarding's "Do your first check-in" opens S4 over the first-run home
  // via the ?checkin=1 route param, which the index route maps to this prop.
  autoOpenCheckIn?: boolean;
}) {
  const { fireHaptic } = useHaptics();
  const [devMode, setDevMode] = useState<DevMode>('live');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [imprintSignal, setImprintSignal] = useState(0);
  const [tiltSignal, setTiltSignal] = useState(0);
  const [reflectionOpened, setReflectionOpened] = useState(() => reflectionGate.isOpened());

  // Open S4 once on mount when arriving from onboarding (?checkin=1). The param stays
  // truthy, but the effect only fires on mount/prop-change, so closing the sheet is final.
  useEffect(() => {
    if (autoOpenCheckIn) setSheetOpen(true);
  }, [autoOpenCheckIn]);

  // Derived fresh each render (cheap store reads). After a save, the setState calls in
  // handleSave re-render and re-derive from the now-mutated store — no memo/tick needed.
  const now = new Date();
  const model =
    devMode === 'live' ? buildLiveModel(store, now) : buildFixtureModel(devMode, now);

  // The one-time reflection row: only in live mode, only while available (Flow 12's
  // following-Monday rule, store-derived) AND not yet opened. Fixtures never show it.
  const reflectionReady =
    devMode === 'live' && !reflectionOpened && isReflectionAvailable(store, now);

  const handleReflectionOpen = useCallback(() => {
    reflectionGate.markOpened();
    setReflectionOpened(true);
    // A2/PR-D: S9 now exists — navigate to it (via the injected seam). The one-time
    // dismissal above still fires on tap (kept).
    navigateToReflection();
  }, [reflectionGate, navigateToReflection]);

  const handleSave = useCallback(
    (state: CheckInState, note?: string) => {
      const firstSaveToday = store.getToday() === undefined;
      store.saveToday(state, note);
      fireHaptic('confirm');
      // Imprint (ring + scale) fires ONLY on the first save of today; a same-day
      // re-save overwrites without replaying it. The haptic fires either way.
      if (firstSaveToday) setImprintSignal((s) => s + 1);
      setTiltSignal((s) => s + 1);
      setSheetOpen(false);
    },
    [store, fireHaptic],
  );

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      {__DEV__ && (
        <View className="flex-row flex-wrap gap-2 px-4 pt-1">
          {DEV_MODES.map((m) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityLabel={`dev-state-${m}`}
              onPress={() => setDevMode(m)}
              className="rounded-full border border-border px-2 py-1 dark:border-border-dark"
            >
              <Text
                variant="caption"
                className={
                  m === devMode
                    ? 'text-primary dark:text-primary-dark'
                    : 'text-text-tertiary dark:text-text-tertiary-dark'
                }
              >
                {m}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <HomeView
        model={model}
        onCheckIn={() => setSheetOpen(true)}
        onHistory={() => router.push('/history')}
        imprintSignal={imprintSignal}
        tiltSignal={tiltSignal}
        reflectionReady={reflectionReady}
        onReflectionOpen={handleReflectionOpen}
      />

      {sheetOpen && <CheckInSheet onSave={handleSave} onClose={() => setSheetOpen(false)} />}
    </View>
  );
}
