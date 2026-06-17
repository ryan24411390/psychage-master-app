import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import { isTourSeen, markTourSeen, migrateTour, TOUR_STORAGE_KEY } from '@/lib/persistence/tour';

function makeStorage(seed?: Record<string, string>) {
  const map = new Map<string, string>(seed ? Object.entries(seed) : []);
  const storage: Storage = {
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
  };
  return { storage, map };
}

describe('tour-seen flag', () => {
  it('is false on first read and seeds the key', () => {
    const { storage, map } = makeStorage();
    expect(isTourSeen(storage)).toBe(false);
    expect(map.get(TOUR_STORAGE_KEY)).toBe(JSON.stringify({ version: 1, seen: false }));
  });

  it('is true after markTourSeen', () => {
    const { storage } = makeStorage();
    markTourSeen(storage);
    expect(isTourSeen(storage)).toBe(true);
  });

  it('reseeds an anomalous blob instead of throwing', () => {
    const { storage } = makeStorage({ [TOUR_STORAGE_KEY]: '{not json' });
    expect(isTourSeen(storage)).toBe(false);
  });

  it('migrateTour treats an unknown version as unseen', () => {
    expect(migrateTour(JSON.stringify({ version: 99, seen: true }))).toEqual({ version: 1, seen: false });
  });
});
