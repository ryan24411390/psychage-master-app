import { useSyncExternalStore } from 'react';

import {
  type DirectoryLocation,
  getDirectoryLocationSnapshot,
  resetDirectoryLocation,
  setDirectoryLocation,
  subscribeDirectoryLocation,
} from '@/lib/persistence/directory-location';

// Reactive read+write of the directory's persisted home location. Reading through
// useSyncExternalStore means completing setup re-renders the Find tab's gate
// immediately (LocationSetup → DirectoryView) without a navigation event.
export interface UseDirectoryLocation extends DirectoryLocation {
  setLocation: typeof setDirectoryLocation;
  resetLocation: typeof resetDirectoryLocation;
}

export function useDirectoryLocation(): UseDirectoryLocation {
  const state = useSyncExternalStore(
    subscribeDirectoryLocation,
    getDirectoryLocationSnapshot,
    getDirectoryLocationSnapshot,
  );
  return { ...state, setLocation: setDirectoryLocation, resetLocation: resetDirectoryLocation };
}
