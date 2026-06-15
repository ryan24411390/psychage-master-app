// ============================================================================
// Clarity Journal — Public API (@psychage/shared/clarity-journal)
// ============================================================================
//
// The native Clarity Journal's pure domain layer. LOCAL-ONLY by construction
// (SR-4): nothing here transmits to Supabase/analytics/Sentry. No user-facing
// copy lives here — instrument wording, screener level labels, and section copy
// are the app's Dr. Dobson-gated fixture (SR-3).
//
// Slice S1 (this file): types + dates + screener scoring + constants.
// Forthcoming slices add: record-store + migrate, insights, report.

// Types + DI seams + errors
export {
  type ActivationType,
  type BehavioralActivation,
  type Clock,
  ClarityJournalEntryNotFoundError,
  ClarityJournalValidationError,
  type ClarityJournalStoreDeps,
  type DailyJournalCheckIn,
  FIELD_MAX_LENGTH,
  type FrequencyItem,
  type IdFactory,
  type IsoDateTime,
  type LocalCalendarDate,
  NOTE_MAX_LENGTH,
  type SafetyFlag,
  type SafetyPlan,
  type SafetyPlanContact,
  type ScoreLevel,
  type ScreenerResults,
  type ScreenerScore,
  type SleepQuality,
  type Storage,
  type StressItem,
  type ThoughtRecord,
  type TriggerLog,
  type WeeklyReflection,
  type WeeklyScreening,
  type WellbeingItem,
  type WellnessToolbox,
} from './types';

// Local-calendar-date helpers
export {
  asLocalCalendarDate,
  dayNumber,
  isLocalCalendarDate,
  toLocalCalendarDate,
  weekStart,
} from './dates';

// Screener scoring (byte-parity with web)
export {
  classifyGAD2,
  classifyPHQ2,
  classifyPSS4,
  classifyWHO5,
  scoreGAD2,
  scorePHQ2,
  scorePSS4,
  scoreScreening,
  scoreWHO5,
} from './scoring';

// Structural + scoring constants
export {
  ACTIVATION_TYPES,
  COGNITIVE_DISTORTIONS,
  type CognitiveDistortion,
  DAILY_TAGS,
  type DailyTag,
  DEFAULT_CRISIS_CONTACT,
  EMOTION_MAX,
  EMOTION_MIN,
  FREQUENCY_VALUES,
  GAD2_THRESHOLDS,
  MOOD_MAX,
  MOOD_MIN,
  PHQ2_THRESHOLDS,
  PSS4_THRESHOLDS,
  SAFETY_PLAN_CONTACT_SECTIONS,
  SAFETY_PLAN_SECTION_NUMBERS,
  SEVERITY_MAX,
  SEVERITY_MIN,
  STRESS_VALUES,
  WELLBEING_VALUES,
  WELLNESS_CATEGORY_IDS,
  type WellnessCategoryId,
  WHO5_THRESHOLDS,
} from './constants';
