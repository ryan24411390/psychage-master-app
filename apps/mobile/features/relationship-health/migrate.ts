// Relationship Health persistence schema + forward-only versioned migrator
// (Sacred Rule #13: every persisted shape carries a version + an N→N+1 transform
// from day one). Modeled on packages/shared/check-in/migrate.ts — same doctrine:
// results are USER DATA, so on anomaly we NEVER silently reseed. `migrate`
// returns `status: 'anomaly'` carrying the raw blob; the store quarantines it and
// surfaces the anomaly before continuing on a best-effort recovered subset.
//
// Mobile starts at schema v2 to match the web tool's current result shape
// (RelationshipHealthResult.version === 2). There is no mobile v1 to migrate from;
// a stored version < 2 has no transform path and is quarantined, not reseeded.

import type { RelationshipHealthResult, RelationshipTier } from './types';

export const SCHEMA_VERSION = 2 as const;
export const STORAGE_KEY = 'mobile:relationship-health';
/** Quarantined blobs land at `${STORAGE_KEY}:quarantine:<iso>-<uuid>` (uuid keeps each anomaly distinct). */
export const QUARANTINE_KEY_PREFIX = `${STORAGE_KEY}:quarantine:`;

/** The persisted envelope. `version` is meta; `results` is the user data (newest first). */
export interface PersistedResults {
  readonly version: number;
  readonly results: RelationshipHealthResult[];
}

/** Why a load was treated as anomalous (for the surfaced anomaly + telemetry later). */
export type AnomalyReason =
  | 'corrupt-json'
  | 'not-an-object'
  | 'missing-version'
  | 'future-version'
  | 'no-migration-path'
  | 'malformed-results';

export type MigrateOutcome =
  | { readonly status: 'clean'; readonly value: PersistedResults }
  | {
      readonly status: 'anomaly';
      /** Best-effort recovered state (empty unless an older envelope yielded salvageable results). */
      readonly value: PersistedResults;
      /** The original blob, preserved verbatim for quarantine. */
      readonly raw: string;
      readonly reason: AnomalyReason;
    };

// Forward-only transform registry, indexed by `from`. Empty: v2 is the first
// mobile schema. A future v3 adds an entry here; `migrate` already walks it.
interface Transform {
  readonly from: number;
  readonly to: number;
  readonly transform: (raw: unknown) => unknown;
}
const TRANSFORMS: readonly Transform[] = [];

const TIERS: readonly RelationshipTier[] = ['thriving', 'healthy', 'mixed', 'strained', 'isolated'];

function emptyStore(): PersistedResults {
  return { version: SCHEMA_VERSION, results: [] };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDomainScores(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  return (['partner', 'family', 'friends', 'community'] as const).every(
    (k) => typeof value[k] === 'number',
  );
}

/**
 * Validate the top-level shape of a stored result. We check the fields the store
 * and results UI depend on; deeper nested copy (intervention text, science notes)
 * is trusted. A result failing any check is dropped and triggers quarantine of the
 * original blob — never silently lost.
 */
function isValidResult(value: unknown): value is RelationshipHealthResult {
  if (!isPlainObject(value)) return false;
  const v = value;
  if (typeof v.id !== 'string' || v.id.length === 0) return false;
  if (v.version !== 2) return false;
  if (typeof v.createdAt !== 'string' || v.createdAt.length === 0) return false;
  if (typeof v.compositeScore !== 'number' || !Number.isFinite(v.compositeScore)) return false;
  if (!isDomainScores(v.domainScores)) return false;
  if (!isPlainObject(v.subDimensionScores)) return false;
  if (typeof v.tier !== 'string' || !TIERS.includes(v.tier as RelationshipTier)) return false;
  if (typeof v.tierLabel !== 'string') return false;
  if (typeof v.skipPartner !== 'boolean') return false;
  if (!isPlainObject(v.answers)) return false;
  if (!isPlainObject(v.dvAlert) || typeof (v.dvAlert as Record<string, unknown>).triggered !== 'boolean') {
    return false;
  }
  if (!isPlainObject(v.isolationAlert)) return false;
  if (!Array.isArray(v.patterns)) return false;
  if (v.fourHorsemen !== null && !isPlainObject(v.fourHorsemen)) return false;
  if (typeof v.blueprint !== 'string') return false;
  return true;
}

/** Newest first — descending ISO `createdAt` (lexical compare equals chronological). */
export function compareByCreatedAtDesc(a: RelationshipHealthResult, b: RelationshipHealthResult): number {
  if (a.createdAt > b.createdAt) return -1;
  if (a.createdAt < b.createdAt) return 1;
  return 0;
}

/**
 * Validate + dedupe a raw results array. Keeps every well-formed result; collapses
 * duplicate ids (last occurrence wins). `dropped` is true when anything was rejected
 * or collapsed — the signal the store uses to quarantine the original blob.
 */
export function normalizeResults(raw: unknown): { results: RelationshipHealthResult[]; dropped: boolean } {
  if (!Array.isArray(raw)) return { results: [], dropped: true };

  const byId = new Map<string, RelationshipHealthResult>();
  let dropped = false;

  for (const candidate of raw) {
    if (!isValidResult(candidate)) {
      dropped = true;
      continue;
    }
    if (byId.has(candidate.id)) dropped = true; // duplicate id collapsed
    byId.set(candidate.id, candidate);
  }

  return { results: [...byId.values()].sort(compareByCreatedAtDesc), dropped };
}

/**
 * Parse + migrate a persisted relationship-results blob.
 *
 * - `null` (no data) → clean empty store.
 * - matching version, all results valid → clean pass-through.
 * - matching version, some results malformed/duplicated → anomaly carrying the
 *   salvageable subset (store quarantines the raw, keeps the subset).
 * - corrupt JSON / non-object / missing version / future version / no migration
 *   path → anomaly carrying the raw and an empty recovered store.
 */
export function migrate(rawJson: string | null): MigrateOutcome {
  if (rawJson === null) return { status: 'clean', value: emptyStore() };

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { status: 'anomaly', value: emptyStore(), raw: rawJson, reason: 'corrupt-json' };
  }

  if (!isPlainObject(parsed)) {
    return { status: 'anomaly', value: emptyStore(), raw: rawJson, reason: 'not-an-object' };
  }

  const envelope = parsed as { version?: unknown; results?: unknown };
  if (typeof envelope.version !== 'number') {
    return { status: 'anomaly', value: emptyStore(), raw: rawJson, reason: 'missing-version' };
  }
  const version = envelope.version;

  if (version > SCHEMA_VERSION) {
    // Downgraded app reading newer state — preserve, never discard.
    return { status: 'anomaly', value: emptyStore(), raw: rawJson, reason: 'future-version' };
  }

  if (version < SCHEMA_VERSION) {
    // Walk transforms forward. None exist yet (v2 is first), so any older version
    // has no path and is quarantined rather than reseeded.
    let cursor = version;
    let payload: unknown = envelope.results;
    while (cursor < SCHEMA_VERSION) {
      const step = TRANSFORMS.find((t) => t.from === cursor);
      if (!step) {
        return { status: 'anomaly', value: emptyStore(), raw: rawJson, reason: 'no-migration-path' };
      }
      payload = step.transform(payload);
      cursor = step.to;
    }
    const migrated = normalizeResults(payload);
    const value: PersistedResults = { version: SCHEMA_VERSION, results: migrated.results };
    return migrated.dropped
      ? { status: 'anomaly', value, raw: rawJson, reason: 'malformed-results' }
      : { status: 'clean', value };
  }

  // version === SCHEMA_VERSION
  const { results, dropped } = normalizeResults(envelope.results);
  const value: PersistedResults = { version: SCHEMA_VERSION, results };
  return dropped
    ? { status: 'anomaly', value, raw: rawJson, reason: 'malformed-results' }
    : { status: 'clean', value };
}

/** Canonical serialization of an envelope (results pre-sorted by `normalizeResults`). */
export function serialize(value: PersistedResults): string {
  return JSON.stringify(value);
}
