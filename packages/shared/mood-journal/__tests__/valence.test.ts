// Valence — the optional 1–10 pleasantness rating added in schema v2. Covers the
// additive migration (v1 moments survive, unrated), fail-loud store validation, and
// the descriptive pattern helpers (valenceTrend / streakSummary). Mood stays a
// LOCAL-ONLY moment field (SR-4); these helpers only COUNT and AVERAGE — never score
// or diagnose (SR-3).

import { describe, expect, it } from 'vitest';

import { migrate, SCHEMA_VERSION, serialize } from '../migrate';
import { MoodJournalStore } from '../moment-store';
import { streakSummary, valenceTrend } from '../patterns';
import {
  isValence,
  type MomentEntry,
  type MomentInput,
  MomentValidationError,
  type Storage,
  VALENCE_MAX,
  VALENCE_MIN,
} from '../types';

function moment(overrides: Partial<MomentEntry> = {}): MomentEntry {
  return {
    id: 'm-1',
    date: '2026-06-16' as MomentEntry['date'],
    createdAt: '2026-06-16T09:00:00.000Z',
    emotions: ['Calm'],
    triggers: ['Work'],
    ...overrides,
  };
}

function makeStore() {
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
  let n = 0;
  const generateId = () => {
    n += 1;
    return `id-${n}`;
  };
  const store = new MoodJournalStore({
    storage,
    now: () => new Date(2026, 5, 16, 9, 0),
    generateId,
  });
  return { store, map };
}

const input = (over: Partial<MomentInput> = {}): MomentInput => ({
  emotions: ['Calm'],
  triggers: ['Work'],
  ...over,
});

describe('isValence', () => {
  it('accepts integers in [VALENCE_MIN, VALENCE_MAX]', () => {
    expect(isValence(VALENCE_MIN)).toBe(true);
    expect(isValence(VALENCE_MAX)).toBe(true);
    expect(isValence(5)).toBe(true);
  });
  it('rejects out-of-range, non-integer, and non-number values', () => {
    expect(isValence(0)).toBe(false);
    expect(isValence(11)).toBe(false);
    expect(isValence(5.5)).toBe(false);
    expect(isValence('5')).toBe(false);
    expect(isValence(undefined)).toBe(false);
    expect(isValence(Number.NaN)).toBe(false);
  });
});

describe('migrate — v1 → v2 (valence is additive)', () => {
  it('migrates a v1 envelope clean, leaving old moments unrated', () => {
    const v1 = JSON.stringify({
      version: 1,
      entries: [{ ...moment() }], // a pre-valence moment
    });
    const out = migrate(v1);
    expect(out.status).toBe('clean');
    expect(out.value.version).toBe(SCHEMA_VERSION);
    expect(out.value.entries).toHaveLength(1);
    expect(out.value.entries[0]?.valence).toBeUndefined();
  });

  it('passes a v2 moment carrying a valid valence through clean', () => {
    const out = migrate(JSON.stringify({ version: SCHEMA_VERSION, entries: [moment({ valence: 7 })] }));
    expect(out.status).toBe('clean');
    expect(out.value.entries[0]?.valence).toBe(7);
  });

  it('quarantines a moment whose valence is out of range', () => {
    const out = migrate(JSON.stringify({ version: SCHEMA_VERSION, entries: [moment({ valence: 99 })] }));
    expect(out.status).toBe('anomaly');
    expect(out.value.entries).toHaveLength(0);
  });

  it('round-trips a valence moment through serialize → migrate', () => {
    const first = migrate(JSON.stringify({ version: SCHEMA_VERSION, entries: [moment({ valence: 6 })] }));
    const again = migrate(serialize(first.value));
    expect(again.status).toBe('clean');
    expect(again.value).toEqual(first.value);
  });
});

describe('MoodJournalStore — valence', () => {
  it('persists and returns a valence when supplied', () => {
    const { store } = makeStore();
    const entry = store.addMoment(input({ valence: 8 }));
    expect(entry.valence).toBe(8);
    expect(store.getEntry(entry.id)?.valence).toBe(8);
  });

  it('omits valence entirely when unrated', () => {
    const { store } = makeStore();
    const entry = store.addMoment(input());
    expect('valence' in entry).toBe(false);
  });

  it('rejects an out-of-range or non-integer valence (fail loud)', () => {
    const { store } = makeStore();
    expect(() => store.addMoment(input({ valence: 0 }))).toThrow(MomentValidationError);
    expect(() => store.addMoment(input({ valence: 11 }))).toThrow(MomentValidationError);
    expect(() => store.addMoment(input({ valence: 4.5 }))).toThrow(MomentValidationError);
  });

  it('editMoment can set or clear the valence', () => {
    const { store } = makeStore();
    const created = store.addMoment(input({ valence: 3 }));
    const rated = store.editMoment(created.id, input({ valence: 9 }));
    expect(rated.valence).toBe(9);
    const cleared = store.editMoment(created.id, input());
    expect('valence' in cleared).toBe(false);
  });
});

describe('valenceTrend', () => {
  it('averages valence per day, ascending, skipping unrated moments and days', () => {
    const moments: MomentEntry[] = [
      moment({ id: 'a', date: '2026-06-14' as MomentEntry['date'], createdAt: '2026-06-14T08:00:00.000Z', valence: 4 }),
      moment({ id: 'b', date: '2026-06-14' as MomentEntry['date'], createdAt: '2026-06-14T20:00:00.000Z', valence: 6 }),
      moment({ id: 'c', date: '2026-06-15' as MomentEntry['date'], createdAt: '2026-06-15T08:00:00.000Z', valence: 8 }),
      moment({ id: 'd', date: '2026-06-16' as MomentEntry['date'], createdAt: '2026-06-16T08:00:00.000Z' }), // unrated → no point
    ];
    expect(valenceTrend(moments)).toEqual([
      { date: '2026-06-14', average: 5, count: 2 },
      { date: '2026-06-15', average: 8, count: 1 },
    ]);
  });

  it('returns [] when nothing is rated', () => {
    expect(valenceTrend([moment()])).toEqual([]);
  });
});

describe('streakSummary', () => {
  it('counts consecutive days ending at the most recent logged day, across a gap', () => {
    const moments: MomentEntry[] = [
      moment({ id: 'old', date: '2026-06-10' as MomentEntry['date'], createdAt: '2026-06-10T08:00:00.000Z' }),
      moment({ id: 'a', date: '2026-06-14' as MomentEntry['date'], createdAt: '2026-06-14T08:00:00.000Z' }),
      moment({ id: 'b', date: '2026-06-15' as MomentEntry['date'], createdAt: '2026-06-15T08:00:00.000Z' }),
      moment({ id: 'c', date: '2026-06-16' as MomentEntry['date'], createdAt: '2026-06-16T08:00:00.000Z' }),
    ];
    const s = streakSummary(moments);
    expect(s.momentsLogged).toBe(4);
    expect(s.daysLogged).toBe(4);
    expect(s.latestStreak).toBe(3); // 06-16, 06-15, 06-14
  });

  it('reports valence direction up / down / steady, and null below two rated days', () => {
    const day = (id: string, date: string, valence?: number) =>
      moment({ id, date: date as MomentEntry['date'], createdAt: `${date}T08:00:00.000Z`, valence });

    expect(streakSummary([day('a', '2026-06-14', 3), day('b', '2026-06-15', 8)]).valenceDirection).toBe('up');
    expect(streakSummary([day('a', '2026-06-14', 8), day('b', '2026-06-15', 3)]).valenceDirection).toBe('down');
    expect(streakSummary([day('a', '2026-06-14', 5), day('b', '2026-06-15', 5)]).valenceDirection).toBe('steady');
    expect(streakSummary([day('a', '2026-06-14', 5)]).valenceDirection).toBeNull();
    expect(streakSummary([day('a', '2026-06-14')]).valenceDirection).toBeNull();
  });

  it('is empty-safe', () => {
    expect(streakSummary([])).toEqual({
      momentsLogged: 0,
      daysLogged: 0,
      latestStreak: 0,
      valenceDirection: null,
    });
  });
});
