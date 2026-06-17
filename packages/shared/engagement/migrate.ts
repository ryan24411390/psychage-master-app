// Moments persistence schema + forward-only versioned migrator (Sacred Rule #13:
// every persisted shape carries a version + an N→N+1 transform from day one).
//
// Mirrors packages/shared/check-in/migrate.ts's NEVER-SILENTLY-LOSE-USER-DATA policy:
// moments are user data, so on anomaly the raw blob is preserved under a quarantine key
// and the failure is surfaced — the store then continues on a best-effort recovered
// subset. (Unlike derived preferences, which may reseed.)
//
// SCHEMA HISTORY
//   v1 — valence-rating shape: { valence 1..5, labels[], context[], note?, routedToSupport }.
//   v2 — affect-labeling shape: { labelPrimary, labelSecondary?, intensity?, note?,
//        routedToSupport }. The naming (a word) is the primitive; valence is retired
//        (affect is now a property of the chosen WORD, resolved app-side). See the v1→v2
//        transform below for the exact, no-data-loss field mapping.

import {
  INTENSITY_VALUES,
  LABEL_MAX_LENGTH,
  type Moment,
  type MomentIntensity,
  NOTE_MAX_LENGTH,
} from './types';

export const SCHEMA_VERSION = 2 as const;
export const STORAGE_KEY = 'mobile:moments';
/** Quarantined blobs land at `${STORAGE_KEY}:quarantine:<iso>-<uuid>` (uuid keeps each anomaly distinct). */
export const QUARANTINE_KEY_PREFIX = `${STORAGE_KEY}:quarantine:`;

/** The persisted envelope. `version` is meta; `moments` is the user data. */
export interface PersistedMoments {
  readonly version: number;
  readonly moments: Moment[];
}

/** Why a load was treated as anomalous (for the surfaced anomaly + telemetry later). */
export type AnomalyReason =
  | 'corrupt-json'
  | 'not-an-object'
  | 'missing-version'
  | 'future-version'
  | 'no-migration-path'
  | 'malformed-moments';

export type MigrateOutcome =
  | { readonly status: 'clean'; readonly value: PersistedMoments }
  | {
      readonly status: 'anomaly';
      /** Best-effort recovered state (empty unless an envelope yielded salvageable moments). */
      readonly value: PersistedMoments;
      /** The original blob, preserved verbatim for quarantine. */
      readonly raw: string;
      readonly reason: AnomalyReason;
    };

// ── v1 → v2 transform ────────────────────────────────────────────────────────────────
//
// The band-ANCHOR word for each retired v1 valence band (1..5). Used ONLY to migrate a
// v1 moment that carried a valence but NO word (the old "rate, skip the words" minimal
// capture) — it preserves the affect the person expressed by naming the band's anchor
// word, so no moment is lost and the rollup band is unchanged. These keys MUST exist in
// the app vocab (apps/mobile/features/moments/vocab.ts BAND_ANCHOR_KEYS) — duplicated
// here as plain strings because packages/shared must stay vocab-agnostic + dependency-free.
const V1_BAND_ANCHOR: Readonly<Record<number, string>> = {
  1: 'overwhelmed',
  2: 'anxious',
  3: 'steady',
  4: 'calm',
  5: 'joyful',
};

/**
 * Map the v1 `moments` payload to the v2 shape. Field mapping (no data loss):
 *   labels[0]      → labelPrimary   (or V1_BAND_ANCHOR[valence] when the v1 moment had
 *                                    no words — preserves the band as the named feeling)
 *   labels[1]      → labelSecondary (labels[2+] are dropped; v2 caps at one second word)
 *   (none)         → intensity      (v1 had no intensity)
 *   valence        → retired        (its band is preserved via labelPrimary/anchor)
 *   context[]      → retired        (the affect-labeling primitive drops context domains)
 *   note           → note           (carried verbatim)
 *   routedToSupport→ routedToSupport (carried verbatim — a recorded historical fact)
 *
 * Defensive: per-entry, never throws. A v1 entry that yields no labelPrimary (no words AND
 * no valid valence) is left without one, so `normalizeMoments` rejects it → quarantine.
 */
function transformV1ToV2(payload: unknown): unknown {
  if (!Array.isArray(payload)) return payload; // normalizeMoments rejects non-arrays
  return payload.map((entry) => {
    if (typeof entry !== 'object' || entry === null) return entry;
    const v = entry as Record<string, unknown>;
    const labels = Array.isArray(v.labels)
      ? v.labels.filter((x): x is string => typeof x === 'string')
      : [];
    const valence = typeof v.valence === 'number' ? Math.min(5, Math.max(1, Math.round(v.valence))) : undefined;
    const labelPrimary = labels[0] ?? (valence !== undefined ? V1_BAND_ANCHOR[valence] : undefined);

    const out: Record<string, unknown> = {
      id: v.id,
      timestamp: v.timestamp,
      routedToSupport: typeof v.routedToSupport === 'boolean' ? v.routedToSupport : false,
    };
    if (labelPrimary !== undefined) out.labelPrimary = labelPrimary;
    if (labels[1] !== undefined) out.labelSecondary = labels[1];
    if (v.note !== undefined) out.note = v.note;
    return out;
  });
}

// Forward-only transform registry, indexed by `from`. `migrate` walks it from the
// persisted version up to SCHEMA_VERSION, applying each step in turn.
interface Transform {
  readonly from: number;
  readonly to: number;
  readonly transform: (raw: unknown) => unknown;
}
const TRANSFORMS: readonly Transform[] = [{ from: 1, to: 2, transform: transformV1ToV2 }];

function emptyStore(): PersistedMoments {
  return { version: SCHEMA_VERSION, moments: [] };
}

function isIntensity(value: unknown): value is MomentIntensity {
  return typeof value === 'string' && (INTENSITY_VALUES as readonly string[]).includes(value);
}

function isWordKey(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= LABEL_MAX_LENGTH;
}

function isValidMoment(value: unknown): value is Moment {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || v.id.length === 0) return false;
  if (typeof v.timestamp !== 'string' || Number.isNaN(Date.parse(v.timestamp))) return false;
  if (!isWordKey(v.labelPrimary)) return false;
  if (v.labelSecondary !== undefined && !isWordKey(v.labelSecondary)) return false;
  if (v.intensity !== undefined && !isIntensity(v.intensity)) return false;
  if (v.note !== undefined && (typeof v.note !== 'string' || v.note.length > NOTE_MAX_LENGTH)) {
    return false;
  }
  if (typeof v.routedToSupport !== 'boolean') return false;
  return true;
}

/** Canonicalize one validated moment — drop unknown keys, omit absent optionals. */
export function canonicalMoment(moment: Moment): Moment {
  const base = {
    id: moment.id,
    timestamp: moment.timestamp,
    labelPrimary: moment.labelPrimary,
    routedToSupport: moment.routedToSupport,
  };
  return {
    ...base,
    ...(moment.labelSecondary !== undefined ? { labelSecondary: moment.labelSecondary } : {}),
    ...(moment.intensity !== undefined ? { intensity: moment.intensity } : {}),
    ...(moment.note !== undefined ? { note: moment.note } : {}),
  };
}

/** Ascending chronological order by capture instant (stable tiebreak on id). */
export function compareByTimestamp(a: Moment, b: Moment): number {
  if (a.timestamp < b.timestamp) return -1;
  if (a.timestamp > b.timestamp) return 1;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/**
 * Validate + dedupe a raw moments array. Keeps every well-formed moment; collapses
 * duplicate ids (last occurrence wins). `dropped` is true when anything was rejected or
 * collapsed — the signal the store uses to quarantine the original blob.
 */
export function normalizeMoments(raw: unknown): { moments: Moment[]; dropped: boolean } {
  if (!Array.isArray(raw)) return { moments: [], dropped: true };

  const byId = new Map<string, Moment>();
  let dropped = false;

  for (const candidate of raw) {
    if (!isValidMoment(candidate)) {
      dropped = true;
      continue;
    }
    if (byId.has(candidate.id)) dropped = true; // duplicate id collapsed
    byId.set(candidate.id, canonicalMoment(candidate));
  }

  return { moments: [...byId.values()].sort(compareByTimestamp), dropped };
}

/**
 * Parse + migrate a persisted moments blob.
 *
 * - `null` (no data) → clean empty store.
 * - older version → walk TRANSFORMS up to SCHEMA_VERSION, then normalize.
 * - matching version, all moments valid → clean pass-through.
 * - matching version, some malformed/duplicated → anomaly carrying the salvageable subset.
 * - corrupt JSON / non-object / missing version / future version / no migration path
 *   → anomaly carrying the raw and an empty recovered store.
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

  const envelope = parsed as { version?: unknown; moments?: unknown };
  if (typeof envelope.version !== 'number') {
    return { status: 'anomaly', value: emptyStore(), raw: rawJson, reason: 'missing-version' };
  }
  const version = envelope.version;

  if (version > SCHEMA_VERSION) {
    // Downgraded app reading newer state — preserve, never discard.
    return { status: 'anomaly', value: emptyStore(), raw: rawJson, reason: 'future-version' };
  }

  if (version < SCHEMA_VERSION) {
    let cursor = version;
    let payload: unknown = envelope.moments;
    while (cursor < SCHEMA_VERSION) {
      const step = TRANSFORMS.find((t) => t.from === cursor);
      if (!step) {
        return { status: 'anomaly', value: emptyStore(), raw: rawJson, reason: 'no-migration-path' };
      }
      payload = step.transform(payload);
      cursor = step.to;
    }
    const migrated = normalizeMoments(payload);
    const value: PersistedMoments = { version: SCHEMA_VERSION, moments: migrated.moments };
    return migrated.dropped
      ? { status: 'anomaly', value, raw: rawJson, reason: 'malformed-moments' }
      : { status: 'clean', value };
  }

  // version === SCHEMA_VERSION
  const { moments, dropped } = normalizeMoments(envelope.moments);
  const value: PersistedMoments = { version: SCHEMA_VERSION, moments };
  return dropped
    ? { status: 'anomaly', value, raw: rawJson, reason: 'malformed-moments' }
    : { status: 'clean', value };
}

/** Canonical serialization of an envelope (moments pre-sorted by `normalizeMoments`). */
export function serialize(value: PersistedMoments): string {
  return JSON.stringify(value);
}
