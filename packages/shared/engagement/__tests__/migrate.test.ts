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
    source: 'today',
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

  it('v1→v2 backfills a missing source to `today` (no data lost)', () => {
    // A genuine v1 moment predates `source`; the migrator must add it, not drop it.
    const v1Moment = { id: 'a', timestamp: '2026-06-17T09:00:00.000Z', valence: 3, labels: [], context: [], routedToSupport: false };
    const out = migrate(JSON.stringify({ version: 1, moments: [v1Moment] }));
    expect(out.status).toBe('clean');
    expect(out.value.version).toBe(SCHEMA_VERSION);
    expect(out.value.moments).toHaveLength(1);
    expect(out.value.moments[0]?.source).toBe('today');
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

  it('keeps labels up to the stored ceiling (folded-in Mood Journal entries)', () => {
    // 12 labels — the closed emotion-tag count a folded-in journal entry may carry —
    // are kept; the capture cap (MAX_LABELS) only bounds fresh writes via `append`.
    const twelve = Array.from({ length: 12 }, (_, i) => `e${i}`);
    const res = normalizeMoments([moment('x', '2026-06-17T09:00:00.000Z', 3, { labels: twelve })]);
    expect(res.moments).toHaveLength(1);
    expect(res.dropped).toBe(false);
  });

  it('drops over-ceiling labels (more than STORED_MAX_LABELS)', () => {
    const thirteen = Array.from({ length: 13 }, (_, i) => `e${i}`);
    const res = normalizeMoments([moment('x', '2026-06-17T09:00:00.000Z', 3, { labels: thirteen })]);
    expect(res.moments).toEqual([]);
    expect(res.dropped).toBe(true);
  });
});
