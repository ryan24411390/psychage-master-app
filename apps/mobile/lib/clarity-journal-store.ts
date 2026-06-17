import { ClarityJournalStore } from '@psychage/shared/clarity-journal';

import { storage } from '@/lib/adapters/storage';
import { generateId } from '@/lib/id';

// The app's single ClarityJournalStore, constructed with the mobile DI seam (storage
// adapter + clock + id factory) per apps/mobile/CLAUDE.md convention #3. Mirrors
// getSleepStore() exactly. LOCAL-ONLY (SR-4): the daily journal — including the 1–10
// energy reading Insights reads — stays in the MMKV-backed storage seam and never
// touches the network. Imports the shared package at RUNTIME, so it loads only on the
// device / in Vitest. Render tests inject an in-memory ClarityJournalStore instead.
//
// NOTE (2026-06-17): no mobile capture surface writes this store yet — Insights reads it
// read-only, so the energy trend is empty until a journal capture screen lands.

let store: ClarityJournalStore | null = null;

export function getClarityJournalStore(): ClarityJournalStore {
  if (!store) {
    store = new ClarityJournalStore({
      storage,
      now: () => new Date(),
      generateId,
    });
  }
  return store;
}

// Drop the cached singleton so the NEXT getClarityJournalStore() re-constructs and
// re-load()s from disk (mirrors resetSleepStore — the store caches entries in-memory at
// construction, so clearing only the storage key would otherwise leave a stale instance).
export function resetClarityJournalStore(): void {
  store = null;
}
