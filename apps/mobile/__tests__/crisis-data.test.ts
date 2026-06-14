import { describe, expect, it } from 'vitest';

import bundleJson from '@/data/crisis/crisis-bundle.json';
import type { CrisisBundle } from '@/data/crisis/crisis-bundle.types';
import type { Storage } from '@/lib/adapters/storage';
import { CrisisStore } from '@/lib/crisis/store';

const bundle = bundleJson as CrisisBundle;
const CACHE_KEY = 'mobile:crisis-cache';

function makeStorage(seed?: Record<string, string>): { storage: Storage; map: Map<string, string> } {
  const map = new Map<string, string>(seed ? Object.entries(seed) : []);
  const storage: Storage = {
    get: (key) => map.get(key) ?? null,
    set: (key, value) => {
      map.set(key, value);
    },
    remove: (key) => {
      map.delete(key);
    },
  };
  return { storage, map };
}

const offlineFetcher = () => Promise.resolve(null);

describe('crisis bundle (committed offline floor)', () => {
  it('carries only verified rows — no verification_status field leaks', () => {
    expect(bundle.helplines.length).toBeGreaterThan(0);
    for (const h of bundle.helplines) {
      expect(Object.keys(h).sort()).toEqual(
        ['callNumber', 'description', 'displayOrder', 'name', 'region', 'textCapable', 'textNumber'].sort(),
      );
    }
  });

  it('excludes countries whose only helplines are non-verified (NO, MA, EG)', () => {
    // Norway has a needs_verification line; Morocco/Egypt are do_not_publish.
    for (const iso of ['NO', 'MA', 'EG']) {
      expect(bundle.helplines.filter((h) => h.region === iso)).toHaveLength(0);
    }
  });

  it('every helpline region maps to a known country', () => {
    const known = new Set(bundle.countries.map((c) => c.iso2));
    for (const h of bundle.helplines) expect(known.has(h.region)).toBe(true);
  });
});

describe('CrisisStore.getResources (offline — bundle floor)', () => {
  it('returns US verified helplines including text-capable 988', () => {
    const { storage } = makeStorage();
    const store = new CrisisStore({ storage, bundle, fetchVerified: offlineFetcher });

    const us = store.getResources('US');
    expect(us.hasVerifiedHelplines).toBe(true);
    expect(us.helplines.length).toBeGreaterThanOrEqual(2);
    const nineEightEight = us.helplines.find((h) => h.callNumber === '988');
    expect(nineEightEight?.textCapable).toBe(true);
    // text-only line preserved (callNumber null, textNumber set) — the 6-field shape
    const textOnly = us.helplines.find((h) => h.callNumber === null);
    expect(textOnly?.textNumber).toBeTruthy();
  });

  it('returns AU resources offline (no network)', () => {
    const { storage } = makeStorage();
    const store = new CrisisStore({ storage, bundle, fetchVerified: offlineFetcher });

    const au = store.getResources('au'); // lower-case normalizes
    expect(au.hasVerifiedHelplines).toBe(true);
    expect(au.helplines.length).toBeGreaterThanOrEqual(1);
    expect(au.helplines.every((h) => h.region === 'AU')).toBe(true);
  });

  it('returns the gap state for a country with no verified helplines (ET)', () => {
    const { storage } = makeStorage();
    const store = new CrisisStore({ storage, bundle, fetchVerified: offlineFetcher });

    const et = store.getResources('ET');
    expect(et.hasVerifiedHelplines).toBe(false);
    expect(et.helplines).toEqual([]);
    expect(et.emergencyNumber).toBe('907');
  });

  it('returns an empty set for an unknown country', () => {
    const { storage } = makeStorage();
    const store = new CrisisStore({ storage, bundle, fetchVerified: offlineFetcher });

    expect(store.getResources('ZZ')).toEqual({
      emergencyNumber: '',
      emergencyNote: null,
      hasVerifiedHelplines: false,
      helplines: [],
    });
  });
});

describe('CrisisStore.listCountries', () => {
  it('lists every country, name-sorted, including gap-state ones', () => {
    const { storage } = makeStorage();
    const store = new CrisisStore({ storage, bundle, fetchVerified: offlineFetcher });

    const list = store.listCountries();
    expect(list.length).toBe(bundle.countries.length);
    expect(list.find((c) => c.iso2 === 'ET')).toEqual({ iso2: 'ET', name: 'Ethiopia' });
    const names = list.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('CrisisStore.refresh (MMKV cache path)', () => {
  const freshBundle: CrisisBundle = {
    generated: '2099-01-01T00:00:00.000Z',
    countries: [{ iso2: 'US', name: 'United States', emergencyNumber: '911', emergencyNote: null, hasVerifiedHelplines: true }],
    helplines: [
      { region: 'US', name: 'Fresh Line', description: 'Updated verified line', callNumber: '111', textCapable: false, textNumber: null, displayOrder: 1 },
    ],
  };

  it('writes the fetched dataset to MMKV and serves it on next read', async () => {
    const { storage, map } = makeStorage();
    const store = new CrisisStore({ storage, bundle, fetchVerified: () => Promise.resolve(freshBundle) });

    const ok = await store.refresh();
    expect(ok).toBe(true);
    expect(map.has(CACHE_KEY)).toBe(true);

    const us = store.getResources('US');
    expect(us.helplines).toHaveLength(1);
    expect(us.helplines[0]?.name).toBe('Fresh Line');
  });

  it('returns false and keeps existing data when offline', async () => {
    const { storage, map } = makeStorage();
    const store = new CrisisStore({ storage, bundle, fetchVerified: offlineFetcher });

    const ok = await store.refresh();
    expect(ok).toBe(false);
    expect(map.has(CACHE_KEY)).toBe(false);
    // still serves the bundle floor
    expect(store.getResources('US').hasVerifiedHelplines).toBe(true);
  });

  it('discards a corrupt/poison cache and falls back to the bundle (uses .remove)', () => {
    const { storage, map } = makeStorage({ [CACHE_KEY]: 'not-json{{' });
    const store = new CrisisStore({ storage, bundle, fetchVerified: offlineFetcher });

    const us = store.getResources('US');
    expect(us.hasVerifiedHelplines).toBe(true); // served from floor
    expect(map.has(CACHE_KEY)).toBe(false); // poison removed
  });

  it('ignores a version-incompatible cache and falls back to the bundle', () => {
    const stale = JSON.stringify({ version: 999, bundle: freshBundle });
    const { storage, map } = makeStorage({ [CACHE_KEY]: stale });
    const store = new CrisisStore({ storage, bundle, fetchVerified: offlineFetcher });

    // Falls back to the real committed bundle (which has >1 US line), not the stale one.
    expect(store.getResources('US').helplines.length).toBeGreaterThanOrEqual(2);
    expect(map.has(CACHE_KEY)).toBe(false);
  });
});
