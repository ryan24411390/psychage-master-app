// Check-in persistence schema + forward-only versioned migrator (Sacred Rule
// #13: every persisted shape carries a version + an N→N+1 transform from day one).
//
// Structure copied from apps/mobile/lib/persistence/tier-flags.ts — but NOT its
// reseed-on-anomaly policy. That file's own contract is explicit: "User-data
// migrators (e.g. check-in entries) must NOT silently reseed: on anomaly they
// must preserve the raw blob under a quarantine key and surface the failure, so
// nothing the user wrote is lost." Tier flags are derived data (cheap to lose);
// check-ins are user data (never silently lose). So instead of reseeding,
// `migrate` returns `status: 'anomaly'` carrying the raw blob; the store
// quarantines it and surfaces the anomaly before continuing on a best-effort
// recovered subset.

import { isLocalCalendarDate } from './dates';
import { type CheckInEntry, type CheckInState, NOTE_MAX_LENGTH } from './types';

export const SCHEMA_VERSION = 1 as const;
export const STORAGE_KEY = 'mobile:check-in-entries';
/** Quarantined blobs land at `${STORAGE_KEY}:quarantine:<iso>-<uuid>` (uuid keeps each anomaly distinct). */
export const QUARANTINE_KEY_PREFIX = `${STORAGE_KEY}:quarantine:`;

/** The persisted envelope. `version` + `reminderSightings` are meta; `entries` is the user data. */
export interface PersistedCheckIns {
  readonly version: number;
  /** Unwired in A1 — nothing reads or increments it; it exists so the reminder doctrine needs no later migration. */
  readonly reminderSightings: number;
  readonly entries: CheckInEntry[];
}

/** Why a load was treated as anomalous (for the surfaced anomaly + telemetry later). */
export type AnomalyReason =
  | 'corrupt-json'
  | 'not-an-object'
  | 'missing-version'
  | 'future-version'
  | 'no-migration-path'
  | 'malformed-entries';

export type MigrateOutcome =
  | { readonly status: 'clean'; readonly value: PersistedCheckIns }
  | {
      readonly status: 'anomaly';
      /** Best-effort recovered state (empty unless a v1 envelope yielded salvageable entries). */
      readonly value: PersistedCheckIns;
      /** The original blob, preserved verbatim for quarantine. */
      readonly raw: string;
      readonly reason: AnomalyReason;
    };

// Forward-only transform registry, indexed by `from`. Empty: v1 is the first
// check-in schema, so there is no legacy shape to expand. A future v2 adds an
// entry here; `migrate` already walks it.
interface Transform {
  readonly from: number;
  readonly to: number;
  readonly transform: (raw: unknown) => unknown;
}
const TRANSFORMS: readonly Transform[] = [];

function emptyStore(): PersistedCheckIns {
  return { version: SCHEMA_VERSION, reminderSightings: 0, entries: [] };
}

function sanitizeCount(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

function isValidEntry(value: unknown): value is CheckInEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || v.id.length === 0) return false;
  if (!isLocalCalendarDate(v.date)) return false;
  if (
    typeof v.state !== 'number' ||
    !Number.isInteger(v.state) ||
    v.state < 0 ||
    v.state > 4
  ) {
    return false;
  }
  if (v.note !== undefined && (typeof v.note !== 'string' || v.note.length > NOTE_MAX_LENGTH)) {
    return false;
  }
  return true;
}

/** Canonicalize one validated entry — drop unknown keys, omit an absent note. */
function canonicalEntry(entry: CheckInEntry): CheckInEntry {
  const base = { id: entry.id, date: entry.date, state: entry.state as CheckInState };
  return entry.note === undefined ? base : { ...base, note: entry.note };
}

/** Ascending chronological order (lexical on `YYYY-MM-DD` equals chronological). */
export function compareByDate(a: CheckInEntry, b: CheckInEntry): number {
  if (a.date < b.date) return -1;
  if (a.date > b.date) return 1;
  return 0;
}

/**
 * Validate + dedupe a raw entries array. Keeps every well-formed entry; collapses
 * duplicate calendar days (last occurrence wins, enforcing one-per-day on read).
 * `dropped` is true when anything was rejected or collapsed — the signal the store
 * uses to quarantine the original blob rather than silently lose it.
 */
export function normalizeEntries(raw: unknown): { entries: CheckInEntry[]; dropped: boolean } {
  if (!Array.isArray(raw)) return { entries: [], dropped: true };

  const byDate = new Map<string, CheckInEntry>();
  let dropped = false;

  for (const candidate of raw) {
    if (!isValidEntry(candidate)) {
      dropped = true;
      continue;
    }
    if (byDate.has(candidate.date)) dropped = true; // duplicate day collapsed
    byDate.set(candidate.date, canonicalEntry(candidate));
  }

  return { entries: [...byDate.values()].sort(compareByDate), dropped };
}

/**
 * Parse + migrate a persisted check-in blob.
 *
 * - `null` (no data) → clean empty store (nothing to lose).
 * - matching version, all entries valid → clean pass-through.
 * - matching version, some entries malformed/duplicated → anomaly carrying the
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

  if (typeof parsed !== 'object' || parsed === null) {
    return { status: 'anomaly', value: emptyStore(), raw: rawJson, reason: 'not-an-object' };
  }

  const envelope = parsed as { version?: unknown; reminderSightings?: unknown; entries?: unknown };
  if (typeof envelope.version !== 'number') {
    return { status: 'anomaly', value: emptyStore(), raw: rawJson, reason: 'missing-version' };
  }
  const version = envelope.version;

  if (version > SCHEMA_VERSION) {
    // Downgraded app reading newer state — preserve, never discard.
    return { status: 'anomaly', value: emptyStore(), raw: rawJson, reason: 'future-version' };
  }

  if (version < SCHEMA_VERSION) {
    // Walk transforms forward. None exist yet (v1 is first), so any older version
    // has no path and is quarantined rather than reseeded.
    let cursor = version;
    let payload: unknown = envelope.entries;
    while (cursor < SCHEMA_VERSION) {
      const step = TRANSFORMS.find((t) => t.from === cursor);
      if (!step) {
        return { status: 'anomaly', value: emptyStore(), raw: rawJson, reason: 'no-migration-path' };
      }
      payload = step.transform(payload);
      cursor = step.to;
    }
    const migrated = normalizeEntries(payload);
    const value: PersistedCheckIns = {
      version: SCHEMA_VERSION,
      reminderSightings: sanitizeCount(envelope.reminderSightings),
      entries: migrated.entries,
    };
    return migrated.dropped
      ? { status: 'anomaly', value, raw: rawJson, reason: 'malformed-entries' }
      : { status: 'clean', value };
  }

  // version === SCHEMA_VERSION
  const { entries, dropped } = normalizeEntries(envelope.entries);
  const value: PersistedCheckIns = {
    version: SCHEMA_VERSION,
    reminderSightings: sanitizeCount(envelope.reminderSightings),
    entries,
  };
  return dropped
    ? { status: 'anomaly', value, raw: rawJson, reason: 'malformed-entries' }
    : { status: 'clean', value };
}

/** Canonical serialization of an envelope (entries pre-sorted by `normalizeEntries`). */
export function serialize(value: PersistedCheckIns): string {
  return JSON.stringify(value);
}
