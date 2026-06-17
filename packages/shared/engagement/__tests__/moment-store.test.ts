// MomentStore unit tests — local-first affect-labeling capture, validation, the presence
// dayRollup, and the merge/restore lane (ingestRemote). No device, no network: Storage is
// an in-memory Map, the clock is a controllable instant, ids are a deterministic counter.

import { describe, expect, it } from 'vitest';

import { asLocalCalendarDate } from '../dates';
import { mergeMoments, MomentStore } from '../moment-store';
import { type Moment, MomentValidationError, NOTE_MAX_LENGTH, type Storage } from '../types';

function mapStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
    },
    remove: (k) => {
      m.delete(k);
    },
  };
}

// Controllable deps: `at` drives the clock; ids are a monotonic counter.
function makeDeps(start = Date.parse('2026-06-17T09:00:00.000Z')) {
  let clock = start;
  let n = 0;
  return {
    deps: {
      storage: mapStorage(),
      now: () => new Date(clock),
      generateId: () => `m${++n}`,
    },
    advance: (ms: number) => {
      clock += ms;
    },
    setClock: (iso: string) => {
      clock = Date.parse(iso);
    },
    setMs: (ms: number) => {
      clock = ms;
    },
  };
}

const HOUR = 3_600_000;

// A local wall-clock instant (ms). Built from local Y/M/D/H so day-grouping tests are
// timezone-independent: callers pick hours safely inside a local day, never near a UTC
// boundary that would drift across midnight in a positive/negative offset.
function localInstant(y: number, m: number, d: number, h: number): number {
  return new Date(y, m - 1, d, h, 0, 0, 0).getTime();
}

describe('append (local-first affect-labeling capture)', () => {
  it('mints id + timestamp and returns the moment immediately', () => {
    const { deps } = makeDeps();
    const store = new MomentStore(deps);
    const m = store.append({ labelPrimary: 'steady' });
    expect(m.id).toBe('m1');
    expect(m.timestamp).toBe('2026-06-17T09:00:00.000Z');
    expect(m.labelPrimary).toBe('steady');
    expect(m.labelSecondary).toBeUndefined();
    expect(m.intensity).toBeUndefined();
    expect(m.routedToSupport).toBe(false);
    expect(m.note).toBeUndefined();
  });

  it('carries the optional second word, intensity, and note', () => {
    const { deps } = makeDeps();
    const store = new MomentStore(deps);
    const m = store.append({
      labelPrimary: 'anxious',
      labelSecondary: 'restless',
      intensity: 'high',
      note: 'before the meeting',
    });
    expect(m).toMatchObject({
      labelPrimary: 'anxious',
      labelSecondary: 'restless',
      intensity: 'high',
      note: 'before the meeting',
    });
  });

  it('is append-only — many per day, never overwrites', () => {
    const { deps, advance } = makeDeps();
    const store = new MomentStore(deps);
    store.append({ labelPrimary: 'anxious' });
    advance(HOUR);
    store.append({ labelPrimary: 'calm' });
    advance(HOUR);
    store.append({ labelPrimary: 'joyful' });
    expect(store.getAll()).toHaveLength(3);
  });

  it('persists so a fresh store over the same storage re-reads it', () => {
    const { deps } = makeDeps();
    const store = new MomentStore(deps);
    store.append({ labelPrimary: 'calm', labelSecondary: 'grateful', note: 'a line' });
    const reopened = new MomentStore(deps); // same storage instance
    const all = reopened.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ labelPrimary: 'calm', labelSecondary: 'grateful', note: 'a line' });
  });

  it('reads are defensive copies — mutating a returned moment does not corrupt the store', () => {
    const { deps } = makeDeps();
    const store = new MomentStore(deps);
    store.append({ labelPrimary: 'steady' });
    const got = store.getRecent(1)[0] as Moment;
    (got as { labelPrimary: string }).labelPrimary = 'injected';
    expect(store.getRecent(1)[0]?.labelPrimary).toBe('steady');
  });
});

describe('validation (fail loud, never clamp)', () => {
  it('rejects a missing primary word (the naming is required)', () => {
    const { deps } = makeDeps();
    const store = new MomentStore(deps);
    expect(() => store.append({ labelPrimary: '' })).toThrow(MomentValidationError);
    // @ts-expect-error — labelPrimary is required by the type; runtime must also reject it.
    expect(() => store.append({})).toThrow(MomentValidationError);
  });

  it('rejects an invalid intensity', () => {
    const { deps } = makeDeps();
    const store = new MomentStore(deps);
    expect(() =>
      // @ts-expect-error — 'extreme' is not a MomentIntensity.
      store.append({ labelPrimary: 'tense', intensity: 'extreme' }),
    ).toThrow(MomentValidationError);
  });

  it('rejects a note over the cap', () => {
    const { deps } = makeDeps();
    const store = new MomentStore(deps);
    expect(() => store.append({ labelPrimary: 'steady', note: 'x'.repeat(NOTE_MAX_LENGTH + 1) })).toThrow(
      MomentValidationError,
    );
  });
});

describe('reads', () => {
  it('getRecent returns newest-first and respects n', () => {
    const { deps, advance } = makeDeps();
    const store = new MomentStore(deps);
    const a = store.append({ labelPrimary: 'overwhelmed' });
    advance(HOUR);
    const b = store.append({ labelPrimary: 'anxious' });
    advance(HOUR);
    const c = store.append({ labelPrimary: 'steady' });
    expect(store.getRecent(2).map((m) => m.id)).toEqual([c.id, b.id]);
    expect(store.getRecent(0)).toEqual([]);
    expect(store.getRecent(-1)).toEqual([]);
    expect(a.id).toBe('m1');
  });

  it('getRange filters by local calendar day inclusive', () => {
    const { deps, setMs } = makeDeps();
    const store = new MomentStore(deps);
    setMs(localInstant(2026, 6, 15, 12));
    store.append({ labelPrimary: 'anxious' });
    setMs(localInstant(2026, 6, 16, 12));
    store.append({ labelPrimary: 'steady' });
    setMs(localInstant(2026, 6, 17, 12));
    store.append({ labelPrimary: 'calm' });
    const mid = store.getRange(asLocalCalendarDate('2026-06-16'), asLocalCalendarDate('2026-06-16'));
    expect(mid).toHaveLength(1);
    expect(mid[0]?.labelPrimary).toBe('steady');
  });
});

describe('dayRollup (event-based → presence bridge)', () => {
  it('groups many moments per day; carries presence + the words named that day', () => {
    const { deps, setMs } = makeDeps();
    const store = new MomentStore(deps);
    // Two moments on local 2026-06-16, one on local 2026-06-17 (all mid-day so they can't
    // cross a UTC midnight).
    setMs(localInstant(2026, 6, 16, 9));
    store.append({ labelPrimary: 'tense', labelSecondary: 'restless' });
    setMs(localInstant(2026, 6, 16, 18));
    store.append({ labelPrimary: 'calm', note: 'better now' });
    setMs(localInstant(2026, 6, 17, 9));
    store.append({ labelPrimary: 'steady' });

    const rollups = store.dayRollup();
    expect(rollups).toHaveLength(2);
    const d16 = rollups[0];
    expect(d16?.date).toBe('2026-06-16');
    expect(d16?.momentCount).toBe(2);
    expect(d16?.hasNote).toBe(true);
    expect(new Set(d16?.labels)).toEqual(new Set(['tense', 'restless', 'calm']));
    expect(rollups[1]?.date).toBe('2026-06-17');
    expect(rollups[1]?.momentCount).toBe(1);
    expect(rollups[1]?.hasNote).toBe(false);
    expect(rollups[1]?.labels).toEqual(['steady']);
  });

  it('honors from/to bounds', () => {
    const { deps, setMs } = makeDeps();
    const store = new MomentStore(deps);
    for (const d of [14, 15, 16]) {
      setMs(localInstant(2026, 6, d, 10));
      store.append({ labelPrimary: 'steady' });
    }
    const out = store.dayRollup(asLocalCalendarDate('2026-06-15'), asLocalCalendarDate('2026-06-16'));
    expect(out.map((r) => r.date)).toEqual(['2026-06-15', '2026-06-16']);
  });
});

describe('mergeMoments (last-write-wins, append-only)', () => {
  function moment(id: string, ts: string, labelPrimary: string): Moment {
    return { id, timestamp: ts, labelPrimary, routedToSupport: false };
  }

  it('unions by id and sorts by timestamp', () => {
    const local = [moment('a', '2026-06-17T09:00:00.000Z', 'steady')];
    const remote = [moment('b', '2026-06-16T09:00:00.000Z', 'anxious')];
    expect(mergeMoments(local, remote).map((m) => m.id)).toEqual(['b', 'a']);
  });

  it('local copy wins on a shared id (local is the source of truth)', () => {
    const local = [moment('a', '2026-06-17T09:00:00.000Z', 'joyful')];
    const remote = [moment('a', '2026-06-17T09:00:00.000Z', 'overwhelmed')];
    expect(mergeMoments(local, remote)).toEqual([local[0]]);
  });
});

describe('ingestRemote (pull/restore — survives reinstall)', () => {
  it('repopulates an empty (freshly reinstalled) store from remote', () => {
    const { deps } = makeDeps();
    const fresh = new MomentStore(deps); // empty local cache, as after reinstall
    expect(fresh.getAll()).toHaveLength(0);
    fresh.ingestRemote([
      { id: 'r1', timestamp: '2026-06-10T09:00:00.000Z', labelPrimary: 'hopeful', routedToSupport: false },
      { id: 'r2', timestamp: '2026-06-11T09:00:00.000Z', labelPrimary: 'drained', routedToSupport: false },
    ]);
    expect(fresh.getAll().map((m) => m.id)).toEqual(['r1', 'r2']);
    // and it persisted — a re-open over the same storage still has them
    const reopened = new MomentStore(deps);
    expect(reopened.getAll()).toHaveLength(2);
  });

  it('merges remote into existing local without dropping local-only moments', () => {
    const { deps } = makeDeps();
    const store = new MomentStore(deps);
    const localMoment = store.append({ labelPrimary: 'steady' }); // id m1
    store.ingestRemote([
      { id: 'remote-1', timestamp: '2026-06-01T09:00:00.000Z', labelPrimary: 'joyful', routedToSupport: false },
    ]);
    expect(store.getAll().map((m) => m.id).sort()).toEqual(['remote-1', localMoment.id].sort());
  });
});

describe('empty / offline resilience', () => {
  it('a fresh store with no storage is empty and does not throw', () => {
    const { deps } = makeDeps();
    const store = new MomentStore(deps);
    expect(store.getAll()).toEqual([]);
    expect(store.getRecent(5)).toEqual([]);
    expect(store.dayRollup()).toEqual([]);
    expect(store.lastAnomaly).toBeNull();
  });
});
