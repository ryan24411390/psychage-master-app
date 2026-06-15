// MoodJournalStore behavioral contract. Map-backed in-memory Storage + deterministic
// injected clock/id (no device, no real clock/RNG). Asserts both the returned value
// AND what was persisted. Mirrors check-in/__tests__/record-store.test.ts.

import { describe, expect, it } from 'vitest';

import { QUARANTINE_KEY_PREFIX, SCHEMA_VERSION, STORAGE_KEY } from '../migrate';
import { MoodJournalStore } from '../moment-store';
import {
  type MomentInput,
  MomentNotFoundError,
  MomentValidationError,
  type Storage,
} from '../types';

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

function makeClock(initial: Date): { now: () => Date; set: (d: Date) => void } {
  let current = initial;
  return { now: () => current, set: (d) => { current = d; } };
}

function makeIds(prefix = 'id'): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `${prefix}-${n}`;
  };
}

const TUE = new Date(2026, 5, 16, 9, 0); // 2026-06-16 local
const WED = new Date(2026, 5, 17, 9, 0); // 2026-06-17 local

function setup(seed?: Record<string, string>, initialClock: Date = TUE) {
  const { storage, map } = makeStorage(seed);
  const clock = makeClock(initialClock);
  const store = new MoodJournalStore({ storage, now: clock.now, generateId: makeIds() });
  return { store, clock, map, storage };
}

const input = (over: Partial<MomentInput> = {}): MomentInput => ({
  emotions: ['Calm'],
  triggers: ['Work'],
  ...over,
});

describe('MoodJournalStore — writes', () => {
  it('addMoment dates to the local day at save time and stamps createdAt from the same clock', () => {
    const { store, clock } = setup(undefined, new Date(2026, 5, 17, 0, 30)); // 00:30 local Wed
    const entry = store.addMoment(input({ note: 'rough day' }));
    expect(entry.date).toBe('2026-06-17');
    expect(entry.createdAt).toBe(clock.now().toISOString());
    expect(entry.emotions).toEqual(['Calm']);
    expect(entry.triggers).toEqual(['Work']);
    expect(entry.note).toBe('rough day');
  });

  it('persists a versioned envelope to STORAGE_KEY', () => {
    const { store, map } = setup();
    store.addMoment(input());
    const persisted = JSON.parse(map.get(STORAGE_KEY) ?? '{}');
    expect(persisted.version).toBe(SCHEMA_VERSION);
    expect(persisted.entries).toHaveLength(1);
  });

  it('allows MANY moments on the same day', () => {
    const { store } = setup();
    store.addMoment(input({ emotions: ['Happy'] }));
    store.addMoment(input({ emotions: ['Sad'] }));
    expect(store.getForDay('2026-06-16' as never)).toHaveLength(2);
    expect(store.getAll()).toHaveLength(2);
  });

  it('dedupes duplicate tags on write', () => {
    const { store } = setup();
    const entry = store.addMoment(input({ emotions: ['Calm', 'Calm', 'Happy'] }));
    expect(entry.emotions).toEqual(['Calm', 'Happy']);
  });

  it('editMoment overwrites tags/note but never re-dates (id/date/createdAt immutable)', () => {
    const { store, clock } = setup();
    const created = store.addMoment(input({ note: 'first' }));
    clock.set(WED); // a day later
    const edited = store.editMoment(created.id, input({ emotions: ['Happy'], triggers: ['Sleep'], note: 'second' }));
    expect(edited.id).toBe(created.id);
    expect(edited.date).toBe(created.date); // still Tuesday
    expect(edited.createdAt).toBe(created.createdAt);
    expect(edited.emotions).toEqual(['Happy']);
    expect(edited.triggers).toEqual(['Sleep']);
    expect(edited.note).toBe('second');
    expect(store.getAll()).toHaveLength(1); // edit is not a new moment
  });

  it('editMoment throws MomentNotFoundError for an unknown id', () => {
    const { store } = setup();
    expect(() => store.editMoment('nope', input())).toThrow(MomentNotFoundError);
  });

  it('deleteMoment removes the moment; unknown id throws', () => {
    const { store } = setup();
    const a = store.addMoment(input());
    store.addMoment(input({ emotions: ['Sad'] }));
    store.deleteMoment(a.id);
    expect(store.getEntry(a.id)).toBeUndefined();
    expect(store.getAll()).toHaveLength(1);
    expect(() => store.deleteMoment('nope')).toThrow(MomentNotFoundError);
  });
});

describe('MoodJournalStore — validation (fail loud)', () => {
  it('rejects a moment with no tags at all', () => {
    const { store } = setup();
    expect(() => store.addMoment({ emotions: [], triggers: [] })).toThrow(MomentValidationError);
  });

  it('rejects an unknown tag', () => {
    const { store } = setup();
    expect(() => store.addMoment(input({ triggers: ['Nope'] as never }))).toThrow(MomentValidationError);
  });

  it('rejects an over-length note', () => {
    const { store } = setup();
    expect(() => store.addMoment(input({ note: 'x'.repeat(281) }))).toThrow(MomentValidationError);
  });
});

describe('MoodJournalStore — reads', () => {
  it('getRecent returns newest first; getRange filters inclusively oldest-first; inverted bounds ⇒ []', () => {
    const { store, clock } = setup();
    clock.set(new Date(2026, 5, 14, 9, 0)); // Sun 06-14
    const sun = store.addMoment(input());
    clock.set(new Date(2026, 5, 16, 9, 0)); // Tue 06-16
    const tue = store.addMoment(input({ emotions: ['Happy'] }));

    expect(store.getRecent(2).map((m) => m.id)).toEqual([tue.id, sun.id]);
    expect(store.getRecent(0)).toEqual([]);
    expect(store.getRange('2026-06-14' as never, '2026-06-16' as never).map((m) => m.id)).toEqual([sun.id, tue.id]);
    expect(store.getRange('2026-06-15' as never, '2026-06-16' as never).map((m) => m.id)).toEqual([tue.id]);
    expect(store.getRange('2026-06-16' as never, '2026-06-14' as never)).toEqual([]);
  });

  it('returns clones — mutating a read result does not corrupt the store', () => {
    const { store } = setup();
    const created = store.addMoment(input());
    const read = store.getEntry(created.id);
    read?.emotions.push('Angry');
    expect(store.getEntry(created.id)?.emotions).toEqual(['Calm']);
  });
});

describe('MoodJournalStore — load anomalies', () => {
  it('quarantines a corrupt blob and surfaces the anomaly, recovering empty', () => {
    const { store, map } = setup({ [STORAGE_KEY]: '{not json' });
    expect(store.getAll()).toEqual([]);
    expect(store.lastAnomaly?.reason).toBe('corrupt-json');
    const quarantined = [...map.keys()].filter((k) => k.startsWith(QUARANTINE_KEY_PREFIX));
    expect(quarantined).toHaveLength(1);
    expect(map.get(quarantined[0] as string)).toBe('{not json');
  });

  it('recovers the valid subset when some moments are malformed', () => {
    const good = {
      id: 'good',
      date: '2026-06-16',
      createdAt: '2026-06-16T09:00:00.000Z',
      emotions: ['Calm'],
      triggers: ['Work'],
    };
    const seed = JSON.stringify({ version: SCHEMA_VERSION, entries: [good, { id: 'bad' }] });
    const { store } = setup({ [STORAGE_KEY]: seed });
    expect(store.getAll().map((m) => m.id)).toEqual(['good']);
    expect(store.lastAnomaly?.reason).toBe('malformed-entries');
  });
});
