import { describe, expect, it } from 'vitest';

import {
  loadReachedMilestones,
  markMilestonesReached,
  migrate,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from '@/lib/persistence/milestones';

// In-memory Storage double (mirrors the engagement-store test doubles): a Map behind
// the get/set/remove seam. Proves the SR-13 migrator + cumulative-only persistence.
function makeStorage(seed?: Record<string, string>) {
  const map = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    map,
    get: (k: string) => map.get(k) ?? null,
    set: (k: string, v: string) => void map.set(k, v),
    remove: (k: string) => void map.delete(k),
  };
}

describe('milestones persistence — migrate', () => {
  it('seeds empty on a fresh store', () => {
    expect(migrate(null)).toEqual({ version: SCHEMA_VERSION, reached: [] });
  });

  it('reseeds on malformed JSON or wrong shape (never throws)', () => {
    expect(migrate('not json')).toEqual({ version: SCHEMA_VERSION, reached: [] });
    expect(migrate('42')).toEqual({ version: SCHEMA_VERSION, reached: [] });
    expect(migrate('{"version":"x"}')).toEqual({ version: SCHEMA_VERSION, reached: [] });
  });

  it('reseeds on an unknown version', () => {
    expect(migrate(JSON.stringify({ version: 99, reached: [1, 10] }))).toEqual({
      version: SCHEMA_VERSION,
      reached: [],
    });
  });

  it('normalizes a v1 blob: keeps known thresholds, dedups, sorts, drops junk', () => {
    expect(
      migrate(JSON.stringify({ version: 1, reached: [10, 1, 10, 7, 250, 999] })),
    ).toEqual({ version: SCHEMA_VERSION, reached: [1, 10, 250] });
  });
});

describe('milestones persistence — load + mark', () => {
  it('loads empty on a fresh store and writes the canonical seed back', () => {
    const s = makeStorage();
    expect(loadReachedMilestones(s)).toEqual([]);
    expect(s.get(STORAGE_KEY)).toBe(JSON.stringify({ version: SCHEMA_VERSION, reached: [] }));
  });

  it('marks thresholds reached cumulatively, deduped + ascending', () => {
    const s = makeStorage();
    expect(markMilestonesReached(s, [10])).toEqual([10]);
    expect(markMilestonesReached(s, [1])).toEqual([1, 10]);
    // Re-marking an already-reached threshold is a no-op (cumulative, never shrinks).
    expect(markMilestonesReached(s, [10])).toEqual([1, 10]);
    expect(loadReachedMilestones(s)).toEqual([1, 10]);
  });

  it('persists across reads (the set only ever grows)', () => {
    const s = makeStorage();
    markMilestonesReached(s, [1, 10, 30]);
    expect(loadReachedMilestones(makeStorage({ [STORAGE_KEY]: s.get(STORAGE_KEY) as string }))).toEqual([
      1, 10, 30,
    ]);
  });

  it('ignores unknown thresholds on mark', () => {
    const s = makeStorage();
    expect(markMilestonesReached(s, [10, 7, 999])).toEqual([10]);
  });
});
