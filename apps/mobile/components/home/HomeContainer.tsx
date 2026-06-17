import type { EngagementStore, MomentDraft } from '@psychage/shared/engagement';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { HomeView } from '@/components/home/HomeView';
import { MomentCaptureSheet } from '@/components/moments/MomentCaptureSheet';
import type { ToolSummary } from '@/features/insights/aggregate';
import { readToolSummaries } from '@/features/insights/read-stores';
import { storage } from '@/lib/adapters/storage';
import { DAILY_STATE_LABELS, dailyRollupReader } from '@/lib/daily-rollup';
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

// Stateful S3 container. Takes the Moments EngagementStore as a prop so render tests
// inject an in-memory double (the real store imports the shared package at runtime,
// which Jest does not transform). The view model is derived through the day-rollup
// reader — the event-based moments collapse to one representative entry per day so
// the day-based home view-model (greeting/status/terrain/reflection) is unchanged.
//
// CAPTURE: the "Right now" CTA opens the MomentCaptureSheet. On save the container
// appends a Moment (local-first; sync is the store's concern) and — if the capture's
// acute predicate flagged it (SR-2) — routes INTO the ungated crisis surface.

export interface ReflectionGate {
  isOpened(): boolean;
  markOpened(): void;
}

const storageReflectionGate: ReflectionGate = {
  isOpened: () => isReflectionRowOpened(storage),
  markOpened: () => markReflectionRowOpened(storage),
};

function buildLiveModel(reader: HomeStore, now: Date, tools: readonly ToolSummary[]): HomeViewModel {
  const hour = now.getHours();
  const today = reader.getToday();
  const recent = reader.getRecent(14);
  const kind = deriveKind(recent.length > 0, today !== undefined);
  const prior = today ? recent.find((e) => e.id !== today.id) : recent[0];
  const terrainDays = buildTerrainDaysFromEntries(recent, now, 14);
  return {
    greeting: greeting(kind, hour),
    status: statusLine(kind, {
      yesterdayLabel: prior ? DAILY_STATE_LABELS[prior.state] : undefined,
      todayLabel: today ? DAILY_STATE_LABELS[today.state] : undefined,
      todayNote: today?.note,
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
  store: EngagementStore;
  reflectionGate?: ReflectionGate;
  navigateToInsights?: () => void;
  readSummaries?: () => readonly ToolSummary[];
  navigateToReflection?: () => void;
  navigateToBreathing?: () => void;
  // Onboarding's "Capture your first moment" opens the sheet over the first-run home.
  autoOpenCheckIn?: boolean;
}) {
  const { fireHaptic } = useHaptics();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [imprintSignal, setImprintSignal] = useState(0);
  const [tiltSignal, setTiltSignal] = useState(0);
  const [bridgeDismissed, setBridgeDismissed] = useState(false);
  const [reflectionOpened, setReflectionOpened] = useState(() => reflectionGate.isOpened());

  const reader = dailyRollupReader(store);

  useEffect(() => {
    if (autoOpenCheckIn) setSheetOpen(true);
  }, [autoOpenCheckIn]);

  const now = new Date();
  const baseModel = buildLiveModel(reader, now, readSummaries());
  const model = bridgeDismissed ? { ...baseModel, card: null } : baseModel;

  const reflectionReady = !reflectionOpened && isReflectionAvailable(reader, now);

  const handleReflectionOpen = useCallback(() => {
    reflectionGate.markOpened();
    setReflectionOpened(true);
    navigateToReflection();
  }, [reflectionGate, navigateToReflection]);

  const handleSave = useCallback(
    (draft: MomentDraft) => {
      // Persist + fire the home reactions. The sheet owns the close: it shows its single
      // post-capture acknowledgment beat, then calls onClose. No acute-handoff route runs
      // here — the SR-2 crisis pill (stack header) is the safety floor, and a band-1 day
      // still surfaces the bridge card below.
      const firstToday = reader.getToday() === undefined;
      store.append(draft);
      fireHaptic('confirm');
      if (firstToday) setImprintSignal((s) => s + 1);
      setTiltSignal((s) => s + 1);
      setBridgeDismissed(false);
    },
    [store, reader, fireHaptic],
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

      {sheetOpen && <MomentCaptureSheet onSave={handleSave} onClose={() => setSheetOpen(false)} />}
    </View>
  );
}
