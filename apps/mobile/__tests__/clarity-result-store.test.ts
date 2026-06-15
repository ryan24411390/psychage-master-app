import { describe, expect, it } from 'vitest';

import {
  CLARITY_HISTORY_CAP,
  CLARITY_QUARANTINE_PREFIX,
  CLARITY_SCHEMA_VERSION,
  CLARITY_STORAGE_KEY,
  ClarityResultStore,
} from '@/features/clarity/result-store';
import type { Storage } from '@/lib/adapters/storage';
import type { ClarityResult } from '@/features/clarity/types';

// LOCAL-ONLY history (SR-4) + versioned forward-only migrator (SR-13). The store
// persists composite/tier/domains ONLY — never the raw answers, which never reach it.

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
  const store = new ClarityResultStore({ storage, now: () => FIXED, generateId: makeIds() });
  return { store, map };
}

const RESULT: ClarityResult = {
  composite: 64,
  tier: 'balanced',
  domains: { emotional: 14, wellbeing: 12, social: 16, stress: 10, functioning: 12 },
  notes: [{ id: 'lonely', text: "You've been feeling disconnected from others lately." }],
  crisis: false,
};

describe('save / getRecent', () => {
  it('save returns a snapshot stamped with id + local date and the kept fields', () => {
    const { store } = setup();
    const snap = store.save(RESULT);
    expect(snap.id).toBe('id-1');
    expect(snap.date).toBe('2026-06-15'); // local calendar day
    expect(snap.composite).toBe(64);
    expect(snap.tier).toBe('balanced');
    expect(snap.domains).toEqual(RESULT.domains);
  });

  it('getRecent returns newest first', () => {
    const { store } = setup();
    store.save({ ...RESULT, composite: 50, tier: 'mixed' });
    store.save({ ...RESULT, composite: 80, tier: 'thriving' });
    const recent = store.getRecent(10);
    expect(recent.map((s) => s.composite)).toEqual([80, 50]);
  });

  it('getRecent(n<=0) returns []', () => {
    const { store } = setup();
    store.save(RESULT);
    expect(store.getRecent(0)).toEqual([]);
    expect(store.getRecent(-1)).toEqual([]);
  });
});

describe('persistence shape (SR-4) — answers / notes / crisis never hit disk', () => {
  it('persisted blob is versioned and carries only composite/tier/domains/id/date', () => {
    const { store, map } = setup();
    store.save(RESULT);
    const raw = map.get(CLARITY_STORAGE_KEY) ?? '';
    const parsed = JSON.parse(raw) as { version: number; entries: unknown[] };
    expect(parsed.version).toBe(CLARITY_SCHEMA_VERSION);
    expect(parsed.entries).toHaveLength(1);
    expect(Object.keys(parsed.entries[0] as object).sort()).toEqual([
      'composite', 'date', 'domains', 'id', 'tier',
    ]);
    // No item-level answer keys, no notes, no crisis flag anywhere in the blob.
    expect(raw).not.toMatch(/"q\d+"/);
    expect(raw).not.toContain('notes');
    expect(raw).not.toContain('crisis');
    expect(raw).not.toContain('disconnected'); // note copy
  });
});

describe('history cap', () => {
  it('keeps at most CLARITY_HISTORY_CAP snapshots (newest retained)', () => {
    const { store } = setup();
    for (let i = 0; i < CLARITY_HISTORY_CAP + 5; i++) {
      store.save({ ...RESULT, composite: i });
    }
    expect(store.count).toBe(CLARITY_HISTORY_CAP);
    // The 5 oldest were dropped; the newest (composite = cap+4) survives at the front.
    expect(store.getRecent(1)[0]?.composite).toBe(CLARITY_HISTORY_CAP + 4);
  });
});

describe('migrator (SR-13) — corrupt / foreign blobs are quarantined, never silently lost', () => {
  it('unparseable JSON → quarantined verbatim, store recovers empty', () => {
    const { store, map } = setup({ [CLARITY_STORAGE_KEY]: '{not json' });
    expect(store.count).toBe(0);
    const quarantined = [...map.keys()].filter((k) => k.startsWith(CLARITY_QUARANTINE_PREFIX));
    expect(quarantined).toHaveLength(1);
    expect(map.get(quarantined[0] ?? '')).toBe('{not json');
    // Primary key was reset to a clean, current-version envelope.
    expect(JSON.parse(map.get(CLARITY_STORAGE_KEY) ?? '{}').version).toBe(CLARITY_SCHEMA_VERSION);
  });

  it('a foreign / future version → quarantined, recovers none', () => {
    const blob = JSON.stringify({ version: 999, entries: [] });
    const { store, map } = setup({ [CLARITY_STORAGE_KEY]: blob });
    expect(store.count).toBe(0);
    expect([...map.keys()].some((k) => k.startsWith(CLARITY_QUARANTINE_PREFIX))).toBe(true);
  });

  it('a valid v1 blob loads cleanly with no quarantine', () => {
    const { store: seedStore, map } = setup();
    seedStore.save(RESULT);
    const blob = map.get(CLARITY_STORAGE_KEY) ?? '';

    const { store, map: map2 } = setup({ [CLARITY_STORAGE_KEY]: blob });
    expect(store.count).toBe(1);
    expect([...map2.keys()].some((k) => k.startsWith(CLARITY_QUARANTINE_PREFIX))).toBe(false);
  });

  it('a blob with one malformed entry recovers the good ones and quarantines the raw', () => {
    const blob = JSON.stringify({
      version: CLARITY_SCHEMA_VERSION,
      entries: [
        { id: 'a', date: '2026-06-01', composite: 50, tier: 'mixed', domains: RESULT.domains },
        { id: 'b', date: 'NOT-A-DATE', composite: 10, tier: 'reachOut', domains: RESULT.domains },
      ],
    });
    const { store, map } = setup({ [CLARITY_STORAGE_KEY]: blob });
    expect(store.count).toBe(1);
    expect(store.getRecent(1)[0]?.id).toBe('a');
    expect([...map.keys()].some((k) => k.startsWith(CLARITY_QUARANTINE_PREFIX))).toBe(true);
  });
});
