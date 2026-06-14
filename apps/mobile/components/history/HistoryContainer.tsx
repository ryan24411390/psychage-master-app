import type { CheckInEntry } from '@psychage/shared/check-in';
import { router } from 'expo-router';

import { HistoryView } from '@/components/history/HistoryView';
import { buildContinuum } from '@/features/history/continuum';
import { isReflectionAvailable } from '@/lib/home-model';
import { useReducedMotion } from '@/lib/motion';

// Stateful S7 container. Takes the RecordStore as a prop so render tests inject an
// in-memory double (the real store imports the shared package at runtime, which Jest
// does not transform — mirrors HomeContainer). Builds the continuum + reflection-row
// availability from the store; R3 adds the S8 detail / S4-edit sheet state here.
// LOCAL-ONLY reads — no network, no telemetry.

export interface HistoryStore {
  getRecent(n: number): CheckInEntry[];
  getRange(from: string, to: string): CheckInEntry[];
}

// ≈11 years of daily entries — effectively the whole record for V1 (the continuum
// renders from the earliest entry's week forward, so this only bounds pathological depth).
const HISTORY_READ_LIMIT = 4000;

export function HistoryContainer({
  store,
  onBack = () => router.back(),
  navigateToReflection = () => router.push('/reflection'),
}: {
  store: HistoryStore;
  // Navigation seams (mirror HomeContainer): defaults use the router; render tests
  // inject spies so they never touch the real router (which throws without a root).
  onBack?: () => void;
  navigateToReflection?: () => void;
}) {
  const reduced = useReducedMotion();
  const now = new Date();
  const weeks = buildContinuum(store.getRecent(HISTORY_READ_LIMIT), now);
  const reflectionAvailable = isReflectionAvailable(store, now);

  return (
    <HistoryView
      weeks={weeks}
      reflectionAvailable={reflectionAvailable}
      reduced={reduced}
      onBack={onBack}
      onReflection={navigateToReflection}
      // TODO(R3): open the S8 entry-detail sheet for the tapped entry.
      onSelectEntry={() => {}}
    />
  );
}
