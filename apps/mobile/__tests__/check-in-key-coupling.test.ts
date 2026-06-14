import { CheckInRecordStore } from '@psychage/shared/check-in';
import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import { CHECK_IN_STORAGE_KEY } from '@/lib/persistence/known-keys';

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
    },
    remove: (k) => {
      m.delete(k);
    },
  };
}

// Pins the re-declared CHECK_IN_STORAGE_KEY (known-keys.ts) to where the shared
// store actually persists. If the shared package renames its STORAGE_KEY, this
// fails loudly — the eraser would otherwise silently miss the check-in data.
describe('check-in storage key coupling', () => {
  it('the store persists under the exact key the eraser removes', () => {
    const storage = memStorage();
    const store = new CheckInRecordStore({
      storage,
      now: () => new Date(2026, 5, 14, 9, 0, 0),
      generateId: () => 'id-1',
    });
    store.saveToday(3);
    expect(storage.get(CHECK_IN_STORAGE_KEY)).not.toBeNull();
  });
});
