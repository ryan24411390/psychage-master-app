// MomentStore — the local-first source of truth for the Moments engine. The capture
// flow, history, reflection, compass, insights, and the therapist export all read
// through this (the day-based surfaces via the app's day-rollup adapter over getAll()).
//
// LOCAL-FIRST. Writes to the injected Storage seam immediately. The mobile
// SyncingMomentStore wraps this with a background, consent-gated push (on append) and
// pull/restore (`ingestRemote`) — but this class never does I/O beyond Storage.
//
// Moments are EVENT-BASED and APPEND-ONLY: many per day, no edit path in V1. `id` and
// `timestamp` are minted at capture and immutable. The id is client-minted so the cloud
// push upserts on the primary key (re-push updates, never duplicates).
//
// VOCAB-AGNOSTIC: the store treats `labelPrimary`/`labelSecondary` as opaque word keys.
// It validates SHAPE (present, length, intensity enum), never a word's MEANING.

import {
  compareByTimestamp,
  type AnomalyReason,
  migrate,
  QUARANTINE_KEY_PREFIX,
  type PersistedMoments,
  SCHEMA_VERSION,
  serialize,
  STORAGE_KEY,
} from './migrate';
import { timestampToLocalCalendarDate } from './dates';
import {
  type DayRollup,
  type EngagementStore,
  INTENSITY_VALUES,
  LABEL_MAX_LENGTH,
  type LocalCalendarDate,
  type Moment,
  type MomentDraft,
  type MomentIntensity,
  type MomentStoreDeps,
  MomentValidationError,
  NOTE_MAX_LENGTH,
  type Storage,
} from './types';

/**
 * A surfaced load anomaly. The raw blob is preserved verbatim at `quarantineKey`; the
 * store continued on a best-effort recovered subset of `recoveredMomentCount` moments.
 * Surfaced (not swallowed) so a later recovery UI / telemetry can act — nothing the user
 * wrote is lost.
 */
export interface MomentAnomaly {
  readonly reason: AnomalyReason;
  readonly quarantineKey: string;
  readonly recoveredMomentCount: number;
  readonly detectedAtIso: string;
}

// A Moment carries only scalars + optional strings (no nested arrays), so a shallow copy
// is a full defensive copy.
function cloneMoment(moment: Moment): Moment {
  return { ...moment };
}

/**
 * Merge remote moments into a local set. Last-write-wins by id; since moments are
 * append-only (no edits), a shared id means the local and remote copies are the same
 * capture — local wins the tie (it is the source of truth). Remote-only ids are adopted
 * (this is what restores history after a reinstall). Pure: used by the store's
 * `ingestRemote` and unit-testable in isolation.
 */
export function mergeMoments(local: readonly Moment[], remote: readonly Moment[]): Moment[] {
  const byId = new Map<string, Moment>();
  for (const m of remote) byId.set(m.id, cloneMoment(m));
  for (const m of local) byId.set(m.id, cloneMoment(m)); // local overlays remote on tie
  return [...byId.values()].sort(compareByTimestamp);
}

export class MomentStore implements EngagementStore {
  private readonly storage: Storage;
  private readonly now: () => Date;
  private readonly generateId: () => string;

  private readonly byId = new Map<string, Moment>();
  private anomaly: MomentAnomaly | null = null;

  constructor(deps: MomentStoreDeps) {
    this.storage = deps.storage;
    this.now = deps.now;
    this.generateId = deps.generateId;
    this.load();
  }

  // ── reads ────────────────────────────────────────────────────────────────

  /** All moments, oldest first. */
  getAll(): Moment[] {
    return this.sortedAscending().map(cloneMoment);
  }

  /** The `n` most recent moments, newest first. `n <= 0` ⇒ []. */
  getRecent(n: number): Moment[] {
    if (!Number.isInteger(n) || n <= 0) return [];
    return this.sortedAscending().reverse().slice(0, n).map(cloneMoment);
  }

  /** Moments whose LOCAL calendar day is within `[from, to]` inclusive, oldest first. */
  getRange(from: LocalCalendarDate, to: LocalCalendarDate): Moment[] {
    return this.sortedAscending()
      .filter((m) => {
        const day = timestampToLocalCalendarDate(m.timestamp);
        return day >= from && day <= to;
      })
      .map(cloneMoment);
  }

  /**
   * Per-day PRESENCE summaries (oldest first), optionally bounded to `[from, to]`. The
   * vocab-agnostic bridge: groups the event-based stream by local calendar day and carries
   * presence (count), whether any note was written, and the union of words named that day.
   * No affect band lives here — a word's band is an app-side vocab property; the app's
   * day-rollup adapter (apps/mobile/lib/daily-rollup.ts) derives bands for the
   * affect-bearing surfaces.
   */
  dayRollup(from?: LocalCalendarDate, to?: LocalCalendarDate): DayRollup[] {
    const byDay = new Map<LocalCalendarDate, Moment[]>();
    for (const m of this.sortedAscending()) {
      const day = timestampToLocalCalendarDate(m.timestamp);
      if (from !== undefined && day < from) continue;
      if (to !== undefined && day > to) continue;
      const bucket = byDay.get(day);
      if (bucket) bucket.push(m);
      else byDay.set(day, [m]);
    }

    const rollups: DayRollup[] = [];
    for (const [date, moments] of byDay) {
      const labels: string[] = [];
      const seen = new Set<string>();
      let hasNote = false;
      for (const m of moments) {
        for (const word of [m.labelPrimary, m.labelSecondary]) {
          if (word !== undefined && !seen.has(word)) {
            seen.add(word);
            labels.push(word);
          }
        }
        if (m.note !== undefined && m.note.length > 0) hasNote = true;
      }
      rollups.push({ date, momentCount: moments.length, hasNote, labels });
    }
    return rollups.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }

  /** The most recent surfaced load anomaly, or null when the last load was clean. */
  get lastAnomaly(): MomentAnomaly | null {
    return this.anomaly;
  }

  // ── writes ───────────────────────────────────────────────────────────────

  /**
   * Capture a moment. Mints `id` + `timestamp`, validates, persists, and returns the full
   * Moment. Append-only — a fresh id every call (never overwrites). Throws
   * MomentValidationError on an invalid draft (fail loud, never clamp).
   */
  append(draft: MomentDraft): Moment {
    this.assertValidLabel('labelPrimary', draft.labelPrimary, true);
    this.assertValidLabel('labelSecondary', draft.labelSecondary, false);
    this.assertValidIntensity(draft.intensity);
    this.assertValidNote(draft.note);

    const moment = makeMoment(
      this.generateId(),
      this.now().toISOString(),
      draft.labelPrimary,
      draft.labelSecondary,
      draft.intensity,
      draft.note,
      draft.routedToSupport ?? false,
    );
    this.byId.set(moment.id, moment);
    this.persist();
    return cloneMoment(moment);
  }

  /**
   * Merge remote moments into the local cache (last-write-wins) and persist. This is the
   * pull/restore half of sync: on a fresh install the local cache is empty and this
   * repopulates it from the user's account (history survives reinstall).
   */
  ingestRemote(remote: readonly Moment[]): void {
    const merged = mergeMoments([...this.byId.values()], remote);
    const before = this.byId.size;
    this.byId.clear();
    for (const m of merged) this.byId.set(m.id, m);
    // Persist only when the merge actually changed the set (avoids a redundant write when
    // a pull returns nothing new).
    if (this.byId.size !== before || remote.length > 0) this.persist();
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private sortedAscending(): Moment[] {
    return [...this.byId.values()].sort(compareByTimestamp);
  }

  private assertValidLabel(field: string, value: string | undefined, required: boolean): void {
    if (value === undefined) {
      if (required) throw new MomentValidationError(`${field} is required (the naming is the act)`);
      return;
    }
    if (typeof value !== 'string' || value.length === 0 || value.length > LABEL_MAX_LENGTH) {
      throw new MomentValidationError(`${field} must be a 1..${LABEL_MAX_LENGTH}-char word key`);
    }
  }

  private assertValidIntensity(intensity: MomentIntensity | undefined): void {
    if (intensity !== undefined && !INTENSITY_VALUES.includes(intensity)) {
      throw new MomentValidationError(
        `intensity must be one of ${INTENSITY_VALUES.join('/')}, got ${String(intensity)}`,
      );
    }
  }

  private assertValidNote(note: string | undefined): void {
    if (note !== undefined && note.length > NOTE_MAX_LENGTH) {
      throw new MomentValidationError(
        `note exceeds ${NOTE_MAX_LENGTH} characters (got ${note.length})`,
      );
    }
  }

  private snapshot(): PersistedMoments {
    return { version: SCHEMA_VERSION, moments: this.sortedAscending() };
  }

  private persist(): void {
    this.storage.set(STORAGE_KEY, serialize(this.snapshot()));
  }

  private hydrate(value: PersistedMoments): void {
    this.byId.clear();
    for (const m of value.moments) this.byId.set(m.id, m);
  }

  /** Read → migrate → quarantine-if-anomalous → hydrate → restamp-if-needed. */
  private load(): void {
    const raw = this.storage.get(STORAGE_KEY);
    const outcome = migrate(raw);

    if (outcome.status === 'anomaly') {
      // Preserve the raw blob (never silently lose user data), then continue on the
      // best-effort recovered subset and surface the anomaly. The key carries a unique
      // suffix from generateId() so two anomalies at the same instant cannot clobber each
      // other (a blind storage.set would otherwise lose the first blob).
      const detectedAtIso = this.now().toISOString();
      const quarantineKey = `${QUARANTINE_KEY_PREFIX}${detectedAtIso}-${this.generateId()}`;
      this.storage.set(quarantineKey, outcome.raw);
      this.hydrate(outcome.value);
      this.anomaly = {
        reason: outcome.reason,
        quarantineKey,
        recoveredMomentCount: outcome.value.moments.length,
        detectedAtIso,
      };
      this.persist();
      return;
    }

    this.hydrate(outcome.value);
    const canonical = serialize(outcome.value);
    if (raw !== canonical) this.storage.set(STORAGE_KEY, canonical);
  }
}

/** Build a canonical moment; omit absent optionals (overwrite-not-merge semantics). */
function makeMoment(
  id: string,
  timestamp: string,
  labelPrimary: string,
  labelSecondary: string | undefined,
  intensity: MomentIntensity | undefined,
  note: string | undefined,
  routedToSupport: boolean,
): Moment {
  return {
    id,
    timestamp,
    labelPrimary,
    routedToSupport,
    ...(labelSecondary !== undefined ? { labelSecondary } : {}),
    ...(intensity !== undefined ? { intensity } : {}),
    ...(note !== undefined ? { note } : {}),
  };
}
