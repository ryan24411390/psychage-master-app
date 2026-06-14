import type { CheckInEntry, CheckInState } from '@psychage/shared/check-in';
import { router } from 'expo-router';
import { useState } from 'react';

import { CheckInSheet } from '@/components/check-in/CheckInSheet';
import { EntryDetailSheet } from '@/components/history/EntryDetailSheet';
import { HistoryView } from '@/components/history/HistoryView';
import { buildContinuum } from '@/features/history/continuum';
import { isReflectionAvailable } from '@/lib/home-model';
import { useReducedMotion } from '@/lib/motion';

// Stateful S7 container. Takes the RecordStore as a prop so render tests inject an
// in-memory double (the real store imports the shared package at runtime, which Jest
// does not transform — mirrors HomeContainer). Builds the continuum + reflection-row
// availability, and owns the S8 detail / S4-edit sheet state. LOCAL-ONLY reads/writes —
// no network, no telemetry.
//
// EDIT PATH (Flow 11 steps 3–5): tap a dot → S8 → "Edit" → S4 in edit mode, pre-filled.
// Save calls editEntry (keys to the entry's STORED date, never re-dates — Date Rule 2)
// and fires NO Imprint / bridge / haptic (those are home's, on the present moment only);
// here we just re-read and return silently to S8 showing the updated entry.

export interface HistoryStore {
  getRecent(n: number): CheckInEntry[];
  getRange(from: string, to: string): CheckInEntry[];
  getEntry(id: string): CheckInEntry | undefined;
  editEntry(id: string, state: CheckInState, note?: string): CheckInEntry;
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
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  // Only the setter is needed — bumping it re-renders so the reads below re-run against
  // the mutable store after an edit.
  const [, forceRefresh] = useState(0);

  const now = new Date();
  const weeks = buildContinuum(store.getRecent(HISTORY_READ_LIMIT), now);
  const reflectionAvailable = isReflectionAvailable(store, now);

  // Re-read each render so an edit is reflected. Missing id (cannot occur — S8 opens only
  // from an existing dot) ⇒ detailEntry is undefined and the sheet simply doesn't render
  // (silent return to S7), the defensive guard the anatomy calls for.
  const detailEntry = detailId ? store.getEntry(detailId) : undefined;

  return (
    <>
      <HistoryView
        weeks={weeks}
        reflectionAvailable={reflectionAvailable}
        reduced={reduced}
        onBack={onBack}
        onReflection={navigateToReflection}
        onSelectEntry={(entry) => {
          setEditing(false);
          setDetailId(entry.id);
        }}
      />

      {detailEntry && !editing ? (
        <EntryDetailSheet
          entry={detailEntry}
          onEdit={() => setEditing(true)}
          onClose={() => setDetailId(null)}
        />
      ) : null}

      {detailEntry && editing ? (
        <CheckInSheet
          mode="edit"
          initialState={detailEntry.state}
          initialNote={detailEntry.note}
          onSave={(state, note) => {
            // Keys to the entry's STORED date (Date Rule 2); no Imprint/bridge/haptic.
            store.editEntry(detailEntry.id, state, note);
            forceRefresh((n) => n + 1);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </>
  );
}
