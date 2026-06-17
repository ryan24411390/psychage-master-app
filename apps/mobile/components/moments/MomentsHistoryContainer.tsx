import type { EngagementStore, Moment } from '@psychage/shared/engagement';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { MomentsHistoryView } from '@/components/moments/MomentsHistoryView';
import { storage } from '@/lib/adapters/storage';
import { hydrateMomentsFromRemote } from '@/lib/moment-store';
import { loadReachedMilestones } from '@/lib/persistence/milestones';

// Stateful Moments history (S7-equivalent). Takes the EngagementStore as a prop so
// render tests inject an in-memory double (the real store imports the shared package
// at runtime, which Jest does not transform — mirrors HistoryContainer).
//
// LOCAL-FIRST read: shows the on-device moments immediately. On mount it also kicks a
// best-effort PULL/restore (hydrateMomentsFromRemote) — consent + auth gated — and
// re-renders if the merge brought anything in. This is what makes history survive a
// reinstall: a fresh install has an empty local cache, the pull repopulates it.

type MomentsHistoryContainerProps = {
  store: EngagementStore;
  onBack?: () => void;
  /** Sync seam — default pulls from the user's account; render tests inject a no-op. */
  hydrate?: (store: EngagementStore) => Promise<boolean>;
};

export function MomentsHistoryContainer({
  store,
  onBack = () => router.back(),
  hydrate = hydrateMomentsFromRemote,
}: MomentsHistoryContainerProps) {
  // Bump to re-read after a background pull merges remote moments into the store.
  const [, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    void hydrate(store).then((changed) => {
      if (active && changed) setTick((n) => n + 1);
    });
    return () => {
      active = false;
    };
  }, [store, hydrate]);

  const moments: Moment[] = store.getAll();
  // Reached milestones are derived from the cumulative count + the persisted set; read
  // on render so a milestone reached this session (or restored via the pull) shows.
  const reached = loadReachedMilestones(storage);
  return <MomentsHistoryView moments={moments} onBack={onBack} reached={reached} />;
}
