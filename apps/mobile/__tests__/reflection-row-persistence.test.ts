// Reflection-row dismissal persistence + SR-13 versioned-migrator proof.
//
// Exercises isReflectionRowOpened + markReflectionRowOpened + migrate against a local
// in-memory Storage (NOT the @/lib/adapters/storage singleton). Proves the row is
// one-time (opened survives reload), and that — being derived UI state — it reseeds to
// opened:false on any anomaly rather than throwing (the tier-flags reference policy,
// the OPPOSITE of the check-in store's quarantine-don't-lose policy for user data).

import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import {
  isReflectionRowOpened,
  markReflectionRowOpened,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from '@/lib/persistence/reflection-row';

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

describe('reflection-row dismissal — SR-13 versioned migrator', () => {
  it('no data → opened:false, stamps a clean v1 envelope', () => {
    const storage = makeStorage();

    expect(isReflectionRowOpened(storage)).toBe(false);
    expect(JSON.parse(storage.get(STORAGE_KEY) as string)).toEqual({
      version: SCHEMA_VERSION,
      opened: false,
    });
  });

  it('markReflectionRowOpened persists opened:true and survives reload (one-time, permanent)', () => {
    const storage = makeStorage();

    markReflectionRowOpened(storage);

    expect(JSON.parse(storage.get(STORAGE_KEY) as string)).toEqual({
      version: SCHEMA_VERSION,
      opened: true,
    });
    expect(isReflectionRowOpened(storage)).toBe(true);
  });

  it('a v1 opened:true envelope passes through unchanged', () => {
    const storage = makeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, opened: true }) });
    expect(isReflectionRowOpened(storage)).toBe(true);
  });
});

describe('reflection-row dismissal — anomaly recovery (reseed, never throws)', () => {
  it('corrupt JSON → reseeds opened:false, persists v1', () => {
    const storage = makeStorage({ [STORAGE_KEY]: '{not json' });

    let opened: boolean | undefined;
    expect(() => {
      opened = isReflectionRowOpened(storage);
    }).not.toThrow();

    expect(opened).toBe(false);
    expect(JSON.parse(storage.get(STORAGE_KEY) as string)).toEqual({
      version: SCHEMA_VERSION,
      opened: false,
    });
  });

  it('future version (v2) → reseeds opened:false, persists v1', () => {
    const storage = makeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 2, opened: true }) });

    expect(isReflectionRowOpened(storage)).toBe(false);
    expect(JSON.parse(storage.get(STORAGE_KEY) as string)).toEqual({
      version: SCHEMA_VERSION,
      opened: false,
    });
  });

  it('missing version → reseeds opened:false', () => {
    const storage = makeStorage({ [STORAGE_KEY]: JSON.stringify({ opened: true }) });
    expect(isReflectionRowOpened(storage)).toBe(false);
  });
});
