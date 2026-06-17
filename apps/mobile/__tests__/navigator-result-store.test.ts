import { describe, expect, it } from 'vitest';

import type { NavigatorResults, UserSymptomInput } from '@psychage/shared/navigator';
import {
  NAVIGATOR_HISTORY_CAP,
  NAVIGATOR_QUARANTINE_PREFIX,
  NAVIGATOR_SCHEMA_VERSION,
  NAVIGATOR_STORAGE_KEY,
  NavigatorResultStore,
} from '@/features/navigator/result-store';
import type { Storage } from '@/lib/adapters/storage';

// LOCAL-ONLY history (SR-4): the store writes to the injected seam and nowhere else.
// Crisis-halt runs are filtered out by the CALLER (NavigatorFlow), not here.

function makeStorage(seed?: Record<string, string>) {
  const map = new Map<string, string>(seed ? Object.entries(seed) : []);
  const storage: Storage = {
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
  };
  return { storage, map };
}

function makeIds() {
  let n = 0;
  return () => `id-${++n}`;
}

const FIXED = new Date('2026-06-15T09:30:00Z');

function setup(seed?: Record<string, string>) {
  const { storage, map } = makeStorage(seed);
  const store = new NavigatorResultStore({ storage, now: () => FIXED, generateId: makeIds() });
  return { store, map };
}

const INPUTS: UserSymptomInput[] = [{ symptom_id: 'low_mood', severity: 6 }];

function results(timestamp = '2026-06-15T09:30:00.000Z'): NavigatorResults {
  return {
    safety: {
      has_crisis: false,
      has_urgent: false,
      has_watch: false,
      highest_level: null,
      flags: [],
      should_halt: false,
      crisis_resources: [],
    },
    results: [],
    general_recommendations: [],
    disclaimer: 'Educational only.',
    version: '1.0',
    timestamp,
  };
}

describe('save / getRecent', () => {
  it('stamps id + local date and keeps inputs, results and the engine timestamp', () => {
    const { store } = setup();
    const snap = store.save(INPUTS, results());
    expect(snap.id).toBe('id-1');
    expect(snap.date).toBe('2026-06-15');
    expect(snap.createdAt).toBe('2026-06-15T09:30:00.000Z');
    expect(snap.inputs).toEqual(INPUTS);
    expect(snap.results.disclaimer).toBe('Educational only.');
  });

  it('getRecent returns newest first', () => {
    const { store } = setup();
    store.save(INPUTS, results('2026-06-10T00:00:00.000Z'));
    store.save(INPUTS, results('2026-06-12T00:00:00.000Z'));
    expect(store.getRecent(10).map((s) => s.createdAt)).toEqual([
      '2026-06-12T00:00:00.000Z',
      '2026-06-10T00:00:00.000Z',
    ]);
  });

  it('getRecent(0) / negative returns []', () => {
    const { store } = setup();
    store.save(INPUTS, results());
    expect(store.getRecent(0)).toEqual([]);
    expect(store.getRecent(-1)).toEqual([]);
  });

  it('caps history at NAVIGATOR_HISTORY_CAP (newest retained)', () => {
    const { store } = setup();
    for (let i = 0; i < NAVIGATOR_HISTORY_CAP + 5; i++) {
      store.save(INPUTS, results(`2026-01-01T00:00:${String(i).padStart(2, '0')}.000Z`));
    }
    expect(store.count).toBe(NAVIGATOR_HISTORY_CAP);
  });

  it('persists under the documented key + schema version', () => {
    const { store, map } = setup();
    store.save(INPUTS, results());
    const raw = map.get(NAVIGATOR_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).version).toBe(NAVIGATOR_SCHEMA_VERSION);
  });
});

describe('corruption handling', () => {
  it('quarantines an unparseable blob and recovers empty', () => {
    const { store, map } = setup({ [NAVIGATOR_STORAGE_KEY]: '{not json' });
    expect(store.count).toBe(0);
    const quarantined = [...map.keys()].some((k) => k.startsWith(NAVIGATOR_QUARANTINE_PREFIX));
    expect(quarantined).toBe(true);
  });

  it('drops malformed entries but keeps valid ones', () => {
    const good = {
      id: 'g1',
      date: '2026-06-15',
      createdAt: '2026-06-15T09:30:00.000Z',
      inputs: INPUTS,
      results: results(),
    };
    const seed = {
      [NAVIGATOR_STORAGE_KEY]: JSON.stringify({
        version: NAVIGATOR_SCHEMA_VERSION,
        entries: [good, { id: 'bad' }],
      }),
    };
    const { store } = setup(seed);
    expect(store.count).toBe(1);
    expect(store.getRecent(1)[0]?.id).toBe('g1');
  });
});
