// MoodJournalStore — the local record of tagged "moments" (emotions + triggers +
// optional note). The patterns layer reads through this; mood itself is NOT here
// (it stays single-sourced in CheckInRecordStore).
//
// LOCAL-ONLY (SR-4). Writes the injected Storage seam and nowhere else — no
// Supabase, no network, no analytics, no Sentry.
//
// THE DATE RULE (the wrong-day bug class this store guards):
//   addMoment keys to the DEVICE'S LOCAL CALENDAR DAY AT SAVE TIME, and stamps an
//   ISO `createdAt` from the SAME clock read. editMoment keeps the stored
//   date/createdAt/id — an edit overwrites only emotions/triggers/note, never
//   re-dates. Unlike check-in, MANY moments may share a day (no overwrite).

import { toLocalCalendarDate } from '../check-in/dates';
import {
  type AnomalyReason,
  compareByCreatedAt,
  migrate,
  type PersistedMoments,
  QUARANTINE_KEY_PREFIX,
  SCHEMA_VERSION,
  serialize,
  STORAGE_KEY,
} from './migrate';
import { type EmotionTag, isEmotionTag, isTriggerTag, type TriggerTag } from './tags';
import {
  isValence,
  type LocalCalendarDate,
  type MomentEntry,
  type MomentInput,
  MomentNotFoundError,
  MomentValidationError,
  type MoodJournalStoreDeps,
  NOTE_MAX_LENGTH,
  type Storage,
  type Valence,
  VALENCE_MAX,
  VALENCE_MIN,
} from './types';

/**
 * A surfaced load anomaly. The raw blob is preserved verbatim at `quarantineKey`;
 * the store continued on a best-effort recovered subset of `recoveredEntryCount`
 * moments. Surfaced (not swallowed) so a later recovery UI / telemetry can act —
 * nothing the user wrote is lost.
 */
export interface MoodJournalAnomaly {
  readonly reason: AnomalyReason;
  readonly quarantineKey: string;
  readonly recoveredEntryCount: number;
  readonly detectedAtIso: string;
}

function cloneMoment(moment: MomentEntry): MomentEntry {
  const base = {
    id: moment.id,
    date: moment.date,
    createdAt: moment.createdAt,
    emotions: [...moment.emotions],
    triggers: [...moment.triggers],
  };
  const withValence = moment.valence === undefined ? base : { ...base, valence: moment.valence };
  return moment.note === undefined ? withValence : { ...withValence, note: moment.note };
}

export class MoodJournalStore {
  private readonly storage: Storage;
  private readonly now: () => Date;
  private readonly generateId: () => string;

  private readonly byId = new Map<string, MomentEntry>();
  private anomaly: MoodJournalAnomaly | null = null;

  constructor(deps: MoodJournalStoreDeps) {
    this.storage = deps.storage;
    this.now = deps.now;
    this.generateId = deps.generateId;
    this.load();
  }

  // ── reads ────────────────────────────────────────────────────────────────

  /** The moment with `id`, or undefined. */
  getEntry(id: string): MomentEntry | undefined {
    const entry = this.byId.get(id);
    return entry ? cloneMoment(entry) : undefined;
  }

  /** All moments on `date`, oldest first (by createdAt). */
  getForDay(date: LocalCalendarDate): MomentEntry[] {
    return this.sortedAscending()
      .filter((m) => m.date === date)
      .map(cloneMoment);
  }

  /** The `n` most recent moments, newest first. `n <= 0` ⇒ []. */
  getRecent(n: number): MomentEntry[] {
    if (!Number.isInteger(n) || n <= 0) return [];
    return this.sortedAscending().reverse().slice(0, n).map(cloneMoment);
  }

  /** Moments whose `date` is within `[from, to]` inclusive, oldest first. Inverted bounds ⇒ []. */
  getRange(from: LocalCalendarDate, to: LocalCalendarDate): MomentEntry[] {
    return this.sortedAscending()
      .filter((m) => m.date >= from && m.date <= to)
      .map(cloneMoment);
  }

  /** Every moment, oldest first. */
  getAll(): MomentEntry[] {
    return this.sortedAscending().map(cloneMoment);
  }

  /** The most recent surfaced load anomaly, or null when the last load was clean. */
  get lastAnomaly(): MoodJournalAnomaly | null {
    return this.anomaly;
  }

  // ── writes ───────────────────────────────────────────────────────────────

  /** Append a new moment, dated to the device's local day at save time. */
  addMoment(input: MomentInput): MomentEntry {
    const { emotions, triggers, valence, note } = this.canonicalizeInput(input);
    const ts = this.now();
    const entry = makeMoment(
      this.generateId(),
      toLocalCalendarDate(ts),
      ts.toISOString(),
      emotions,
      triggers,
      valence,
      note,
    );
    this.byId.set(entry.id, entry);
    this.persist();
    return cloneMoment(entry);
  }

  /**
   * Overwrite the identified moment's emotions/triggers/note. NEVER re-dates: the
   * moment keeps its stored date/createdAt/id. Throws MomentNotFoundError if unknown.
   */
  editMoment(id: string, input: MomentInput): MomentEntry {
    const existing = this.byId.get(id);
    if (!existing) throw new MomentNotFoundError(id);

    const { emotions, triggers, valence, note } = this.canonicalizeInput(input);
    const entry = makeMoment(
      existing.id,
      existing.date,
      existing.createdAt,
      emotions,
      triggers,
      valence,
      note,
    );
    this.byId.set(id, entry);
    this.persist();
    return cloneMoment(entry);
  }

  /** Remove the identified moment. Throws MomentNotFoundError if unknown. */
  deleteMoment(id: string): void {
    if (!this.byId.has(id)) throw new MomentNotFoundError(id);
    this.byId.delete(id);
    this.persist();
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private sortedAscending(): MomentEntry[] {
    return [...this.byId.values()].sort(compareByCreatedAt);
  }

  /** Validate (fail loud) + dedupe an input into a canonical tag set. */
  private canonicalizeInput(input: MomentInput): {
    emotions: EmotionTag[];
    triggers: TriggerTag[];
    valence?: Valence;
    note?: string;
  } {
    if (!Array.isArray(input.emotions) || !input.emotions.every(isEmotionTag)) {
      throw new MomentValidationError('emotions must all be known emotion tags');
    }
    if (!Array.isArray(input.triggers) || !input.triggers.every(isTriggerTag)) {
      throw new MomentValidationError('triggers must all be known trigger tags');
    }
    const emotions = [...new Set(input.emotions)];
    const triggers = [...new Set(input.triggers)];
    if (emotions.length + triggers.length === 0) {
      throw new MomentValidationError('a moment needs at least one emotion or trigger');
    }
    if (input.valence !== undefined && !isValence(input.valence)) {
      throw new MomentValidationError(
        `valence must be an integer ${VALENCE_MIN}–${VALENCE_MAX} (got ${input.valence})`,
      );
    }
    if (input.note !== undefined && input.note.length > NOTE_MAX_LENGTH) {
      throw new MomentValidationError(
        `note exceeds ${NOTE_MAX_LENGTH} characters (got ${input.note.length})`,
      );
    }
    const trimmedNote = input.note === undefined || input.note === '' ? undefined : input.note;
    const base = input.valence === undefined ? { emotions, triggers } : { emotions, triggers, valence: input.valence };
    return trimmedNote === undefined ? base : { ...base, note: trimmedNote };
  }

  private snapshot(): PersistedMoments {
    return { version: SCHEMA_VERSION, entries: this.sortedAscending() };
  }

  private persist(): void {
    this.storage.set(STORAGE_KEY, serialize(this.snapshot()));
  }

  private hydrate(value: PersistedMoments): void {
    this.byId.clear();
    for (const entry of value.entries) this.byId.set(entry.id, entry);
  }

  /** Read → migrate → quarantine-if-anomalous → hydrate → restamp-if-needed. */
  private load(): void {
    const raw = this.storage.get(STORAGE_KEY);
    const outcome = migrate(raw);

    if (outcome.status === 'anomaly') {
      // Preserve the raw blob (never silently lose user data), then continue on the
      // best-effort recovered subset and surface the anomaly. The key carries a
      // unique UUID suffix: a timestamp alone is not collision-proof, and storage.set
      // is a blind put — two anomalies at the same instant would clobber the first blob.
      const detectedAtIso = this.now().toISOString();
      const quarantineKey = `${QUARANTINE_KEY_PREFIX}${detectedAtIso}-${this.generateId()}`;
      this.storage.set(quarantineKey, outcome.raw);
      this.hydrate(outcome.value);
      this.anomaly = {
        reason: outcome.reason,
        quarantineKey,
        recoveredEntryCount: outcome.value.entries.length,
        detectedAtIso,
      };
      // Reset the primary key to the clean recovered shape so the next launch reads a
      // valid envelope and does not re-quarantine the same blob.
      this.persist();
      return;
    }

    this.hydrate(outcome.value);
    // Restamp when the stored form is missing or non-canonical so subsequent loads
    // are pass-through.
    const canonical = serialize(outcome.value);
    if (raw !== canonical) this.storage.set(STORAGE_KEY, canonical);
  }
}

/** Build a canonical moment; omit `valence`/`note` when absent. Key order matches
 *  `canonicalMoment` in migrate.ts so writes and reloads serialize identically. */
function makeMoment(
  id: string,
  date: LocalCalendarDate,
  createdAt: string,
  emotions: EmotionTag[],
  triggers: TriggerTag[],
  valence: Valence | undefined,
  note: string | undefined,
): MomentEntry {
  const base = { id, date, createdAt, emotions, triggers };
  const withValence = valence === undefined ? base : { ...base, valence };
  return note === undefined ? withValence : { ...withValence, note };
}
