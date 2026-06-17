// Moments migrator unit tests — the SR-13 forward-only versioned migrator. Mirrors
// the check-in migrator's never-silently-lose-user-data policy: anomalies carry the
// raw blob + a best-effort recovered subset, never a silent reseed.

import { describe, expect, it } from 'vitest';

import { migrate, normalizeMoments, SCHEMA_VERSION, serialize } from '../migrate';
import type { Moment } from '../types';

function moment(id: string, ts: string, valence: number, over?: Partial<Moment>): Moment {
  return {
    id,
    timestamp: ts,
    valence: valence as Moment['valence'],
    labels: [],
    context: [],
    routedToSupport: false,
    ...over,
  };
}

describe('migrate', () => {
  it('null → clean empty store', () => {
    const out = migrate(null);
    expect(out.status).toBe('clean');
    expect(out.value.moments).toEqual([]);
    expect(out.value.version).toBe(SCHEMA_VERSION);
  });

  it('clean pass-through for a valid v1 envelope', () => {
    const env = { version: 1, moments: [moment('a', '2026-06-17T09:00:00.000Z', 3)] };
    const out = migrate(serialize(env as never));
    expect(out.status).toBe('clean');
    expect(out.value.moments).toHaveLength(1);
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
      version: 1,
      moments: [moment('ok', '2026-06-17T09:00:00.000Z', 3), { id: 'bad', valence: 9 }],
    };
    const out = migrate(JSON.stringify(env));
    expect(out.status).toBe('anomaly');
    if (out.status === 'anomaly') {
      expect(out.reason).toBe('malformed-moments');
      expect(out.value.moments.map((m) => m.id)).toEqual(['ok']);
    }
  });
});

describe('normalizeMoments', () => {
  it('collapses duplicate ids (last wins) and flags dropped', () => {
    const res = normalizeMoments([
      moment('dup', '2026-06-17T09:00:00.000Z', 2),
      moment('dup', '2026-06-17T10:00:00.000Z', 4),
    ]);
    expect(res.moments).toHaveLength(1);
    expect(res.moments[0]?.valence).toBe(4);
    expect(res.dropped).toBe(true);
  });

  it('drops over-cap labels', () => {
    const res = normalizeMoments([moment('x', '2026-06-17T09:00:00.000Z', 3, { labels: ['a', 'b', 'c', 'd'] })]);
    expect(res.moments).toEqual([]);
    expect(res.dropped).toBe(true);
  });
});
