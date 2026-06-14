// Daily Check-In — domain types + the injected capability seams.
//
// Pure, platform-agnostic. The store sits on three injected capabilities so
// packages/shared stays dependency-free (CLAUDE.md: "No runtime dependencies")
// and the date rules stay unit-testable without a device or a real clock:
//
//   - Storage    — the key-value seam (mobile injects its MMKV adapter; tests
//                  inject an in-memory Map). Structural mirror of
//                  apps/mobile/lib/adapters/storage — never imported from the app.
//   - Clock      — a `() => Date` source. The two date rules (see record-store)
//                  key new entries to the device's LOCAL calendar day at SAVE
//                  time; injecting the clock is what lets the midnight-crossing
//                  case be proven deterministically.
//   - IdFactory  — a UUID minter. RN has no built-in crypto.randomUUID without a
//                  polyfill, so the app injects expo-crypto; tests inject a
//                  deterministic counter so "edit never re-stamps the id" is
//                  assertable.
//
// LOCAL-ONLY. None of this is ever serialized to Supabase, analytics, or Sentry
// (Sacred Rule #4 sibling: check-in sync is gated behind the SR-4 ADR).

/**
 * Mood/affect state recorded by a check-in. A 0..4 ordinal scale; the labels
 * and colors are a UI concern (Slices 2–5), not the store's.
 */
export type CheckInState = 0 | 1 | 2 | 3 | 4;

/**
 * A device-local calendar day in `YYYY-MM-DD` form (zero-padded, fixed width so
 * lexical comparison equals chronological comparison). Branded to keep a raw
 * `new Date().toISOString()` (UTC, time-bearing) out of a slot that means "the
 * local day" — that confusion is the wrong-day bug class this store guards.
 * Construct only through dates.ts (`toLocalCalendarDate` / `asLocalCalendarDate`).
 */
export type LocalCalendarDate = string & { readonly __brand: 'LocalCalendarDate' };

/**
 * One check-in. `id` and `date` are minted AT CREATION and are immutable — an
 * edit overwrites `state`/`note` but NEVER re-stamps `id` or `date`. At most one
 * entry exists per calendar day.
 */
export interface CheckInEntry {
  readonly id: string;
  readonly date: LocalCalendarDate;
  readonly state: CheckInState;
  /** Optional free-text, max NOTE_MAX_LENGTH UTF-16 units. Absent ⇒ no note. */
  readonly note?: string;
}

/** Maximum note length, in UTF-16 code units (matches RN TextInput `maxLength`). */
export const NOTE_MAX_LENGTH = 24;

/**
 * Key-value persistence seam. Structurally identical to
 * apps/mobile/lib/adapters/storage's `Storage`; redeclared here because
 * packages/shared must not import from an app. Mobile's adapter satisfies it
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
export interface CheckInStoreDeps {
  readonly storage: Storage;
  readonly now: Clock;
  readonly generateId: IdFactory;
}

/**
 * Thrown when a write would violate the entry contract (state out of 0..4, note
 * over NOTE_MAX_LENGTH). Writes fail loud rather than silently truncate/clamp —
 * silent mutation of user input is the failure mode user-data code must avoid.
 */
export class CheckInValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckInValidationError';
  }
}

/** Thrown when `editEntry` targets an id that does not exist. */
export class CheckInEntryNotFoundError extends Error {
  readonly id: string;
  constructor(id: string) {
    super(`No check-in entry with id "${id}"`);
    this.name = 'CheckInEntryNotFoundError';
    this.id = id;
  }
}
