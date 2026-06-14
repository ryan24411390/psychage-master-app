import { CheckInRecordStore } from '@psychage/shared/check-in';
import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import { KNOWN_LOCAL_KEYS } from '@/lib/persistence/known-keys';
import { wipeLocalData } from '@/lib/persistence/wipe-local-data';

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

describe('wipeLocalData (S48 local delete)', () => {
  it('clears every known key; a fresh store then reads empty', () => {
    const storage = memStorage();
    let clock = new Date(2026, 5, 14, 9, 0, 0);
    let n = 0;
    const store = new CheckInRecordStore({
      storage,
      now: () => clock,
      generateId: () => `id-${++n}`,
    });

    store.saveToday(2);
    clock = new Date(2026, 5, 15, 9, 0, 0);
    store.saveToday(4);
    expect(store.getRecent(50).length).toBe(2);

    // seed the other known pref keys
    storage.set('mobile:tier-flags', JSON.stringify({ version: 1, data: {} }));
    storage.set('mobile:appearance', JSON.stringify({ version: 1, mode: 'night', reducedMotion: true }));
    storage.set(
      'mobile:reminder-settings',
      JSON.stringify({ version: 1, enabled: true, time: '07:00', neverAsked: true }),
    );
    storage.set('mobile:personalization', JSON.stringify({ version: 1, name: 'Sam', homeLead: 'navigator' }));

    wipeLocalData(storage);

    for (const key of KNOWN_LOCAL_KEYS) {
      expect(storage.get(key)).toBeNull();
    }

    // A fresh store bound to the now-empty disk has no entries (proves the disk
    // wipe independently of any live-instance reset).
    const fresh = new CheckInRecordStore({ storage, now: () => clock, generateId: () => 'x' });
    expect(fresh.getRecent(50)).toEqual([]);
    expect(fresh.getToday()).toBeUndefined();
  });
});
