// Supabase data layer — typed records for the six V1 personal-data tables.
//
// Pure types, no runtime deps (packages/shared/CLAUDE.md). The shapes mirror the
// applied V1 schema in ARCHITECTURE.md §2 (forward-compat fields) + §3 (per-table
// columns). The data layer talks to Supabase only through an injected adapter
// (see adapters.ts) — these records are the typed payloads that cross that seam.
//
// SR-4: `NavigatorHistoryRecord` is summary-only — there is deliberately NO
// raw-symptom field. Raw symptom selections never reach Supabase.

// ── §2 forward-compat fields (ARCHITECTURE.md §2) ──────────────────────────────
// Every personal-data row carries these. `profiles` is the documented exception
// (user_id is its PK; no id/device_id/client_version) — see ProfileRecord.

/** Row identity + lifecycle timestamps. ISO-8601 strings (timestamptz on the wire). */
export interface RowIdentity {
  readonly id: string;
  readonly user_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/** The provenance/versioning fields a write wrapper stamps on every insert. */
export interface WriteStamp {
  /** The device that wrote this row (V2 conflict resolution + debugging). */
  readonly device_id: string;
  /** e.g. "mobile@1.0.3". */
  readonly client_version: string;
  /** Per-row schema version (Sacred Rule #13). Ships at 1. */
  readonly schema_version: number;
}

/** The full §2 set inherited by the five non-profile personal-data tables. */
export type ForwardCompatFields = RowIdentity & WriteStamp;

// ── Insert/stamp helpers (used by wrappers + the gated check-in write) ─────────

/** Server-managed columns (DB defaults) — never sent by the client on insert. */
type ServerManaged = 'id' | 'created_at' | 'updated_at';

/** Fields a write wrapper stamps automatically, not supplied by the caller. */
type StampedKeys = keyof WriteStamp;

/** A record reduced to the fields a caller supplies on insert. */
export type InsertInput<T> = Omit<T, ServerManaged | StampedKeys>;

/** Caller-provided provenance for a write; the wrapper turns this into a WriteStamp. */
export interface WriteContext {
  readonly device_id: string;
  readonly client_version: string;
}

// ── Record types (six tables) ─────────────────────────────────────────────────

/** Profile language preference (ARCHITECTURE.md §3 check constraint). */
export type PreferredLanguage = 'en' | 'pt' | 'es' | 'sv' | 'fr';
/** Onboarding intent bucket. */
export type OnboardingReason = 'curious' | 'struggling' | 'supporting';
/** Premium subscription state. */
export type PremiumStatus = 'free' | 'premium';

/**
 * `profiles` — the PII home (Sacred Rule #11). Other tables join here via
 * `user_id`. §2 exception: `user_id` is the PK; no `id`/`device_id`/`client_version`.
 */
export interface ProfileRecord {
  readonly user_id: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly schema_version: number;
  readonly display_name?: string;
  readonly preferred_language: PreferredLanguage;
  readonly onboarding_reason?: OnboardingReason;
  /** Local time-of-day "HH:MM[:SS]". */
  readonly daily_check_in_time?: string;
  readonly daily_check_in_enabled?: boolean;
  /** ISO country code, for crisis-resource defaults. */
  readonly region?: string;
  readonly premium_status: PremiumStatus;
  readonly premium_until?: string;
}

/**
 * `check_ins` — daily mood check-in. Schema is applied in V1, but the WRITE path
 * is gated OFF (checkin-gate.ts); only the read wrapper is live.
 */
export interface CheckInRecord extends ForwardCompatFields {
  /** 1..10 (DB check constraint). */
  readonly mood_score: number;
  /** When the user says they felt this; can differ from created_at. */
  readonly experienced_at: string;
  /** Which contextual prompt was answered, e.g. "what_on_mind". */
  readonly prompt_id?: string;
  /** Free text, ≤ 2000 chars (DB check constraint). */
  readonly prompt_response?: string;
  /** Non-PII metadata (timezone, language, etc.). */
  readonly context: Record<string, unknown>;
}

/** Bucketed duration (ARCHITECTURE.md §3 — never an exact figure). */
export type DurationCategory = 'acute' | 'subacute' | 'chronic';

/**
 * One matched condition in a navigator summary. `confidence` is produced upstream
 * by `@psychage/shared/navigator` and is ≤ 0.75 (Sacred Rule #1). The data layer
 * never computes or raises it.
 */
export interface MatchedConditionSummary {
  readonly condition_id: string;
  readonly confidence: number;
  readonly tier: string;
}

/**
 * `navigator_history` — SUMMARY ONLY (Sacred Rule #4). No raw-symptom column
 * exists. `crisis_triggered` is a service-quality boolean only — the crisis flow
 * content never lands here.
 */
export interface NavigatorHistoryRecord extends ForwardCompatFields {
  readonly matched_conditions: readonly MatchedConditionSummary[];
  readonly duration_category: DurationCategory;
  readonly flow_completed: boolean;
  readonly crisis_triggered: boolean;
  /** What the user did next: "saved", "shared", "abandoned", etc. */
  readonly outcome?: string;
}

/** Therapist/provider role (ARCHITECTURE.md §3 check constraint). */
export type TherapistRole = 'therapist' | 'psychiatrist' | 'primary_care' | 'other';

/**
 * `therapist_links` — PLAINTEXT-FACING shape. At rest, email/phone/notes are
 * pgsodium-encrypted bytea (US-4); the `get_/upsert_therapist_link` RPCs handle
 * the cipher boundary, so callers of this layer see plaintext. PII (Sacred Rule #11).
 */
export interface TherapistLinkRecord extends ForwardCompatFields {
  readonly display_name: string;
  /** ≤ 320 chars (validated pre-encrypt in the RPC). */
  readonly email?: string;
  /** E.164, ^\+[1-9]\d{1,14}$ (validated pre-encrypt in the RPC). */
  readonly phone_e164?: string;
  readonly role: TherapistRole;
  readonly treats_tags: readonly string[];
  readonly session_frequency?: string;
  /** ≤ 2000 chars (validated pre-encrypt in the RPC). */
  readonly notes?: string;
}

/** What kind of artifact was shared. */
export type ShareType = 'navigator_result' | 'check_in_summary' | 'journal_export' | 'trend_summary';
/** Share delivery format. */
export type ShareFormat = 'pdf' | 'email' | 'link';

/**
 * `share_history` — record of a share action. `payload_summary` is high-level only
 * (no raw symptom/journal content).
 */
export interface ShareHistoryRecord extends ForwardCompatFields {
  readonly share_type: ShareType;
  /** FK → therapist_links(id); null after the link is deleted (ON DELETE SET NULL). */
  readonly shared_with_therapist_id?: string;
  readonly format: ShareFormat;
  readonly payload_summary: Record<string, unknown>;
}

/**
 * `journal_entries` — forward-compat table. Defined for the schema contract; V1 [A]
 * has no product writer, but the typed read/write wrappers exist for forward use.
 */
export interface JournalEntryRecord extends ForwardCompatFields {
  /** 1..50000 chars (DB check constraint). */
  readonly content: string;
  readonly tags: readonly string[];
  /** File references, not the files themselves. */
  readonly attachments: readonly Record<string, unknown>[];
}
