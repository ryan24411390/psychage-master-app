import { MoodJournalStore } from '@psychage/shared/mood-journal';

import { storage } from '@/lib/adapters/storage';
import { generateId } from '@/lib/id';

// The app's single MoodJournalStore — the "patterns & triggers" record — constructed
// with the mobile DI seam (storage adapter + clock + id factory) per
// apps/mobile/CLAUDE.md convention #3. Mood itself is NOT stored here; it stays
// single-sourced in the check-in record (getCheckInStore). This store holds only the
// tagged moments (emotions/triggers/note).
//
// LOCAL-ONLY (SR-4): writes the MMKV-backed storage seam, never the network. Imports
// the shared package at RUNTIME, so it loads only on the device / in Vitest — never in
// a Jest-rendered path (MoodJournalView takes the stores as props so render tests inject
// in-memory doubles instead).

let store: MoodJournalStore | null = null;

export function getMoodJournalStore(): MoodJournalStore {
  if (!store) {
    store = new MoodJournalStore({
      storage,
      now: () => new Date(),
      generateId,
    });
  }
  return store;
}

// Drop the cached singleton so the NEXT getMoodJournalStore() re-constructs and
// re-load()s from disk. Mirrors resetCheckInStore: a "delete my data" flow that clears
// the storage key must also reset the live instance, which caches moments in-memory at
// construction. Additive — existing callers are unaffected.
export function resetMoodJournalStore(): void {
  store = null;
}
