// Schema migrator unit contract (Verification #5, pure layer). Structure copied
// from apps/mobile/__tests__/tier-flags-persistence.test.ts — but the POLICY is
// inverted: tier flags reseed on anomaly (derived data); check-ins quarantine
// (user data). Each anomaly case asserts the raw blob is carried out for
// preservation, never discarded.

import { describe, expect, it } from 'vitest';

import {
  migrate,
  normalizeEntries,
  SCHEMA_VERSION,
  serialize,
} from '../migrate';

const VALID_ENTRY = { id: 'a', date: '2026-06-16', state: 2 };
const VALID_ENTRY_2 = { id: 'b', date: '2026-06-17', state: 4, note: 'hi' };

describe('migrate — clean loads', () => {
  it('null (no data) → clean empty store at SCHEMA_VERSION, reminderSightings 0', () => {
    const outcome = migrate(null);
    expect(outcome.status).toBe('clean');
    expect(outcome.value).toEqual({ version: SCHEMA_VERSION, reminderSightings: 0, entries: [] });
  });

  it('valid v1 envelope → clean pass-through, entries sorted ascending', () => {
    const raw = serialize({
      version: 1,
      reminderSightings: 0,
      // intentionally out of order to prove the migrator canonicalizes
      entries: [VALID_ENTRY_2, VALID_ENTRY] as never,
    });
    const outcome = migrate(raw);
    expect(outcome.status).toBe('clean');
    expect(outcome.value.entries.map((e) => e.date)).toEqual(['2026-06-16', '2026-06-17']);
  });

  it('reminderSightings persists at 0 for fresh, and a written value round-trips (forward-compat)', () => {
    expect(migrate(null).value.reminderSightings).toBe(0);

    const raw = serialize({ version: 1, reminderSightings: 7, entries: [VALID_ENTRY] as never });
    const outcome = migrate(raw);
    expect(outcome.status).toBe('clean');
    expect(outcome.value.reminderSightings).toBe(7);
  });

  it('a non-integer / negative reminderSightings is sanitized to 0 without anomaly', () => {
    const raw = JSON.stringify({ version: 1, reminderSightings: -3, entries: [VALID_ENTRY] });
    const outcome = migrate(raw);
    expect(outcome.status).toBe('clean');
    expect(outcome.value.reminderSightings).toBe(0);
  });

  it('a state-0 entry migrates cleanly — the falsy floor is preserved, not dropped', () => {
    const raw = JSON.stringify({
      version: 1,
      reminderSightings: 0,
      entries: [{ id: 'z', date: '2026-06-16', state: 0 }],
    });
    const outcome = migrate(raw);
    expect(outcome.status).toBe('clean');
    expect(outcome.value.entries).toEqual([{ id: 'z', date: '2026-06-16', state: 0 }]);
  });
});

describe('migrate — anomalies preserve the raw blob (quarantine policy)', () => {
  it('corrupt JSON → anomaly, raw carried verbatim, empty recovered store', () => {
    const raw = '{not json';
    const outcome = migrate(raw);
    expect(outcome).toMatchObject({ status: 'anomaly', reason: 'corrupt-json', raw });
    expect(outcome.value.entries).toEqual([]);
  });

  it('missing/non-number version → anomaly', () => {
    expect(migrate(JSON.stringify({ entries: [] }))).toMatchObject({
      status: 'anomaly',
      reason: 'missing-version',
    });
  });

  it('future version (v2) → anomaly (downgrade preserves, never discards)', () => {
    const raw = JSON.stringify({ version: 2, reminderSightings: 0, entries: [VALID_ENTRY] });
    expect(migrate(raw)).toMatchObject({ status: 'anomaly', reason: 'future-version', raw });
  });

  it('older version with no migration path → anomaly', () => {
    const raw = JSON.stringify({ version: 0, entries: [] });
    expect(migrate(raw)).toMatchObject({ status: 'anomaly', reason: 'no-migration-path', raw });
  });

  it('a malformed entry → anomaly, valid entries recovered, raw preserved', () => {
    const raw = JSON.stringify({
      version: 1,
      reminderSightings: 0,
      entries: [VALID_ENTRY, { id: 'x', date: 'not-a-date', state: 2 }],
    });
    const outcome = migrate(raw);
    expect(outcome).toMatchObject({ status: 'anomaly', reason: 'malformed-entries', raw });
    expect(outcome.value.entries).toHaveLength(1);
    expect(outcome.value.entries[0].id).toBe('a');
  });

  it('an over-length note in a persisted entry is rejected as malformed', () => {
    const raw = JSON.stringify({
      version: 1,
      reminderSightings: 0,
      entries: [{ id: 'a', date: '2026-06-16', state: 2, note: 'x'.repeat(25) }],
    });
    expect(migrate(raw)).toMatchObject({ status: 'anomaly', reason: 'malformed-entries' });
  });

  it('the persisted-layer state guard rejects >4, <0, and non-integer (valid dates isolate the cause)', () => {
    // Each bad entry has a VALID, distinct date, so rejection is attributable to
    // state alone — proving the second enforcement site (isValidEntry) actually fires.
    const raw = JSON.stringify({
      version: 1,
      reminderSightings: 0,
      entries: [
        { id: 'ok', date: '2026-06-16', state: 2 },
        { id: 'hi', date: '2026-06-17', state: 7 },
        { id: 'lo', date: '2026-06-18', state: -1 },
        { id: 'frac', date: '2026-06-19', state: 2.5 },
      ],
    });
    const outcome = migrate(raw);
    expect(outcome).toMatchObject({ status: 'anomaly', reason: 'malformed-entries', raw });
    expect(outcome.value.entries.map((e) => e.id)).toEqual(['ok']);
  });
});

describe('normalizeEntries', () => {
  it('collapses duplicate calendar days (last wins) and flags dropped', () => {
    const { entries, dropped } = normalizeEntries([
      { id: 'a', date: '2026-06-16', state: 1 },
      { id: 'b', date: '2026-06-16', state: 4 },
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('b');
    expect(dropped).toBe(true);
  });

  it('drops unknown keys and omits an absent note in the canonical entry', () => {
    const { entries, dropped } = normalizeEntries([
      { id: 'a', date: '2026-06-16', state: 1, junk: true },
    ]);
    expect(dropped).toBe(false);
    expect(entries[0]).toEqual({ id: 'a', date: '2026-06-16', state: 1 });
    expect(entries[0]).not.toHaveProperty('note');
    expect(entries[0]).not.toHaveProperty('junk');
  });

  it('non-array input → empty + dropped', () => {
    expect(normalizeEntries('nope')).toEqual({ entries: [], dropped: true });
  });
});
