import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import {
  TOOLKIT_PROGRESS_QUARANTINE_PREFIX,
  TOOLKIT_PROGRESS_SCHEMA_VERSION,
  TOOLKIT_PROGRESS_STORAGE_KEY,
  ToolkitProgressStore,
} from '@/features/toolkits/progress-store';

function makeStorage(seed?: Record<string, string>) {
  const map = new Map<string, string>(Object.entries(seed ?? {}));
  const storage: Storage = {
    get: (k) => map.get(k) ?? null,
    set: (k, v) => {
      map.set(k, v);
    },
    remove: (k) => {
      map.delete(k);
    },
    getAllKeys: () => [...map.keys()],
  };
  return { storage, map };
}

// Clock that advances 1s per call so timestamps are distinct + deterministic.
function makeClock(startIso = '2026-06-15T10:00:00.000Z') {
  let ms = Date.parse(startIso);
  return () => {
    ms += 1000;
    return new Date(ms);
  };
}

function makeStore(seed?: Record<string, string>) {
  const { storage, map } = makeStorage(seed);
  let n = 0;
  const store = new ToolkitProgressStore({
    storage,
    now: makeClock(),
    generateId: () => `q${++n}`,
  });
  return { store, storage, map };
}

describe('ToolkitProgressStore', () => {
  it('records the first open and is idempotent on the opened timestamp', () => {
    const { store } = makeStore();
    const first = store.markOpened('tk', 'i1');
    expect(first.openedAt).not.toBeNull();
    const second = store.markOpened('tk', 'i1');
    expect(second.openedAt).toBe(first.openedAt); // unchanged
  });

  it('toggles done and clears it', () => {
    const { store } = makeStore();
    expect(store.setDone('tk', 'i1', true).completedAt).not.toBeNull();
    expect(store.setDone('tk', 'i1', false).completedAt).toBeNull();
  });

  it('sets and clears the self-rating', () => {
    const { store } = makeStore();
    expect(store.setRating('tk', 'i1', 'a_little').selfRating).toBe('a_little');
    expect(store.setRating('tk', 'i1', null).selfRating).toBeNull();
  });

  it('getForToolkit returns only the requested toolkit, keyed by item id', () => {
    const { store } = makeStore();
    store.setDone('tkA', 'a1', true);
    store.setRating('tkB', 'b1', 'not_yet');
    const a = store.getForToolkit('tkA');
    expect(Object.keys(a)).toEqual(['a1']);
    expect(a.a1?.completed_at).not.toBeNull();
    expect(store.getForToolkit('tkB').b1?.self_rating).toBe('not_yet');
  });

  it('persists across reconstruction (survives an app restart)', () => {
    const { store, storage } = makeStore();
    store.setDone('tk', 'i1', true);

    const reborn = new ToolkitProgressStore({
      storage,
      now: makeClock(),
      generateId: () => 'q',
    });
    expect(reborn.getForToolkit('tk').i1?.completed_at).not.toBeNull();
  });

  it('quarantines a corrupt blob and recovers empty (never silently loses)', () => {
    const { store, map } = makeStore({ [TOOLKIT_PROGRESS_STORAGE_KEY]: '{not json' });
    expect(store.getForToolkit('tk')).toEqual({});
    const quarantined = [...map.keys()].filter((k) =>
      k.startsWith(TOOLKIT_PROGRESS_QUARANTINE_PREFIX),
    );
    expect(quarantined).toHaveLength(1);
    expect(map.get(quarantined[0] as string)).toBe('{not json');
  });

  it('quarantines a future-version blob', () => {
    const future = JSON.stringify({ version: TOOLKIT_PROGRESS_SCHEMA_VERSION + 1, items: {} });
    const { map } = makeStore({ [TOOLKIT_PROGRESS_STORAGE_KEY]: future });
    expect(
      [...map.keys()].some((k) => k.startsWith(TOOLKIT_PROGRESS_QUARANTINE_PREFIX)),
    ).toBe(true);
  });

  it('loads a valid persisted blob', () => {
    const valid = JSON.stringify({
      version: TOOLKIT_PROGRESS_SCHEMA_VERSION,
      items: {
        i1: {
          toolkitId: 'tk',
          itemId: 'i1',
          openedAt: '2026-06-15T10:00:00.000Z',
          completedAt: null,
          selfRating: 'a_little',
          updatedAt: '2026-06-15T10:00:00.000Z',
        },
      },
    });
    const { store } = makeStore({ [TOOLKIT_PROGRESS_STORAGE_KEY]: valid });
    expect(store.getForToolkit('tk').i1?.self_rating).toBe('a_little');
  });
});
