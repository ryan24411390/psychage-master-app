import { RelationshipResultStore } from '@/features/relationship-health/result-store';
import { storage } from '@/lib/adapters/storage';
import { generateId } from '@/lib/id';

// The app's single RelationshipResultStore, constructed with the mobile DI seam
// (storage adapter + clock + id factory) per apps/mobile/CLAUDE.md convention #3.
// LOCAL-ONLY: writes the MMKV-backed storage seam, never the network (SR-4). The
// completed-assessment history (incl. raw answers) lives only on the device. This
// module imports the feature store at RUNTIME, so it loads only on device / in
// Vitest — never in a Jest render path (the flow takes the store as a prop so
// render tests inject an in-memory double instead).

let store: RelationshipResultStore | null = null;

export function getRelationshipStore(): RelationshipResultStore {
  if (!store) {
    store = new RelationshipResultStore({
      storage,
      now: () => new Date(),
      generateId,
    });
  }
  return store;
}

// Drop the cached singleton so the NEXT getRelationshipStore() re-constructs and
// re-load()s from disk (mirrors resetCheckInStore — needed after a disk wipe so a
// stale in-memory instance doesn't keep answering reads).
export function resetRelationshipStore(): void {
  store = null;
}
