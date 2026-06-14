import { SleepRecordStore } from '@psychage/shared/sleep';

import { storage } from '@/lib/adapters/storage';
import { generateId } from '@/lib/id';

// The app's single SleepRecordStore, constructed with the mobile DI seam (storage
// adapter + clock + id factory) per apps/mobile/CLAUDE.md convention #3. LOCAL-ONLY:
// writes the MMKV-backed storage seam, never the network (SR-4 — sleep data stays
// on device). Imports the shared package at RUNTIME, so it loads only on the device
// / in Vitest. Render tests inject an in-memory SleepRecordStore instead.

let store: SleepRecordStore | null = null;

export function getSleepStore(): SleepRecordStore {
  if (!store) {
    store = new SleepRecordStore({
      storage,
      now: () => new Date(),
      generateId,
    });
  }
  return store;
}

// Drop the cached singleton so the NEXT getSleepStore() re-constructs and
// re-load()s from disk (mirrors resetCheckInStore — the store caches entries
// in-memory at construction, so a "delete my data" that only clears the storage
// key would otherwise leave a stale live instance answering reads).
export function resetSleepStore(): void {
  store = null;
}
