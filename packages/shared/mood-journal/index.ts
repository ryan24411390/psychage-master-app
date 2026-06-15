// ============================================================================
// Mood Journal — Public API (@psychage/shared/mood-journal)
// ============================================================================
//
// The "patterns & triggers" layer. A person logs MOMENTS (emotions + triggers +
// optional note); the patterns functions surface what's been coming up over time.
// Mood itself is NOT recorded here — it stays single-sourced in the Daily Check-In
// record (@psychage/shared/check-in). The pattern view joins the two by calendar
// day on the consumer side.
//
// LOCAL-ONLY by construction (SR-4): the store writes the injected Storage seam and
// nowhere else. Moments never reach Supabase/analytics/Sentry. Storage/Clock/
// IdFactory are injected so the package stays dependency-free and the date rule
// stays device-free testable.

// Store
export { MoodJournalStore, type MoodJournalAnomaly } from './moment-store';

// Moment contract + injected seams + errors
export {
  type Clock,
  type IdFactory,
  type LocalCalendarDate,
  type MomentEntry,
  type MomentInput,
  MomentNotFoundError,
  MomentValidationError,
  type MoodJournalStoreDeps,
  NOTE_MAX_LENGTH,
  type Storage,
} from './types';

// Tag vocabularies (the closed emotion/trigger sets) + guards
export {
  EMOTION_TAGS,
  type EmotionTag,
  isEmotionTag,
  isTriggerTag,
  TRIGGER_TAGS,
  type TriggerTag,
} from './tags';

// Pattern aggregation (pure; callers pre-window the moment set)
export {
  type DayGroup,
  emotionFrequency,
  type TagCount,
  timeline,
  triggerFrequency,
  triggerMoodCoOccurrence,
  type TriggerMoodCoOccurrence,
} from './patterns';

// Local-calendar-date construction (re-exported from check-in so this barrel is
// self-sufficient — consumers build range bounds without a second import).
export { asLocalCalendarDate, isLocalCalendarDate, toLocalCalendarDate } from '../check-in/dates';

// Schema surface (observability — the migrator itself is internal to the store).
// STORAGE_KEY is deliberately NOT exported: a consumer holding it plus a Storage
// instance could write past validation. The store owns its key.
export { type AnomalyReason, SCHEMA_VERSION } from './migrate';
