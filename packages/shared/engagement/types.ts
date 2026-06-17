// Moments engine — domain types + the injected capability seams.
//
// A Moment is an AFFECT-LABELING primitive: a fast, user-initiated NAMING of a precise
// feeling (the prefrontal "name it to tame it" act), NOT a valence rating. The required
// act is choosing a word; everything else is optional. Moments are momentary and
// EVENT-BASED (many per day, each with its own instant) — the evolved daily check-in.
//
// The store sits on three injected capabilities so packages/shared stays dependency-free
// (CLAUDE.md: "No runtime dependencies") and the logic stays unit-testable without a
// device or a real clock:
//
//   - Storage    — the key-value seam (mobile injects its MMKV adapter; tests inject an
//                  in-memory Map). Structural mirror of apps/mobile/lib/adapters/storage —
//                  never imported from the app.
//   - Clock      — a `() => Date` source. A moment's `timestamp` is the FULL instant at
//                  capture (not a calendar day): event-based, time matters. The day-rollup
//                  derives the local calendar day from it (dates.ts).
//   - IdFactory  — a UUID minter. The id is CLIENT-MINTED so the cloud push can upsert on
//                  the primary key for idempotency. Tests inject a deterministic counter.
//
// VOCAB-AGNOSTIC. The store persists `labelPrimary`/`labelSecondary` as OPAQUE word keys.
// The curated vocabulary (and any band/valence a word maps to, used only by day-based read
// surfaces) lives APP-SIDE (apps/mobile/features/moments/vocab.ts) — the engine never
// interprets a word's meaning. This is why there is no `valence` here: affect is a property
// of the chosen WORD, resolved by the consumer, not a number the store holds.
//
// LOCAL-FIRST. The MMKV store is the source of truth; sync is a background, consent-gated
// backup + restore (ADR-001 / SR-4 carve-out — user-owned data, NOT telemetry).

/**
 * Optional magnitude of a named feeling — how strongly it's felt, NOT how pleasant it is.
 * Absent ⇒ the person named the feeling without grading its strength. Three coarse steps
 * keep capture fast (one tap, skippable).
 */
export type MomentIntensity = 'low' | 'med' | 'high';

/** The three intensity values, for validation + UI iteration. */
export const INTENSITY_VALUES: readonly MomentIntensity[] = ['low', 'med', 'high'];

/**
 * A device-local calendar day in `YYYY-MM-DD` form (zero-padded, fixed width so lexical
 * comparison equals chronological comparison). Branded to keep a raw time-bearing ISO
 * string out of a slot that means "the local day". Construct only through dates.ts
 * (`toLocalCalendarDate` / `asLocalCalendarDate`).
 */
export type LocalCalendarDate = string & { readonly __brand: 'LocalCalendarDate' };

/**
 * One captured Moment. `id` and `timestamp` are minted AT CAPTURE and immutable — moments
 * are append-only (there is no edit path in V1).
 *
 * `labelPrimary` is the REQUIRED naming — a curated-vocabulary word key (the prefrontal
 * act). `labelSecondary` is an optional single second word; `intensity` an optional
 * magnitude. `routedToSupport` is a DERIVED service-quality flag (never crisis content) —
 * it is DEFINED here but always `false` in V1: the acute-handoff threshold is a pending
 * clinical decision (Dr. Lena Dobson), so no routing rule is built. The SR-2 crisis pill
 * (GlobalHeader) is the safety floor.
 */
export interface Moment {
  readonly id: string;
  /** Full capture instant, ISO-8601 (`new Date().toISOString()`). */
  readonly timestamp: string;
  /** The named feeling — a curated-vocabulary word key (required: the naming IS the act). */
  readonly labelPrimary: string;
  /** An optional single second word (curated-vocabulary key). Absent ⇒ one word only. */
  readonly labelSecondary?: string;
  /** Optional magnitude (how strongly), NOT pleasantness. Absent ⇒ ungraded. */
  readonly intensity?: MomentIntensity;
  /** Optional one-line free text, ≤ NOTE_MAX_LENGTH UTF-16 units. Absent ⇒ no note. */
  readonly note?: string;
  /** DERIVED service-quality flag — always false in V1 (no acute-handoff rule built). */
  readonly routedToSupport: boolean;
}

/** The caller-supplied fields on capture; the store mints `id` + `timestamp`. */
export interface MomentDraft {
  readonly labelPrimary: string;
  readonly labelSecondary?: string;
  readonly intensity?: MomentIntensity;
  readonly note?: string;
  readonly routedToSupport?: boolean;
}

/**
 * A per-day PRESENCE summary derived from many moments — the vocab-agnostic bridge for
 * day-based surfaces. The engine carries no affect band (a word's band is an app-side
 * vocab property), so this summary is presence + the day's chosen words. The app's
 * day-rollup adapter (apps/mobile/lib/daily-rollup.ts) maps words → bands for the
 * affect-bearing surfaces (terrain, history, insights).
 */
export interface DayRollup {
  readonly date: LocalCalendarDate;
  readonly momentCount: number;
  readonly hasNote: boolean;
  /** Union of all words (primary + secondary) named that day, in first-seen order. */
  readonly labels: readonly string[];
}

/** Maximum length of an optional word key, in characters (guards corrupt/hand-edited blobs). */
export const LABEL_MAX_LENGTH = 64;
/** Maximum note length, in UTF-16 code units (one line; matches RN TextInput `maxLength`). */
export const NOTE_MAX_LENGTH = 80;

/**
 * Key-value persistence seam. Structurally identical to
 * apps/mobile/lib/adapters/storage's `Storage`; redeclared here because packages/shared
 * must not import from an app. Mobile's adapter satisfies it by structural typing; tests
 * pass a Map-backed literal.
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
export interface MomentStoreDeps {
  readonly storage: Storage;
  readonly now: Clock;
  readonly generateId: IdFactory;
}

/**
 * The adapter the app codes against: a local cache with a background sync behind it.
 * `MomentStore` implements the local half; the mobile `SyncingMomentStore` adds the push
 * (on append) and pull/restore (`ingestRemote`) without changing this surface.
 */
export interface EngagementStore {
  /** Capture a moment. Writes local immediately and returns the minted Moment. */
  append(draft: MomentDraft): Moment;
  /** The `n` most recent moments, newest first. `n <= 0` ⇒ []. */
  getRecent(n: number): Moment[];
  /** Moments whose local calendar day is within `[from, to]` inclusive, oldest first. */
  getRange(from: LocalCalendarDate, to: LocalCalendarDate): Moment[];
  /** All moments, oldest first. */
  getAll(): Moment[];
  /** Per-day presence summaries (oldest first), optionally bounded to `[from, to]`. */
  dayRollup(from?: LocalCalendarDate, to?: LocalCalendarDate): DayRollup[];
  /** Merge remote moments into the local cache (last-write-wins; restores on reinstall). */
  ingestRemote(remote: readonly Moment[]): void;
}

/**
 * Thrown when a write would violate the moment contract (missing/empty `labelPrimary`,
 * an invalid `intensity`, or a note over NOTE_MAX_LENGTH). Writes fail loud rather than
 * silently truncate/clamp — silent mutation of user input is the failure mode user-data
 * code must avoid.
 */
export class MomentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MomentValidationError';
  }
}
