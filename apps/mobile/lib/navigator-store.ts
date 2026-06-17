// The app's single NavigatorResultStore, constructed with the mobile DI seam
// (storage adapter + clock + id factory) per apps/mobile/CLAUDE.md convention #3.
//
// LOCAL-ONLY (SR-4). Like lib/clarity-store.ts there is deliberately NO syncing
// subclass: Symptom Navigator results never leave the device — no push, no pull,
// no analytics, no Sentry. This singleton only lets the device remember past runs.

import { NavigatorResultStore } from '@/features/navigator/result-store';
import { storage } from '@/lib/adapters/storage';
import { generateId } from '@/lib/id';

let store: NavigatorResultStore | null = null;

export function getNavigatorStore(): NavigatorResultStore {
  if (!store) {
    store = new NavigatorResultStore({
      storage,
      now: () => new Date(),
      generateId,
    });
  }
  return store;
}

/** Drop the cached singleton so the next getNavigatorStore() re-load()s from disk. */
export function resetNavigatorStore(): void {
  store = null;
}
