// The app's single ClarityResultStore, constructed with the mobile DI seam
// (storage adapter + clock + id factory) per apps/mobile/CLAUDE.md convention #3.
//
// LOCAL-ONLY. There is deliberately NO syncing subclass here (contrast
// lib/check-in-store.ts, which mirrors writes to Supabase under the SR-4 ADR
// carve-out): that carve-out covers consented mood self-tracking ONLY. Assessment
// tool results never leave the device — no push, no pull, no analytics, no Sentry.

import { ClarityResultStore } from '@/features/clarity/result-store';
import { storage } from '@/lib/adapters/storage';
import { generateId } from '@/lib/id';

let store: ClarityResultStore | null = null;

export function getClarityStore(): ClarityResultStore {
  if (!store) {
    store = new ClarityResultStore({
      storage,
      now: () => new Date(),
      generateId,
    });
  }
  return store;
}

/** Drop the cached singleton so the next getClarityStore() re-load()s from disk. */
export function resetClarityStore(): void {
  store = null;
}
