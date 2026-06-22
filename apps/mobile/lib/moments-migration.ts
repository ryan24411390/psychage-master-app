// One-time, idempotent, non-destructive fold of the retired Mood Journal store into
// the unified Moments store (P42–P44). The Mood Journal kept a SEPARATE local record
// ({ emotions, triggers, optional 1–10 valence, note }); Moments is now the single
// affect-capture record. This adapter reads the journal's MMKV blob, maps every entry
// into a Moment, and ingests them — then retires the journal key.
//
// SELF-CONTAINED BY DESIGN. It hard-codes the journal's storage key and parses the
// blob with its own defensive reader so it KEEPS WORKING after the @psychage/shared/
// mood-journal package is deleted in the same change. A historical migration must not
// depend on the code it is retiring.
//
// LOCAL-ONLY (SR-4). No Supabase import. Ingest goes through `EngagementStore.ingestRemote`,
// which the mobile SyncingMomentStore does NOT override — so folding a journal entry in
// never triggers a cloud push. Mood Journal was local-only; it stays local.
//
// IDEMPOTENT three ways: (1) a done-flag short-circuits re-runs; (2) the journal key is
// removed after a successful fold, so a later run reads nothing; (3) ingest merges by id
// (ids are preserved), so even a re-fold of the same entries cannot duplicate.

import type { EngagementStore, Moment, MomentValence, Storage } from '@psychage/shared/engagement';

/** The retired Mood Journal MMKV key (was `STORAGE_KEY` in packages/shared/mood-journal/migrate.ts). */
const MOOD_JOURNAL_KEY = 'mobile:mood-journal-moments';
/** Set once the fold has run, so subsequent launches short-circuit. */
const MIGRATION_DONE_KEY = 'mobile:moments-migration:mood-journal:done';
/** A corrupt journal blob is preserved here rather than silently dropped. */
const QUARANTINE_KEY = 'mobile:moments-migration:mood-journal:quarantine';

/** The unified note cap (mirrors engagement NOTE_MAX_LENGTH; journal notes were ≤280). */
const NOTE_MAX_LENGTH = 280;

export interface MoodJournalMigrationResult {
  /** How many journal entries were folded into Moments this run. */
  readonly migrated: number;
  /** True when the fold had already run (or there was nothing to fold). */
  readonly alreadyDone: boolean;
  /** How many entries were skipped as malformed (never silently — surfaced for visibility). */
  readonly skipped: number;
}

/** The shape a Mood Journal entry was persisted in (defensively re-declared, not imported). */
interface RawJournalEntry {
  id: string;
  createdAt: string;
  emotions: string[];
  triggers: string[];
  valence?: number;
  note?: string;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === 'string');
}

/** Validate one raw entry enough to fold it in safely. Returns null when unusable. */
function readEntry(value: unknown): RawJournalEntry | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || v.id.length === 0) return null;
  if (typeof v.createdAt !== 'string' || Number.isNaN(Date.parse(v.createdAt))) return null;
  if (!isStringArray(v.emotions) || !isStringArray(v.triggers)) return null;
  const valence =
    typeof v.valence === 'number' && Number.isInteger(v.valence) && v.valence >= 1 && v.valence <= 10
      ? v.valence
      : undefined;
  const note =
    typeof v.note === 'string' && v.note.length > 0 && v.note.length <= NOTE_MAX_LENGTH
      ? v.note
      : undefined;
  return {
    id: v.id,
    createdAt: v.createdAt,
    emotions: [...new Set(v.emotions)],
    triggers: [...new Set(v.triggers)],
    ...(valence !== undefined ? { valence } : {}),
    ...(note !== undefined ? { note } : {}),
  };
}

/**
 * Remap a 1–10 Mood Journal valence onto the unified 1–5 scale (ceil(v/2), clamped).
 * The finer original is preserved separately on `legacyValence10`, so this lossy step
 * never discards the user's input.
 */
function remapValence(v: number): MomentValence {
  return Math.min(5, Math.max(1, Math.ceil(v / 2))) as MomentValence;
}

/**
 * Map a journal entry to a Moment. `createdAt → timestamp`, `emotions → labels`
 * (feeling words), `triggers → context` (impacts), `source: 'compass'` (the journal
 * lived on the Compass tool). Unrated entries take the neutral midpoint (3) — no
 * affect is fabricated beyond the midpoint, and nothing rated is lost. Key order
 * matches `canonicalMoment` so the ingest persists without a reload restamp.
 */
function entryToMoment(entry: RawJournalEntry): Moment {
  const base = {
    id: entry.id,
    timestamp: entry.createdAt,
    valence: entry.valence !== undefined ? remapValence(entry.valence) : (3 as MomentValence),
    labels: entry.emotions,
    context: entry.triggers,
    routedToSupport: false,
    source: 'compass' as const,
  };
  const withLegacy = entry.valence !== undefined ? { ...base, legacyValence10: entry.valence } : base;
  return entry.note !== undefined ? { ...withLegacy, note: entry.note } : withLegacy;
}

/**
 * Fold the Mood Journal into the Moments store. Safe to call on every store
 * construction: it does nothing once the done-flag is set. `storage` and `store` must
 * be backed by the SAME storage instance.
 */
export function migrateMoodJournalIntoMoments(
  storage: Storage,
  store: EngagementStore,
): MoodJournalMigrationResult {
  if (storage.get(MIGRATION_DONE_KEY) !== null) {
    return { migrated: 0, alreadyDone: true, skipped: 0 };
  }

  const raw = storage.get(MOOD_JOURNAL_KEY);
  if (raw === null) {
    // Nothing to fold (no journal data ever, or already retired). Mark done.
    storage.set(MIGRATION_DONE_KEY, new Date().toISOString());
    return { migrated: 0, alreadyDone: true, skipped: 0 };
  }

  let entriesRaw: unknown;
  try {
    const parsed: unknown = JSON.parse(raw);
    entriesRaw =
      typeof parsed === 'object' && parsed !== null ? (parsed as { entries?: unknown }).entries : null;
  } catch {
    entriesRaw = null;
  }

  if (!Array.isArray(entriesRaw)) {
    // Unreadable blob — preserve it verbatim (never silently lose user data), then mark
    // done so we don't loop. The journal key is left in place too.
    storage.set(QUARANTINE_KEY, raw);
    storage.set(MIGRATION_DONE_KEY, new Date().toISOString());
    return { migrated: 0, alreadyDone: false, skipped: 0 };
  }

  const moments: Moment[] = [];
  let skipped = 0;
  for (const candidate of entriesRaw) {
    const entry = readEntry(candidate);
    if (entry === null) {
      skipped += 1;
      continue;
    }
    moments.push(entryToMoment(entry));
  }

  if (moments.length > 0) store.ingestRemote(moments);
  storage.remove(MOOD_JOURNAL_KEY);
  storage.set(MIGRATION_DONE_KEY, new Date().toISOString());
  return { migrated: moments.length, alreadyDone: false, skipped };
}
