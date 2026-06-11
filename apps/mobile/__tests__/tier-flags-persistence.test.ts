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

// Anomaly recovery — reseed-on-anomaly policy (derived data; never throws).
// Each case asserts the recovered state is BOTH returned AND persisted, so the
// next launch reads a clean v1 envelope. This is the reference pattern; copy the
// structure, not the policy (user-data migrators must quarantine, not reseed).
describe('tier-flags persistence — anomaly recovery (reseed/normalize)', () => {
  const ALL_TRUE = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true };

  it('corrupt JSON → reseeds defaults, does not throw, persists v1', () => {
    const storage = makeStorage({ [STORAGE_KEY]: '{not json' });

    let flags: ReturnType<typeof loadTierFlags> | undefined;
    expect(() => {
      flags = loadTierFlags(storage);
    }).not.toThrow();

    expect(flags).toEqual(ALL_TRUE);
    expect(JSON.parse(storage.get(STORAGE_KEY) as string)).toEqual({
      version: SCHEMA_VERSION,
      data: ALL_TRUE,
    });
  });

  it('future version (v2) → reseeds defaults, does not throw, persists v1', () => {
    const future = {
      version: 2,
      data: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
    };
    const storage = makeStorage({ [STORAGE_KEY]: JSON.stringify(future) });

    let flags: ReturnType<typeof loadTierFlags> | undefined;
    expect(() => {
      flags = loadTierFlags(storage);
    }).not.toThrow();

    expect(flags).toEqual(ALL_TRUE);
    expect(JSON.parse(storage.get(STORAGE_KEY) as string)).toEqual({
      version: SCHEMA_VERSION,
      data: ALL_TRUE,
    });
  });

  it('v1 with a missing key → fills missing from default, preserves present keys, persists normalized', () => {
    // tier 3 absent; the rest are valid and must survive (not a full reset).
    const partial = { version: 1, data: { 1: false, 2: true, 4: false, 5: true, 6: false } };
    const storage = makeStorage({ [STORAGE_KEY]: JSON.stringify(partial) });

    const flags = loadTierFlags(storage);

    const normalized = { 1: false, 2: true, 3: true, 4: false, 5: true, 6: false };
    expect(flags).toEqual(normalized);
    expect(JSON.parse(storage.get(STORAGE_KEY) as string)).toEqual({
      version: SCHEMA_VERSION,
      data: normalized,
    });
  });

  it('v1 with an extra key → drops the unknown key, persists a clean shape', () => {
    const extra = {
      version: 1,
      data: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true },
    };
    const storage = makeStorage({ [STORAGE_KEY]: JSON.stringify(extra) });

    const flags = loadTierFlags(storage);

    expect(flags).toEqual(ALL_TRUE);
    expect(flags).not.toHaveProperty('7');
    expect(JSON.parse(storage.get(STORAGE_KEY) as string)).toEqual({
      version: SCHEMA_VERSION,
      data: ALL_TRUE,
    });
  });
});
