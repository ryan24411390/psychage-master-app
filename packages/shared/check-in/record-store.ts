// CheckInRecordStore — the typed S3↔S4 boundary. Home (S3), the check-in sheet
// (S4), history (S7), and entry detail (S8) all read/write through this.
//
// LOCAL-ONLY. Writes to the injected Storage seam and nowhere else — no Supabase,
// no network, no sync (gated behind the SR-4 ADR), no analytics, no Sentry.
//
// THE TWO DATE RULES (the wrong-day bug class this store exists to prevent):
//   1. saveToday keys to the DEVICE'S LOCAL CALENDAR DAY AT SAVE TIME. A check-in
//      saved at 00:30 Wednesday is Wednesday's entry.
//   2. editEntry keys to THE ENTRY'S STORED DATE, never the edit-time clock.
//      Editing Tuesday's entry on Wednesday keeps it on Tuesday — the id and date
//      minted at creation are immutable; an edit overwrites only state/note.
// At most one entry exists per calendar day (saveToday overwrites today's).

import { toLocalCalendarDate } from './dates';
import {
  type AnomalyReason,
  compareByDate,
  migrate,
  QUARANTINE_KEY_PREFIX,
  type PersistedCheckIns,
  SCHEMA_VERSION,
  serialize,
  STORAGE_KEY,
} from './migrate';
import {
  type CheckInEntry,
  type CheckInState,
  CheckInEntryNotFoundError,
  CheckInValidationError,
  type CheckInStoreDeps,
  type LocalCalendarDate,
  NOTE_MAX_LENGTH,
  type Storage,
} from './types';

/**
 * A surfaced load anomaly. The raw blob is preserved verbatim at `quarantineKey`;
 * the store continued on a best-effort recovered subset of `recoveredEntryCount`
 * entries. Surfaced (not swallowed) so a later recovery UI / telemetry can act —
 * nothing the user wrote is lost.
 */
export interface CheckInAnomaly {
  readonly reason: AnomalyReason;
  readonly quarantineKey: string;
  readonly recoveredEntryCount: number;
  readonly detectedAtIso: string;
}

function cloneEntry(entry: CheckInEntry): CheckInEntry {
  return { ...entry };
}

export class CheckInRecordStore {
  private readonly storage: Storage;
  private readonly now: () => Date;
  private readonly generateId: () => string;

  private readonly byDate = new Map<LocalCalendarDate, CheckInEntry>();
  private reminderSightingsValue = 0;
  private anomaly: CheckInAnomaly | null = null;

  constructor(deps: CheckInStoreDeps) {
    this.storage = deps.storage;
    this.now = deps.now;
    this.generateId = deps.generateId;
    this.load();
  }

  // ── reads ────────────────────────────────────────────────────────────────

  /** Today's entry (device-local calendar day), or undefined. */
  getToday(): CheckInEntry | undefined {
    const entry = this.byDate.get(this.todayKey());
    return entry ? cloneEntry(entry) : undefined;
  }

  /** The entry with `id`, or undefined. */
  getEntry(id: string): CheckInEntry | undefined {
    const entry = this.findById(id);
    return entry ? cloneEntry(entry) : undefined;
  }

  /** The `n` most recent entries, newest first. `n <= 0` ⇒ []. */
  getRecent(n: number): CheckInEntry[] {
    if (!Number.isInteger(n) || n <= 0) return [];
    return this.sortedAscending()
      .reverse()
      .slice(0, n)
      .map(cloneEntry);
  }

  /** Entries within `[from, to]` inclusive, oldest first. Inverted bounds (from > to) yield []. */
  getRange(from: LocalCalendarDate, to: LocalCalendarDate): CheckInEntry[] {
    return this.sortedAscending()
      .filter((entry) => entry.date >= from && entry.date <= to)
      .map(cloneEntry);
  }

  /** Unwired meta counter — always 0 in A1 (nothing increments it yet). */
  get reminderSightings(): number {
    return this.reminderSightingsValue;
  }

  /** The most recent surfaced load anomaly, or null when the last load was clean. */
  get lastAnomaly(): CheckInAnomaly | null {
    return this.anomaly;
  }

  // ── writes ───────────────────────────────────────────────────────────────

  /**
   * Create today's entry, or OVERWRITE if today already has one. A same-day
   * re-save is an EDIT, not a second entry: the existing id and date are
   * preserved (Date Rule 1 minted them once); only state/note change. Note
   * omitted ⇒ cleared (overwrite, not merge).
   */
  saveToday(state: CheckInState, note?: string): CheckInEntry {
    this.assertValidState(state);
    this.assertValidNote(note);

    const date = this.todayKey();
    const existing = this.byDate.get(date);
    const id = existing ? existing.id : this.generateId();
    const entry = makeEntry(id, date, state, note);

    this.byDate.set(date, entry);
    this.persist();
    return cloneEntry(entry);
  }

  /**
   * Overwrite the identified entry's state/note. NEVER re-dates (Date Rule 2):
   * the entry keeps its stored date regardless of the edit-time clock. Note
   * omitted ⇒ cleared. Throws CheckInEntryNotFoundError if `id` is unknown.
   */
  editEntry(id: string, state: CheckInState, note?: string): CheckInEntry {
    this.assertValidState(state);
    this.assertValidNote(note);

    const existing = this.findById(id);
    if (!existing) throw new CheckInEntryNotFoundError(id);

    const entry = makeEntry(existing.id, existing.date, state, note);
    this.byDate.set(existing.date, entry);
    this.persist();
    return cloneEntry(entry);
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private todayKey(): LocalCalendarDate {
    return toLocalCalendarDate(this.now());
  }

  private findById(id: string): CheckInEntry | undefined {
    for (const entry of this.byDate.values()) {
      if (entry.id === id) return entry;
    }
    return undefined;
  }

  private sortedAscending(): CheckInEntry[] {
    return [...this.byDate.values()].sort(compareByDate);
  }

  private assertValidState(state: CheckInState): void {
    if (!Number.isInteger(state) || state < 0 || state > 4) {
      throw new CheckInValidationError(`state must be an integer 0..4, got ${String(state)}`);
    }
  }

  private assertValidNote(note: string | undefined): void {
    if (note !== undefined && note.length > NOTE_MAX_LENGTH) {
      throw new CheckInValidationError(
        `note exceeds ${NOTE_MAX_LENGTH} characters (got ${note.length})`,
      );
    }
  }

  private snapshot(): PersistedCheckIns {
    return {
      version: SCHEMA_VERSION,
      reminderSightings: this.reminderSightingsValue,
      entries: this.sortedAscending(),
    };
  }

  private persist(): void {
    this.storage.set(STORAGE_KEY, serialize(this.snapshot()));
  }

  private hydrate(value: PersistedCheckIns): void {
    this.byDate.clear();
    for (const entry of value.entries) this.byDate.set(entry.date, entry);
    this.reminderSightingsValue = value.reminderSightings;
  }

  /** Read → migrate → quarantine-if-anomalous → hydrate → restamp-if-needed. */
  private load(): void {
    const raw = this.storage.get(STORAGE_KEY);
    const outcome = migrate(raw);

    if (outcome.status === 'anomaly') {
      // Preserve the raw blob (never silently lose user data), then continue on
      // the best-effort recovered subset and surface the anomaly. The key carries
      // a unique suffix from generateId() (a UUID on device): the timestamp alone
      // is not collision-proof, and `storage.set` is a blind put — two anomalies
      // at the same instant on a timestamp-only key would clobber the first blob,
      // which is exactly the silent user-data loss the quarantine exists to prevent.
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
      // Reset the primary key to the clean recovered shape so the next launch
      // reads a valid envelope and does not re-quarantine the same blob.
      this.persist();
      return;
    }

    this.hydrate(outcome.value);
    // Restamp when the stored form is missing or non-canonical (null → empty,
    // re-sorted entries, normalized meta) so subsequent loads are pass-through.
    const canonical = serialize(outcome.value);
    if (raw !== canonical) this.storage.set(STORAGE_KEY, canonical);
  }
}

/** Build a canonical entry; omit `note` when absent (overwrite-not-merge semantics). */
function makeEntry(
  id: string,
  date: LocalCalendarDate,
  state: CheckInState,
  note: string | undefined,
): CheckInEntry {
  return note === undefined ? { id, date, state } : { id, date, state, note };
}
