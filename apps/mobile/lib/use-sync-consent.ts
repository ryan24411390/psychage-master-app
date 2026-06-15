import { useSyncExternalStore } from 'react';

import {
  getSyncConsentSnapshot,
  setCheckInSyncConsent,
  subscribeSyncConsent,
  type SyncConsentState,
} from '@/lib/persistence/sync-consent';

// Reactive read+write of the check-in cloud-backup consent for the S46 toggle.
// Reads through useSyncExternalStore so flipping the toggle re-renders the row
// immediately; the setter persists and notifies the push gate (lib/check-in-store
// pushCheckInEntry reads the same store synchronously via getCheckInSyncConsent).
export interface UseSyncConsent extends SyncConsentState {
  setCheckInSyncConsent: (on: boolean) => void;
}

export function useSyncConsent(): UseSyncConsent {
  const state = useSyncExternalStore(
    subscribeSyncConsent,
    getSyncConsentSnapshot,
    getSyncConsentSnapshot,
  );
  return { ...state, setCheckInSyncConsent };
}
