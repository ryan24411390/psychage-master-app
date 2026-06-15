// Supabase data layer — the check-in persistence write path.
//
// ADR-001 (mood-sync) is Accepted (2026-06-14) and this is the write-flip slice:
//
//   - CHECKIN_PERSISTENCE_ENABLED = true
//   - writeCheckIn() upserts the row (best-effort, push-only backup)
//   - this file IS now re-exported from index.ts
//
// SR-4 boundary: ONLY check-in mood data syncs. Symptom Navigator selections never
// reach Supabase (that path does not exist). The local RecordStore stays the source
// of truth; this write is a best-effort backup the caller swallows on failure.
//
// Idempotency: the write upserts on CHECK_IN_DAY_CONFLICT_TARGET so a re-push of the
// same local calendar day UPDATEs the existing row rather than inserting a duplicate.
// That depends on the unique index `(user_id, experienced_at)` applied in
// supabase/migrations/20260614000008_check_ins_write.sql and on the client mapping a
// calendar day to a deterministic UTC-midnight `experienced_at`
// (apps/mobile/lib/check-in-sync-map.ts). Server-side, the mobile-write RLS in that
// same migration (auth.uid() = user_id AND platform = 'mobile') still owns the gate.

import { DataAccessError, type SupabaseLike } from './adapters';
import { DATA_SCHEMA_VERSION } from './migrations';
import type { CheckInRecord, InsertInput, WriteContext } from './types';

/** Master switch for the check-in write path. ON since the write-flip slice (ADR-001). */
export const CHECKIN_PERSISTENCE_ENABLED = true;

/**
 * The unique-constraint columns the check-in upsert collides on — one row per
 * (user, calendar day). Mirrors the unique index in the write-flip migration; the
 * client maps each calendar day to a deterministic UTC-midnight `experienced_at`.
 */
export const CHECK_IN_DAY_CONFLICT_TARGET = 'user_id,experienced_at';

/** Caller-supplied check-in fields on write; the wrapper stamps the §2 provenance. */
export type CheckInInput = InsertInput<CheckInRecord>;

/** Thrown when `writeCheckIn` is called while the gate is OFF. */
export class CheckInPersistenceDisabledError extends Error {
  constructor() {
    super('check-in persistence is disabled (CHECKIN_PERSISTENCE_ENABLED is false)');
    this.name = 'CheckInPersistenceDisabledError';
  }
}

/**
 * Upsert a check-in row (best-effort, push-only). Stamps the §2 provenance and
 * upserts on the per-day key so a same-day re-push is idempotent. Throws
 * `CheckInPersistenceDisabledError` if the master flag is ever flipped back off;
 * throws `DataAccessError` on a PostgREST error. Callers treat both as best-effort.
 */
export async function writeCheckIn(
  client: SupabaseLike,
  input: CheckInInput,
  ctx: WriteContext,
): Promise<CheckInRecord> {
  if (!CHECKIN_PERSISTENCE_ENABLED) {
    throw new CheckInPersistenceDisabledError();
  }

  const row = {
    ...input,
    device_id: ctx.device_id,
    client_version: ctx.client_version,
    schema_version: DATA_SCHEMA_VERSION,
  };
  const result = await client
    .from<CheckInRecord>('check_ins')
    .upsert(row, { onConflict: CHECK_IN_DAY_CONFLICT_TARGET })
    .select()
    .single();
  if (result.error) {
    throw new DataAccessError(result.error.message);
  }
  return result.data;
}
