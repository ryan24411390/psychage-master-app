import type { CheckInState } from '@psychage/shared/check-in';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { CheckInSheet } from '@/components/check-in/CheckInSheet';
import { HomeView } from '@/components/home/HomeView';
import type { ToolSummary } from '@/features/insights/aggregate';
import { readToolSummaries } from '@/features/insights/read-stores';
import { storage } from '@/lib/adapters/storage';
import { STATE_LABELS } from '@/lib/check-in-labels';
import { useHaptics } from '@/lib/haptic-context';
import {
  bridgeCardFor,
  buildTerrainDaysFromEntries,
  calculateDormantTool,
  ctaLabel,
  deriveKind,
  generateMoodInsight,
  greeting,
  type HomeStore,
  type HomeViewModel,
  isReflectionAvailable,
  readForHour,
  recordLabel,
  statusLine,
} from '@/lib/home-model';
import { readingProgressStore } from '@/lib/reading-progress-store';
import {
  isReflectionRowOpened,
  markReflectionRowOpened,
} from '@/lib/persistence/reflection-row';

// Stateful S3 container (sub-slice E). Takes the RecordStore as a prop so render
// tests inject an in-memory double (the real store imports the shared package at
// runtime, which Jest does not transform). The view model is derived from the store —
// the CTA→S4→saveToday path drives status/terrain/bridge + the Imprint. checked-in/
// away copy lives in home-model.

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

function buildLiveModel(store: HomeStore, now: Date, tools: readonly ToolSummary[]): HomeViewModel {
  const hour = now.getHours();
  const today = store.getToday();
  const recent = store.getRecent(14); // We need 14 days now!
  const kind = deriveKind(recent.length > 0, today !== undefined);
  const prior = today ? recent.find((e) => e.id !== today.id) : recent[0];
  const terrainDays = buildTerrainDaysFromEntries(recent, now, 14);
  return {
    greeting: greeting(kind, hour),
    status: statusLine(kind, {
      yesterdayLabel: prior ? STATE_LABELS[prior.state] : undefined,
      todayLabel: today ? STATE_LABELS[today.state] : undefined,
      hasPrior: prior !== undefined,
    }),
    recordLabel: recordLabel(recent.length),
    terrainDays,
    read: readForHour(hour),
    ctaLabel: ctaLabel(today !== undefined),
    card: today ? bridgeCardFor(today.state, hour) : null,
    dormantTool: calculateDormantTool(),
    insight: generateMoodInsight(terrainDays),
    inProgressReads: readingProgressStore.getInProgressReads(),
    tools,
  };
}

export function HomeContainer({
  store,
  reflectionGate = storageReflectionGate,
  navigateToReflection = () => router.push('/reflection'),
  navigateToBreathing = () => router.push('/toolkit'),
  navigateToInsights = () => router.push('/insights'),
  readSummaries = readToolSummaries,
  autoOpenCheckIn = false,
}: {
  store: HomeStore;
  reflectionGate?: ReflectionGate;
  // Insights nav seam — default pushes the cross-tool Insights screen; render tests
  // inject a spy so they never touch the real router.
  navigateToInsights?: () => void;
  // Cross-tool summary seam — default reads the local tool singletons; render tests
  // inject `() => []` so they don't touch MMKV/native storage.
  readSummaries?: () => readonly ToolSummary[];
  // Navigation seam (mirrors reflectionGate): the default pushes S9; render tests
  // inject a spy so they never touch the real router (which throws without a root).
  navigateToReflection?: () => void;
  // Steadying-bridge "Breathing" chip → the real breathing flow (/toolkit defaults to
  // breathing). Same nav seam as reflection so render tests inject a spy.
  navigateToBreathing?: () => void;
  // A2/PR-E: onboarding's "Do your first check-in" opens S4 over the first-run home
  // via the ?checkin=1 route param, which the index route maps to this prop.
  autoOpenCheckIn?: boolean;
}) {
  const { fireHaptic } = useHaptics();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [imprintSignal, setImprintSignal] = useState(0);
  const [tiltSignal, setTiltSignal] = useState(0);
  const [bridgeDismissed, setBridgeDismissed] = useState(false);
  const [reflectionOpened, setReflectionOpened] = useState(() => reflectionGate.isOpened());

  // Open S4 once on mount when arriving from onboarding (?checkin=1). The param stays
  // truthy, but the effect only fires on mount/prop-change, so closing the sheet is final.
  useEffect(() => {
    if (autoOpenCheckIn) setSheetOpen(true);
  }, [autoOpenCheckIn]);

  // Derived fresh each render (cheap store reads). After a save, the setState calls in
  // handleSave re-render and re-derive from the now-mutated store — no memo/tick needed.
  const now = new Date();
  const baseModel = buildLiveModel(store, now, readSummaries());
  // "Not now" dismisses the steadying bridge for this session (display-only — no
  // check-in write). A fresh save re-arms it (handleSave resets the flag).
  const model = bridgeDismissed ? { ...baseModel, card: null } : baseModel;

  // The one-time reflection row: only while available (Flow 12's following-Monday rule,
  // store-derived) AND not yet opened.
  const reflectionReady = !reflectionOpened && isReflectionAvailable(store, now);

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
      // Re-arm the bridge — a new entry may surface (or clear) the steadying card.
      setBridgeDismissed(false);
      setSheetOpen(false);
    },
    [store, fireHaptic],
  );

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <HomeView
        model={model}
        onCheckIn={() => setSheetOpen(true)}
        onHistory={() => router.push('/history')}
        onInsights={navigateToInsights}
        onBreathing={navigateToBreathing}
        onDismissBridge={() => setBridgeDismissed(true)}
        imprintSignal={imprintSignal}
        tiltSignal={tiltSignal}
        reflectionReady={reflectionReady}
        onReflectionOpen={handleReflectionOpen}
      />

      {sheetOpen && <CheckInSheet onSave={handleSave} onClose={() => setSheetOpen(false)} />}
    </View>
  );
}
