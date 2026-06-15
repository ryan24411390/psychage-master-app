// CheckInRecordStore behavioral contract — the six Verification points plus the
// edges that protect the S3↔S4 boundary. Structure follows
// apps/mobile/__tests__/tier-flags-persistence.test.ts: a Map-backed in-memory
// Storage, deterministic injected clock + id factory (so no device, no real
// clock, no real RNG), asserting both the returned value AND what was persisted.

import { describe, expect, it } from 'vitest';

import { toLocalCalendarDate } from '../dates';
import { QUARANTINE_KEY_PREFIX, SCHEMA_VERSION, STORAGE_KEY } from '../migrate';
import { CheckInRecordStore } from '../record-store';
import {
  type CheckInState,
  CheckInEntryNotFoundError,
  CheckInValidationError,
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
  return {
    now: () => current,
    set: (d) => {
      current = d;
    },
  };
}

function makeIds(prefix = 'id'): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `${prefix}-${n}`;
  };
}

const TUE = new Date(2026, 5, 16, 9, 0); // 2026-06-16
const WED = new Date(2026, 5, 17, 9, 0); // 2026-06-17

function setup(seed?: Record<string, string>, initialClock: Date = TUE) {
  const { storage, map } = makeStorage(seed);
  const clock = makeClock(initialClock);
  const store = new CheckInRecordStore({ storage, now: clock.now, generateId: makeIds() });
  return { store, clock, map, storage };
}

function persistedEntries(map: Map<string, string>): unknown[] {
  const raw = map.get(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as { entries: unknown[] }).entries : [];
}

// ── Verification #1 + #6: same-day re-save overwrites; one entry per day ──────
describe('saveToday — same-day re-save overwrites (Verification #1, #6)', () => {
  it('a second save on the same day edits in place — never a second entry', () => {
    const { store, map } = setup();

    const first = store.saveToday(2, 'morning');
    const second = store.saveToday(4, 'evening');

    expect(store.getRecent(10)).toHaveLength(1);
    expect(persistedEntries(map)).toHaveLength(1);

    // Same-day re-save is an EDIT: id + date preserved, state/note overwritten.
    expect(second.id).toBe(first.id);
    expect(second.date).toBe(first.date);
    expect(store.getToday()).toMatchObject({ state: 4, note: 'evening' });
  });

  it('holds one-entry-per-day across many days', () => {
    const { store, clock, map } = setup();

    store.saveToday(1); // TUE
    clock.set(WED);
    store.saveToday(2);
    clock.set(new Date(2026, 5, 18, 9, 0)); // THU
    store.saveToday(3);
    store.saveToday(0); // re-save THU → still one THU entry

    expect(store.getRecent(10)).toHaveLength(3);
    expect(persistedEntries(map)).toHaveLength(3);
  });
});

// ── Verification #2: midnight crossing ───────────────────────────────────────
describe('saveToday — midnight crossing (Verification #2)', () => {
  it('a check-in at 00:30 lands on the NEW local calendar day', () => {
    const { store, clock, map } = setup({}, new Date(2026, 5, 16, 23, 30)); // TUE 23:30

    const tue = store.saveToday(1);
    expect(tue.date).toBe('2026-06-16');

    clock.set(new Date(2026, 5, 17, 0, 30)); // WED 00:30 — 30 min later
    const wed = store.saveToday(3);
    expect(wed.date).toBe('2026-06-17');

    // Two distinct days, both retained; getToday tracks the clock.
    expect(store.getRecent(10)).toHaveLength(2);
    expect(persistedEntries(map)).toHaveLength(2);
    expect(store.getToday()?.date).toBe('2026-06-17');
    expect(store.getEntry(tue.id)?.date).toBe('2026-06-16');
  });

  it('keys to the LOCAL day, not the UTC day, under a non-UTC zone (UTC-regression guard)', () => {
    // End-to-end Date Rule 1 through the store. A timestamp-only/getUTC* regression
    // would file this 00:30-local check-in under the previous (UTC) day.
    const original = process.env.TZ;
    try {
      process.env.TZ = 'Asia/Kolkata'; // UTC+5:30 → 00:30 local is the previous day in UTC
      const instant = new Date(2026, 5, 17, 0, 30);
      expect(instant.getUTCDate()).not.toBe(instant.getDate()); // precondition: days diverge
      const { storage } = makeStorage();
      const store = new CheckInRecordStore({ storage, now: () => instant, generateId: makeIds() });
      expect(store.saveToday(2).date).toBe('2026-06-17'); // local day, not UTC's 2026-06-16
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
});

// ── Verification #3: editing a past entry does not re-date it ─────────────────
describe('editEntry — never re-dates (Verification #3)', () => {
  it('editing Tuesday on Wednesday keeps it on Tuesday', () => {
    const { store, clock } = setup();

    const tue = store.saveToday(2, 'tue note'); // 2026-06-16
    clock.set(WED);
    store.saveToday(1); // create Wednesday's entry

    const edited = store.editEntry(tue.id, 4, 'edited on wed');

    expect(edited.id).toBe(tue.id);
    expect(edited.date).toBe('2026-06-16'); // unchanged, not Wednesday
    expect(edited.state).toBe(4);
    expect(edited.note).toBe('edited on wed');

    // The stored entry is still on Tuesday; Wednesday's entry is untouched.
    expect(store.getEntry(tue.id)?.date).toBe('2026-06-16');
    expect(store.getToday()?.date).toBe('2026-06-17');
    expect(store.getRecent(10)).toHaveLength(2);
  });

  it('throws CheckInEntryNotFoundError for an unknown id', () => {
    const { store } = setup();
    expect(() => store.editEntry('nope', 2)).toThrow(CheckInEntryNotFoundError);
  });
});

// ── Verification #4: note maxlength ───────────────────────────────────────────
describe('note maxlength enforcement (Verification #4)', () => {
  it('accepts exactly 24 characters', () => {
    const { store } = setup();
    const note = 'x'.repeat(24);
    expect(store.saveToday(2, note).note).toBe(note);
  });

  it('rejects 25 characters on both saveToday and editEntry — fails loud, no truncation', () => {
    const { store } = setup();
    const tooLong = 'x'.repeat(25);

    expect(() => store.saveToday(2, tooLong)).toThrow(CheckInValidationError);

    const entry = store.saveToday(2, 'ok');
    expect(() => store.editEntry(entry.id, 3, tooLong)).toThrow(CheckInValidationError);
    // The rejected write left the stored note unchanged.
    expect(store.getEntry(entry.id)?.note).toBe('ok');
  });
});

// ── state validation ─────────────────────────────────────────────────────────
describe('state validation', () => {
  it('rejects out-of-range and non-integer states', () => {
    const { store } = setup();
    expect(() => store.saveToday(5 as CheckInState)).toThrow(CheckInValidationError);
    expect(() => store.saveToday(-1 as CheckInState)).toThrow(CheckInValidationError);
    expect(() => store.saveToday(2.5 as CheckInState)).toThrow(CheckInValidationError);
    expect(store.getRecent(10)).toHaveLength(0); // nothing persisted
  });
});

// ── overwrite semantics: omitting note clears it ─────────────────────────────
describe('overwrite semantics', () => {
  it('re-saving today without a note clears the existing note (overwrite, not merge)', () => {
    const { store } = setup();
    store.saveToday(2, 'had a note');
    const cleared = store.saveToday(3);
    expect(cleared).not.toHaveProperty('note');
    expect(store.getToday()).not.toHaveProperty('note');
  });

  it('editEntry without a note clears the existing note (overwrite, not merge — and still no re-date)', () => {
    const { store } = setup();
    const entry = store.saveToday(2, 'had a note');
    const edited = store.editEntry(entry.id, 3);
    expect(edited).not.toHaveProperty('note');
    expect(store.getEntry(entry.id)).not.toHaveProperty('note');
    expect(store.getEntry(entry.id)?.state).toBe(3);
    expect(store.getEntry(entry.id)?.date).toBe(entry.date);
  });
});

// ── reads ────────────────────────────────────────────────────────────────────
describe('reads', () => {
  it('getEntry returns undefined for an unknown id', () => {
    const { store } = setup();
    expect(store.getEntry('missing')).toBeUndefined();
  });

  it('getToday returns undefined when today has no entry', () => {
    const { store, clock } = setup();
    store.saveToday(2); // TUE
    clock.set(WED);
    expect(store.getToday()).toBeUndefined();
  });

  it('getRecent returns newest-first, respects n, and returns [] for n <= 0', () => {
    const { store, clock } = setup();
    const a = store.saveToday(1); // TUE
    clock.set(WED);
    const b = store.saveToday(2); // WED
    clock.set(new Date(2026, 5, 18, 9, 0)); // THU
    const c = store.saveToday(3);

    expect(store.getRecent(2).map((e) => e.id)).toEqual([c.id, b.id]);
    expect(store.getRecent(99).map((e) => e.id)).toEqual([c.id, b.id, a.id]);
    expect(store.getRecent(0)).toEqual([]);
    expect(store.getRecent(-1)).toEqual([]);
  });

  it('getRange is inclusive of both bounds, oldest-first', () => {
    const { store, clock } = setup();
    store.saveToday(1); // 06-16
    clock.set(WED);
    store.saveToday(2); // 06-17
    clock.set(new Date(2026, 5, 18, 9, 0));
    store.saveToday(3); // 06-18

    const range = store.getRange(
      toLocalCalendarDate(new Date(2026, 5, 16)),
      toLocalCalendarDate(new Date(2026, 5, 17)),
    );
    expect(range.map((e) => e.date)).toEqual(['2026-06-16', '2026-06-17']);
  });

  it('getRange with inverted bounds (from > to) returns []', () => {
    const { store, clock } = setup();
    store.saveToday(1); // 06-16
    clock.set(WED);
    store.saveToday(2); // 06-17
    const reversed = store.getRange(
      toLocalCalendarDate(new Date(2026, 5, 18)),
      toLocalCalendarDate(new Date(2026, 5, 15)),
    );
    expect(reversed).toEqual([]);
  });

  it('returns defensive copies — a returned entry cannot mutate stored state', () => {
    const { store } = setup();
    store.saveToday(2, 'note');
    expect(store.getToday()).not.toBe(store.getToday()); // fresh object each read
    expect(store.getToday()).toEqual(store.getToday()); // but equal by value
  });
});

// ── persistence round-trip (Verification #5, integration) ────────────────────
describe('persistence round-trip — tier-flags pattern (Verification #5)', () => {
  it('a fresh store seeds and persists a v1 envelope with reminderSightings 0', () => {
    const { store, map } = setup();
    expect(store.reminderSightings).toBe(0);
    const envelope = JSON.parse(map.get(STORAGE_KEY) as string);
    expect(envelope).toEqual({ version: SCHEMA_VERSION, reminderSightings: 0, entries: [] });
  });

  it('entries written by one store instance are read back by a second on the same storage', () => {
    const { storage, map, clock } = setup();
    // First instance writes across two days.
    const s1 = new CheckInRecordStore({ storage, now: clock.now, generateId: makeIds('a') });
    const tue = s1.saveToday(2, 'persisted');
    clock.set(WED);
    s1.saveToday(4);

    // Second instance hydrates purely from storage.
    const s2 = new CheckInRecordStore({ storage, now: clock.now, generateId: makeIds('b') });
    expect(s2.getRecent(10)).toHaveLength(2);
    expect(s2.getEntry(tue.id)).toMatchObject({ date: '2026-06-16', state: 2, note: 'persisted' });
    expect(s2.lastAnomaly).toBeNull();

    // LOCAL-ONLY: nothing was written outside the single check-in key.
    expect([...map.keys()]).toEqual([STORAGE_KEY]);
  });

  it('a state-0 entry (the falsy floor of the scale) survives the round-trip', () => {
    const { storage, clock } = setup();
    const s1 = new CheckInRecordStore({ storage, now: clock.now, generateId: makeIds('z') });
    const zero = s1.saveToday(0, 'flat');
    expect(zero.state).toBe(0);

    const s2 = new CheckInRecordStore({ storage, now: clock.now, generateId: makeIds('y') });
    expect(s2.getEntry(zero.id)).toMatchObject({ state: 0, note: 'flat' });
  });
});

// ── anomaly quarantine (user-data policy, integration) ───────────────────────
describe('anomaly handling — quarantine, never silently reseed', () => {
  it('corrupt JSON is preserved under a quarantine key; the store recovers empty and re-stamps clean', () => {
    const { store, map, storage } = setup({ [STORAGE_KEY]: '{not json' });

    expect(store.lastAnomaly).not.toBeNull();
    expect(store.lastAnomaly?.reason).toBe('corrupt-json');
    expect(store.getRecent(10)).toEqual([]);

    // The raw blob is preserved verbatim — nothing the user wrote is lost.
    const qKey = store.lastAnomaly?.quarantineKey as string;
    expect(qKey.startsWith(QUARANTINE_KEY_PREFIX)).toBe(true);
    expect(map.get(qKey)).toBe('{not json');

    // Primary key was reset to a clean envelope, so a second store on the same
    // storage loads cleanly and does not re-quarantine the same blob.
    const reopened = new CheckInRecordStore({ storage, now: () => TUE, generateId: makeIds() });
    expect(reopened.lastAnomaly).toBeNull();
    expect(map.get(qKey)).toBe('{not json'); // quarantine still preserved
  });

  it('malformed entries are partially recovered while the raw blob is quarantined', () => {
    const blob = JSON.stringify({
      version: 1,
      reminderSightings: 0,
      entries: [
        { id: 'good', date: '2026-06-16', state: 2 },
        { id: 'bad', date: 'xxxx', state: 9 },
      ],
    });
    const { store, map } = setup({ [STORAGE_KEY]: blob });

    expect(store.lastAnomaly?.reason).toBe('malformed-entries');
    expect(store.lastAnomaly?.recoveredEntryCount).toBe(1);
    expect(store.getRecent(10).map((e) => e.id)).toEqual(['good']);
    expect(map.get(store.lastAnomaly?.quarantineKey as string)).toBe(blob);
  });

  it('a future-version blob is quarantined, not discarded', () => {
    const blob = JSON.stringify({ version: 2, reminderSightings: 0, entries: [] });
    const { store, map } = setup({ [STORAGE_KEY]: blob });
    expect(store.lastAnomaly?.reason).toBe('future-version');
    expect(map.get(store.lastAnomaly?.quarantineKey as string)).toBe(blob);
  });
});
