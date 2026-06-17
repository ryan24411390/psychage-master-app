import { useSyncExternalStore } from 'react';

import {
  getSyncConsentSnapshot,
  setCheckInSyncConsent,
  setMomentSyncConsent,
  subscribeSyncConsent,
  type SyncConsentState,
} from '@/lib/persistence/sync-consent';

// Reactive read+write of the sync consents for the privacy toggles. Reads through
// useSyncExternalStore so flipping a toggle re-renders the row immediately; the setter
// persists and notifies the sync gates (the push paths read the same store
// synchronously via getMomentSyncConsent / getCheckInSyncConsent). The Moments engine
// uses `momentSyncConsent`; `checkInSyncConsent` is the retired check-in's flag.
export interface UseSyncConsent extends SyncConsentState {
  setCheckInSyncConsent: (on: boolean) => void;
  setMomentSyncConsent: (on: boolean) => void;
}

export function useSyncConsent(): UseSyncConsent {
  const state = useSyncExternalStore(
    subscribeSyncConsent,
    getSyncConsentSnapshot,
    getSyncConsentSnapshot,
  );
  return { ...state, setCheckInSyncConsent, setMomentSyncConsent };
}
