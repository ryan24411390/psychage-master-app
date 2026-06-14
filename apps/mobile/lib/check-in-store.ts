import { CheckInRecordStore } from '@psychage/shared/check-in';

import { storage } from '@/lib/adapters/storage';
import { generateId } from '@/lib/id';

// The app's single CheckInRecordStore, constructed with the mobile DI seam
// (storage adapter + clock + id factory) per apps/mobile/CLAUDE.md convention #3.
// LOCAL-ONLY: writes the MMKV-backed storage seam, never the network (SR-4 — sync
// is cooling-off-gated). This module imports the shared package at RUNTIME, so it is
// loaded only on the device / in Vitest — never in a Jest-rendered path (HomeContainer
// takes the store as a prop so render tests inject an in-memory double instead).

let store: CheckInRecordStore | null = null;

export function getCheckInStore(): CheckInRecordStore {
  if (!store) {
    store = new CheckInRecordStore({
      storage,
      now: () => new Date(),
      generateId,
    });
  }
  return store;
}
