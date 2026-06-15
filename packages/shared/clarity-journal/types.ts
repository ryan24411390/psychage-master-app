// Clarity Journal — domain types (mobile). Pure TypeScript; no user-facing copy
// lives here (clinical/instrument wording is the app's Dr. Dobson-gated fixture).
// LOCAL-ONLY by construction (SR-4): the store writes the injected Storage seam
// and nowhere else — never Supabase, analytics, or Sentry.

// ── Branded primitives ───────────────────────────────────────────────────────

/** A device-local calendar day, `YYYY-MM-DD`. Built only via dates.ts. */
export type LocalCalendarDate = string & { readonly __brand: 'LocalCalendarDate' };

/** An ISO-8601 timestamp string. */
export type IsoDateTime = string;

// ── Screeners ────────────────────────────────────────────────────────────────

/** Severity level for a screener. The APP maps this to educational copy (SR-3);
 *  the enum itself carries no diagnostic wording. */
export type ScoreLevel = 'low' | 'moderate' | 'elevated';

/** A 0-3 frequency item (PHQ-2 / GAD-2). */
export type FrequencyItem = 0 | 1 | 2 | 3;
/** A 0-4 stress item (PSS-4). */
export type StressItem = 0 | 1 | 2 | 3 | 4;
/** A 0-5 wellbeing item (WHO-5). */
export type WellbeingItem = 0 | 1 | 2 | 3 | 4 | 5;

export interface ScreenerScore {
  readonly score: number;
  readonly level: ScoreLevel;
}

export interface ScreenerResults {
  readonly phq2: ScreenerScore;
  readonly gad2: ScreenerScore;
  readonly pss4: ScreenerScore;
  readonly who5: ScreenerScore;
}

// ── Section entries ──────────────────────────────────────────────────────────

export type SleepQuality = 'poor' | 'fair' | 'good' | 'great';
export type ActivationType = 'mastery' | 'pleasure' | 'both';

/** S-2 daily journal check-in. Separate store from the standalone S4 check-in. */
export interface DailyJournalCheckIn {
  readonly id: string;
  readonly date: LocalCalendarDate;
  readonly createdAt: IsoDateTime;
  readonly mood: number; // 1-10
  readonly energy: number; // 1-10
  readonly sleptLastNight: boolean;
  readonly sleepHours?: number; // 0-24, step 0.5
  readonly sleepQuality?: SleepQuality;
  readonly note?: string;
  readonly tags: readonly string[];
}

/** S-3 weekly screening, keyed to the Monday `weekStart`. */
export interface WeeklyScreening {
  readonly id: string;
  readonly weekStart: LocalCalendarDate;
  readonly createdAt: IsoDateTime;
  readonly phq2: readonly [FrequencyItem, FrequencyItem];
  readonly gad2: readonly [FrequencyItem, FrequencyItem];
  readonly pss4: readonly [StressItem, StressItem];
  readonly who5: readonly [WellbeingItem, WellbeingItem];
}

/** S-4 CBT thought record. */
export interface ThoughtRecord {
  readonly id: string;
  readonly date: LocalCalendarDate;
  readonly createdAt: IsoDateTime;
  readonly situation: string;
  readonly automaticThought: string;
  readonly distortions: readonly string[]; // distortion ids (constants.COGNITIVE_DISTORTIONS)
  readonly evidenceFor: string;
  readonly evidenceAgainst: string;
  readonly balancedThought: string;
  readonly emotionBefore: number; // 0-10
  readonly emotionAfter: number; // 0-10
}

/** S-5 behavioral activation. `actualMood` absent ⇒ draft. */
export interface BehavioralActivation {
  readonly id: string;
  readonly date: LocalCalendarDate;
  readonly createdAt: IsoDateTime;
  readonly activity: string;
  readonly type: ActivationType;
  readonly predictedMood: number; // 0-10
  readonly actualMood?: number; // 0-10; absent = not yet rated
}

/** S-6 trigger & pattern log. */
export interface TriggerLog {
  readonly id: string;
  readonly date: LocalCalendarDate;
  readonly createdAt: IsoDateTime;
  readonly trigger: string;
  readonly severity: number; // 1-5
  readonly category: string;
  readonly subCategory?: string;
  readonly whatHelps?: string;
  readonly whatWorsens?: string;
  readonly effectiveness?: number; // 1-5
}

/** S-7 wellness toolbox — 4 fixed categories, each a list of user strategies. */
export interface WellnessToolbox {
  readonly updatedAt: IsoDateTime;
  readonly physical: readonly string[];
  readonly social: readonly string[];
  readonly mental: readonly string[];
  readonly professional: readonly string[];
}

export interface SafetyPlanContact {
  readonly label: string;
  readonly phone?: string;
}

/** S-7 6-section Stanley-Brown safety plan. */
export interface SafetyPlan {
  readonly updatedAt: IsoDateTime;
  /** Section number (1-6) → free-text lines. */
  readonly sections: Readonly<Record<1 | 2 | 3 | 4 | 5 | 6, readonly string[]>>;
  /** Section-4 crisis contacts; seeded with the region helpline (988 in US). */
  readonly crisisContacts: readonly SafetyPlanContact[];
}

/** S-8 weekly reflection, keyed to `weekStart`. */
export interface WeeklyReflection {
  readonly id: string;
  readonly weekStart: LocalCalendarDate;
  readonly createdAt: IsoDateTime;
  readonly wentWell: string;
  readonly wasDifficult: string;
  readonly patterns: string;
  readonly doNext: string;
  readonly gratitude: string;
}

/** Internal on-device crisis-detection marker. Never transmitted (SR-4). */
export interface SafetyFlag {
  readonly date: LocalCalendarDate;
  readonly source: 'keyword';
  readonly createdAt: IsoDateTime;
}

// ── DI seams (mirrors check-in/sleep; package stays dependency-free) ───────────

export interface Storage {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

/** Injected clock — no hidden `new Date()` in the store. */
export type Clock = () => Date;
/** Injected id factory — a UUID on device, deterministic in tests. */
export type IdFactory = () => string;

export interface ClarityJournalStoreDeps {
  readonly storage: Storage;
  readonly now: Clock;
  readonly generateId: IdFactory;
}

// ── Validation caps + errors ───────────────────────────────────────────────────

/** Free-text note cap (UTF-16 units) for the daily check-in note. */
export const NOTE_MAX_LENGTH = 280;
/** Free-text cap for the longer journal fields (situation, thought, evidence…). */
export const FIELD_MAX_LENGTH = 2000;

export class ClarityJournalValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClarityJournalValidationError';
  }
}

export class ClarityJournalEntryNotFoundError extends Error {
  constructor(id: string) {
    super(`No Clarity Journal entry with id "${id}"`);
    this.name = 'ClarityJournalEntryNotFoundError';
  }
}
