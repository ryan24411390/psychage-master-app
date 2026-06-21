import { describe, expect, it } from 'vitest';
import type { Storage } from '@/lib/adapters/storage';
import {
  addItem,
  bookmarkKey,
  loadBookmarks,
  MAX_BOOKMARKS,
  migrate,
  removeItem,
  type StoredBookmark,
  STORAGE_KEY,
} from '@/features/bookmarks/store';

function stored(over: Partial<StoredBookmark> = {}): StoredBookmark {
  return { resource_type: 'article', resource_id: 'a', savedAt: '2026-06-21T00:00:00.000Z', ...over };
}

/** Map-backed Storage double (the persistence pattern: inject, don't touch the singleton). */
function fakeStorage(seed: Record<string, string> = {}): Storage & { map: Map<string, string> } {
  const map = new Map(Object.entries(seed));
  return {
    map,
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
  };
}

const NOW = '2026-06-21T12:00:00.000Z';

describe('bookmarks migrate (SR-13)', () => {
  it('seeds to an empty list', () => {
    expect(migrate(null)).toEqual({ version: 1, items: [] });
  });

  it('reseeds on corrupt / non-object / missing-or-future version / non-array items', () => {
    expect(migrate('nope')).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ items: [stored()] }))).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ version: 2, items: [stored()] }))).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ version: 1, items: 'x' }))).toEqual(migrate(null));
  });

  it('drops malformed items, dedupes by (type,id), caps to MAX_BOOKMARKS', () => {
    const items = [
      stored({ resource_id: 'a' }),
      stored({ resource_id: 'a' }), // dupe (same type+id)
      { resource_type: 'article' }, // no resource_id
      { resource_type: 'nope', resource_id: 'x' }, // bad type
      stored({ resource_type: 'provider', resource_id: 'a' }), // same id, different type → kept
    ];
    const out = migrate(JSON.stringify({ version: 1, items }));
    expect(out.items.map(bookmarkKey)).toEqual(['article:a', 'provider:a']);
    expect(out.items.length).toBeLessThanOrEqual(MAX_BOOKMARKS);
  });
});

describe('bookmarks pure transforms', () => {
  it('addItem prepends (newest-first) and is idempotent per (type,id)', () => {
    const a = addItem([], { resource_type: 'article', resource_id: 'a' }, NOW);
    expect(a.map(bookmarkKey)).toEqual(['article:a']);
    const b = addItem(a, { resource_type: 'article', resource_id: 'b' }, NOW);
    expect(b.map(bookmarkKey)).toEqual(['article:b', 'article:a']);
    const dupe = addItem(b, { resource_type: 'article', resource_id: 'a' }, NOW);
    expect(dupe.map(bookmarkKey)).toEqual(['article:b', 'article:a']);
  });

  it('addItem does not mutate its input', () => {
    const prev = addItem([], { resource_type: 'tool', resource_id: 'clarity' }, NOW);
    addItem(prev, { resource_type: 'tool', resource_id: 'mood-journal' }, NOW);
    expect(prev.map(bookmarkKey)).toEqual(['tool:clarity']);
  });

  it('removeItem drops the matching (type,id), no-op when absent', () => {
    const prev = addItem(
      addItem([], { resource_type: 'article', resource_id: 'a' }, NOW),
      { resource_type: 'provider', resource_id: 'a' },
      NOW,
    );
    expect(removeItem(prev, { resource_type: 'article', resource_id: 'a' }).map(bookmarkKey)).toEqual([
      'provider:a',
    ]);
    expect(removeItem(prev, { resource_type: 'article', resource_id: 'zzz' })).toHaveLength(2);
  });
});

describe('loadBookmarks (DI read → migrate → write-back)', () => {
  it('seeds + persists a normalized blob on first read', () => {
    const s = fakeStorage();
    expect(loadBookmarks(s)).toEqual({ version: 1, items: [] });
    expect(s.get(STORAGE_KEY)).toBe(JSON.stringify({ version: 1, items: [] }));
  });

  it('round-trips a saved set', () => {
    const blob = JSON.stringify({ version: 1, items: [stored({ resource_id: 'x' })] });
    const out = loadBookmarks(fakeStorage({ [STORAGE_KEY]: blob }));
    expect(out.items.map(bookmarkKey)).toEqual(['article:x']);
  });
});
