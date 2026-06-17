// Supabase data layer — the Moments persistence read/write path.
//
// Moments are the evolved check-in and inherit ADR-001's SR-4 carve-out (Accepted
// 2026-06-14): consented, user-owned self-tracking — NOT telemetry. LOCAL stays the
// source of truth (the MMKV MomentStore); this write is a best-effort backup the
// caller swallows on failure, and `readMoments` is the pull/restore lane.
//
// Idempotency: unlike check_ins (keyed on the calendar day), a Moment carries a
// CLIENT-MINTED id and the upsert collides on the PRIMARY KEY. A re-push of the same
// local moment UPDATEs its row rather than inserting a duplicate. That depends on the
// `id` being sent by the client (MomentInput includes it) — server-side, the
// mobile-write RLS in 20260617000001_moments.sql (auth.uid() = user_id AND
// platform = 'mobile') still owns the gate.

import { DataAccessError, type SupabaseLike } from './adapters';
import { DATA_SCHEMA_VERSION } from './migrations';
import type { InsertInput, MomentRecord, WriteContext } from './types';

/** Master switch for the moment write path. ON since the Moments engine landed (ADR-001). */
export const MOMENT_PERSISTENCE_ENABLED = true;

/**
 * The unique-constraint column the moment upsert collides on — the primary key.
 * The client mints the id, so a re-push of the same moment hits the same row.
 */
export const MOMENT_CONFLICT_TARGET = 'id';

/**
 * Caller-supplied moment fields on write. Unlike the other tables, `id` IS supplied
 * by the client (it is the idempotency key); only created_at/updated_at and the §2
 * stamp are server/wrapper-managed.
 */
export type MomentInput = InsertInput<MomentRecord> & { readonly id: string };

/** Thrown when `writeMoment` is called while the gate is OFF. */
export class MomentPersistenceDisabledError extends Error {
  constructor() {
    super('moment persistence is disabled (MOMENT_PERSISTENCE_ENABLED is false)');
    this.name = 'MomentPersistenceDisabledError';
  }
}

/**
 * Upsert a moment row (best-effort, push-only). Stamps the §2 provenance and upserts
 * on the client-minted primary key so a re-push is idempotent. Throws
 * `MomentPersistenceDisabledError` if the master flag is ever flipped off; throws
 * `DataAccessError` on a PostgREST error. Callers treat both as best-effort.
 */
export async function writeMoment(
  client: SupabaseLike,
  input: MomentInput,
  ctx: WriteContext,
): Promise<MomentRecord> {
  if (!MOMENT_PERSISTENCE_ENABLED) {
    throw new MomentPersistenceDisabledError();
  }

  const row = {
    ...input,
    device_id: ctx.device_id,
    client_version: ctx.client_version,
    schema_version: DATA_SCHEMA_VERSION,
  };
  const result = await client
    .from<MomentRecord>('moments')
    .upsert(row, { onConflict: MOMENT_CONFLICT_TARGET })
    .select()
    .single();
  if (result.error) {
    throw new DataAccessError(result.error.message);
  }
  return result.data;
}

/** Read all of a user's moments (the pull/restore lane — repopulates after reinstall). */
export async function readMoments(
  client: SupabaseLike,
  userId: string,
): Promise<readonly MomentRecord[]> {
  const result = await client.from<MomentRecord>('moments').select('*').eq('user_id', userId);
  if (result.error) {
    throw new DataAccessError(result.error.message);
  }
  return result.data;
}
