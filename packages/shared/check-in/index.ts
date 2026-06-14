// ============================================================================
// Daily Check-In — Public API (@psychage/shared/check-in)
// ============================================================================
//
// The typed S3↔S4 boundary. Home (S3), the check-in sheet (S4), history (S7),
// and entry detail (S8) consume the RecordStore through this barrel; deep imports
// into sibling modules are not part of the public surface.
//
// LOCAL-ONLY by construction: the store writes to the injected Storage seam and
// nowhere else. Check-in data never reaches Supabase/analytics/Sentry (sync is
// gated behind the SR-4 ADR). Storage/Clock/IdFactory are injected so the package
// stays dependency-free and the date rules stay device-free testable.

// Store
export { CheckInRecordStore, type CheckInAnomaly } from './record-store';

// Entry contract + injected seams + errors
export {
  type CheckInEntry,
  type CheckInState,
  type CheckInStoreDeps,
  type Clock,
  type IdFactory,
  type LocalCalendarDate,
  type Storage,
  NOTE_MAX_LENGTH,
  CheckInValidationError,
  CheckInEntryNotFoundError,
} from './types';

// Local-calendar-date construction (consumers build range bounds with these)
export { asLocalCalendarDate, isLocalCalendarDate, toLocalCalendarDate } from './dates';

// Schema surface (observability — the migrator itself is internal to the store).
// STORAGE_KEY is deliberately NOT exported: a consumer holding it plus a Storage
// instance could write past assertValidState/assertValidNote/one-per-day. The
// store owns its key; the migrator (migrate/serialize/normalizeEntries) stays internal.
export { type AnomalyReason, SCHEMA_VERSION } from './migrate';
