import { router, Stack } from 'expo-router';
import { useReducer, useState } from 'react';

import { ToolScreen } from '@/components/ui/ToolScreen';
import { NAVIGATOR_COPY } from '@/features/navigator/copy';
import { NavigatorHistoryDetail } from '@/features/navigator/components/NavigatorHistoryDetail';
import { NavigatorHistoryView } from '@/features/navigator/components/NavigatorHistoryView';
import { NavigatorOverTime } from '@/features/navigator/components/NavigatorOverTime';
import {
  buildNavigatorSummaryHtml,
  type NavigatorSummaryArea,
} from '@/features/navigator/pdf/build-navigator-html';
import type { NavigatorSnapshot } from '@/features/navigator/result-store';
import { generateAndShare } from '@/features/therapist';
import { expoPdfPrinter } from '@/features/therapist/pdf/expo-printer';
import { storage } from '@/lib/adapters/storage';
import { goBackOr } from '@/lib/nav';
import { getNavigatorStore } from '@/lib/navigator-store';
import { loadPersonalization } from '@/lib/persistence/personalization';

// Past Symptom Navigator explorations. Reads the local-only history store (SR-4) and
// toggles list ↔ read-only detail ↔ over-time in local state. GlobalHeader keeps the
// crisis Help-now pill one tap away (SR-2). "Start new" replaces into the live flow.
// P41: a past run can be shared as a SUMMARY-ONLY PDF (LABELS only — SR-1/SR-4) or
// forgotten (local delete); the over-time view charts how many areas each run touched.
export default function NavigatorHistoryRoute() {
  // A delete mutates the store in place; bump to force a fresh getRecent() read.
  const [, force] = useReducer((n: number) => n + 1, 0);
  const snapshots = getNavigatorStore().getRecent(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overTime, setOverTime] = useState(false);
  const selected = selectedId ? snapshots.find((s) => s.id === selectedId) : undefined;

  const shareSnapshot = (snapshot: NavigatorSnapshot) => {
    const areas: NavigatorSummaryArea[] = snapshot.results.results
      .slice(0, 5)
      .map((r) => ({ name: r.name, relevance: r.relevance_label }));
    const html = buildNavigatorSummaryHtml({
      fullName: loadPersonalization(storage).name ?? NAVIGATOR_COPY.summaryDocTitle,
      date: snapshot.date,
      areas,
    });
    void generateAndShare(html, expoPdfPrinter);
  };

  const deleteSnapshot = (id: string) => {
    getNavigatorStore().delete(id);
    setSelectedId(null);
    force();
  };

  let onBack: () => void;
  let body: React.ReactNode;
  if (overTime) {
    onBack = () => setOverTime(false);
    body = <NavigatorOverTime snapshots={snapshots} />;
  } else if (selected) {
    onBack = () => setSelectedId(null);
    body = (
      <NavigatorHistoryDetail
        snapshot={selected}
        onDownload={() => shareSnapshot(selected)}
        onDelete={() => deleteSnapshot(selected.id)}
      />
    );
  } else {
    onBack = () => goBackOr('/compass');
    body = (
      <NavigatorHistoryView
        snapshots={snapshots}
        onSelect={setSelectedId}
        onStartNew={() => router.replace('/navigator')}
        onViewOverTime={() => setOverTime(true)}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <ToolScreen scroll="none" onBack={onBack}>
        {body}
      </ToolScreen>
    </>
  );
}
