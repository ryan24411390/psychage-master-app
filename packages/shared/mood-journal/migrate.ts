// Mood Journal persistence schema + forward-only versioned migrator (Sacred Rule
// #13: every persisted shape carries a version + an N→N+1 transform from day one).
//
// Structure mirrors check-in/migrate.ts and inherits its user-data doctrine: moments
// are USER DATA, never silently lost. On anomaly the migrator returns
// `status: 'anomaly'` carrying the raw blob; the store quarantines it under a
// distinct key and continues on a best-effort recovered subset. It NEVER reseeds.
//
// Unlike check-in, MANY moments may share a calendar day, so there is no
// one-per-day collapse — every well-formed moment is kept. Duplicate tags WITHIN a
// moment are redundant, not corrupt: they are deduped silently (not quarantined).

import { isLocalCalendarDate } from '../check-in/dates';
import { isEmotionTag, isTriggerTag } from './tags';
import { isValence, type MomentEntry, NOTE_MAX_LENGTH } from './types';

export const SCHEMA_VERSION = 2 as const;
export const STORAGE_KEY = 'mobile:mood-journal-moments';
/** Quarantined blobs land at `${STORAGE_KEY}:quarantine:<iso>-<uuid>` (uuid keeps each anomaly distinct). */
export const QUARANTINE_KEY_PREFIX = `${STORAGE_KEY}:quarantine:`;

/** The persisted envelope. `version` is meta; `entries` is the user data. */
export interface PersistedMoments {
  readonly version: number;
  readonly entries: MomentEntry[];
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
  | { readonly status: 'clean'; readonly value: PersistedMoments }
  | {
      readonly status: 'anomaly';
      /** Best-effort recovered state (empty unless a v1 envelope yielded salvageable moments). */
      readonly value: PersistedMoments;
      /** The original blob, preserved verbatim for quarantine. */
      readonly raw: string;
      readonly reason: AnomalyReason;
    };

// Forward-only transform registry, indexed by `from`. v1→v2 adds the OPTIONAL
// `valence` field: it is purely additive, so a v1 moment is already a valid v2
// moment (it simply carries no valence). The transform is therefore identity —
// `normalizeMoments` re-validates the result under the v2 `isValidMoment`, which
// accepts a missing valence. No v1 user data is lost or rated retroactively.
interface Transform {
  readonly from: number;
  readonly to: number;
  readonly transform: (raw: unknown) => unknown;
}
const TRANSFORMS: readonly Transform[] = [{ from: 1, to: 2, transform: (entries) => entries }];

function emptyStore(): PersistedMoments {
  return { version: SCHEMA_VERSION, entries: [] };
}

const ISO_INSTANT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function isIsoInstant(value: unknown): value is string {
  return typeof value === 'string' && ISO_INSTANT_RE.test(value) && Number.isFinite(Date.parse(value));
}

function isValidMoment(value: unknown): value is MomentEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || v.id.length === 0) return false;
  if (!isLocalCalendarDate(v.date)) return false;
  if (!isIsoInstant(v.createdAt)) return false;
  if (!Array.isArray(v.emotions) || !v.emotions.every(isEmotionTag)) return false;
  if (!Array.isArray(v.triggers) || !v.triggers.every(isTriggerTag)) return false;
  if (v.emotions.length + v.triggers.length === 0) return false;
  if (v.valence !== undefined && !isValence(v.valence)) return false;
  if (v.note !== undefined && (typeof v.note !== 'string' || v.note.length > NOTE_MAX_LENGTH)) {
    return false;
  }
  return true;
}

/**
 * Canonicalize one validated moment — drop unknown keys, dedupe tags, carry valence
 * when present, omit an empty note. Key order matches `makeMoment` in the store so a
 * fresh write and a reloaded write serialize identically (the load() restamp check).
 */
function canonicalMoment(moment: MomentEntry): MomentEntry {
  const emotions = [...new Set(moment.emotions)];
  const triggers = [...new Set(moment.triggers)];
  const base = { id: moment.id, date: moment.date, createdAt: moment.createdAt, emotions, triggers };
  const withValence = moment.valence === undefined ? base : { ...base, valence: moment.valence };
  return moment.note === undefined || moment.note === ''
    ? withValence
    : { ...withValence, note: moment.note };
}

/**
 * Ascending chronological order by `createdAt` (ISO-8601 sorts lexically =
 * chronologically), id as a deterministic tie-break.
 */
export function compareByCreatedAt(a: MomentEntry, b: MomentEntry): number {
  if (a.createdAt < b.createdAt) return -1;
  if (a.createdAt > b.createdAt) return 1;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/**
 * Validate a raw moments array. Keeps EVERY well-formed moment (no one-per-day
 * collapse — many moments may share a day). `dropped` is true when any moment was
 * rejected — the signal the store uses to quarantine the original blob rather than
 * silently lose it. (Tag dedupe within a kept moment is silent normalization, not a drop.)
 */
export function normalizeMoments(raw: unknown): { entries: MomentEntry[]; dropped: boolean } {
  if (!Array.isArray(raw)) return { entries: [], dropped: true };

  const entries: MomentEntry[] = [];
  let dropped = false;

  for (const candidate of raw) {
    if (!isValidMoment(candidate)) {
      dropped = true;
      continue;
    }
    entries.push(canonicalMoment(candidate));
  }

  entries.sort(compareByCreatedAt);
  return { entries, dropped };
}

/**
 * Parse + migrate a persisted mood-journal blob.
 *
 * - `null` (no data) → clean empty store (nothing to lose).
 * - matching version, all moments valid → clean pass-through.
 * - matching version, some moments malformed → anomaly carrying the salvageable
 *   subset (store quarantines the raw, keeps the subset).
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

  const envelope = parsed as { version?: unknown; entries?: unknown };
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
    const migrated = normalizeMoments(payload);
    const value: PersistedMoments = { version: SCHEMA_VERSION, entries: migrated.entries };
    return migrated.dropped
      ? { status: 'anomaly', value, raw: rawJson, reason: 'malformed-entries' }
      : { status: 'clean', value };
  }

  // version === SCHEMA_VERSION
  const { entries, dropped } = normalizeMoments(envelope.entries);
  const value: PersistedMoments = { version: SCHEMA_VERSION, entries };
  return dropped
    ? { status: 'anomaly', value, raw: rawJson, reason: 'malformed-entries' }
    : { status: 'clean', value };
}

/** Canonical serialization of an envelope (entries pre-sorted by `normalizeMoments`). */
export function serialize(value: PersistedMoments): string {
  return JSON.stringify(value);
}
