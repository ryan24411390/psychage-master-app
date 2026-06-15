// Mood Journal — domain types + injected capability seams.
//
// The "patterns & triggers" layer. Mood itself is NOT recorded here — it stays
// single-sourced in the Daily Check-In record (CheckInRecordStore). A MomentEntry
// captures only the net-new dimension: which emotions/triggers a person noted, and
// when. The pattern view joins these to the check-in record by calendar day
// (mobile side) to surface what's been coming up — never re-recording mood.
//
// Pure + platform-agnostic, on the same three injected seams as check-in so the
// package stays dependency-free (packages/shared: "No runtime dependencies") and
// the date rule stays unit-testable without a device or a real clock.
//
// LOCAL-ONLY (SR-4). A moment never leaves the device — not to Supabase, not to
// analytics, not to Sentry. The store writes the injected Storage seam and nowhere
// else.
//
// The `LocalCalendarDate` brand is REUSED from check-in (not re-minted) so a
// moment's `date` and a check-in's `date` are the same branded type — the pattern
// join is then type-clean, with one source of truth for "the device's local day".

import type { LocalCalendarDate } from '../check-in/types';
import type { EmotionTag, TriggerTag } from './tags';

export type { LocalCalendarDate };

/**
 * One logged moment. `id`, `date`, and `createdAt` are minted AT CREATION and are
 * immutable — an edit overwrites `emotions`/`triggers`/`note` but NEVER re-stamps
 * them. Unlike a check-in, MANY moments may share a calendar day; `createdAt` (an
 * ISO-8601 instant) orders them within the day.
 */
export interface MomentEntry {
  readonly id: string;
  readonly date: LocalCalendarDate;
  /** ISO-8601 instant the moment was created. Orders moments within a day; immutable. */
  readonly createdAt: string;
  readonly emotions: readonly EmotionTag[];
  readonly triggers: readonly TriggerTag[];
  /** Optional free text, max NOTE_MAX_LENGTH UTF-16 units. Absent ⇒ no note. */
  readonly note?: string;
}

/** Maximum note length, in UTF-16 code units (bounds on-device storage; web had no cap). */
export const NOTE_MAX_LENGTH = 280;

/** The fields a write supplies; `id`/`date`/`createdAt` are minted by the store. */
export interface MomentInput {
  readonly emotions: readonly EmotionTag[];
  readonly triggers: readonly TriggerTag[];
  readonly note?: string;
}

/**
 * Key-value persistence seam. Structurally identical to check-in's `Storage` and to
 * apps/mobile/lib/adapters/storage; re-declared here so the mood-journal module owns
 * its seam and depends on no sibling module's contract. Mobile's adapter satisfies it
 * by structural typing; tests pass a Map-backed literal.
 */
export interface Storage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** Injected clock. Production: `() => new Date()`. Tests: a fixed instant. */
export type Clock = () => Date;

/** Injected UUID minter. Production: expo-crypto. Tests: a deterministic counter. */
export type IdFactory = () => string;

/** The three capabilities the store is constructed with. */
export interface MoodJournalStoreDeps {
  readonly storage: Storage;
  readonly now: Clock;
  readonly generateId: IdFactory;
}

/**
 * Thrown when a write would violate the moment contract (unknown tag, no tags at
 * all, note over NOTE_MAX_LENGTH). Writes fail loud rather than silently drop/clamp
 * — silent mutation of user input is the failure mode user-data code must avoid.
 */
export class MomentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MomentValidationError';
  }
}

/** Thrown when `editMoment` / `deleteMoment` targets an id that does not exist. */
export class MomentNotFoundError extends Error {
  readonly id: string;
  constructor(id: string) {
    super(`No moment with id "${id}"`);
    this.name = 'MomentNotFoundError';
    this.id = id;
  }
}
