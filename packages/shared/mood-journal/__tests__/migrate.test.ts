// Mood Journal migrator contract — mirrors check-in/__tests__/migrate.test.ts.
// User-data doctrine: never silently lose a moment. Anomalies carry the raw blob +
// a best-effort recovered subset; valid blobs pass through clean. Unlike check-in,
// many moments may share a day (no one-per-day collapse).

import { describe, expect, it } from 'vitest';

import { migrate, normalizeMoments, SCHEMA_VERSION, serialize } from '../migrate';
import type { MomentEntry } from '../types';

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

function envelope(entries: unknown[]): string {
  return JSON.stringify({ version: SCHEMA_VERSION, entries });
}

describe('migrate', () => {
  it('treats null (no data) as a clean empty store', () => {
    const out = migrate(null);
    expect(out.status).toBe('clean');
    expect(out.value).toEqual({ version: SCHEMA_VERSION, entries: [] });
  });

  it('passes a valid envelope through clean', () => {
    const out = migrate(envelope([moment()]));
    expect(out.status).toBe('clean');
    expect(out.value.entries).toHaveLength(1);
  });

  it('keeps MULTIPLE moments on the same day (no one-per-day collapse)', () => {
    const a = moment({ id: 'm-1', createdAt: '2026-06-16T09:00:00.000Z' });
    const b = moment({ id: 'm-2', createdAt: '2026-06-16T18:00:00.000Z' });
    const out = migrate(envelope([a, b]));
    expect(out.status).toBe('clean');
    expect(out.value.entries.map((e) => e.id)).toEqual(['m-1', 'm-2']);
  });

  it('sorts entries by createdAt ascending', () => {
    const late = moment({ id: 'm-late', createdAt: '2026-06-16T20:00:00.000Z' });
    const early = moment({ id: 'm-early', createdAt: '2026-06-16T06:00:00.000Z' });
    const out = migrate(envelope([late, early]));
    expect(out.value.entries.map((e) => e.id)).toEqual(['m-early', 'm-late']);
  });

  it('dedupes duplicate tags within a moment SILENTLY (still clean, not an anomaly)', () => {
    const out = migrate(
      envelope([moment({ emotions: ['Calm', 'Calm', 'Happy'], triggers: ['Work', 'Work'] })]),
    );
    expect(out.status).toBe('clean');
    expect(out.value.entries[0]?.emotions).toEqual(['Calm', 'Happy']);
    expect(out.value.entries[0]?.triggers).toEqual(['Work']);
  });

  it('drops a malformed moment and quarantines the raw (anomaly, valid subset kept)', () => {
    const raw = envelope([moment({ id: 'good' }), { id: 'bad' /* missing fields */ }]);
    const out = migrate(raw);
    expect(out.status).toBe('anomaly');
    if (out.status !== 'anomaly') return;
    expect(out.reason).toBe('malformed-entries');
    expect(out.raw).toBe(raw);
    expect(out.value.entries.map((e) => e.id)).toEqual(['good']);
  });

  it('drops a moment carrying a tag outside the preset vocabulary', () => {
    const out = migrate(envelope([moment({ triggers: ['NotARealTrigger'] as never })]));
    expect(out.status).toBe('anomaly');
    expect(out.value.entries).toHaveLength(0);
  });

  it('drops a moment whose note exceeds NOTE_MAX_LENGTH', () => {
    const out = migrate(envelope([moment({ note: 'x'.repeat(281) })]));
    expect(out.status).toBe('anomaly');
    expect(out.value.entries).toHaveLength(0);
  });

  it('drops a moment with no tags at all', () => {
    const out = migrate(envelope([moment({ emotions: [], triggers: [] })]));
    expect(out.status).toBe('anomaly');
    expect(out.value.entries).toHaveLength(0);
  });

  it('flags corrupt JSON', () => {
    const out = migrate('{not json');
    expect(out).toMatchObject({ status: 'anomaly', reason: 'corrupt-json' });
  });

  it('flags a non-object payload', () => {
    const out = migrate('123');
    expect(out).toMatchObject({ status: 'anomaly', reason: 'not-an-object' });
  });

  it('flags a missing version', () => {
    const out = migrate(JSON.stringify({ entries: [] }));
    expect(out).toMatchObject({ status: 'anomaly', reason: 'missing-version' });
  });

  it('preserves a future-version blob rather than discarding it', () => {
    const out = migrate(JSON.stringify({ version: SCHEMA_VERSION + 1, entries: [] }));
    expect(out).toMatchObject({ status: 'anomaly', reason: 'future-version' });
  });

  it('quarantines an older version with no migration path', () => {
    const out = migrate(JSON.stringify({ version: 0, entries: [] }));
    expect(out).toMatchObject({ status: 'anomaly', reason: 'no-migration-path' });
  });

  it('round-trips through serialize → migrate', () => {
    const first = migrate(envelope([moment({ id: 'm-2', createdAt: '2026-06-16T18:00:00.000Z' }), moment({ id: 'm-1' })]));
    const again = migrate(serialize(first.value));
    expect(again.status).toBe('clean');
    expect(again.value).toEqual(first.value);
  });
});

describe('normalizeMoments', () => {
  it('returns dropped:true for a non-array payload', () => {
    expect(normalizeMoments('nope')).toEqual({ entries: [], dropped: true });
  });
});
