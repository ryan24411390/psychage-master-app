import { MomentStore } from '@psychage/shared/engagement';
import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import { MOMENTS_STORAGE_KEY, KNOWN_LOCAL_KEYS } from '@/lib/persistence/known-keys';
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
    getAllKeys: () => Array.from(m.keys()),
  };
}

describe('wipeLocalData (S48 local delete)', () => {
  it('clears every known key; a fresh store then reads empty', () => {
    const storage = memStorage();
    let clock = new Date(2026, 5, 14, 9, 0, 0);
    let n = 0;
    const store = new MomentStore({
      storage,
      now: () => clock,
      generateId: () => `id-${++n}`,
    });

    store.append({ valence: 3 });
    clock = new Date(2026, 5, 15, 9, 0, 0);
    store.append({ valence: 5 });
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
    const fresh = new MomentStore({ storage, now: () => clock, generateId: () => 'x' });
    expect(fresh.getRecent(50)).toEqual([]);
    expect(fresh.getAll()).toEqual([]);
  });

  it('sweeps dynamic :quarantine: keys that have no static registry entry', () => {
    const storage = memStorage();
    // A corrupt-blob quarantine key — dynamically suffixed, not in KNOWN_LOCAL_KEYS.
    const quarantineKey = `${MOMENTS_STORAGE_KEY}:quarantine:2026-06-15T00:00:00.000Z-abc123`;
    storage.set(quarantineKey, JSON.stringify({ corrupt: true }));
    storage.set('mobile:appearance', JSON.stringify({ version: 1, mode: 'night' }));

    wipeLocalData(storage);

    expect(storage.get(quarantineKey)).toBeNull(); // reached via getAllKeys enumeration
    expect(storage.get('mobile:appearance')).toBeNull();
    expect(storage.getAllKeys?.()).toEqual([]);
  });
});
