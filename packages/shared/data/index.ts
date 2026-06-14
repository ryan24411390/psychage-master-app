// ============================================================================
// Supabase data layer — Public API (@psychage/shared/data)
// ============================================================================
//
// The typed, dependency-injected boundary between the apps and Supabase. Consumers
// inject a `SupabaseLike` client (+ provenance) and call the typed read/write
// wrappers; deep imports into sibling files are not part of the public surface.
//
// GATED OUT (deliberately absent from this barrel): the check-in write path lives
// in `checkin-gate.ts` and is NOT re-exported. `CHECKIN_PERSISTENCE_ENABLED` is
// false and `writeCheckIn` early-throws until the platform-claim write-flip slice
// (AC-2.4 / AC-8.4). Reaching it requires a deep import, which the package
// `exports` map does not resolve.

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
  type PostgrestBuilder,
  type SupabaseLike,
  type Platform,
  type PlatformClaimProvider,
  DataAccessError,
  noopSupabaseClient,
  defaultPlatformClaimProvider,
} from './adapters';

// ── Live read/write wrappers (check-in WRITE is gated — not here) ─────────────
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
