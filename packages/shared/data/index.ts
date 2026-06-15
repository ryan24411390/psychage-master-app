// ============================================================================
// Supabase data layer — Public API (@psychage/shared/data)
// ============================================================================
//
// The typed, dependency-injected boundary between the apps and Supabase. Consumers
// inject a `SupabaseLike` client (+ provenance) and call the typed read/write
// wrappers; deep imports into sibling files are not part of the public surface.
//
// Check-in WRITE path (`checkin-gate.ts`) is exported below. The write-flip slice is
// live — `CHECKIN_PERSISTENCE_ENABLED` is true and `writeCheckIn` upserts (best-effort,
// push-only), gated server-side by the mobile-write RLS (ADR-001 Accepted 2026-06-14).

// ── Record types (six tables) + §2 field bases + insert helpers ───────────────
export type {
  RowIdentity,
  WriteStamp,
  ForwardCompatFields,
  InsertInput,
  WriteContext,
  ProfileRecord,
  PreferredLanguage,
  OnboardingReason,
  PremiumStatus,
  CheckInRecord,
  DurationCategory,
  MatchedConditionSummary,
  NavigatorHistoryRecord,
  TherapistRole,
  TherapistLinkRecord,
  ShareType,
  ShareFormat,
  ShareHistoryRecord,
  JournalEntryRecord,
} from './types';

// ── DI seam: the injected client + platform claim, with safe no-op defaults ───
export {
  type PostgrestError,
  type PostgrestResult,
  type InsertValues,
  type UpsertOptions,
  type PostgrestBuilder,
  type SupabaseLike,
  type Platform,
  type PlatformClaimProvider,
  DataAccessError,
  noopSupabaseClient,
  defaultPlatformClaimProvider,
} from './adapters';

// ── Check-in WRITE path (write-flip slice — ADR-001 Accepted) ─────────────────
export {
  type CheckInInput,
  CHECKIN_PERSISTENCE_ENABLED,
  CHECK_IN_DAY_CONFLICT_TARGET,
  CheckInPersistenceDisabledError,
  writeCheckIn,
} from './checkin-gate';

// ── Live read/write wrappers ──────────────────────────────────────────────────
export {
  type ProfileUpsertInput,
  type NavigatorHistoryInput,
  type JournalEntryInput,
  type ShareHistoryInput,
  type TherapistLinkUpsertInput,
  unwrap,
  buildWriteStamp,
  readProfile,
  writeProfile,
  readCheckIns,
  readNavigatorHistory,
  writeNavigatorHistory,
  readJournalEntries,
  writeJournalEntry,
  readShareHistory,
  writeShareHistory,
  readTherapistLinks,
  writeTherapistLink,
} from './wrappers';

// ── Forward-only schema-version migration runner (Sacred Rule #13) ────────────
export {
  type DataMigrator,
  DATA_SCHEMA_VERSION,
  runForwardMigrations,
  migratorCount,
} from './migrations';
