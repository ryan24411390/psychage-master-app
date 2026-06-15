// ============================================================================
// Sleep Architect — Public API (@psychage/shared/sleep)
// ============================================================================
//
// The native Sleep Architect's domain layer: the local-only RecordStore plus the
// pure metric / score / chronotype / correlation functions. Screens consume this
// barrel; deep imports into sibling modules are not part of the public surface.
//
// LOCAL-ONLY by construction: the store writes the injected Storage seam and
// nowhere else. Sleep data never reaches Supabase/analytics/Sentry (SR-4).
// Storage/Clock/IdFactory are injected so the package stays dependency-free and
// the date rules stay device-free testable.
//
// SR-1: the composite score is computed as a 0–100 number, but `bandForScore` is
// the only sanctioned way to surface it — the app renders a band, never the number.

// Store
export { SleepRecordStore, type SleepAnomaly } from './record-store';

// Entry contract + injected seams + settings + errors
export {
  type BedtimeSuggestion,
  type ChronotypeAnimal,
  type ChronotypeCategory,
  type ChronotypeResult,
  type Clock,
  type IdFactory,
  type LocalCalendarDate,
  type NapEntry,
  SLEEP_NOTE_MAX,
  type SleepDebtResult,
  type SleepEntry,
  type SleepEntryInput,
  SleepEntryNotFoundError,
  type SleepMetrics,
  type SleepRating,
  type SleepScoreBreakdown,
  type SleepSettings,
  type SleepStoreDeps,
  type Storage,
  type StreakData,
  type SubstanceLog,
  SleepValidationError,
} from './types';

// Local-calendar-date construction (consumers build range bounds / today with these)
export { asLocalCalendarDate, dayNumber, isLocalCalendarDate, toLocalCalendarDate } from './dates';

// Pure calculations
export {
  calculateMetrics,
  calculateOptimalBedtimes,
  calculateSleepDebt,
  calculateSleepScore,
  calculateStreak,
  formatDuration,
  formatTime,
  minutesBetween,
  parseTime,
  windowByDays,
} from './calculations';

// SR-1 score band (the only way the score reaches the UI)
export { bandForScore, SLEEP_SCORE_BANDS, type SleepScoreBand } from './score-band';

// Chronotype
export { ANIMAL_PROFILES, getCategoryLabel, scoreChronotype } from './chronotype';

// Correlations (source-agnostic; the screen supplies the two dated series)
export {
  classifyCorrelation,
  correlate,
  type CorrelationResult,
  type CorrelationSignificance,
  type DatedValue,
  pearson,
} from './correlations';

// Local crisis-content detection (on-device safety net)
export { detectCrisisContent } from './crisis';

// Domain constants
export { CRISIS_KEYWORDS, DEFAULT_SLEEP_SETTINGS, SLEEP_RECOMMENDATIONS } from './constants';

// Schema surface (observability — the migrator itself is internal to the store).
// STORAGE_KEY is deliberately NOT exported: the store owns its key so no consumer
// can write past the validators / one-per-day rule.
export { type AnomalyReason, SCHEMA_VERSION } from './migrate';
