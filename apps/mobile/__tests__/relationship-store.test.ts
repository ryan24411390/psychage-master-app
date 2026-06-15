import { describe, expect, it } from 'vitest';

import { QUESTIONS } from '@/features/relationship-health/questions';
import { computeResult } from '@/features/relationship-health/scoring';
import { RelationshipResultStore, type Storage } from '@/features/relationship-health/result-store';
import { SCHEMA_VERSION, STORAGE_KEY } from '@/features/relationship-health/migrate';

function makeStorage() {
  const map = new Map<string, string>();
  const storage: Storage = {
    get: (k) => map.get(k) ?? null,
    set: (k, v) => {
      map.set(k, v);
    },
    remove: (k) => {
      map.delete(k);
    },
  };
  return { map, storage };
}

// Each now() call advances one second → save order is reflected in createdAt.
function makeClock() {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 5, 15, 0, 0, tick++));
}

function makeIds() {
  let n = 0;
  return () => `rh_${n++}`;
}

function computed() {
  const a: Record<string, number> = {};
  for (const q of QUESTIONS) a[q.id] = 3;
  return computeResult(a, false);
}

describe('RelationshipResultStore — persistence', () => {
  it('stamps id + createdAt on save and returns newest first', () => {
    const { storage } = makeStorage();
    const store = new RelationshipResultStore({ storage, now: makeClock(), generateId: makeIds() });

    const a = store.saveResult(computed());
    const b = store.saveResult(computed());

    expect(a.id).toBe('rh_0');
    expect(b.id).toBe('rh_1');
    expect(a.createdAt).not.toBe(b.createdAt);

    const history = store.loadHistory();
    expect(history).toHaveLength(2);
    expect(history[0]?.id).toBe('rh_1'); // newest first
    expect(history[1]?.id).toBe('rh_0');
  });

  it('reads back a result by id and deletes it', () => {
    const { storage } = makeStorage();
    const store = new RelationshipResultStore({ storage, now: makeClock(), generateId: makeIds() });
    const a = store.saveResult(computed());

    expect(store.getResult(a.id)?.id).toBe(a.id);
    const remaining = store.deleteResult(a.id);
    expect(remaining).toHaveLength(0);
    expect(store.getResult(a.id)).toBeUndefined();
  });

  it('persists across store instances sharing the same storage', () => {
    const { storage } = makeStorage();
    const store1 = new RelationshipResultStore({ storage, now: makeClock(), generateId: makeIds() });
    store1.saveResult(computed());
    store1.saveResult(computed());

    const store2 = new RelationshipResultStore({ storage, now: makeClock(), generateId: makeIds() });
    expect(store2.loadHistory()).toHaveLength(2);
    expect(store2.lastAnomaly).toBeNull();
  });

  it('writes only to the relationship-health key (no network, local-only)', () => {
    const { map, storage } = makeStorage();
    const store = new RelationshipResultStore({ storage, now: makeClock(), generateId: makeIds() });
    store.saveResult(computed());
    expect([...map.keys()]).toEqual([STORAGE_KEY]);
  });

  it('clearHistory empties the store', () => {
    const { storage } = makeStorage();
    const store = new RelationshipResultStore({ storage, now: makeClock(), generateId: makeIds() });
    store.saveResult(computed());
    store.clearHistory();
    expect(store.loadHistory()).toHaveLength(0);
  });
});

describe('RelationshipResultStore — migrator & quarantine', () => {
  it('quarantines corrupt JSON and recovers an empty store', () => {
    const { map, storage } = makeStorage();
    map.set(STORAGE_KEY, '{not valid json');
    const store = new RelationshipResultStore({ storage, now: makeClock(), generateId: makeIds() });

    expect(store.loadHistory()).toHaveLength(0);
    expect(store.lastAnomaly?.reason).toBe('corrupt-json');
    const quarantined = [...map.keys()].find((k) => k.includes(':quarantine:'));
    expect(quarantined).toBeTruthy();
    expect(map.get(quarantined as string)).toBe('{not valid json');
  });

  it('quarantines a future schema version', () => {
    const { storage, map } = makeStorage();
    map.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION + 1, results: [] }));
    const store = new RelationshipResultStore({ storage, now: makeClock(), generateId: makeIds() });
    expect(store.lastAnomaly?.reason).toBe('future-version');
  });

  it('recovers valid results and quarantines when one is malformed', () => {
    const { map, storage } = makeStorage();
    // First, get one genuinely-valid persisted result.
    const seed = new RelationshipResultStore({ storage, now: makeClock(), generateId: makeIds() });
    const good = seed.saveResult(computed());

    // Now hand-write an envelope mixing the good result with a garbage one.
    map.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, results: [good, { id: 'x' }] }));
    const store = new RelationshipResultStore({ storage, now: makeClock(), generateId: makeIds() });

    expect(store.lastAnomaly?.reason).toBe('malformed-results');
    expect(store.loadHistory()).toHaveLength(1);
    expect(store.loadHistory()[0]?.id).toBe(good.id);
  });
});
