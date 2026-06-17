// Reached-milestones state — mobile-local, SR-13 versioned migrator (mirrors
// lib/persistence/onboarding). Records WHICH cumulative thresholds the person has
// already reached, so each milestone flags + celebrates exactly once. Derived progress
// state (not authored user data) → reseed-on-anomaly, never throws. Not symptom data
// (SR-4). Cumulative-only: the set only ever grows, never resets.

import { detectNewMilestones, MILESTONE_THRESHOLDS } from '@psychage/shared/engagement';

import type { Storage } from '@/lib/adapters/storage';

export const SCHEMA_VERSION = 1 as const;
export const STORAGE_KEY = 'mobile:milestones';

const KNOWN = new Set<number>(MILESTONE_THRESHOLDS);

export interface Persisted {
  readonly version: number;
  /** Threshold values reached, ascending, deduped, limited to known thresholds. */
  readonly reached: number[];
}

function seed(): Persisted {
  return { version: SCHEMA_VERSION, reached: [] };
}

// Keep only known thresholds, deduped + ascending — guards a hand-edited / stale blob
// and keeps the persisted shape canonical regardless of input ordering.
function normalize(values: readonly number[]): number[] {
  const kept = new Set<number>();
  for (const v of values) {
    if (typeof v === 'number' && KNOWN.has(v)) kept.add(v);
  }
  return [...kept].sort((a, b) => a - b);
}

export function migrate(rawJson: string | null): Persisted {
  if (rawJson === null) return seed();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return seed();
  }

  if (typeof parsed !== 'object' || parsed === null) return seed();

  const envelope = parsed as { version?: unknown; reached?: unknown };
  if (typeof envelope.version !== 'number') return seed();

  if (envelope.version === SCHEMA_VERSION) {
    const reached = Array.isArray(envelope.reached) ? (envelope.reached as number[]) : [];
    return { version: SCHEMA_VERSION, reached: normalize(reached) };
  }

  return seed();
}

// Read → migrate → write-back-if-needed → the canonical state.
function read(storage: Storage): Persisted {
  const raw = storage.get(STORAGE_KEY);
  const persisted = migrate(raw);
  if (raw === null || raw !== JSON.stringify(persisted)) {
    storage.set(STORAGE_KEY, JSON.stringify(persisted));
  }
  return persisted;
}

/** The thresholds already reached (ascending). */
export function loadReachedMilestones(storage: Storage): number[] {
  return read(storage).reached;
}

/**
 * Union `thresholds` into the reached set and persist. Returns the full reached set
 * after the write. Cumulative — never removes. A no-op when nothing is new.
 */
export function markMilestonesReached(storage: Storage, thresholds: readonly number[]): number[] {
  const current = read(storage).reached;
  const next = normalize([...current, ...thresholds]);
  if (next.length !== current.length) {
    storage.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, reached: next }));
  }
  return next;
}

/**
 * Record a capture against the cumulative total: detect thresholds newly crossed at
 * `totalCount`, persist them, and return both the thresholds `newly` reached this
 * capture and the full `reached` set after. The single call both hooks use — the home
 * hook celebrates from `newly`, the onboarding hook ignores it (silent mark).
 */
export function recordCount(
  storage: Storage,
  totalCount: number,
): { reached: number[]; newly: number[] } {
  const before = loadReachedMilestones(storage);
  const newly = detectNewMilestones(totalCount, before);
  const reached = newly.length > 0 ? markMilestonesReached(storage, newly) : before;
  return { reached, newly };
}
