// Persistence + SR-13 versioned-migrator proof.
//
// Exercises `loadTierFlags` + `migrate` against a local in-memory Storage
// (does NOT import the `@/lib/adapters/storage` singleton — keeps the
// seam test's storage state untouched). Three load-bearing assertions:
//
//   1. No data  → default-seed { 1..6: true } at SCHEMA_VERSION 1.
//   2. v1 data  → pass-through unchanged; version stamp preserved.
//   3. v0 blob  → transform expands legacy `{ enabled: false }` into
//      per-tier `{ 1..6: false }` and stamps version 1.

import { describe, it, expect } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  loadTierFlags,
} from '@/lib/persistence/tier-flags';

function makeStorage(seed?: Record<string, string>): Storage {
  const store = new Map<string, string>(seed ? Object.entries(seed) : []);
  return {
    get: (key) => store.get(key) ?? null,
    set: (key, value) => {
      store.set(key, value);
    },
    remove: (key) => {
      store.delete(key);
    },
  };
}

describe('tier-flags persistence — SR-13 versioned migrator', () => {
  it('no data → default-seeds { 1..6: true } at SCHEMA_VERSION', () => {
    const storage = makeStorage();

    const flags = loadTierFlags(storage);

    expect(flags).toEqual({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true });

    const stamped = storage.get(STORAGE_KEY);
    expect(stamped).not.toBeNull();
    expect(JSON.parse(stamped as string)).toEqual({
      version: SCHEMA_VERSION,
      data: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true },
    });
  });

  it('v1 envelope → returned unchanged; version stamp preserved', () => {
    const original = {
      version: 1,
      data: { 1: true, 2: false, 3: true, 4: false, 5: true, 6: true },
    };
    const storage = makeStorage({ [STORAGE_KEY]: JSON.stringify(original) });

    const flags = loadTierFlags(storage);

    expect(flags).toEqual(original.data);

    const stamped = storage.get(STORAGE_KEY);
    expect(JSON.parse(stamped as string)).toEqual(original);
  });

  it('v0 blob ({ enabled: false }) → transforms to per-tier { 1..6: false } and stamps v1', () => {
    const legacy = { version: 0, data: { enabled: false } };
    const storage = makeStorage({ [STORAGE_KEY]: JSON.stringify(legacy) });

    const flags = loadTierFlags(storage);

    expect(flags).toEqual({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false });

    const stamped = storage.get(STORAGE_KEY);
    expect(JSON.parse(stamped as string)).toEqual({
      version: SCHEMA_VERSION,
      data: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
    });
  });
});
