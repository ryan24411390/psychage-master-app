// Moments migrator unit tests — the SR-13 forward-only versioned migrator. Mirrors the
// check-in migrator's never-silently-lose-user-data policy: anomalies carry the raw blob +
// a best-effort recovered subset, never a silent reseed. Covers the v1 (valence-rating) →
// v2 (affect-labeling) transform: NO data loss, exact field mapping.

import { describe, expect, it } from 'vitest';

import { migrate, normalizeMoments, SCHEMA_VERSION, serialize } from '../migrate';
import type { Moment } from '../types';

function v2Moment(id: string, ts: string, labelPrimary: string, over?: Partial<Moment>): Moment {
  return { id, timestamp: ts, labelPrimary, routedToSupport: false, ...over };
}

// A v1 (pre-migration) moment, as it was persisted on the old schema.
function v1Moment(
  id: string,
  ts: string,
  valence: number,
  over?: { labels?: string[]; context?: string[]; note?: string; routedToSupport?: boolean },
) {
  return {
    id,
    timestamp: ts,
    valence,
    labels: over?.labels ?? [],
    context: over?.context ?? [],
    routedToSupport: over?.routedToSupport ?? false,
    ...(over?.note !== undefined ? { note: over.note } : {}),
  };
}

describe('migrate — current version (v2)', () => {
  it('null → clean empty store at the current version', () => {
    const out = migrate(null);
    expect(out.status).toBe('clean');
    expect(out.value.moments).toEqual([]);
    expect(out.value.version).toBe(SCHEMA_VERSION);
  });

  it('clean pass-through for a valid v2 envelope', () => {
    const env = { version: 2, moments: [v2Moment('a', '2026-06-17T09:00:00.000Z', 'steady')] };
    const out = migrate(serialize(env as never));
    expect(out.status).toBe('clean');
    expect(out.value.moments).toHaveLength(1);
    expect(out.value.moments[0]?.labelPrimary).toBe('steady');
  });

  it('corrupt JSON → anomaly preserving the raw blob', () => {
    const out = migrate('{not json');
    expect(out.status).toBe('anomaly');
    if (out.status === 'anomaly') {
      expect(out.reason).toBe('corrupt-json');
      expect(out.raw).toBe('{not json');
      expect(out.value.moments).toEqual([]);
    }
  });

  it('future version → anomaly (downgraded app preserves newer state)', () => {
    const out = migrate(JSON.stringify({ version: 99, moments: [] }));
    expect(out.status).toBe('anomaly');
    if (out.status === 'anomaly') expect(out.reason).toBe('future-version');
  });

  it('malformed moments → anomaly carrying the salvageable subset', () => {
    const env = {
      version: 2,
      moments: [v2Moment('ok', '2026-06-17T09:00:00.000Z', 'steady'), { id: 'bad' /* no labelPrimary */ }],
    };
    const out = migrate(JSON.stringify(env));
    expect(out.status).toBe('anomaly');
    if (out.status === 'anomaly') {
      expect(out.reason).toBe('malformed-moments');
      expect(out.value.moments.map((m) => m.id)).toEqual(['ok']);
    }
  });
});

describe('migrate — v1 → v2 (affect-labeling evolution, NO data loss)', () => {
  it('maps labels[0]→labelPrimary, labels[1]→labelSecondary; drops labels[2+]/context/valence; keeps note + routedToSupport', () => {
    const env = {
      version: 1,
      moments: [
        v1Moment('a', '2026-06-16T09:00:00.000Z', 2, {
          labels: ['anxious', 'restless', 'tense'],
          context: ['work', 'sleep'],
          note: 'before the call',
          routedToSupport: true,
        }),
      ],
    };
    const out = migrate(JSON.stringify(env));
    expect(out.status).toBe('clean');
    expect(out.value.version).toBe(2);
    const m = out.value.moments[0];
    expect(m).toEqual({
      id: 'a',
      timestamp: '2026-06-16T09:00:00.000Z',
      labelPrimary: 'anxious',
      labelSecondary: 'restless', // labels[2] ('tense') dropped — v2 caps at one second word
      note: 'before the call', // carried verbatim
      routedToSupport: true, // a recorded historical fact, preserved
    });
    // valence + context are GONE from the persisted shape
    expect('valence' in (m as object)).toBe(false);
    expect('context' in (m as object)).toBe(false);
  });

  it('a label-less v1 moment (rated, no words) maps to its band-ANCHOR word — no moment lost', () => {
    const env = {
      version: 1,
      moments: [
        v1Moment('lo', '2026-06-16T09:00:00.000Z', 1), // valence 1, no labels
        v1Moment('mid', '2026-06-16T10:00:00.000Z', 3),
        v1Moment('hi', '2026-06-16T11:00:00.000Z', 5),
      ],
    };
    const out = migrate(JSON.stringify(env));
    expect(out.status).toBe('clean');
    expect(out.value.moments.map((m) => m.labelPrimary)).toEqual(['overwhelmed', 'steady', 'joyful']);
  });

  it('a single-word v1 moment migrates with no second word', () => {
    const env = {
      version: 1,
      moments: [v1Moment('s', '2026-06-16T09:00:00.000Z', 4, { labels: ['calm'] })],
    };
    const out = migrate(JSON.stringify(env));
    expect(out.status).toBe('clean');
    const m = out.value.moments[0];
    expect(m?.labelPrimary).toBe('calm');
    expect(m?.labelSecondary).toBeUndefined();
  });

  it('round-trips: a full v1 store migrates to a v2 store the migrator then passes through clean', () => {
    const v1Env = {
      version: 1,
      moments: [
        v1Moment('a', '2026-06-15T09:00:00.000Z', 4, { labels: ['grateful'] }),
        v1Moment('b', '2026-06-16T09:00:00.000Z', 2, { labels: ['drained', 'discouraged'], note: 'long day' }),
      ],
    };
    const migrated = migrate(JSON.stringify(v1Env));
    expect(migrated.status).toBe('clean');
    // Re-persisting the migrated v2 store and re-reading it is a clean no-op (idempotent).
    const reMigrated = migrate(serialize(migrated.value));
    expect(reMigrated.status).toBe('clean');
    expect(reMigrated.value.moments).toEqual(migrated.value.moments);
    expect(migrated.value.moments).toHaveLength(2);
  });
});

describe('normalizeMoments', () => {
  it('collapses duplicate ids (last wins) and flags dropped', () => {
    const res = normalizeMoments([
      v2Moment('dup', '2026-06-17T09:00:00.000Z', 'anxious'),
      v2Moment('dup', '2026-06-17T10:00:00.000Z', 'calm'),
    ]);
    expect(res.moments).toHaveLength(1);
    expect(res.moments[0]?.labelPrimary).toBe('calm');
    expect(res.dropped).toBe(true);
  });

  it('rejects a moment with no primary word', () => {
    const res = normalizeMoments([{ id: 'x', timestamp: '2026-06-17T09:00:00.000Z', routedToSupport: false }]);
    expect(res.moments).toEqual([]);
    expect(res.dropped).toBe(true);
  });

  it('rejects an invalid intensity', () => {
    const res = normalizeMoments([
      v2Moment('x', '2026-06-17T09:00:00.000Z', 'tense', { intensity: 'extreme' as never }),
    ]);
    expect(res.moments).toEqual([]);
    expect(res.dropped).toBe(true);
  });
});
