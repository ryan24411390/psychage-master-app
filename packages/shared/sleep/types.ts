// Sleep Architect — domain types + the injected capability seams.
//
// Ported from psychage-v2 `src/lib/sleep/types.ts`, adapted to the mobile
// LOCAL-ONLY persistence contract (mirrors @psychage/shared/check-in):
//
//   - `date` is a branded LocalCalendarDate (device-local YYYY-MM-DD), not a raw
//     time-bearing ISO string — the same wrong-day bug class the check-in store
//     guards. Construct only through dates.ts.
//   - The store sits on three injected capabilities (Storage / Clock / IdFactory)
//     so packages/shared stays dependency-free and the date rules stay testable
//     without a device or a real clock.
//   - Web's sync-only `updated_at` field is DROPPED: mobile is local-only (SR-4),
//     there is no remote to resolve conflicts against.
//
// LOCAL-ONLY. None of this is ever serialized to Supabase, analytics, or Sentry.

/** Self-rated 1..5 ordinal (1 = worst, 5 = best). UI labels are a screen concern. */
export type SleepRating = 1 | 2 | 3 | 4 | 5;

/**
 * A device-local calendar day in `YYYY-MM-DD` form (zero-padded, fixed width so
 * lexical comparison equals chronological comparison). Branded to keep a raw
 * `new Date().toISOString()` (UTC, time-bearing) out of a slot that means "the
 * local day". Construct only through dates.ts.
 */
export type LocalCalendarDate = string & { readonly __brand: 'LocalCalendarDate' };

/** A daytime nap window. */
export interface NapEntry {
  readonly start: string; // HH:MM
  readonly end: string; // HH:MM
}

/** Substances / behaviors logged alongside a night. Enrichment — not scored. */
export interface SubstanceLog {
  readonly caffeine_last_time?: string; // HH:MM
  readonly alcohol: boolean;
  readonly alcohol_units?: number;
  readonly screens_before_bed_minutes?: number;
  readonly exercise: boolean;
  readonly exercise_time?: string; // HH:MM
  readonly medication_sleep_aid: boolean;
}

/**
 * The editable payload of a night. `saveToday`/`editEntry` accept this; the store
 * mints `id` / `date` / `created_at`. At most one entry exists per calendar day.
 */
export interface SleepEntryInput {
  readonly bedtime: string; // HH:MM — got into bed
  readonly lights_out: string; // HH:MM — tried to sleep
  readonly sleep_onset_minutes: number; // latency
  readonly wake_time: string; // HH:MM — woke
  readonly out_of_bed_time: string; // HH:MM — got out of bed
  readonly night_wakings: number;
  readonly night_waking_duration_minutes: number; // total WASO
  readonly sleep_quality: SleepRating;
  readonly morning_mood: SleepRating;
  readonly dream_recall: boolean;
  readonly dream_notes?: string;
  readonly naps: readonly NapEntry[];
  readonly substances: SubstanceLog;
  readonly notes?: string;
}

/**
 * One logged night. `id` / `date` / `created_at` are minted AT CREATION and are
 * immutable — an edit overwrites the input fields but NEVER re-stamps them.
 */
export interface SleepEntry extends SleepEntryInput {
  readonly id: string;
  readonly date: LocalCalendarDate;
  readonly created_at: string; // ISO datetime (local clock at creation)
}

/** Maximum free-text length, in UTF-16 code units (notes + dream notes). */
export const SLEEP_NOTE_MAX = 1000;

// ─── Computed result shapes (pure) ───────────────────────────────────────────

export interface SleepMetrics {
  readonly time_in_bed_minutes: number;
  readonly total_sleep_minutes: number;
  readonly sleep_efficiency: number; // 0–100
  readonly sleep_latency_minutes: number;
  readonly wake_after_sleep_onset: number;
  readonly midpoint_of_sleep: string; // HH:MM
}

export interface SleepScoreBreakdown {
  readonly overall: number; // 0–100 — computed; UI renders a band, never this number (SR-1)
  readonly duration: number;
  readonly efficiency: number;
  readonly quality: number;
  readonly consistency: number;
  readonly latency: number;
}

export interface SleepDebtResult {
  readonly total_debt_minutes: number;
  readonly daily_deficits: { readonly date: string; readonly deficit_minutes: number }[];
  readonly recovery_days_estimate: number;
}

export interface StreakData {
  readonly current: number;
  readonly best: number;
  readonly last_logged_date: string;
  readonly weekly_count: number;
}

export interface BedtimeSuggestion {
  readonly bedtime: string;
  readonly cycles: number;
  readonly sleep_duration_minutes: number;
  readonly recommended: boolean;
}

// ─── Chronotype ──────────────────────────────────────────────────────────────

export type ChronotypeAnimal = 'lion' | 'bear' | 'wolf' | 'dolphin';
export type ChronotypeCategory =
  | 'definitely_morning'
  | 'moderately_morning'
  | 'neither'
  | 'moderately_evening'
  | 'definitely_evening';

export interface ChronotypeResult {
  readonly score: number; // 4–25 (rMEQ range)
  readonly category: ChronotypeCategory;
  readonly animal: ChronotypeAnimal;
  readonly label: string;
  readonly description: string;
  readonly ideal_bedtime: string;
  readonly ideal_wake_time: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface SleepSettings {
  readonly target_sleep_minutes: number;
  readonly age_range: string;
  readonly chronotype?: ChronotypeAnimal;
  readonly target_bedtime?: string;
  readonly target_wake_time?: string;
}

// ─── Injected seams (mirror @psychage/shared/check-in) ───────────────────────

/**
 * Key-value persistence seam. Structurally identical to
 * apps/mobile/lib/adapters/storage's `Storage`; redeclared here because
 * packages/shared must not import from an app. Mobile's adapter satisfies it by
 * structural typing; tests pass a Map-backed literal.
 */
export interface Storage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** Injected clock. Production: `() => new Date()`. Tests: a fixed instant. */
export type Clock = () => Date;

/** Injected UUID/id minter. Production: app id factory. Tests: a deterministic counter. */
export type IdFactory = () => string;

/** The three capabilities the store is constructed with. */
export interface SleepStoreDeps {
  readonly storage: Storage;
  readonly now: Clock;
  readonly generateId: IdFactory;
}

// ─── Errors (fail loud — never silently clamp/truncate user data) ────────────

/** Thrown when a write would violate the entry contract (bad time, rating, length, …). */
export class SleepValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SleepValidationError';
  }
}

/** Thrown when `editEntry` targets an id that does not exist. */
export class SleepEntryNotFoundError extends Error {
  readonly id: string;
  constructor(id: string) {
    super(`No sleep entry with id "${id}"`);
    this.name = 'SleepEntryNotFoundError';
    this.id = id;
  }
}
