// Mood Journal → Moments fold (P42–P44). Injected in-memory Storage + a real
// MomentStore; no device, no network. Proves: every journal field lands on a Moment
// with no loss, the fold is idempotent, and folded records survive a store reload
// (the load-validation ceiling accepts >3 labels + legacyValence10 + source).

import { describe, expect, it } from 'vitest';

import { MomentStore, type Storage } from '@psychage/shared/engagement';

import { migrateMoodJournalIntoMoments } from '@/lib/moments-migration';

const MOOD_JOURNAL_KEY = 'mobile:mood-journal-moments';

function memStorage(): Storage {
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

let idCounter = 0;
function makeStore(storage: Storage): MomentStore {
  return new MomentStore({
    storage,
    now: () => new Date('2026-06-22T12:00:00.000Z'),
    generateId: () => `gen_${++idCounter}`,
  });
}

const TWELVE_EMOTIONS = [
  'Happy', 'Calm', 'Grateful', 'Excited', 'Proud', 'Relaxed',
  'Anxious', 'Stressed', 'Tired', 'Sad', 'Angry', 'Lonely',
];
const LONG_NOTE = 'x'.repeat(280);

function seedJournal(storage: Storage): void {
  storage.set(
    MOOD_JOURNAL_KEY,
    JSON.stringify({
      version: 2,
      entries: [
        // rated, with note + tags
        {
          id: 'mj_rated',
          date: '2026-06-18',
          createdAt: '2026-06-18T08:00:00.000Z',
          emotions: ['Anxious', 'Tired'],
          triggers: ['Work', 'Sleep'],
          valence: 8,
          note: LONG_NOTE,
        },
        // unrated (no valence) — tags only
        {
          id: 'mj_unrated',
          date: '2026-06-19',
          createdAt: '2026-06-19T08:00:00.000Z',
          emotions: ['Calm'],
          triggers: [],
        },
        // all twelve emotions — exercises the stored-label ceiling on reload
        {
          id: 'mj_twelve',
          date: '2026-06-20',
          createdAt: '2026-06-20T08:00:00.000Z',
          emotions: TWELVE_EMOTIONS,
          triggers: ['Family'],
          valence: 5,
        },
        // malformed — missing id; must be skipped, not crash
        { date: '2026-06-21', createdAt: '2026-06-21T08:00:00.000Z', emotions: ['Sad'], triggers: [] },
      ],
    }),
  );
}

describe('migrateMoodJournalIntoMoments', () => {
  it('folds every journal entry into a Moment with no field lost', () => {
    const storage = memStorage();
    seedJournal(storage);
    const store = makeStore(storage);

    const result = migrateMoodJournalIntoMoments(storage, store);

    expect(result.migrated).toBe(3);
    expect(result.skipped).toBe(1);

    const byId = new Map(store.getAll().map((m) => [m.id, m]));

    const rated = byId.get('mj_rated');
    expect(rated?.timestamp).toBe('2026-06-18T08:00:00.000Z'); // createdAt → timestamp
    expect(rated?.valence).toBe(4); // ceil(8/2) = 4
    expect(rated?.legacyValence10).toBe(8); // original preserved
    expect(rated?.labels).toEqual(['Anxious', 'Tired']); // emotions → labels (descriptors)
    expect(rated?.context).toEqual(['Work', 'Sleep']); // triggers → context (impacts)
    expect(rated?.note).toBe(LONG_NOTE); // 280-char note not truncated
    expect(rated?.source).toBe('compass');
    expect(rated?.routedToSupport).toBe(false);

    const unrated = byId.get('mj_unrated');
    expect(unrated?.valence).toBe(3); // neutral midpoint
    expect(unrated?.legacyValence10).toBeUndefined(); // nothing fabricated
    expect(unrated?.note).toBeUndefined();
  });

  it('keeps a 12-emotion entry through a store reload (stored ceiling)', () => {
    const storage = memStorage();
    seedJournal(storage);
    migrateMoodJournalIntoMoments(storage, makeStore(storage));

    // Re-open over the same storage: load() re-validates every persisted moment.
    const reopened = makeStore(storage);
    const twelve = reopened.getAll().find((m) => m.id === 'mj_twelve');
    expect(twelve?.labels).toHaveLength(12);
    expect(reopened.lastAnomaly).toBeNull(); // nothing dropped/quarantined
  });

  it('merges into existing Moments without dropping them', () => {
    const storage = memStorage();
    seedJournal(storage);
    const store = makeStore(storage);
    const existing = store.append({ valence: 2, source: 'today' });

    migrateMoodJournalIntoMoments(storage, store);

    const ids = store.getAll().map((m) => m.id);
    expect(ids).toContain(existing.id);
    expect(ids).toContain('mj_rated');
  });

  it('is idempotent — a second run folds nothing and cannot duplicate', () => {
    const storage = memStorage();
    seedJournal(storage);
    const store = makeStore(storage);

    const first = migrateMoodJournalIntoMoments(storage, store);
    const countAfterFirst = store.getAll().length;
    const second = migrateMoodJournalIntoMoments(storage, store);

    expect(first.migrated).toBe(3);
    expect(second.migrated).toBe(0);
    expect(second.alreadyDone).toBe(true);
    expect(store.getAll().length).toBe(countAfterFirst);
    expect(storage.get(MOOD_JOURNAL_KEY)).toBeNull(); // journal key retired
  });

  it('does nothing when there is no journal data', () => {
    const storage = memStorage();
    const store = makeStore(storage);
    const result = migrateMoodJournalIntoMoments(storage, store);
    expect(result.migrated).toBe(0);
    expect(result.alreadyDone).toBe(true);
    expect(store.getAll()).toEqual([]);
  });
});
