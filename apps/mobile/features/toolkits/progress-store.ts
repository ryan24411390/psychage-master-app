// ToolkitProgressStore — the LOCAL-FIRST record of per-item toolkit engagement.
//
// Local is the source of truth (MMKV via the injected Storage seam). On top of a
// successful local write the syncing wrapper (store.ts) fires a best-effort,
// consent-gated, push-only backup to Supabase (sync.ts). There is no pull, no merge.
//
// Shape mirrors the web `user_toolkit_progress` row so the upsert stays
// wire-compatible: keyed by `toolkit_item.id`, carrying openedAt / completedAt /
// selfRating. Versioned + forward-only migrator (SR-13): a corrupt / foreign blob
// is QUARANTINED verbatim under a unique key (user-data policy — never silently
// lost), then the store continues on the recovered subset. Pure (no React, no RN)
// → Vitest; the DI seam (storage / clock / id) keeps it deterministic.

import type { Storage } from '@/lib/adapters/storage';

import type { ProgressMap, SelfRating } from './types';

export const TOOLKIT_PROGRESS_STORAGE_KEY = 'mobile:toolkit-progress';
export const TOOLKIT_PROGRESS_QUARANTINE_PREFIX = `${TOOLKIT_PROGRESS_STORAGE_KEY}:quarantine:`;
export const TOOLKIT_PROGRESS_SCHEMA_VERSION = 1 as const;

const SELF_RATINGS: ReadonlySet<string> = new Set<SelfRating>(['a_little', 'not_yet']);

/** One persisted item-progress record. `itemId` is the stable key. */
export interface PersistedItemProgress {
  readonly toolkitId: string;
  readonly itemId: string;
  readonly openedAt: string | null;
  readonly completedAt: string | null;
  readonly selfRating: SelfRating | null;
  readonly updatedAt: string;
}

interface PersistedProgress {
  readonly version: number;
  readonly items: Record<string, PersistedItemProgress>;
}

export interface ToolkitProgressStoreDeps {
  readonly storage: Storage;
  readonly now: () => Date;
  readonly generateId: () => string;
}

/**
 * The subset of the store the UI consumes. The detail view depends on this
 * interface (not the concrete class) so render tests inject an in-memory double
 * and never pull in the syncing singleton (which imports the Supabase client).
 */
export interface ToolkitProgressApi {
  getForToolkit(toolkitId: string): ProgressMap;
  markOpened(toolkitId: string, itemId: string): PersistedItemProgress;
  setDone(toolkitId: string, itemId: string, done: boolean): PersistedItemProgress;
  setRating(toolkitId: string, itemId: string, rating: SelfRating | null): PersistedItemProgress;
}

function isSelfRating(value: unknown): value is SelfRating {
  return typeof value === 'string' && SELF_RATINGS.has(value);
}

function isPersistedItem(value: unknown): value is PersistedItemProgress {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.toolkitId === 'string' &&
    v.toolkitId.length > 0 &&
    typeof v.itemId === 'string' &&
    v.itemId.length > 0 &&
    (v.openedAt === null || typeof v.openedAt === 'string') &&
    (v.completedAt === null || typeof v.completedAt === 'string') &&
    (v.selfRating === null || isSelfRating(v.selfRating)) &&
    typeof v.updatedAt === 'string'
  );
}

/** Strip unknown keys from a validated record (defends against hand-edited blobs). */
function canonical(p: PersistedItemProgress): PersistedItemProgress {
  return {
    toolkitId: p.toolkitId,
    itemId: p.itemId,
    openedAt: p.openedAt,
    completedAt: p.completedAt,
    selfRating: p.selfRating,
    updatedAt: p.updatedAt,
  };
}

type LoadOutcome =
  | { status: 'clean'; items: Record<string, PersistedItemProgress> }
  | { status: 'anomaly'; items: Record<string, PersistedItemProgress>; raw: string };

/** Parse + validate the persisted blob. Forward-only; v1 is the first schema. */
function loadBlob(raw: string | null): LoadOutcome {
  if (raw === null) return { status: 'clean', items: {} };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'anomaly', items: {}, raw };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { status: 'anomaly', items: {}, raw };
  }

  const env = parsed as { version?: unknown; items?: unknown };
  if (env.version !== TOOLKIT_PROGRESS_SCHEMA_VERSION) {
    // Missing / older / newer version: no migration path yet — preserve, recover none.
    return { status: 'anomaly', items: {}, raw };
  }
  if (typeof env.items !== 'object' || env.items === null) {
    return { status: 'anomaly', items: {}, raw };
  }

  const items: Record<string, PersistedItemProgress> = {};
  let dropped = false;
  for (const [key, candidate] of Object.entries(env.items as Record<string, unknown>)) {
    if (isPersistedItem(candidate) && candidate.itemId === key) {
      items[key] = canonical(candidate);
    } else {
      dropped = true;
    }
  }
  return dropped ? { status: 'anomaly', items, raw } : { status: 'clean', items };
}

export class ToolkitProgressStore implements ToolkitProgressApi {
  private readonly storage: Storage;
  private readonly now: () => Date;
  private readonly generateId: () => string;
  private items: Record<string, PersistedItemProgress> = {};

  constructor(deps: ToolkitProgressStoreDeps) {
    this.storage = deps.storage;
    this.now = deps.now;
    this.generateId = deps.generateId;
    this.load();
  }

  /** Progress for one toolkit's items, keyed by item id (UI-facing shape). */
  getForToolkit(toolkitId: string): ProgressMap {
    const map: ProgressMap = {};
    for (const record of Object.values(this.items)) {
      if (record.toolkitId !== toolkitId) continue;
      map[record.itemId] = {
        opened_at: record.openedAt,
        completed_at: record.completedAt,
        self_rating: record.selfRating,
      };
    }
    return map;
  }

  /** Every record (sync reads this on the rare full re-push path). */
  getAll(): PersistedItemProgress[] {
    return Object.values(this.items).map(canonical);
  }

  /** Record the first open of an item; idempotent (keeps the original timestamp). */
  markOpened(toolkitId: string, itemId: string): PersistedItemProgress {
    const existing = this.items[itemId];
    return this.write(toolkitId, itemId, {
      openedAt: existing?.openedAt ?? this.now().toISOString(),
    });
  }

  /** Toggle the completed state of an item. */
  setDone(toolkitId: string, itemId: string, done: boolean): PersistedItemProgress {
    return this.write(toolkitId, itemId, {
      completedAt: done ? this.now().toISOString() : null,
    });
  }

  /** Set (or clear) the "was this helpful?" self-rating. */
  setRating(toolkitId: string, itemId: string, rating: SelfRating | null): PersistedItemProgress {
    return this.write(toolkitId, itemId, { selfRating: rating });
  }

  private write(
    toolkitId: string,
    itemId: string,
    patch: Partial<Pick<PersistedItemProgress, 'openedAt' | 'completedAt' | 'selfRating'>>,
  ): PersistedItemProgress {
    const prev = this.items[itemId];
    const next: PersistedItemProgress = {
      toolkitId,
      itemId,
      openedAt: prev?.openedAt ?? null,
      completedAt: prev?.completedAt ?? null,
      selfRating: prev?.selfRating ?? null,
      ...patch,
      updatedAt: this.now().toISOString(),
    };
    this.items[itemId] = next;
    this.persist();
    return canonical(next);
  }

  private persist(): void {
    const payload: PersistedProgress = {
      version: TOOLKIT_PROGRESS_SCHEMA_VERSION,
      items: this.items,
    };
    this.storage.set(TOOLKIT_PROGRESS_STORAGE_KEY, JSON.stringify(payload));
  }

  private load(): void {
    const raw = this.storage.get(TOOLKIT_PROGRESS_STORAGE_KEY);
    const outcome = loadBlob(raw);
    this.items = outcome.items;

    if (outcome.status === 'anomaly') {
      // Preserve the raw blob (never silently lose user data) under a unique key,
      // then rewrite the primary key to the recovered subset for a clean next launch.
      const stamp = `${this.now().toISOString()}-${this.generateId()}`;
      this.storage.set(`${TOOLKIT_PROGRESS_QUARANTINE_PREFIX}${stamp}`, outcome.raw);
      this.persist();
    }
  }
}
