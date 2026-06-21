import { useSyncExternalStore } from 'react';

import {
  addManualProvider,
  getMyProvidersSnapshot,
  removeProvider,
  type SavedProvider,
  type SavedProviderInput,
  setProviderContacted,
  subscribeMyProviders,
  toggleSavedProvider,
} from '@/lib/persistence/my-providers';

// Reactive read of the local "My providers" list. Saving / marking contacted on any
// surface re-renders every consumer (the directory card, the detail screen, and the
// My-providers list) without a navigation event. Local-first — works signed-out.
export interface UseMyProviders {
  items: readonly SavedProvider[];
  savedIds: ReadonlySet<string>;
  isSaved: (id: string) => boolean;
  toggleSaved: (input: SavedProviderInput) => void;
  setContacted: (id: string, contacted: boolean) => void;
  addManual: (input: { name: string; phone?: string | null }) => string | null;
  remove: (id: string) => void;
}

export function useMyProviders(): UseMyProviders {
  const snapshot = useSyncExternalStore(
    subscribeMyProviders,
    getMyProvidersSnapshot,
    getMyProvidersSnapshot,
  );
  const savedIds = new Set(snapshot.items.map((p) => p.id));
  return {
    items: snapshot.items,
    savedIds,
    isSaved: (id) => savedIds.has(id),
    toggleSaved: toggleSavedProvider,
    setContacted: setProviderContacted,
    addManual: addManualProvider,
    remove: removeProvider,
  };
}
