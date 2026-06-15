// The app's single ToolkitProgressStore, constructed with the mobile DI seam
// (storage adapter + clock + id factory) per apps/mobile/CLAUDE.md convention #3.
//
// LOCAL IS THE SOURCE OF TRUTH. The MMKV-backed store is authoritative; on top of a
// successful local mutation the SyncingToolkitProgressStore fires a BEST-EFFORT,
// PUSH-ONLY, CONSENT-GATED backup to Supabase. There is no pull, no merge. A failed,
// un-consented, or unauthenticated push is swallowed and never blocks the local write.
//
// This module imports the Supabase auth client at RUNTIME (via sync.ts), so it is
// loaded only on the device / in Vitest — never in a Jest-rendered path. Render tests
// inject an in-memory ToolkitProgressApi double into ToolkitDetailView instead of
// importing this singleton.

import { storage } from '@/lib/adapters/storage';
import { generateId } from '@/lib/id';

import {
  type PersistedItemProgress,
  ToolkitProgressStore,
  type ToolkitProgressApi,
} from './progress-store';
import { pushToolkitProgress } from './sync';
import type { SelfRating } from './types';

/** ToolkitProgressStore that mirrors each successful local write to the cloud. */
class SyncingToolkitProgressStore extends ToolkitProgressStore {
  markOpened(toolkitId: string, itemId: string): PersistedItemProgress {
    const record = super.markOpened(toolkitId, itemId);
    void pushToolkitProgress(record);
    return record;
  }

  setDone(toolkitId: string, itemId: string, done: boolean): PersistedItemProgress {
    const record = super.setDone(toolkitId, itemId, done);
    void pushToolkitProgress(record);
    return record;
  }

  setRating(toolkitId: string, itemId: string, rating: SelfRating | null): PersistedItemProgress {
    const record = super.setRating(toolkitId, itemId, rating);
    void pushToolkitProgress(record);
    return record;
  }
}

let store: ToolkitProgressStore | null = null;

export function getToolkitProgressStore(): ToolkitProgressApi {
  if (!store) {
    store = new SyncingToolkitProgressStore({
      storage,
      now: () => new Date(),
      generateId,
    });
  }
  return store;
}

/** Drop the cached singleton so the NEXT get re-constructs and re-load()s from disk. */
export function resetToolkitProgressStore(): void {
  store = null;
}
